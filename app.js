const CHAPTERS = [
  {
    name: "Poland",
    description:
      "Round Table politics, elections, presidential travel, debt relief, Walesa, and post-communist transition diplomacy."
  },
  {
    name: "Hungary",
    description:
      "Border opening, Nagy reburial, East German refugee route, republic proclamation, Antall, Goncz, and reform diplomacy."
  },
  {
    name: "Czechoslovakia",
    description:
      "Velvet Revolution, Havel diplomacy, federal and Czech-Slovak leadership, troop withdrawal, and reform assistance."
  },
  {
    name: "Bulgaria",
    description:
      "Zhivkov's fall, constitutional transition, Zhelev, Dimitrov, reform policy, and U.S. assistance."
  },
  {
    name: "Romania",
    description:
      "Ceausescu's fall, elections, Iliescu-era transition, credentials, human rights, and assistance questions."
  },
  {
    name: "East Germany",
    description:
      "German Democratic Republic transition diplomacy, de Maiziere contacts, and unification-era Eastern Europe implications."
  }
];

const CHAPTER_ORDER = CHAPTERS.map((chapter) => chapter.name);

const recordsRoot = document.querySelector("#records-root");
const chapterGrid = document.querySelector("#chapter-grid");
const totalRecords = document.querySelector("#total-records");
const chapterTotal = document.querySelector("#chapter-total");
const totalPages = document.querySelector("#total-pages");
const fullReleaseCount = document.querySelector("#full-release-count");
const partialReleaseCount = document.querySelector("#partial-release-count");
const chapterFilter = document.querySelector("#chapter-filter");
const typeFilter = document.querySelector("#type-filter");
const releaseFilter = document.querySelector("#release-filter");
const recordSearch = document.querySelector("#record-search");
const resetFilters = document.querySelector("#reset-filters");

let allRecords = [];

function chapterId(chapterName) {
  return `chapter-${chapterName
    .toLowerCase()
    .replaceAll(",", "")
    .replaceAll(" and ", "-")
    .replaceAll(" ", "-")}`;
}

function formatDate(dateString) {
  const date = new Date(`${dateString}T00:00:00Z`);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC"
  }).format(date);
}

function byChapterThenDate(a, b) {
  return (
    a.chapter.number - b.chapter.number ||
    a.sortDate.localeCompare(b.sortDate) ||
    a.title.localeCompare(b.title)
  );
}

function chaptersWithRecords(records) {
  const names = new Set(records.map((record) => record.chapter.name));
  return CHAPTERS.filter((chapter) => names.has(chapter.name));
}

function setSummary(records) {
  const releaseCounts = records.reduce(
    (counts, record) => {
      if (record.releaseStatus === "Full") counts.full += 1;
      if (record.releaseStatus === "Partial") counts.partial += 1;
      return counts;
    },
    { full: 0, partial: 0 }
  );

  totalRecords.textContent = records.length.toString();
  chapterTotal.textContent = chaptersWithRecords(records).length.toString();
  totalPages.textContent = records
    .reduce((sum, record) => sum + (record.pageCount || 0), 0)
    .toLocaleString();
  fullReleaseCount.textContent = releaseCounts.full.toString();
  partialReleaseCount.textContent = releaseCounts.partial.toString();

  for (const chapterName of CHAPTER_ORDER) {
    const chapterRecords = records.filter((record) => record.chapter.name === chapterName);
    const countNode = document.querySelector(`[data-chapter-count="${chapterName}"]`);
    const pagesNode = document.querySelector(`[data-chapter-pages="${chapterName}"]`);
    const pageTotal = chapterRecords.reduce((sum, record) => sum + (record.pageCount || 0), 0);
    if (countNode) {
      countNode.textContent = chapterRecords.length.toString();
    }
    if (pagesNode) {
      pagesNode.textContent = pageTotal.toLocaleString();
    }
  }
}

