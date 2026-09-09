# saRNA Database

The **saRNA Database** is a curated literature resource for **small activating RNA (saRNA)** research. It brings together reported saRNA sequences with their experimental context, target information, genomic annotations, and reported effects in a structured and searchable format.

The resource is developed and maintained at the **National Institute of Chemistry, Slovenia**.

**Website:** https://nic-sbi.github.io/sarna-database/

## Project status

Version **1.0.0** is the current validated public release. The website presents the release through a searchable client-side interface, while the complete versioned package is preserved and distributed through Zenodo:

https://doi.org/10.5281/zenodo.21871232

The associated review article has been accepted; its citation is forthcoming.

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

The public dataset is organized around three linked entities.

### Records

A **record** represents a reported experimental observation or testing context for an saRNA. Records contain the experimental conditions, biological context, target information, reported effect, and links to the corresponding sequence and source.

Each record has a stable identifier of the form `RECxxxxxx`.

### Sequences

A **sequence** represents a distinct normalized saRNA sequence pair. Sequence entries contain the normalized sense and antisense strands and sequence-derived properties such as length and GC content. Multiple experimental records may refer to the same sequence.

Each sequence has a stable identifier of the form `SEQxxxxxx`.

### Sources

A **source** represents a publication or patent from which database records were curated. Source metadata include bibliographic identifiers and links to the records and sequences associated with that source.

The relationships between these tables allow sequence information and bibliographic metadata to be stored once while remaining linked to all relevant experimental records.

## Data access

The website uses the approved Records, Sequences, and Sources CSV tables to provide interactive search, filtering, sorting, pagination, and expandable record details. It does not include separate file-download buttons.

For the authoritative workbook, CSV tables, documentation, changelog, license, and persistent citation metadata, use the [Zenodo archive](https://doi.org/10.5281/zenodo.21871232).

## Curation and quality control

The database is manually curated from the scientific and patent literature. Reported values are preserved where possible, and normalized or derived values are distinguished from source-reported information.

For details on the public release structure and interpretation, see the [Methods](https://nic-sbi.github.io/sarna-database/methods.html) page.

## Versioning and archival

Public database releases are versioned and archived on Zenodo. Subsequent corrections or additions will be issued as new versions rather than silently replacing a previously released dataset.

The website represents the current public version of the resource, while Zenodo provides the persistent archival record for individual releases.

## Citation

Users should cite the specific version of the saRNA Database used in their work. The associated review article has been accepted; its citation is forthcoming.

See the [Citation](https://nic-sbi.github.io/sarna-database/citation.html) page for current citation information.

## Reporting errors and suggesting additions

We welcome reports of possible sequence errors, missing or incorrectly annotated publications, discrepancies in experimental metadata, identifier or genomic-annotation issues, and relevant publications or patents that may meet the inclusion criteria.

Please use the contact information on the [project website](https://nic-sbi.github.io/sarna-database/contact.html). Accepted corrections will be documented and incorporated into a subsequent database release.

## Licensing

Database content and original project annotations are available under the **Creative Commons Attribution 4.0 International (CC BY 4.0)** license. Website and supporting source code are licensed separately under the **MIT License**. Source publications, patents, and other third-party materials remain subject to their respective copyright and licensing terms.

See [`LICENSE-DATA.md`](LICENSE-DATA.md) and [`LICENSE`](LICENSE) for details.

## Repository and development

This repository contains the Quarto website source, public search tables, documentation, annotation scripts, and release infrastructure for the saRNA Database. The website is deployed through GitHub Pages.

After rendering the site, run the release checks with:

```powershell
./scripts/validate-site.ps1 -SiteDir _site
```

Working spreadsheets, manuscript files, reviewer material, internal notes, unpublished metadata, and other non-public project materials must not be added to this public repository. The `data/private/` and `output/` directories are ignored. The complete release package belongs on Zenodo.

## Maintainers

The saRNA Database is developed and maintained at the **National Institute of Chemistry, Slovenia**. Project contact information is available at https://nic-sbi.github.io/sarna-database/contact.html.
