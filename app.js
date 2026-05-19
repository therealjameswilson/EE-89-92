const CHAPTER_ORDER = [
  "Poland",
  "Hungary",
  "Czechoslovakia",
  "Romania, Bulgaria, and Albania",
  "Yugoslavia and Regional"
];

const recordsRoot = document.querySelector("#records-root");
const totalRecords = document.querySelector("#total-records");
const totalPages = document.querySelector("#total-pages");
const sourceFamilyCount = document.querySelector("#source-family-count");
const chapterFilter = document.querySelector("#chapter-filter");
const statusFilter = document.querySelector("#status-filter");
const recordSearch = document.querySelector("#record-search");

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

function setSummary(records) {
  totalRecords.textContent = records.length.toString();
  totalPages.textContent = records
    .reduce((sum, record) => sum + (record.pageCount || 0), 0)
    .toLocaleString();
  sourceFamilyCount.textContent = new Set(records.map((record) => record.sourceFamily)).size.toString();

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

function fillFilters(records) {
  for (const chapterName of CHAPTER_ORDER) {
    const option = document.createElement("option");
    option.value = chapterName;
    option.textContent = chapterName;
    chapterFilter.append(option);
  }

  const statuses = [...new Set(records.map((record) => record.status))].sort();
  for (const status of statuses) {
    const option = document.createElement("option");
    option.value = status;
    option.textContent = status;
    statusFilter.append(option);
  }
}

function createMeta(record) {
  const meta = document.createElement("div");
  meta.className = "record-meta";

  const values = [
    record.type,
    record.pageCount ? `${record.pageCount.toLocaleString()} pages` : "Pages pending",
    record.countries.join(", "),
    record.sourceFamily,
    record.status
  ];

  for (const value of values) {
    if (!value) continue;
    const item = document.createElement("span");
    item.textContent = value;
    meta.append(item);
  }

  return meta;
}

function createLinks(record) {
  const links = document.createElement("div");
  links.className = "record-links";

  for (const link of record.links || []) {
    const anchor = document.createElement("a");
    anchor.href = link.url;
    anchor.rel = "noreferrer";
    anchor.textContent = link.label;
    links.append(anchor);
  }

  return links;
}

function createRecordRow(record) {
  const row = document.createElement("article");
  row.className = "record-row";

  const date = document.createElement("time");
  date.className = "record-date";
  date.dateTime = record.date;
  date.textContent = formatDate(record.date);

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

  const sourceNote = document.createElement("p");
  sourceNote.className = "record-source-note";
  sourceNote.textContent = record.sourceNote;

  const nextAction = document.createElement("p");
  nextAction.className = "record-next";
  const nextLabel = document.createElement("strong");
  nextLabel.textContent = "Next action:";
  nextAction.append(nextLabel, document.createTextNode(` ${record.nextAction}`));

  body.append(title, dateLine, subject, createMeta(record), sourceNote, nextAction);

  row.append(date, body, createLinks(record));
  return row;
}

function recordMatches(record) {
  const selectedChapter = chapterFilter.value;
  const selectedStatus = statusFilter.value;
  const query = recordSearch.value.trim().toLowerCase();

  if (selectedChapter !== "all" && record.chapter.name !== selectedChapter) return false;
  if (selectedStatus !== "all" && record.status !== selectedStatus) return false;
  if (!query) return true;

  const haystack = [
    record.title,
    record.dateLine,
    record.subjectLine,
    record.sourceFamily,
    record.sourceNote,
    record.nextAction,
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
  recordsRoot.replaceChildren();

  if (!filtered.length) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent = "No chronology cues match the current filters.";
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
    count.textContent = `${chapterRecords.length} cues / ${pageTotal.toLocaleString()} pages`;
    header.append(heading, count);

    const list = document.createElement("div");
    list.className = "record-list";
    for (const record of chapterRecords) {
      list.append(createRecordRow(record));
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
    setSummary(allRecords);
    fillFilters(allRecords);
    renderRecords();
    enableChapterCards();

    for (const control of [chapterFilter, statusFilter, recordSearch]) {
      control.addEventListener("input", renderRecords);
      control.addEventListener("change", renderRecords);
    }

    if (window.location.hash) {
      document.querySelector(window.location.hash)?.scrollIntoView();
    }
  } catch (error) {
    recordsRoot.innerHTML =
      '<p class="error">The Eastern Europe chronology could not be loaded. Try opening this site through a local server or GitHub Pages.</p>';
  }
}

init();