function renderChapterCards(records) {
  if (!chapterGrid) return;

  chapterGrid.replaceChildren();
  chaptersWithRecords(records).forEach((chapter) => {
    const chapterRecords = records.filter((record) => record.chapter.name === chapter.name);
    const pageTotal = chapterRecords.reduce((sum, record) => sum + (record.pageCount || 0), 0);
    const card = document.createElement("a");
    card.className = "chapter-card";
    card.href = `#${chapterId(chapter.name)}`;
    card.setAttribute("aria-label", `View ${chapter.name} chronology`);

    const number = document.createElement("p");
    number.className = "chapter-number";
    number.textContent = `Chapter ${CHAPTER_ORDER.indexOf(chapter.name) + 1}`;

    const heading = document.createElement("h3");
    heading.textContent = chapter.name;

    const count = document.createElement("p");
    count.className = "chapter-count";
    count.textContent = `${chapterRecords.length} documents / ${pageTotal.toLocaleString()} pages`;

    const description = document.createElement("p");
    description.textContent = chapter.description;

    const action = document.createElement("span");
    action.className = "chapter-action";
    action.textContent = "View documents";

    card.append(number, heading, count, description, action);
    chapterGrid.append(card);
  });
}

function fillFilters(records) {
  for (const { name: chapterName } of chaptersWithRecords(records)) {
    const option = document.createElement("option");
    option.value = chapterName;
    option.textContent = chapterName;
    chapterFilter.append(option);
  }

  const types = [...new Set(records.map((record) => record.type))].sort();
  for (const type of types) {
    const option = document.createElement("option");
    option.value = type;
    option.textContent = type;
    typeFilter.append(option);
  }

  const releaseStatuses = [...new Set(records.map((record) => record.releaseStatus || "Not stated"))].sort();
  for (const status of releaseStatuses) {
    const option = document.createElement("option");
    option.value = status;
    option.textContent = status;
    releaseFilter.append(option);
  }
}

function createMeta(record) {
  const meta = document.createElement("div");
  meta.className = "record-meta";

  const values = [
    record.type,
    record.pageCount ? `${record.pageCount.toLocaleString()} pages` : "Pages pending",
    record.releaseStatus ? `${record.releaseStatus} release` : "",
    record.coverageRole,
    record.countries.join(", "),
    record.sourceFamily,
    record.naid ? `NAID ${record.naid}` : ""
  ];

  for (const value of values) {
    if (!value) continue;
    const item = document.createElement("span");
    item.textContent = value;
    meta.append(item);
  }

  return meta;
}

function hasConversationTime(record) {
  return /(\d{1,2}:\d{2}|a\.m\.|p\.m\.)/i.test(record.dateLine || "");
}

function readinessItems(record) {
  return [
    { label: "Source note", ready: Boolean(record.sourceNote) },
    { label: "Catalog", ready: Boolean(record.catalogUrl || record.naid) },
    { label: "PDF", ready: Boolean(record.pdfUrl) },
    { label: "Pages", ready: Number(record.pageCount) > 0 },
    { label: "Release", ready: Boolean(record.releaseStatus) },
    {
      label: "Time check",
      ready: hasConversationTime(record),
      note: hasConversationTime(record) ? "Conversation time visible" : "Verify Washington time in PDF"
    }
  ];
}

function createReadiness(record) {
  const list = document.createElement("div");
  list.className = "record-readiness";

  for (const item of readinessItems(record)) {
    const badge = document.createElement("span");
    badge.className = item.ready ? "readiness-badge ready" : "readiness-badge needs-review";
    badge.textContent = item.label;
    if (item.note) badge.title = item.note;
    list.append(badge);
  }

  return list;
}

function citationText(record) {
  return [
    `${record.title}, ${record.dateLine || record.date}.`,
    record.sourceNote,
    record.pageCount ? `Compiler page count: ${record.pageCount.toLocaleString()} pages.` : "",
    record.catalogUrl ? `Catalog reference: ${record.catalogUrl}.` : "",
    record.pdfUrl ? `PDF scan: ${record.pdfUrl}.` : ""
  ]
    .filter(Boolean)
    .join(" ");
}

