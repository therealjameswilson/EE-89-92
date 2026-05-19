const fs = require("fs");
const http = require("http");
const https = require("https");
const path = require("path");
const { execFileSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const DATA_PATH = path.join(ROOT, "data", "records.json");
const MIRROR_PATH = path.join(ROOT, "data", "records.js");
const AUDIT_PATH = path.join(ROOT, "reports", "bush-eastern-europe-leader-memcon-telcon-audit.json");
const CACHE_DIR = path.join("/private/tmp", "ee-89-92-bush-leader-pdfs");
const TABLE_URL = "https://www.bush41library.gov/digital-research-room/about-textual-collections/memcons-and-telcons";

const CHAPTER_ALIASES = [
  {
    chapter: { number: 1, name: "Poland" },
    countries: ["Poland"]
  },
  {
    chapter: { number: 2, name: "Hungary" },
    countries: ["Hungary"]
  },
  {
    chapter: { number: 3, name: "Czechoslovakia" },
    countries: ["Czechoslovakia", "Czech Republic", "Czech and Slovak Federal Republic", "Slovak Republic", "Slovakia"]
  },
  {
    chapter: { number: 4, name: "Romania, Bulgaria, and Albania" },
    countries: ["Romania", "Bulgaria", "Albania"]
  },
  {
    chapter: { number: 5, name: "Yugoslavia and Regional" },
    countries: [
      "Yugoslavia",
      "Croatia",
      "Slovenia",
      "Serbia",
      "Bosnia",
      "Bosnia and Herzegovina",
      "Macedonia",
      "Estonia",
      "Latvia",
      "Lithuania",
      "Ukraine",
      "Ukrainian"
    ]
  }
];

const HEAD_OF_STATE_OR_GOVERNMENT_TERMS = [
  "Antall",
  "Bielecki",
  "Calfa",
  "Dimitrov",
  "Drnovsek",
  "Godmanis",
  "Gorbunovs",
  "Goncz",
  "Havel",
  "Jaruzelski",
  "Jovic",
  "Kravchuk",
  "Landsbergis",
  "Markovic",
  "Mazowiecki",
  "Meciar",
  "Nemeth",
  "Olszewski",
  "Pithart",
  "Rakowski",
  "Ruutel",
  "Straub",
  "Walesa",
  "Zhelev"
];

function formatJson(value, indent = 0) {
  const pad = " ".repeat(indent);
  const child = " ".repeat(indent + 2);

  if (Array.isArray(value)) {
    if (!value.length) return "[]";
    if (value.every((item) => item === null || ["string", "number", "boolean"].includes(typeof item))) {
      return `[${value.map((item) => JSON.stringify(item)).join(", ")}]`;
    }
    return `[\n${value.map((item) => `${child}${formatJson(item, indent + 2)}`).join(",\n")}\n${pad}]`;
  }

  if (value && typeof value === "object") {
    const entries = Object.entries(value);
    if (!entries.length) return "{}";
    return `{\n${entries
      .map(([key, item]) => `${child}${JSON.stringify(key)}: ${formatJson(item, indent + 2)}`)
      .join(",\n")}\n${pad}}`;
  }

  return JSON.stringify(value);
}

function displayDate(isoDate) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC"
  }).format(new Date(`${isoDate}T00:00:00Z`));
}

