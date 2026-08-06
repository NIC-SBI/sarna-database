# Repository scripts

## project-links.lua

This Quarto Lua filter removes links that still contain the organization or project-email placeholder. That keeps the initial site free of invalid functional links while allowing the values to be replaced centrally in _variables.yml.

## validate-site.ps1

This placeholder-phase validation script checks that required pages render, internal HTML links resolve, headings and link labels are usable, short-page TOCs remain disabled, unresolved public placeholders and malformed email links are absent, the noindex/nofollow directives are present, and no tracking code or private/data files are included. When a validated public data release is intentionally added, update the data-file safeguard in the script as part of that release change.
