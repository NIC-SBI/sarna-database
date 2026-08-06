# saRNA Database

This repository contains the Quarto source for the public placeholder website for the saRNA Database, a future literature-based resource for small activating RNA research.

## Current status

The site is **under preparation**. It does not publish the current working workbook, manuscript data, database records, unpublished metadata, or a functional data-processing pipeline. No preliminary or unvalidated data are public.

## Local requirements

Install the current supported [Quarto release](https://quarto.org/docs/get-started/). Git is recommended for workflow checks.

Preview locally:

```text
quarto preview
```

Render the complete site into the uncommitted _site/ directory:

```text
quarto render
```

Run the placeholder-phase checks after rendering:

```text
pwsh ./scripts/validate-site.ps1 -SiteDir _site
```

## Configuration

Replace unresolved values only in [_variables.yml](_variables.yml):

- the GitHub organization slug;
- the project email address;
- release and citation values when they exist; and
- optional custom-domain documentation.

The copyright holder remains a configurable placeholder in LICENSE until the department confirms the correct attribution.

The initial project URL will be https://<organization>.github.io/sarna-database/. No custom domain or CNAME file is assumed.

## Repository structure

```text
.github/workflows/   GitHub Actions checks and Pages deployment
assets/              Local CSS and image placeholders
data/                Public data-directory documentation and private-data guard
docs/                Deployment, maintenance, and future-pipeline documentation
scripts/              Quarto placeholder-link filter and validation script
*.qmd                Quarto website pages
_quarto.yml          Quarto website configuration
_variables.yml       Central project placeholders
```

## Deployment

The check-site.yml workflow renders the site on pushes and pull requests. The publish-site.yml workflow renders and deploys to GitHub Pages on pushes to main or through manual execution. Configure the repository’s Pages source as **GitHub Actions**. See [docs/deployment.md](docs/deployment.md).

## Data protection

Never add manuscripts, working spreadsheets, reviewer files, internal notes, unpublished metadata, or private data to this public repository. The data/private/ and output/ directories are ignored, and all Excel workbook formats are blocked during the placeholder phase. The placeholder-phase validation also rejects workbook and CSV files until an explicit release change updates that safeguard. Before a finalized public workbook is released, narrow or intentionally override the Excel ignore rule as part of the approved release change.

## Future release

The future release will use one finalized Excel workbook as the authoritative source, validate it, generate a UTF-8 CSV export, expose a static client-side searchable table, and create a versioned package for deliberate manual upload to Zenodo. This architecture is documented in [docs/future-data-pipeline.md](docs/future-data-pipeline.md) and is not implemented yet.

## License

Website code is licensed under MIT. Future released database content and original project annotations are designated for CC BY 4.0, subject to the terms and scope described in [LICENSE-DATA.md](LICENSE-DATA.md). Cited publications and third-party materials retain their own rights.
