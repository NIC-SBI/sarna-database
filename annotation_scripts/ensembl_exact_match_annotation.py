#!/usr/bin/env python3
"""Annotate saRNA target coordinates from explicit species/gene IDs.

Input is a CSV table with at least these columns:
record_id, species_code, ensembl_gene_id, sense_sequence, antisense_sequence

The script retrieves Ensembl gene metadata and a +/- TSS window, searches exact
matches for the sense, antisense, and reverse-complement sequences, and writes a
CSV with coordinate-level annotation fields.
"""

import argparse
import csv
import json
import re
import time
import urllib.parse
import urllib.request


ENSEMBL_REST = "https://rest.ensembl.org"
ENSEMBL_GRCH37_REST = "https://grch37.rest.ensembl.org"
DEFAULT_WINDOW_BP = 10_000
DEFAULT_ASSEMBLY_BY_SPECIES = {
    "homo_sapiens": "GRCh38",
    "mus_musculus": "GRCm39",
    "rattus_norvegicus": "GRCr8",
    "pan_troglodytes": "Pan_tro_3.0",
    "chlorocebus_sabaeus": "ChlSab1.1",
}


def request_text(base_url, path, accept):
    request = urllib.request.Request(
        base_url + path,
        headers={
            "Accept": accept,
            "Content-Type": accept,
            "User-Agent": "saRNA-annotation/1.0",
        },
    )
    with urllib.request.urlopen(request, timeout=40) as response:
        return response.read().decode("utf-8").strip()


def memoized_request(memo, key, base_url, path, accept):
    if key not in memo:
        memo[key] = request_text(base_url, path, accept)
        time.sleep(0.08)
    return memo[key]


def reverse_complement(sequence):
    table = str.maketrans("ACGTUNacgtun", "TGCAANtgcaan")
    return str(sequence or "").translate(table)[::-1].upper().replace("U", "T")


def clean_sequence(value):
    sequence = str(value or "").strip().upper().replace("U", "T")
    if sequence in {"", "NA", "NONE"}:
        return ""
    return sequence


def has_paired_terminal_overhangs(sense, antisense):
    sense = str(sense or "").strip().upper()
    antisense = str(antisense or "").strip().upper()
    return len(sense) > 2 and len(antisense) > 2 and sense[-2:] in {"TT", "UU"} and antisense[-2:] in {"TT", "UU"}


def normalize_sarna_pair(sense, antisense):
    sense = str(sense or "").strip().upper()
    antisense = str(antisense or "").strip().upper()
    if has_paired_terminal_overhangs(sense, antisense):
        sense = sense[:-2]
        antisense = antisense[:-2]
    return clean_sequence(sense), clean_sequence(antisense)


def query_sequences(sense, antisense):
    candidates = [
        ("sense", sense),
        ("antisense", antisense),
        ("sense_reverse_complement", reverse_complement(sense)),
        ("antisense_reverse_complement", reverse_complement(antisense)),
    ]
    out = []
    seen = set()
    for name, sequence in candidates:
        if sequence and re.fullmatch(r"[ACGT]+", sequence) and sequence not in seen:
            out.append((name, sequence))
            seen.add(sequence)
    return out


def gene_metadata_from_lookup(lookup_json, source_url, species_code):
    data = json.loads(lookup_json)
    strand = int(data.get("strand", 1))
    transcripts = data.get("Transcript", []) or data.get("transcripts", [])
    canonical = next((tx for tx in transcripts if tx.get("is_canonical") in (1, "1", True)), None)
    if canonical is None and transcripts:
        canonical = transcripts[0]

    if canonical:
        tss = int(canonical["start"] if strand == 1 else canonical["end"])
        canonical_transcript = canonical.get("id")
    else:
        tss = int(data["start"] if strand == 1 else data["end"])
        canonical_transcript = None

    return {
        "species_code": species_code,
        "ensembl_gene_id": data.get("id"),
        "gene_symbol": data.get("display_name"),
        "chromosome": str(data.get("seq_region_name")),
        "strand": strand,
        "tss": tss,
        "canonical_transcript": canonical_transcript,
        "source_url": source_url,
    }