function normalize(value) {
  return (value || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function hasTerm(haystack, term) {
  const normalizedHaystack = normalize(haystack);
  const normalizedTerm = normalize(term);
  return new RegExp(`(^|\\s)${normalizedTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(\\s|$)`).test(
    normalizedHaystack
  );
}

function participantDisplay(tableName) {
  if (tableName.includes(":") || tableName.includes(";")) return tableName.replace(/\s+/g, " ").trim();
  const parts = tableName.split(",").map((part) => part.trim());
  return parts.length > 1 ? `${parts.slice(1).join(" ")} ${parts[0]}`.replace(/\s+/g, " ") : tableName;
}

function countryList(rowCountry) {
  const countries = rowCountry
    .split(",")
    .map((country) => (country.trim() === "Ukrainian" ? "Ukraine" : country.trim()))
    .filter(Boolean);
  return [...new Set(["United States", ...countries])];
}

function chapterFor(rowCountry, participants) {
  const haystack = `${rowCountry} ${participants}`;
  const match = CHAPTER_ALIASES.find((entry) => entry.countries.some((country) => hasTerm(haystack, country)));
  if (!match) return { number: 5, name: "Yugoslavia and Regional" };
  return match.chapter;
}

function coverageRole(participants) {
  return HEAD_OF_STATE_OR_GOVERNMENT_TERMS.some((term) => hasTerm(participants, term))
    ? "Head of state or government"
    : "Senior official or delegation";
}

function ancestor(record, level) {
  return (record.ancestors || []).find((item) => item.levelOfDescription === level);
}

function firstDigitalObject(record) {
  return (record.digitalObjects || []).find((object) => object.objectUrl) || null;
}

async function fetchCatalogRecord(naid) {
  const url = `https://catalog.archives.gov/proxy/records/search?naId=${encodeURIComponent(naid)}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Catalog fetch failed ${response.status}: ${url}`);
  const json = await response.json();
  const record = json.body?.hits?.hits?.[0]?._source?.record;
  if (!record) throw new Error(`No Catalog record found for ${naid}`);
  return record;
}

function download(url, targetPath, redirects = 0) {
  return new Promise((resolve, reject) => {
    if (fs.existsSync(targetPath) && fs.statSync(targetPath).size > 0) {
      resolve();
      return;
    }

    const client = url.startsWith("http://") ? http : https;
    const file = fs.createWriteStream(targetPath);
    client
      .get(url, (response) => {
        if ([301, 302, 303, 307, 308].includes(response.statusCode) && response.headers.location) {
          file.close();
          fs.rmSync(targetPath, { force: true });
          if (redirects >= 5) {
            reject(new Error(`Too many redirects for ${url}`));
            return;
          }
          download(new URL(response.headers.location, url).toString(), targetPath, redirects + 1)
            .then(resolve)
            .catch(reject);
          return;
        }

        if (response.statusCode !== 200) {
          file.close();
          fs.rmSync(targetPath, { force: true });
          reject(new Error(`HTTP ${response.statusCode} for ${url}`));
          return;
        }

        response.pipe(file);
        file.on("finish", () => file.close(resolve));
      })
      .on("error", (error) => {
        file.close();
        fs.rmSync(targetPath, { force: true });
        reject(error);
      });
  });
}

function pageCount(pdfPath) {
  const output = execFileSync("pdfinfo", [pdfPath], { encoding: "utf8" });
  const match = output.match(/^Pages:\s+(\d+)/m);
  if (!match) throw new Error(`Could not read page count from ${pdfPath}`);
  return Number(match[1]);
}

function sourceNoteFor(row, catalogRecord, digitalObject, pages) {
  const series = ancestor(catalogRecord, "series");
  const fileUnit = ancestor(catalogRecord, "fileUnit");
  const pieces = [
    `Source: George H.W. Bush Presidential Library and Museum, Digital Research Room, "Memcons and Telcons" table (${TABLE_URL}), row: Date ${row.date}; Type ${row.type}; Participants ${row.participants}; Country ${row.country}; Release Status ${row.status || "blank"}; NAID ${row.naid}.`,
    `National Archives Catalog item: ${catalogRecord.title}, NAID ${catalogRecord.naId}.`,
    `Collection: Records of the National Security Council (George H. W. Bush Administration), NAID 2163580.`,
    series ? `Series: ${series.title}, NAID ${series.naId}.` : "",
    fileUnit ? `File unit: ${fileUnit.title}, NAID ${fileUnit.naId}.` : "",
    digitalObject ? `Digital object: ${digitalObject.objectFilename}, object ID ${digitalObject.objectId}, URL ${digitalObject.objectUrl}.` : "Digital object: none listed in Catalog.",
    `Access restriction: ${catalogRecord.accessRestriction?.status || "not stated"}.`,
    `Page count: ${pages} pages, measured from the linked PDF scan with pdfinfo.`
  ];
  return pieces.filter(Boolean).join(" ");
}

async function toRecord(row) {
  const catalogRecord = await fetchCatalogRecord(row.naid);
  const digitalObject = firstDigitalObject(catalogRecord);
  let pages = 0;

  if (digitalObject?.objectUrl) {
    const targetPath = path.join(CACHE_DIR, `${row.naid}.pdf`);
    await download(digitalObject.objectUrl, targetPath);
    pages = pageCount(targetPath);
  }

  const participant = participantDisplay(row.participants);
  const chapter = chapterFor(row.country, row.participants);
  const role = coverageRole(row.participants);
  const countries = countryList(row.country);
  const sourceNote = sourceNoteFor(row, catalogRecord, digitalObject, pages);

  return {
    id: `bush-ee-${row.naid}`,
    date: row.isoDate,
    sortDate: row.isoDate,
    type: row.type,
    title: catalogRecord.title || `${row.type}: President Bush and ${participant}`,
    dateLine: displayDate(row.isoDate),
    subjectLine: `President Bush and ${participant}`,
    participants: ["George H. W. Bush", participant],
    countries,
    chapter,
    status: "Document found",
    releaseStatus: row.status || catalogRecord.accessRestriction?.status || "Not stated",
    coverageRole: role,
    sourceFamily: "Bush Library memcons/telcons",
    sourceNote,
    nextAction:
      "Review the linked PDF, verify page-level provenance and context, and decide whether this item should be promoted into the final FRUS document sequence.",
    topics: [
      "Bush Library Memcons and Telcons",
      row.type,
      "Eastern Europe",
      role,
      ...countries.filter((country) => country !== "United States")
    ],
    naid: String(row.naid),
    catalogUrl: `https://catalog.archives.gov/id/${row.naid}`,
    pdfUrl: digitalObject?.objectUrl || "",
    pageCount: pages,
    source: {
      name: "Records of the National Security Council (George H. W. Bush Administration)",
      url: "https://catalog.archives.gov/id/2163580",
      tableUrl: TABLE_URL,
      tablePage: row.tablePage,
      tableRow: row,
      series: ancestor(catalogRecord, "series")?.title || "",
      seriesNaid: ancestor(catalogRecord, "series")?.naId ? String(ancestor(catalogRecord, "series").naId) : "",
      fileUnitTitle: ancestor(catalogRecord, "fileUnit")?.title || "",
      fileUnitNaid: ancestor(catalogRecord, "fileUnit")?.naId ? String(ancestor(catalogRecord, "fileUnit").naId) : "",
      objectUrl: digitalObject?.objectUrl || "",
      objectFilename: digitalObject?.objectFilename || "",
      objectId: digitalObject?.objectId || ""
    },
    links: [
      {
        label: "Catalog",
        url: `https://catalog.archives.gov/id/${row.naid}`
      },
      ...(digitalObject?.objectUrl
        ? [
            {
              label: "Open PDF",
              url: digitalObject.objectUrl
            }
          ]
        : []),
      {
        label: "Bush Library table",
        url: TABLE_URL
      },
      {
        label: "Coverage audit",
        url: "reports/bush-eastern-europe-leader-memcon-telcon-audit.json"
      }
    ]
  };
}

async function main() {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  const audit = JSON.parse(fs.readFileSync(AUDIT_PATH, "utf8"));
  const existing = JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));
  const baseRecords = existing.filter((record) => !record.id.startsWith("bush-ee-"));
  const harvested = [];

  for (const [index, row] of audit.rows.entries()) {
    const record = await toRecord(row);
    harvested.push(record);
    console.log(`${String(index + 1).padStart(2, "0")}/${audit.rows.length} ${record.pageCount}p ${record.title}`);
  }

  audit.harvestedRecords = {
    generatedAt: new Date().toISOString(),
    totalRecords: harvested.length,
    totalPages: harvested.reduce((sum, record) => sum + record.pageCount, 0),
    headOfStateOrGovernmentRows: harvested.filter((record) => record.coverageRole === "Head of state or government")
      .length,
    seniorOfficialOrDelegationRows: harvested.filter((record) => record.coverageRole !== "Head of state or government")
      .length,
    records: harvested.map((record) => ({
      id: record.id,
      naid: record.naid,
      date: record.date,
      type: record.type,
      title: record.title,
      countries: record.countries,
      chapter: record.chapter.name,
      coverageRole: record.coverageRole,
      releaseStatus: record.releaseStatus,
      pageCount: record.pageCount,
      catalogUrl: record.catalogUrl,
      pdfUrl: record.pdfUrl
    }))
  };

  const nextRecords = [...baseRecords, ...harvested].sort((a, b) => {
    return a.chapter.number - b.chapter.number || a.sortDate.localeCompare(b.sortDate) || a.title.localeCompare(b.title);
  });

  fs.writeFileSync(DATA_PATH, `${formatJson(nextRecords)}\n`);
  fs.writeFileSync(MIRROR_PATH, `window.EE_RECORDS = ${JSON.stringify(nextRecords, null, 2)};\n`);
  fs.writeFileSync(AUDIT_PATH, `${JSON.stringify(audit, null, 2)}\n`);

  console.log(`${harvested.length} records, ${audit.harvestedRecords.totalPages} pages.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
