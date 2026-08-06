# Future data pipeline

This document specifies the intended release architecture. It is documentation only; no Excel-to-CSV processing or searchable database is implemented in the placeholder phase.

```text
Finalized Excel workbook
        ↓
Validation and export script
        ↓
Public CSV export
        ↓
Static client-side searchable table
        ↓
Excel and CSV downloads
        ↓
Versioned release package
        ↓
Manual Zenodo upload
```

The finalized Excel workbook will be the authoritative source for each release.

## Future input

- One finalized Excel workbook.
- Sheet names and required columns defined in a later schema configuration.
- All finalized workbook columns included in the public release.

## Future processing requirements

A future script should:

1. Read the authoritative Excel workbook.
2. Validate expected sheets and columns.
3. Reject rows without required record identifiers.
4. Detect duplicate record IDs.
5. Export the public table to UTF-8 CSV.
6. Preserve the finalized Excel workbook unchanged as the downloadable source file.
7. Produce release metadata and checksums.
8. Copy generated files into a versioned release directory.
9. Generate a validation summary.
10. Fail without publishing when validation errors are present.

## Future search interface

For a literature-scale collection, the planned interface is a static client-side table rather than a server database. It should provide one global search box, sortable columns, pagination or virtual scrolling, horizontal scrolling for wide tables, a clear record-count display, a reset-search control, and optional column visibility controls if usability testing shows they are needed.

Runtime assets should be locally bundled and open source, or provided by a lightweight custom implementation. They must not be loaded from an unpinned third-party CDN.

## Future downloads

The release page should provide direct links to the authoritative Excel workbook, generated CSV file, Zenodo version record, data dictionary, and changelog.

## Future Zenodo package

The future build may create a directory such as:

```text
dist/sarna-database-v1.0.0/
├── sarna-database-v1.0.0.xlsx
├── sarna-database-v1.0.0.csv
├── README.md
├── data-dictionary.csv
├── CHANGELOG.md
├── LICENSE-DATA.md
├── validation-report.txt
└── checksums.sha256
```

Zenodo upload and publication must remain a deliberate manual action. No workflow should automatically publish or overwrite a Zenodo record.
