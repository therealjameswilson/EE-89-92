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
    name: "Albania",
    description:
      "Multiparty opening, late communist transition, democratic elections, and U.S. policy toward Tirana."
  },
  {
    name: "Yugoslavia",
    description:
      "Federal crisis, Drnovsek, Jovic, Markovic, dissolution diplomacy, arms embargo, and sanctions policy."
  },
  {
    name: "Slovenia",
    description:
      "Independence declaration, recognition issues, Yugoslav dissolution, and U.S.-European coordination."
  },
  {
    name: "Croatia",
    description:
      "Independence declaration, recognition issues, conflict escalation, and cross-volume Yugoslavia diplomacy."
  },
  {
    name: "Bosnia and Herzegovina",
    description:
      "Recognition, war outbreak, refugees, humanitarian policy, and European and UN diplomacy."
  },
  {
    name: "Serbia and Montenegro",
    description:
      "Sanctions, arms embargo questions, Belgrade policy, and Yugoslav conflict diplomacy."
  },
  {
    name: "Estonia",
    description:
      "Restored independence, Ruutel contacts, Baltic recognition, and Soviet collapse boundary records."
  },
  {
    name: "Latvia",
    description:
      "Godmanis and Gorbunovs contacts, restored independence, Baltic recognition, and Soviet collapse boundary records."
  },
  {
    name: "Lithuania",
    description:
      "Landsbergis contacts, restored independence, Baltic recognition, and Soviet collapse boundary records."
  },
  {
    name: "Ukraine",
    description:
      "Kravchuk contacts, independence recognition, nuclear and Soviet succession issues, and post-Soviet transition."
  }
];

const CHAPTER_ORDER = CHAPTERS.map((chapter) => chapter.name);

const recordsRoot = document.querySelector("#records-root");
const chapterGrid = document.querySelector("#chapter-grid");
const totalRecords = document.querySelector("#total-records");
const chapterTotal = document.querySelector("#chapter-total");
const totalPages = document.querySelector("#total-pages");
const releaseStatusCount = document.querySelector("#release-status-count");
const chapterFilter = document.querySelector("#chapter-filter");
const releaseFilter = document.querySelector("#release-filter");
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

function chaptersWithRecords(records) {
  const names = new Set(records.map((record) => record.chapter.name));
  return CHAPTERS.filter((chapter) => names.has(chapter.name));
}

function setSummary(records) {
  totalRecords.textContent = records.length.toString();
  chapterTotal.textContent = chaptersWithRecords(records).length.toString();
  totalPages.textContent = records
    .reduce((sum, record) => sum + (record.pageCount || 0), 0)
    .toLocaleString();
  releaseStatusCount.textContent = new Set(records.map((record) => record.releaseStatus || "Not stated")).size.toString();

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
  const selectedRelease = releaseFilter.value;
  const query = recordSearch.value.trim().toLowerCase();

  if (selectedChapter !== "all" && record.chapter.name !== selectedChapter) return false;
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
    renderChapterCards(allRecords);
    setSummary(allRecords);
    fillFilters(allRecords);
    renderRecords();
    enableChapterCards();

    for (const control of [chapterFilter, releaseFilter, recordSearch]) {
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
