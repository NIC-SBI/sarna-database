# saRNA Ensembl Exact-Match Annotation

This folder contains a script that documents the coordinate-mapping logic used for saRNA genomic annotation.
## Included File

- `ensembl_exact_match_annotation.py` - retrieves Ensembl gene metadata and TSS-window sequence, then assigns exact-match saRNA genomic coordinates.

## Expected Input

Provide a CSV file with explicit, already-curated identifiers:

```text
record_id,species_code,ensembl_gene_id,sense_sequence,antisense_sequence
```

Species codes should use Ensembl names such as `homo_sapiens`, `mus_musculus`, `rattus_norvegicus`, `pan_troglodytes`, or `chlorocebus_sabaeus`. Species assignment, target-gene synonym resolution, and any manual gene-ID curation are expected to be completed upstream and represented directly in the input table.

## Example Run

```bash
python ensembl_exact_match_annotation.py \
  --input input.csv \
  --output annotated_coordinates.csv \
  --human-grch37-rescue
```

## Mapping Logic

For each supplied Ensembl gene ID, the script retrieves gene metadata with transcript expansion from Ensembl REST. The canonical transcript is used to define the transcription start site (TSS) when available; otherwise the gene start or end is used according to strand orientation. A +/-10 kb window around the TSS is retrieved from the relevant Ensembl assembly and oriented by gene strand.

Sense and antisense saRNA sequences are converted from RNA to DNA by replacing U with T. Terminal TT/UU overhangs are trimmed only when present on both strands. The sense sequence, antisense sequence, and their reverse complements are searched against the oriented TSS window. Coordinate assignments are made only for exact A/C/G/T matches. If multiple exact hits are found, the hit whose midpoint is closest to the TSS is selected.

Rows without exact sequence matches retain gene-level metadata where retrieval succeeds, but coordinate-level fields remain blank. Human rows can optionally be retried against the Ensembl GRCh37 REST service; the output records the reference assembly used for each coordinate assignment.