def lookup_gene_by_id(memo, species_code, gene_id, base_url=ENSEMBL_REST):
    key = f"lookup_id:{base_url}:{gene_id}"
    path = f"/lookup/id/{urllib.parse.quote(gene_id)}?expand=1"
    source_url = base_url + path
    lookup_json = memoized_request(memo, key, base_url, path, "application/json")
    return gene_metadata_from_lookup(lookup_json, source_url, species_code)


def fetch_sequence_window(memo, gene, window_bp, base_url=ENSEMBL_REST, grch37=False):
    start = max(1, int(gene["tss"]) - window_bp)
    end = int(gene["tss"]) + window_bp
    region = urllib.parse.quote(f"{gene['chromosome']}:{start}..{end}:1", safe=":..")
    species_path = "human" if grch37 else urllib.parse.quote(gene["species_code"])
    path = f"/sequence/region/{species_path}/{region}?"
    key = f"sequence:{base_url}:{species_path}:{gene['chromosome']}:{start}:{end}"
    sequence = memoized_request(memo, key, base_url, path, "text/plain").upper()
    return start, end, sequence


def exact_match_starts(reference_sequence, query_sequence):
    starts = []
    start = reference_sequence.find(query_sequence)
    while start != -1:
        starts.append(start)
        start = reference_sequence.find(query_sequence, start + 1)
    return starts


def interval_from_oriented_hit(gene, region_start, region_end, start_index, match_length):
    if gene["strand"] == 1:
        genomic_start = region_start + start_index
        genomic_end = genomic_start + match_length - 1
    else:
        genomic_end = region_end - start_index
        genomic_start = genomic_end - match_length + 1

    relative_a = (genomic_start - gene["tss"]) * gene["strand"]
    relative_b = (genomic_end - gene["tss"]) * gene["strand"]
    relative_start, relative_end = sorted((int(relative_a), int(relative_b)))
    return genomic_start, genomic_end, relative_start, relative_end


def exact_hits_for_record(gene, sense, antisense, memo, window_bp, base_url=ENSEMBL_REST, grch37=False):
    sense_dna, antisense_dna = normalize_sarna_pair(sense, antisense)
    candidates = query_sequences(sense_dna, antisense_dna)
    if not candidates:
        return []

    region_start, region_end, reference_sequence = fetch_sequence_window(memo, gene, window_bp, base_url, grch37)
    oriented_reference = reference_sequence if gene["strand"] == 1 else reverse_complement(reference_sequence)
    tss_index = gene["tss"] - region_start if gene["strand"] == 1 else region_end - gene["tss"]

    hits = []
    for query_name, query_sequence in candidates:
        for start_index in exact_match_starts(oriented_reference, query_sequence):
            midpoint_distance = abs((start_index + len(query_sequence) / 2) - tss_index)
            genomic_start, genomic_end, relative_start, relative_end = interval_from_oriented_hit(
                gene, region_start, region_end, start_index, len(query_sequence)
            )
            hits.append(
                {
                    "matched_query": query_name,
                    "matched_sequence": query_sequence,
                    "genomic_start": int(genomic_start),
                    "genomic_end": int(genomic_end),
                    "relative_start": int(relative_start),
                    "relative_end": int(relative_end),
                    "distance_to_tss": float(midpoint_distance),
                }
            )
    return hits


def select_closest_hit(hits):
    if not hits:
        return None
    return sorted(hits, key=lambda hit: (hit["distance_to_tss"], hit["genomic_start"], hit["genomic_end"]))[0]


def blank_annotation(record, status):
    return {
        **record,
        "gene_symbol": "",
        "chromosome": "",
        "strand": "",
        "tss": "",
        "canonical_transcript": "",
        "genomic_location": "",
        "relative_location": "",
        "matched_query": "",
        "hit_count": 0,
        "selected_hit_distance_to_tss": "",
        "reference_genome_assembly": "",
        "mapping_status": status,
        "ensembl_source_url": "",
    }