async function copyText(text, button) {
  const original = button.textContent;
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
    } else {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "fixed";
      textarea.style.left = "-9999px";
      document.body.append(textarea);
      textarea.select();
      document.execCommand("copy");
      textarea.remove();
    }
    button.textContent = "Copied";
  } catch {
    button.textContent = "Copy failed";
  } finally {
    setTimeout(() => {
      button.textContent = original;
    }, 1400);
  }
}

function createCopyButton(label, text) {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = label;
  button.addEventListener("click", () => copyText(text, button));
  return button;
}

function createLinks(record) {
  const links = document.createElement("div");
  links.className = "record-links";

  links.append(
    createCopyButton("Copy source note", record.sourceNote || ""),
    createCopyButton("Copy citation", citationText(record))
  );

  for (const link of record.links || []) {
    const anchor = document.createElement("a");
    anchor.href = link.url;
    anchor.rel = "noreferrer";
    anchor.textContent = link.label;
    links.append(anchor);
  }

  return links;
}

function createSourceDetails(record) {
  const details = document.createElement("details");
  details.className = "record-source-details";

  const summary = document.createElement("summary");
  summary.textContent = "Source note and compiler checks";

  const sourceNote = document.createElement("p");
  sourceNote.className = "record-source-note";
  sourceNote.textContent = record.sourceNote;

  const nextAction = document.createElement("p");
  nextAction.className = "record-next";
  const nextLabel = document.createElement("strong");
  nextLabel.textContent = "Compiler action:";
  nextAction.append(nextLabel, document.createTextNode(` ${record.nextAction}`));

  const method = document.createElement("p");
  method.className = "record-next";
  method.textContent =
    "FRUS check: verify original classification, distribution, drafting information, marginalia, omissions, and Washington conversation time in the PDF before final selection.";

  details.append(summary, sourceNote, nextAction, method);
  return details;
}

