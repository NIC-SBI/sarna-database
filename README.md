# saRNA Database

The **saRNA Database** is a curated literature resource for **small activating RNA (saRNA)** research. It brings together reported saRNA sequences with their experimental context, target information, genomic annotations, and reported effects in a structured and searchable format.

The resource is developed and maintained at the **National Institute of Chemistry, Slovenia**.

**Website:** https://nic-sbi.github.io/sarna-database/

## Project status

The database is currently **under preparation**.

The first validated public release is planned to accompany the associated peer-reviewed review article. The working database and preliminary or unvalidated records are not published in this repository.

Once released, each database version will be made available through:

- the searchable saRNA Database website;
- versioned downloadable data files; and
- a persistent archival record on Zenodo.

The associated article and dataset will have separate persistent identifiers.

## Scope

The database is designed to capture experimentally reported small activating RNAs and the context in which their activity was evaluated.

Curated information includes, where available:

- sense and antisense saRNA sequences;
- sequence length and GC content;
- sequence modifications and terminal overhangs;
- target genes and genomic target regions;
- organism and reference-genome information;
- transcription start site and relative targeting position;
- experimental model and cell line;
- saRNA concentration or dose;
- delivery or transfection method;
- treatment duration;
- assay or experimental readout;
- reported activity or effect;
- publication or patent provenance; and
- identifiers such as DOI, PMID, Ensembl Gene ID, and patent numbers.

Information is retained as reported by the original source where appropriate, with normalized fields added to support consistent searching and analysis.

## Data organization

The public dataset is organized around three linked entities:

### Records

A **record** represents a reported experimental observation or testing context for an saRNA.

Records contain the experimental conditions, biological context, target information, reported effect, and links to the corresponding sequence and source.

Each record has a stable identifier of the form:

`RECxxxxxx`

### Sequences

A **sequence** represents a distinct normalized saRNA sequence pair.

Sequence entries contain the normalized sense and antisense strands and sequence-derived properties such as length and GC content.

Each sequence has a stable identifier of the form:

`SEQxxxxxx`

Multiple experimental records may refer to the same sequence.

### Sources

A **source** represents a publication or patent from which database records were curated.

Source metadata include bibliographic identifiers and links to the records and sequences associated with that source.

Each source has a stable project identifier.

The relationships between these tables allow sequence information and bibliographic metadata to be stored once while remaining linked to all relevant experimental records.

## Data access

When the first validated release is published, the dataset will be available in open, machine-readable formats suitable for reuse and archival.

Release materials are expected to include:

- experimental records;
- sequence data;
- source/publication metadata;
- a data dictionary;
- release metadata;
- validation information; and
- a human-readable spreadsheet representation.

The same released data will be used to generate the searchable tables presented on the project website.

See the [Downloads](https://nic-sbi.github.io/sarna-database/downloads.html) page for release files when they become available.

## Curation and quality control

The database is manually curated from the scientific and patent literature.

The release methodology will document:

- literature-search and screening procedures;
- inclusion and exclusion criteria;
- sequence extraction and normalization;
- experimental-condition extraction;
- outcome annotation;
- identifier assignment;
- genomic annotation;
- quality-control procedures;
- discrepancy resolution; and
- release and correction procedures.

Reported values are preserved where possible. Normalized or derived values are distinguished from source-reported information.

For additional information, see the [Methods](https://nic-sbi.github.io/sarna-database/methods.html) page.

## Versioning and archival

Public database releases will be versioned.

Each validated release will be archived on **Zenodo** and assigned a persistent DOI. Subsequent corrections or additions will be issued as new versions rather than silently replacing a previously released dataset.

The website represents the current public version of the resource, while Zenodo provides the persistent archival record for individual releases.

## Citation

Citation information will be added when the associated article and first database release are published.

Users should cite:

1. the associated peer-reviewed article; and
2. the specific version of the saRNA Database used in their work.

See the [Citation](https://nic-sbi.github.io/sarna-database/citation.html) page for current citation information.

## Reporting errors and suggesting additions

We welcome reports of:

- possible sequence errors;
- missing or incorrectly annotated publications;
- discrepancies in experimental metadata;
- identifier or genomic-annotation issues; and
- relevant publications or patents that may meet the database inclusion criteria.

Please use the contact information provided on the [project website](https://nic-sbi.github.io/sarna-database/contact.html). Accepted corrections will be documented and incorporated into a subsequent database release.

## Licensing

Database content and original project annotations are intended to be released under the **Creative Commons Attribution 4.0 International (CC BY 4.0)** license.

Website and supporting source code are licensed separately under the **MIT License**.

Source publications, patents, and other third-party materials remain subject to their respective copyright and licensing terms.

See [`LICENSE-DATA.md`](LICENSE-DATA.md) and [`LICENSE`](LICENSE) for details.

## Repository

This repository contains the source code, documentation, and release infrastructure for the saRNA Database website and public dataset.

The website is built with [Quarto](https://quarto.org/) and deployed through GitHub Pages.

Development, deployment, validation, and release procedures are documented under [`docs/`](docs/).

Working spreadsheets, unpublished manuscript materials, internal curation notes, and other non-public project materials are not stored in this public repository.

## Maintainers

The saRNA Database is developed and maintained at the **National Institute of Chemistry, Slovenia**.

Project contact information is available at:

https://nic-sbi.github.io/sarna-database/contact.html