def annotate_record(record, memo, window_bp, use_grch37_rescue):
    species_code = record["species_code"].strip()
    gene_id = record["ensembl_gene_id"].strip()
    if not species_code or not gene_id:
        return blank_annotation(record, "missing_species_or_gene_id")

    try:
        gene = lookup_gene_by_id(memo, species_code, gene_id)
        hits = exact_hits_for_record(
            gene,
            record.get("sense_sequence", ""),
            record.get("antisense_sequence", ""),
            memo,
            window_bp,
        )
        assembly = DEFAULT_ASSEMBLY_BY_SPECIES.get(species_code, "")
        status = "exact_current_assembly" if hits else "gene_metadata_only_no_exact_match"
    except Exception as exc:
        return blank_annotation(record, f"gene_or_sequence_lookup_failed:{type(exc).__name__}")

    if not hits and use_grch37_rescue and species_code == "homo_sapiens":
        try:
            grch37_gene = lookup_gene_by_id(memo, species_code, gene_id, ENSEMBL_GRCH37_REST)
            grch37_hits = exact_hits_for_record(
                grch37_gene,
                record.get("sense_sequence", ""),
                record.get("antisense_sequence", ""),
                memo,
                window_bp,
                ENSEMBL_GRCH37_REST,
                grch37=True,
            )
            if grch37_hits:
                gene = grch37_gene
                hits = grch37_hits
                assembly = "GRCh37"
                status = "exact_grch37_rescue"
        except Exception:
            pass

    selected_hit = select_closest_hit(hits)
    genomic_location = ""
    relative_location = ""
    matched_query = ""
    selected_distance = ""
    if selected_hit:
        genomic_location = f"chr{gene['chromosome']}:{selected_hit['genomic_start']}-{selected_hit['genomic_end']}"
        relative_location = f"{selected_hit['relative_start']} to {selected_hit['relative_end']}"
        matched_query = selected_hit["matched_query"]
        selected_distance = selected_hit["distance_to_tss"]

    return {
        **record,
        "gene_symbol": gene["gene_symbol"] or "",
        "chromosome": gene["chromosome"],
        "strand": gene["strand"],
        "tss": gene["tss"],
        "canonical_transcript": gene["canonical_transcript"] or "",
        "genomic_location": genomic_location,
        "relative_location": relative_location,
        "matched_query": matched_query,
        "hit_count": len(hits),
        "selected_hit_distance_to_tss": selected_distance,
        "reference_genome_assembly": assembly if selected_hit else "",
        "mapping_status": status,
        "ensembl_source_url": gene["source_url"],
    }


def annotate_csv(input_path, output_path, window_bp=DEFAULT_WINDOW_BP, use_grch37_rescue=False):
    memo = {}
    with open(input_path, "r", encoding="utf-8-sig", newline="") as input_file:
        reader = csv.DictReader(input_file)
        required = {"record_id", "species_code", "ensembl_gene_id", "sense_sequence", "antisense_sequence"}
        missing = sorted(required - set(reader.fieldnames or []))
        if missing:
            raise ValueError(f"Missing required input columns: {', '.join(missing)}")
        rows = [
            annotate_record(row, memo, window_bp, use_grch37_rescue)
            for row in reader
        ]

    fieldnames = list(rows[0].keys()) if rows else list(required)
    for name in [
        "gene_symbol",
        "chromosome",
        "strand",
        "tss",
        "canonical_transcript",
        "genomic_location",
        "relative_location",
        "matched_query",
        "hit_count",
        "selected_hit_distance_to_tss",
        "reference_genome_assembly",
        "mapping_status",
        "ensembl_source_url",
    ]:
        if name not in fieldnames:
            fieldnames.append(name)

    with open(output_path, "w", encoding="utf-8", newline="") as output_file:
        writer = csv.DictWriter(output_file, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)


def main():
    parser = argparse.ArgumentParser(description="Annotate saRNA genomic coordinates using Ensembl exact matches.")
    parser.add_argument("--input", required=True, help="Input CSV with explicit species/gene/sequence columns.")
    parser.add_argument("--output", required=True, help="Output annotated CSV path.")
    parser.add_argument("--window-bp", type=int, default=DEFAULT_WINDOW_BP, help="Bases searched on each side of the TSS.")
    parser.add_argument("--human-grch37-rescue", action="store_true", help="Try Ensembl GRCh37 for unresolved human rows.")
    args = parser.parse_args()
    annotate_csv(args.input, args.output, args.window_bp, args.human_grch37_rescue)


if __name__ == "__main__":
    main()
