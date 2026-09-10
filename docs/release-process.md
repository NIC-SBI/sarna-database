# Release process

The public website presents three linked, approved CSV tables:

- `data/public/records.csv`;
- `data/public/sequences.csv`; and
- `data/public/sources.csv`.

The complete authoritative release package, including the workbook and supporting documentation, is distributed through Zenodo. Working source files and unpublished material must not be committed to this repository.

## Preparing a website release

1. Finalize and validate the release outside the public website repository.
2. Export the approved Records, Sequences, and Sources tables as UTF-8 CSV.
3. Verify stable identifiers, required columns, cross-table references, duplicate identifiers, and displayed record counts.
4. Replace all three files in `data/public/` together.
5. Update the database version, DOI, citation, archive text, and visible counts.
6. Render the site and run `scripts/validate-site.ps1`.
7. Review the searchable interface against the archived package.
8. Publish the release package to Zenodo manually.
9. Merge the website update only after the version-specific Zenodo record and links are confirmed.

## Publication safeguards

GitHub Actions validates and deploys the website but does not publish or overwrite Zenodo records. Runtime assets remain local to the site, and database-file download links point to the versioned Zenodo archive rather than directly to repository CSV files.