// BEGIN PRESIDENTIAL CITATION CROSS-CHECK
let bushCitationAuditPromise;
function loadBushCitationAudit() {
  if (!bushCitationAuditPromise) {
    bushCitationAuditPromise = fetch("data/bush-presidential-citation-matches.json?v=20261031")
      .then(response => {
        if (!response.ok) throw new Error("Citation cross-check unavailable");
        return response.json();
      })
      .then(audit => {
        if (audit.schemaVersion !== 1 || !audit.matchesByRecordId) throw new Error("Citation cross-check format unavailable");
        return audit;
      })
      .catch(error => { bushCitationAuditPromise = undefined; throw error; });
  }
  return bushCitationAuditPromise;
}
function bushCitationText(tag, text, className = "") {
  const node = document.createElement(tag);
  node.textContent = text;
  if (className) node.className = className;
  return node;
}
function bushCitationLink(text, href) {
  const node = bushCitationText("a", text);
  node.href = href;
  node.target = "_blank";
  node.rel = "noopener noreferrer";
  return node;
}
async function copyBushCitationSource(text) {
  if (navigator.clipboard?.writeText) {
    try { await navigator.clipboard.writeText(text); return; } catch { /* Use the fallback below. */ }
  }
  const field = document.createElement("textarea");
  field.value = text;
  field.readOnly = true;
  field.style.position = "fixed";
  field.style.left = "-9999px";
  document.body.append(field);
  try {
    field.select();
    if (!document.execCommand("copy")) throw new Error("Copy unavailable");
  } finally { field.remove(); }
}
function createBushCitationCandidate(candidate, match) {
  const card = bushCitationText("section", "", "bush-citation-candidate");
  const inferred = match.status === "candidate-existing-inference";
  card.append(bushCitationText("h4", `${inferred ? "Candidate folder reference" : "Canonical folder reference"} · ${candidate.id}`));
  const label = bushCitationText("label", "Plain Source: stem — not a verified document citation", "bush-citation-label");
  const source = document.createElement("textarea");
  source.className = "bush-citation-source";
  source.readOnly = true;
  source.rows = 4;
  source.value = candidate.n;
  source.setAttribute("aria-label", `Source stem for canonical row ${candidate.id}`);
  label.append(source);
  const actions = bushCitationText("div", "", "bush-citation-actions");
  const copy = bushCitationText("button", inferred ? "Copy candidate Source stem" : "Copy folder Source stem");
  copy.type = "button";
  const status = bushCitationText("p", "", "bush-citation-status");
  status.setAttribute("role", "status");
  copy.addEventListener("click", async () => {
    try {
      await copyBushCitationSource(candidate.n);
      status.textContent = "Source stem copied. Review flags and match evidence are not included.";
    } catch {
      source.focus(); source.select();
      status.textContent = "Automatic copy is unavailable. The Source stem is selected; use your device’s Copy command.";
    }
  });
  actions.append(copy, bushCitationLink("View canonical source row ↗", `https://therealjameswilson.github.io/bush41-nsc-source-notes/?id=${encodeURIComponent(candidate.id)}`));
  card.append(label, actions, status);
  const reference = [candidate.g, candidate.ss || candidate.st, candidate.oa ? `OA/ID ${candidate.oa}` : "", candidate.na ? `File-unit NAID ${candidate.na}` : "", candidate.sn ? `Series NAID ${candidate.sn}` : ""].filter(Boolean).join(" · ");
  card.append(bushCitationText("p", reference, "bush-citation-metadata"));
  card.append(bushCitationText("p", `Source level: ${candidate.t || "unspecified"}. Availability in the source: ${candidate.a || "not stated"}. Availability is separate from the document’s original classification and release status.`, "bush-citation-metadata"));
  const evidence = (match.matchingEvidence || []).find(item => item.canonicalRowId === candidate.id);
  if (evidence?.identifiers?.length) {
    card.append(bushCitationText("p", `Identifier evidence: ${evidence.identifiers.map(item => `${item.field} = ${item.value} (${item.comparison})`).join("; ")}.`, "bush-citation-metadata"));
  }
  for (const warning of evidence?.cautions || []) card.append(bushCitationText("p", warning, "bush-citation-warning"));
  const links = bushCitationText("div", "", "bush-citation-actions");
  if (candidate.c) links.append(bushCitationLink("Canonical folder catalog reference ↗", candidate.c));
  if (candidate.o) links.append(bushCitationLink("Canonical folder’s linked object — may be another document ↗", candidate.o));
  card.append(links);
  return card;
}
function createBushCitationDetails(record) {
  const details = bushCitationText("details", "", "bush-citation-details");
  const summary = bushCitationText("summary", "Check copyable Bush 41 folder reference");
  const content = bushCitationText("div", "", "bush-citation-content");
  const status = bushCitationText("p", "Citation evidence loads when this section opens.");
  status.setAttribute("role", "status");
  content.append(status); details.append(summary, content);
  let loaded = false; let loading = false;
  details.addEventListener("toggle", async () => {
    if (!details.open || loaded || loading) return;
    loading = true;
    status.textContent = "Loading the canonical folder-reference cross-check…";
    try {
      const audit = await loadBushCitationAudit();
      const match = audit.matchesByRecordId[record.id];
      if (!match) {
        summary.textContent = "Record outside this citation cross-check";
        content.replaceChildren(bushCitationText("p", `This record is not among the ${audit.counts.records} records in the checked source set. No match assessment or citation has been inferred. Preserve its existing source note and document links; use the full collection for further research.`));
        content.append(bushCitationLink("Search the complete Bush 41 collection ↗", "https://therealjameswilson.github.io/bush41-nsc-source-notes/"));
        content.append(bushCitationText("p", audit.scope, "bush-citation-metadata"));
        content.append(bushCitationLink("Download the audited record list and source version", "data/bush-presidential-citation-matches.json"));
        loaded = true;
        return;
      }
      const rows = match.canonicalRows || [];
      const inferred = match.status === "candidate-existing-inference";
      summary.textContent = inferred ? "Candidate folder reference · prior inference remains unverified"
        : rows.length ? "Exact folder identifier reference · document attribution unverified"
        : "No exact folder reference in the checked collection";
      content.replaceChildren(bushCitationText("p", match.matchBasis));
      if (rows.length) {
        content.append(bushCitationText("p", "This checks recorded folder identifiers, not the document image or the document’s attribution to that folder. Zero item citations were verified. Keep the original document PDF, existing source/classification notes and stronger item citations; do not replace State Department FOIA provenance.", "bush-citation-warning"));
        if (inferred) content.append(bushCitationText("p", `Candidate only: this record already used an inferential attribution${match.existingEvidence?.priorMatchMethod ? ` (${match.existingEvidence.priorMatchMethod})` : ""}. Matching the recorded folder identifier does not validate that earlier inference.`, "bush-citation-warning"));
        for (const warning of match.reviewFlags || []) content.append(bushCitationText("p", warning, "bush-citation-warning"));
        if (rows.length > 1) content.append(bushCitationText("p", "All canonical candidate rows are retained below. No candidate was selected automatically.", "bush-citation-warning"));
        rows.forEach(candidate => content.append(createBushCitationCandidate(candidate, match)));
      } else {
        content.append(bushCitationText("p", "No citation has been inferred. Preserve the existing source note and document links. Search the complete collection and verify the repository, series, folder and document identity before using a stem."));
        content.append(bushCitationLink("Search the complete Bush 41 collection ↗", "https://therealjameswilson.github.io/bush41-nsc-source-notes/"));
      }
      const counts = audit.counts;
      const coverage = `${counts.matchedFolderReferences || 0} of ${counts.records} records have canonical folder references${counts['candidate-existing-inference'] ? `, including ${counts['candidate-existing-inference']} prior inferential candidates` : ""}; ${counts.unmatched || 0} remain unmatched. Zero verified item citations.`;
      content.append(bushCitationText("p", coverage, "bush-citation-metadata"));
      const version = bushCitationText("p", `Checked source: ${audit.sourceVersion.entryCount.toLocaleString()} canonical rows, generated ${audit.sourceVersion.generatedAt}. `, "bush-citation-metadata");
      version.append(bushCitationLink("Download cross-check, input hashes and match rules", "data/bush-presidential-citation-matches.json"));
      content.append(version);
      loaded = true;
    } catch {
      status.textContent = "Citation evidence could not load. Close and reopen this section to retry, or open the complete source collection.";
      if (!content.querySelector("a")) content.append(bushCitationLink("Open the complete Bush 41 collection ↗", "https://therealjameswilson.github.io/bush41-nsc-source-notes/"));
    } finally { loading = false; }
  });
  return details;
}
// END PRESIDENTIAL CITATION CROSS-CHECK

