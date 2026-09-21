(() => {
  "use strict";

  const app = document.getElementById("sarna-database-app");
  if (!app) return;

  const PAGE_SIZES = [25, 50, 100];
  const LABELS = {
    record_id: "Record ID",
    sequence_id: "Sequence ID",
    publication_id: "Publication ID",
    legacy_sarna_id: "Legacy saRNA ID",
    sense_sequence_reported: "Sense sequence as reported",
    antisense_sequence_reported: "Antisense sequence as reported",
    target_gene_reported: "Target gene",
    chromosome: "Chromosome",
    tss_coordinate: "TSS coordinate",
    strand_orientation: "Strand orientation",
    sequence_genomic_location: "Sequence genomic location",
    sequence_location_relative_to_tss: "Sequence location relative to TSS",
    modifications_reported: "Reported modifications",
    sense_length_nt: "Sense length (nt)",
    sense_gc_percent: "Sense GC (%)",
    antisense_length_nt: "Antisense length (nt)",
    antisense_gc_percent: "Antisense GC (%)",
    sense_sequence_normalized: "Sense sequence",
    antisense_sequence_normalized: "Antisense sequence",
    effect_reported: "Reported effect",
    concentration_or_dose_reported: "Dose or concentration",
    time_point_or_duration_reported: "Time or duration",
    cell_type_or_model_reported: "Cell type or model",
    comments: "Comments",
    name_in_reference: "Name in reference",
    transfection_or_delivery_method_reported: "Reported transfection or delivery method",
    species_of_origin: "Species",
    ensembl_gene_id: "Ensembl gene ID",
    reference_genome_assembly: "Genome assembly",
    source_type: "Source type",
    reference_label: "Source",
    title: "Title",
    year: "Year",
    record_count: "Records",
    doi: "DOI",
    pmid: "PMID",
    patent_number: "Patent number",
    related_patent_numbers: "Related patent numbers",
    access_note: "Access note",
  };

  const VIEW_CONFIG = {
    records: {
      label: "Records",
      columns: [
        "record_id",
        "target_gene_reported",
        "sense_sequence_normalized",
        "antisense_sequence_normalized",
        "effect_reported",
        "cell_type_or_model_reported",
        "species_of_origin",
        "_source",
      ],
      defaultSort: "record_id",
    },
    sequences: {
      label: "Sequences",
      columns: [
        "sequence_id",
        "sense_sequence_normalized",
        "antisense_sequence_normalized",
        "record_count",
      ],
      defaultSort: "sequence_id",
    },
    sources: {
      label: "Sources",
      columns: [
        "publication_id",
        "source_type",
        "reference_label",
        "title",
        "year",
        "record_count",
      ],
      defaultSort: "publication_id",
    },
  };

  const state = {
    data: { records: [], sequences: [], sources: [] },
    view: "records",
    query: "",
    filters: { target: "", species: "", sourceType: "", assembly: "" },
    sortKey: "record_id",
    sortDirection: 1,
    page: 1,
    pageSize: 100,
    expanded: new Set(),
  };

  function parseCSV(text) {
    const rows = [];
    let row = [];
    let field = "";
    let quoted = false;

    for (let index = 0; index < text.length; index += 1) {
      const character = text[index];
      if (quoted) {
        if (character === '"') {
          if (text[index + 1] === '"') {
            field += '"';
            index += 1;
          } else {
            quoted = false;
          }
        } else {
          field += character;
        }
      } else if (character === '"') {
        quoted = true;
      } else if (character === ",") {
        row.push(field);
        field = "";
      } else if (character === "\n") {
        row.push(field);
        rows.push(row);
        row = [];
        field = "";
      } else if (character !== "\r") {
        field += character;
      }
    }

    if (field || row.length) {
      row.push(field);
      rows.push(row);
    }

    if (!rows.length) return [];
    rows[0][0] = rows[0][0].replace(/^\uFEFF/, "");
    const headers = rows.shift();
    return rows
      .filter((values) => values.some((value) => value !== ""))
      .map((values) => Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""])));
  }

  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function fieldLabel(field) {
    if (field === "_source") return "Source";
    return LABELS[field] || field.replaceAll("_", " ").replace(/^./, (letter) => letter.toUpperCase());
  }

  function normalizedSearchText(record) {
    return Object.values(record).join(" ").toLocaleLowerCase();
  }

  function sourceURL(source) {
    if (!source) return "";
    if (source.doi) return `https://doi.org/${source.doi}`;
    if (source.pmid) return `https://pubmed.ncbi.nlm.nih.gov/${source.pmid}/`;
    if (source.patent_number) return `https://patents.google.com/patent/${encodeURIComponent(source.patent_number)}/en`;
    return "";
  }

  function displayValue(record, field) {
    if (field === "_source") return record._source?.reference_label || record.publication_id || "";
    return record[field] || "";
  }

  function appendValue(container, record, field) {
    const value = displayValue(record, field);
    if (!value) {
      container.append(element("span", "sarna-empty", "—"));
      return;
    }

    if (field === "_source") {
      const url = sourceURL(record._source);
      if (url) {
        const link = element("a", "", value);
        link.href = url;
        link.dataset.umamiEvent = "source-open";
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        container.append(link);
      } else {
        container.append(document.createTextNode(value));
      }
      if (record._source?.access_note?.toLocaleLowerCase().includes("retract")) {
        container.append(element("span", "sarna-retracted", "Retracted source"));
      }
      return;
    }

    if (state.view === "sources" && field === "reference_label") {
      const url = sourceURL(record);
      if (url) {
        const link = element("a", "", value);
        link.href = url;
        link.dataset.umamiEvent = "source-open";
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        container.append(link);
        return;
      }
    }

    container.append(document.createTextNode(value));
  }

  function uniqueSorted(values) {
    return [...new Set(values.filter(Boolean))].sort((left, right) => left.localeCompare(right, undefined, { numeric: true }));
  }

  function buildSelect(labelText, key, values) {
    const group = element("div", "sarna-filter");
    const label = element("label", "", labelText);
    const select = element("select");
    select.dataset.filter = key;
    label.htmlFor = `sarna-filter-${key}`;
    select.id = label.htmlFor;
    const allOption = element("option", "", "All");
    allOption.value = "";
    select.append(allOption);
    values.forEach((value) => {
      const option = element("option", "", value);
      option.value = value;
      select.append(option);
    });
    select.value = state.filters[key];
    select.addEventListener("change", () => {
      state.filters[key] = select.value;
      state.page = 1;
      state.expanded.clear();
      renderResults();
    });
    group.append(label, select);
    return group;
  }

  function renderShell() {
    app.replaceChildren();

    const tabs = element("div", "sarna-view-tabs");
    tabs.setAttribute("role", "tablist");
    tabs.setAttribute("aria-label", "Database tables");
    Object.entries(VIEW_CONFIG).forEach(([key, config]) => {
      const button = element("button", "sarna-view-tab", `${config.label} (${state.data[key].length.toLocaleString()})`);
      button.type = "button";
      button.dataset.view = key;
      button.setAttribute("role", "tab");
      button.setAttribute("aria-selected", key === state.view ? "true" : "false");
      button.addEventListener("click", () => {
        state.view = key;
        state.query = "";
        state.page = 1;
        state.sortKey = VIEW_CONFIG[key].defaultSort;
        state.sortDirection = 1;
        state.expanded.clear();
        renderShell();
      });
      tabs.append(button);
    });

    const controls = element("div", "sarna-database-controls");
    const searchGroup = element("div", "sarna-search");
    const searchLabel = element("label", "", `Search ${VIEW_CONFIG[state.view].label.toLocaleLowerCase()}`);
    searchLabel.htmlFor = "sarna-search-input";
    const search = element("input");
    search.id = searchLabel.htmlFor;
    search.type = "search";
    search.placeholder = state.view === "records" ? "Gene, sequence, model, record ID, publication…" : "Search all fields…";
    search.autocomplete = "off";
    search.value = state.query;
    search.addEventListener("input", () => {
      state.query = search.value.trim().toLocaleLowerCase();
      state.page = 1;
      state.expanded.clear();
      renderResults();
    });
    searchGroup.append(searchLabel, search);
    controls.append(searchGroup);

    if (state.view === "records") {
      const filterGrid = element("div", "sarna-filter-grid");
      filterGrid.append(
        buildSelect("Target gene", "target", uniqueSorted(state.data.records.map((row) => row.target_gene_reported))),
        buildSelect("Species", "species", uniqueSorted(state.data.records.map((row) => row.species_of_origin))),
        buildSelect("Source type", "sourceType", uniqueSorted(state.data.records.map((row) => row._source?.source_type))),
        buildSelect("Genome assembly", "assembly", uniqueSorted(state.data.records.map((row) => row.reference_genome_assembly))),
      );
      controls.append(filterGrid);
    }

    const actions = element("div", "sarna-control-actions");
    const reset = element("button", "sarna-secondary-button", "Clear search and filters");
    reset.type = "button";
    reset.addEventListener("click", () => {
      state.query = "";
      state.filters = { target: "", species: "", sourceType: "", assembly: "" };
      state.page = 1;
      state.expanded.clear();
      renderShell();
    });
    actions.append(reset);
    controls.append(actions);

    const summary = element("p", "sarna-results-summary");
    summary.id = "sarna-results-summary";
    summary.setAttribute("aria-live", "polite");
    const tableRegion = element("div", "sarna-table-region");
    tableRegion.id = "sarna-table-region";
    tableRegion.setAttribute("role", "region");
    tableRegion.setAttribute("aria-label", `${VIEW_CONFIG[state.view].label} results`);
    tableRegion.tabIndex = 0;
    const pagination = element("div", "sarna-pagination");
    pagination.id = "sarna-pagination";

    app.append(tabs, controls, summary, tableRegion, pagination);
    renderResults();
  }

  function filteredRows() {
    return state.data[state.view].filter((record) => {
      if (state.query && !record._search.includes(state.query)) return false;
      if (state.view !== "records") return true;
      if (state.filters.target && record.target_gene_reported !== state.filters.target) return false;
      if (state.filters.species && record.species_of_origin !== state.filters.species) return false;
      if (state.filters.sourceType && record._source?.source_type !== state.filters.sourceType) return false;
      if (state.filters.assembly && record.reference_genome_assembly !== state.filters.assembly) return false;
      return true;
    });
  }

  function sortableValue(record, key) {
    const value = displayValue(record, key);
    if (["record_count", "year", "sense_length_nt", "antisense_length_nt", "sense_gc_percent", "antisense_gc_percent"].includes(key)) {
      const number = Number(value);
      return Number.isFinite(number) ? number : Number.POSITIVE_INFINITY;
    }
    return value.toLocaleLowerCase();
  }

  function renderHeader(table, columns) {
    const thead = element("thead");
    const row = element("tr");
    const detailHeader = element("th", "sarna-detail-heading", "Details");
    detailHeader.scope = "col";
    row.append(detailHeader);
    columns.forEach((field) => {
      const th = element("th");
      th.scope = "col";
      const button = element("button", "sarna-sort-button", fieldLabel(field));
      button.type = "button";
      if (state.sortKey === field) {
        button.dataset.direction = state.sortDirection === 1 ? "ascending" : "descending";
        button.setAttribute("aria-sort", button.dataset.direction);
        button.append(document.createTextNode(state.sortDirection === 1 ? " ↑" : " ↓"));
      }
      button.addEventListener("click", () => {
        if (state.sortKey === field) state.sortDirection *= -1;
        else {
          state.sortKey = field;
          state.sortDirection = 1;
        }
        state.page = 1;
        state.expanded.clear();
        renderResults();
      });
      th.append(button);
      row.append(th);
    });
    thead.append(row);
    table.append(thead);
  }

  function recordKey(record) {
    return record.record_id || record.sequence_id || record.publication_id;
  }

  function renderDetails(record, colspan) {
    const detailRow = element("tr", "sarna-detail-row");
    const cell = element("td");
    cell.colSpan = colspan;
    const wrapper = element("div", "sarna-record-details");
    const heading = element("h3", "", `${recordKey(record)} details`);
    const list = element("dl");

    Object.entries(record)
      .filter(([field]) => !field.startsWith("_"))
      .forEach(([field, value]) => {
        const term = element("dt", "", fieldLabel(field));
        const definition = element("dd");
        definition.textContent = value || "—";
        if (field.includes("sequence")) definition.classList.add("sarna-sequence");
        list.append(term, definition);
      });

    if (state.view === "records" && record._source) {
      const sourceHeading = element("h4", "", "Source details");
      wrapper.append(heading, list, sourceHeading);
      const sourceList = element("dl");
      ["publication_id", "source_type", "reference_label", "title", "year", "doi", "pmid", "patent_number", "access_note"].forEach((field) => {
        const term = element("dt", "", fieldLabel(field));
        const definition = element("dd");
        definition.textContent = record._source[field] || "—";
        sourceList.append(term, definition);
      });
      wrapper.append(sourceList);
    } else {
      wrapper.append(heading, list);
    }

    cell.append(wrapper);
    detailRow.append(cell);
    return detailRow;
  }

  function renderBody(table, rows, columns) {
    const tbody = element("tbody");
    rows.forEach((record) => {
      const key = recordKey(record);
      const row = element("tr");
      const toggleCell = element("td", "sarna-detail-cell");
      const toggle = element("button", "sarna-expand-button", state.expanded.has(key) ? "Hide" : "Expand");
      toggle.type = "button";
      toggle.setAttribute("aria-expanded", state.expanded.has(key) ? "true" : "false");
      toggle.setAttribute("aria-label", `${state.expanded.has(key) ? "Hide" : "Show"} all fields for ${key}`);
      toggle.addEventListener("click", () => {
        if (state.expanded.has(key)) state.expanded.delete(key);
        else state.expanded.add(key);
        renderResults();
      });
      toggleCell.append(toggle);
      row.append(toggleCell);

      columns.forEach((field) => {
        const cell = element("td");
        if (field.includes("sequence")) cell.classList.add("sarna-sequence");
        appendValue(cell, record, field);
        row.append(cell);
      });
      tbody.append(row);
      if (state.expanded.has(key)) tbody.append(renderDetails(record, columns.length + 1));
    });
    table.append(tbody);
  }

  function renderPagination(totalRows, totalPages) {
    const pagination = document.getElementById("sarna-pagination");
    pagination.replaceChildren();

    const previous = element("button", "sarna-secondary-button", "Previous");
    previous.type = "button";
    previous.disabled = state.page <= 1;
    previous.addEventListener("click", () => {
      state.page -= 1;
      state.expanded.clear();
      renderResults();
      document.getElementById("sarna-results-summary").scrollIntoView({ block: "nearest" });
    });

    const pageLabel = element("span", "", totalRows ? `Page ${state.page} of ${totalPages}` : "No pages");

    const next = element("button", "sarna-secondary-button", "Next");
    next.type = "button";
    next.disabled = state.page >= totalPages;
    next.addEventListener("click", () => {
      state.page += 1;
      state.expanded.clear();
      renderResults();
      document.getElementById("sarna-results-summary").scrollIntoView({ block: "nearest" });
    });

    const sizeGroup = element("label", "sarna-page-size", "Rows per page ");
    const size = element("select");
    PAGE_SIZES.forEach((value) => {
      const option = element("option", "", String(value));
      option.value = String(value);
      size.append(option);
    });
    size.value = String(state.pageSize);
    size.addEventListener("change", () => {
      state.pageSize = Number(size.value);
      state.page = 1;
      state.expanded.clear();
      renderResults();
    });
    sizeGroup.append(size);
    pagination.append(previous, pageLabel, next, sizeGroup);
  }

  function renderResults() {
    const config = VIEW_CONFIG[state.view];
    const rows = filteredRows();
    rows.sort((left, right) => {
      const a = sortableValue(left, state.sortKey);
      const b = sortableValue(right, state.sortKey);
      if (typeof a === "number" && typeof b === "number") return (a - b) * state.sortDirection;
      return String(a).localeCompare(String(b), undefined, { numeric: true }) * state.sortDirection;
    });

    const totalPages = Math.max(1, Math.ceil(rows.length / state.pageSize));
    state.page = Math.min(state.page, totalPages);
    const start = (state.page - 1) * state.pageSize;
    const pageRows = rows.slice(start, start + state.pageSize);

    document.getElementById("sarna-results-summary").textContent =
      `${rows.length.toLocaleString()} of ${state.data[state.view].length.toLocaleString()} ${config.label.toLocaleLowerCase()}`;

    const region = document.getElementById("sarna-table-region");
    region.replaceChildren();
    if (!rows.length) {
      region.append(element("p", "sarna-no-results", "No matching results. Clear the search or filters and try again."));
    } else {
      const table = element("table", "sarna-data-table");
      renderHeader(table, config.columns);
      renderBody(table, pageRows, config.columns);
      region.append(table);
    }
    renderPagination(rows.length, totalPages);
  }

  async function loadData() {
    try {
      const paths = {
        records: app.dataset.recordsUrl,
        sequences: app.dataset.sequencesUrl,
        sources: app.dataset.sourcesUrl,
      };
      const entries = await Promise.all(
        Object.entries(paths).map(async ([key, url]) => {
          const response = await fetch(url);
          if (!response.ok) throw new Error(`Could not load ${key}.`);
          return [key, parseCSV(await response.text())];
        }),
      );
      entries.forEach(([key, data]) => {
        state.data[key] = data;
      });

      const sources = new Map(state.data.sources.map((source) => [source.publication_id, source]));
      state.data.records.forEach((record) => {
        record._source = sources.get(record.publication_id) || null;
        record._search = `${normalizedSearchText(record)} ${record._source ? normalizedSearchText(record._source) : ""}`;
      });
      state.data.sequences.forEach((record) => {
        record._search = normalizedSearchText(record);
      });
      state.data.sources.forEach((record) => {
        record._search = normalizedSearchText(record);
      });
      renderShell();
    } catch (error) {
      app.replaceChildren();
      const message = element("div", "sarna-load-error");
      message.setAttribute("role", "alert");
      message.append(
        element("h2", "", "The database could not be loaded"),
        element("p", "", "Please refresh the page. The complete release remains available from the Zenodo archive linked above."),
      );
      app.append(message);
    }
  }

  loadData();
})();
