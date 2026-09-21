# Maintenance

The expected maintenance process is intentionally small:

1. Edit the relevant .qmd file or central configuration value.
2. Preview the site locally with quarto preview.
3. Open a pull request.
4. Confirm that the site-check workflow passes.
5. Merge the pull request to main.
6. Confirm the automatic GitHub Pages deployment.

Keep public-site changes focused and reviewable. Do not add working spreadsheets, manuscript files, reviewer materials, internal notes, unpublished metadata, cookies, or tracking services beyond the approved Umami analytics integration. Do not send search text or database record contents as analytics events.

For each public database release:

1. update the version and DOI values in `_variables.yml`;
2. replace the approved web-table CSV files together;
3. reconcile the record, sequence, and source counts shown on the site;
4. update citation and archive wording;
5. run a clean render and `scripts/validate-site.ps1`; and
6. confirm the GitHub Pages deployment and Zenodo links after merging.

Review contact guidance whenever the corresponding article or curator responsibilities change.