function createRecordRow(record, candidateNumber) {
  const row = document.createElement("article");
  row.className = "record-row";

  const dateCell = document.createElement("div");
  dateCell.className = "record-date-cell";

  const sequence = document.createElement("p");
  sequence.className = "record-sequence";
  sequence.textContent = `Candidate ${String(candidateNumber).padStart(3, "0")}`;

  const date = document.createElement("time");
  date.className = "record-date";
  date.dateTime = record.date;
  date.textContent = formatDate(record.date);
  dateCell.append(sequence, date);

  const body = document.createElement("div");

  const title = document.createElement(record.links?.[0] ? "a" : "span");
  title.className = "record-title";
  title.textContent = record.title;
  if (record.links?.[0]) {
    title.href = record.links[0].url;
    title.rel = "noreferrer";
  }

  const dateLine = document.createElement("p");
  dateLine.className = "record-date-line";
  dateLine.textContent = record.dateLine || formatDate(record.date);

  const subject = document.createElement("p");
  subject.className = "record-subject";
  subject.textContent = record.subjectLine || record.topics.join(", ");

  body.append(title, dateLine, subject, createMeta(record), createReadiness(record), createSourceDetails(record));

  body.append(createBushCitationDetails(record));

  row.append(dateCell, body, createLinks(record));
  return row;
}

