[CmdletBinding()]
param(
    [string]$SiteDir = "_site"
)

$ErrorActionPreference = "Stop"
$root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$sitePath = Join-Path $root $SiteDir

$requiredSourcePages = @(
    "index.qmd",
    "database.qmd",
    "methods.qmd",
    "downloads.qmd",
    "citation.qmd",
    "contact.qmd",
    "about.qmd"
)

foreach ($page in $requiredSourcePages) {
    $pagePath = Join-Path $root $page
    if (-not (Test-Path -LiteralPath $pagePath -PathType Leaf)) {
        throw "Required source page is missing: $page"
    }
}

if (-not (Test-Path -LiteralPath $sitePath -PathType Container)) {
    throw "Rendered site directory is missing: $sitePath"
}

foreach ($page in ($requiredSourcePages | ForEach-Object { [IO.Path]::ChangeExtension($_, ".html") })) {
    $pagePath = Join-Path $sitePath $page
    if (-not (Test-Path -LiteralPath $pagePath -PathType Leaf)) {
        throw "Required rendered page is missing: $page"
    }
}

$sourceFiles = @(Get-ChildItem -LiteralPath $root -Recurse -File | Where-Object {
    $relativePath = $_.FullName.Substring($root.Length).TrimStart([IO.Path]::DirectorySeparatorChar, [IO.Path]::AltDirectorySeparatorChar)
    $relativePath -notlike "$SiteDir\*" -and
    $relativePath -notlike ".git\*" -and
    $relativePath -notmatch "^(data[\\/]private|output|outputs|work_missing_values|work_publication_ids|work_record_ids|node_modules)([\\/]|$)"
})

$privateFiles = @($sourceFiles | Where-Object {
    $_.FullName -match "[\/]data[\/]private[\/]" -and $_.Name -ne ".gitkeep"
})
if ($privateFiles.Count -gt 0) {
    throw "Private data files are present in data/private/: $($privateFiles.Name -join ', ')"
}

$temporaryFiles = @($sourceFiles | Where-Object { $_.Name -match "^~\$" })
if ($temporaryFiles.Count -gt 0) {
    throw "Temporary spreadsheet files are present: $($temporaryFiles.Name -join ', ')"
}

# Placeholder-phase safeguard: no workbook or CSV database export is allowed yet.
$dataFiles = @($sourceFiles | Where-Object {
    $_.Extension.ToLowerInvariant() -in @(".xlsx", ".xls", ".xlsm", ".csv")
})
if ($dataFiles.Count -gt 0) {
    throw "Data files are not allowed during the placeholder phase: $($dataFiles.Name -join ', ')"
}

$sourceText = ($sourceFiles | Where-Object { $_.Extension -in @(".qmd", ".yml", ".yaml", ".md", ".css", ".lua", ".html") } | ForEach-Object { Get-Content -LiteralPath $_.FullName -Raw }) -join [Environment]::NewLine
if ($sourceText.Contains("](/")) {
    throw "An internal source link starts with '/', which would break repository-subpath hosting."
}

$htmlFiles = @(Get-ChildItem -LiteralPath $sitePath -Recurse -Filter *.html -File)
if ($htmlFiles.Count -eq 0) {
    throw "No rendered HTML files were found."
}

$allHtml = ($htmlFiles | ForEach-Object { Get-Content -LiteralPath $_.FullName -Raw }) -join [Environment]::NewLine
$trackingPattern = 'googletagmanager|google-analytics|gtag\s*\(|plausible|matomo|hotjar|mixpanel|segment\.io|facebook\.com/tr|pixel\.facebook'
if ($allHtml -match $trackingPattern) {
    throw "Tracking or analytics code was found in the rendered site."
}
if ($allHtml -match '<(?:script|link)[^>]+(?:src|href)=["'']https?://') {
    throw "An external runtime asset was found; scripts, styles, and fonts must be locally bundled."
}
if ($allHtml -notmatch '<meta[^>]+name=["'']robots["''][^>]+noindex') {
    throw "The placeholder site must contain a noindex directive."
}

$brokenLinks = [System.Collections.Generic.List[string]]::new()
$emptyLinks = [System.Collections.Generic.List[string]]::new()

foreach ($htmlFile in $htmlFiles) {
    $html = Get-Content -LiteralPath $htmlFile.FullName -Raw

    foreach ($match in [regex]::Matches($html, 'href\s*=\s*["'']([^"'']*)["'']', [Text.RegularExpressions.RegexOptions]::IgnoreCase)) {
        $href = $match.Groups[1].Value
        if ([string]::IsNullOrWhiteSpace($href)) {
            $emptyLinks.Add($htmlFile.Name)
            continue
        }
        if ($href -match "^(#|https?://|mailto:|tel:|javascript:)") {
            continue
        }

        $pathPart = ($href -split "[?#]", 2)[0]
        if ([string]::IsNullOrWhiteSpace($pathPart)) {
            continue
        }

        $targetPath = Join-Path $htmlFile.DirectoryName $pathPart
        if ($pathPart.EndsWith("/")) {
            $targetPath = Join-Path $targetPath "index.html"
        }
        if (-not (Test-Path -LiteralPath $targetPath -PathType Leaf)) {
            $brokenLinks.Add("$($htmlFile.Name) -> $href")
        }
    }

    $pageHeadingLevels = @(
        [regex]::Matches($html, '<h([1-6])\b', [Text.RegularExpressions.RegexOptions]::IgnoreCase) |
            ForEach-Object { [int]$_.Groups[1].Value }
    )
    if ($pageHeadingLevels.Count -eq 0 -or $pageHeadingLevels -notcontains 1) {
        throw "No page-level h1 heading was found in $($htmlFile.Name)."
    }
    $firstTitleIndex = [Array]::IndexOf($pageHeadingLevels, 1)
    for ($index = $firstTitleIndex + 1; $index -lt $pageHeadingLevels.Count; $index++) {
        if ($pageHeadingLevels[$index] -gt ($pageHeadingLevels[$index - 1] + 1)) {
            throw "Heading levels skip from h$($pageHeadingLevels[$index - 1]) to h$($pageHeadingLevels[$index]) in $($htmlFile.Name)."
        }
    }

    foreach ($match in [regex]::Matches($html, '<a\b([^>]*)>(.*?)</a>', [Text.RegularExpressions.RegexOptions]::IgnoreCase -bor [Text.RegularExpressions.RegexOptions]::Singleline)) {
        $attributes = $match.Groups[1].Value
        $label = [regex]::Replace($match.Groups[2].Value, '<[^>]+>', "")
        $label = [System.Net.WebUtility]::HtmlDecode($label).Trim()
        $hasAriaLabel = $attributes -match 'aria-label\s*=\s*["''][^"'']+[^"'']*["'']'
        if ([string]::IsNullOrWhiteSpace($label) -and -not $hasAriaLabel) {
            throw "An anchor without a descriptive label was found in $($htmlFile.Name)."
        }
    }
}

if ($brokenLinks.Count -gt 0) {
    throw "Unresolved internal links: $($brokenLinks -join '; ')"
}
if ($emptyLinks.Count -gt 0) {
    throw "Empty links were found in: $($emptyLinks -join ', ')"
}

Write-Output "Site validation passed: $($htmlFiles.Count) HTML files checked."