function recordMatches(record) {
  const selectedChapter = chapterFilter.value;
  const selectedType = typeFilter.value;
  const selectedRelease = releaseFilter.value;
  const query = recordSearch.value.trim().toLowerCase();

  if (selectedChapter !== "all" && record.chapter.name !== selectedChapter) return false;
  if (selectedType !== "all" && record.type !== selectedType) return false;
  if (selectedRelease !== "all" && (record.releaseStatus || "Not stated") !== selectedRelease) return false;
  if (!query) return true;

  const haystack = [
    record.title,
    record.dateLine,
    record.subjectLine,
    record.sourceFamily,
    record.sourceNote,
    record.nextAction,
    record.naid,
    record.releaseStatus,
    ...record.countries,
    ...record.topics
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return haystack.includes(query);
}

function renderRecords() {
  const filtered = allRecords.filter(recordMatches).sort(byChapterThenDate);
  const sequenceById = new Map(allRecords.slice().sort(byChapterThenDate).map((record, index) => [record.id, index + 1]));
  recordsRoot.replaceChildren();

  if (!filtered.length) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent = "No declassified memcons or telcons match the current filters.";
    recordsRoot.append(empty);
    return;
  }

  for (const chapterName of CHAPTER_ORDER) {
    const chapterRecords = filtered.filter((record) => record.chapter.name === chapterName);
    if (!chapterRecords.length) continue;

    const section = document.createElement("section");
    section.className = "record-chapter";
    section.id = chapterId(chapterName);

    const header = document.createElement("div");
    header.className = "record-chapter-header";

    const heading = document.createElement("h3");
    heading.textContent = `Chapter ${CHAPTER_ORDER.indexOf(chapterName) + 1}: ${chapterName}`;

    const count = document.createElement("p");
    count.className = "record-count";
    const pageTotal = chapterRecords.reduce((sum, record) => sum + (record.pageCount || 0), 0);
    count.textContent = `${chapterRecords.length} documents / ${pageTotal.toLocaleString()} pages`;
    header.append(heading, count);

    const list = document.createElement("div");
    list.className = "record-list";
    for (const record of chapterRecords) {
      list.append(createRecordRow(record, sequenceById.get(record.id)));
    }

    section.append(header, list);
    recordsRoot.append(section);
  }
}

function enableChapterCards() {
  for (const card of document.querySelectorAll(".chapter-card")) {
    card.addEventListener("click", (event) => {
      const targetId = card.getAttribute("href");
      if (!targetId?.startsWith("#")) return;

      const target = document.querySelector(targetId);
      if (!target) return;

      event.preventDefault();
      history.pushState(null, "", targetId);
      target.scrollIntoView({ block: "start" });
    });
  }
}

async function loadRecords() {
  const response = await fetch("data/records.json");
  if (!response.ok) throw new Error(`Could not load records: ${response.status}`);
  return response.json();
}

async function init() {
  try {
    allRecords = window.EE_RECORDS || (await loadRecords());
    renderChapterCards(allRecords);
    setSummary(allRecords);
    fillFilters(allRecords);
    renderRecords();
    enableChapterCards();

    for (const control of [chapterFilter, typeFilter, releaseFilter, recordSearch]) {
      control.addEventListener("input", renderRecords);
      control.addEventListener("change", renderRecords);
    }

    resetFilters.addEventListener("click", () => {
      chapterFilter.value = "all";
      typeFilter.value = "all";
      releaseFilter.value = "all";
      recordSearch.value = "";
      renderRecords();
    });

    if (window.location.hash) {
      document.querySelector(window.location.hash)?.scrollIntoView();
    }
  } catch (error) {
    recordsRoot.innerHTML =
      '<p class="error">The declassified memcon/telcon list could not be loaded. Try opening this site through a local server or GitHub Pages.</p>';
  }
}

init();
