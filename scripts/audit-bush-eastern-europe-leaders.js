const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const REPORT_PATH = path.join(ROOT, "reports", "bush-eastern-europe-leader-memcon-telcon-audit.json");
const TABLE_URL = "https://www.bush41library.gov/digital-research-room/about-textual-collections/memcons-and-telcons";

const EASTERN_EUROPE_COUNTRIES = new Set([
  "Albania",
  "Bosnia",
  "Bosnia and Herzegovina",
  "Bulgaria",
  "Croatia",
  "Czech Republic",
  "Czech and Slovak Federal Republic",
  "Czechoslovakia",
  "East Germany",
  "Estonia",
  "German Democratic Republic",
  "GDR",
  "Hungary",
  "Latvia",
  "Lithuania",
  "Macedonia",
  "Poland",
  "Romania",
  "Serbia",
  "Slovakia",
  "Slovak Republic",
  "Slovenia",
  "Ukraine",
  "Ukrainian",
  "Yugoslavia"
]);

const LEADER_ALIASES = {
  Albania: ["Alia", "Berisha"],
  "Bosnia and Herzegovina": ["Izetbegovic"],
  Bulgaria: ["Mladenov", "Zhelev"],
  Croatia: ["Tudjman"],
  "Czech Republic": ["Havel", "Klaus"],
  Czechoslovakia: ["Havel", "Dubcek", "Calfa"],
  "German Democratic Republic": ["Honecker", "Krenz", "Modrow", "Maiziere", "de Maiziere"],
  Estonia: ["Ruutel"],
  Hungary: ["Goncz", "Grosz", "Nemeth", "Antall", "Szűrös", "Szuros"],
  Latvia: ["Godmanis", "Gorbunovs"],
  Lithuania: ["Landsbergis"],
  Macedonia: ["Gligorov"],
  Poland: ["Jaruzelski", "Mazowiecki", "Walesa", "Kiszczak"],
  Romania: ["Ceausescu", "Iliescu", "Roman", "Constantinescu"],
  Serbia: ["Milosevic"],
  Slovakia: ["Meciar"],
  Slovenia: ["Kucan"],
  Ukraine: ["Kravchuk"],
  Ukrainian: ["Kravchuk"],
  Yugoslavia: ["Markovic", "Milosevic", "Tudjman", "Kucan", "Izetbegovic"]
};

const BROAD_SANITY_TERMS = [
  "Albania",
  "Alia",
  "Berisha",
  "Bosnia",
  "Croatia",
  "East Germany",
  "Estonia",
  "GDR",
  "German Democratic Republic",
  "Gligorov",
  "Honecker",
  "Izetbegovic",
  "Krenz",
  "Kravchuk",
  "Kucan",
  "Landsbergis",
  "Latvia",
  "Lithuania",
  "Macedonia",
  "Maiziere",
  "Milosevic",
  "Modrow",
  "Serbia",
  "Slovenia",
  "Tudjman",
  "Ukraine"
];

function decodeHtml(value) {
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&#039;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

function rowsFromHtml(html, page) {
  return [...html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)]
    .map((row) => [...row[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((cell) => decodeHtml(cell[1])))
    .filter((cells) => cells.length === 6)
    .map(([date, type, participants, country, status, naid]) => ({
      date,
      type,
      participants,
      country,
      status,
      naid,
      tablePage: page,
      catalogUrl: `https://catalog.archives.gov/id/${naid}`
    }));
}

function parseTableDate(value) {
  const [month, day, year] = value.split("/").map((part) => Number(part));
  if (!month || !day || !year) return "";
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
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
  if (!normalizedTerm) return false;
  return new RegExp(`(^|\\s)${normalizedTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(\\s|$)`).test(
    normalizedHaystack
  );
}

function isEasternEuropeLeaderRow(row) {
  if (!["Memcon", "Telcon"].includes(row.type)) return false;
  if (row.country.split(",").map((country) => country.trim()).some((country) => EASTERN_EUROPE_COUNTRIES.has(country))) {
    return true;
  }

  const haystack = `${row.participants} ${row.country}`;
  return Object.entries(LEADER_ALIASES).some(([country, aliases]) => {
    if (!EASTERN_EUROPE_COUNTRIES.has(country)) return false;
    return aliases.some((alias) => hasTerm(haystack, alias));
  });
}

async function fetchText(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Fetch failed ${response.status}: ${url}`);
  return response.text();
}

async function main() {
  const existingReport = fs.existsSync(REPORT_PATH)
    ? JSON.parse(fs.readFileSync(REPORT_PATH, "utf8"))
    : {};
  const allRows = [];
  const relevantRows = [];

  for (let page = 0; ; page += 1) {
    const url = page === 0 ? TABLE_URL : `${TABLE_URL}?page=${page}`;
    const html = await fetchText(url);
    const rows = rowsFromHtml(html, page);
    if (!rows.length) break;
    allRows.push(...rows);
    relevantRows.push(...rows.filter(isEasternEuropeLeaderRow));
    if (page > 100) throw new Error("Stopped after 100 pages; pagination shape may have changed.");
  }

  const normalizedRows = relevantRows
    .map((row) => ({
      ...row,
      isoDate: parseTableDate(row.date),
      rowKey: `${parseTableDate(row.date)}-${row.type}-${row.naid}`
    }))
    .sort((a, b) => a.isoDate.localeCompare(b.isoDate) || a.participants.localeCompare(b.participants));
  const relevantNaids = new Set(normalizedRows.map((row) => row.naid));
  const broadSanityRows = allRows
    .filter((row) => BROAD_SANITY_TERMS.some((term) => hasTerm(`${row.participants} ${row.country}`, term)))
    .map((row) => ({
      ...row,
      isoDate: parseTableDate(row.date),
      alreadyIncluded: relevantNaids.has(row.naid)
    }))
    .sort((a, b) => a.isoDate.localeCompare(b.isoDate) || a.participants.localeCompare(b.participants));

  const report = {
    generatedAt: new Date().toISOString(),
    source: {
      name: "George H. W. Bush Presidential Library Memcons and Telcons table",
      url: TABLE_URL
    },
    scope:
      "All table rows with Type Memcon or Telcon and an Eastern Europe country/leader signal. This is the authoritative Bush Library public table pass before item-level Catalog enrichment.",
    totalTableRows: allRows.length,
    totalEasternEuropeLeaderRows: normalizedRows.length,
    rowsByCountry: Object.fromEntries(
      [...new Set(normalizedRows.map((row) => row.country))]
        .sort()
        .map((country) => [country, normalizedRows.filter((row) => row.country === country).length])
    ),
    broadSanitySearch: {
      terms: BROAD_SANITY_TERMS,
      totalRows: broadSanityRows.length,
      notAlreadyIncluded: broadSanityRows.filter((row) => !row.alreadyIncluded)
    },
    rows: normalizedRows,
    ...(existingReport.harvestedRecords ? { harvestedRecords: existingReport.harvestedRecords } : {})
  };

  fs.mkdirSync(path.dirname(REPORT_PATH), { recursive: true });
  fs.writeFileSync(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`);

  console.log(`${normalizedRows.length} Eastern Europe leader memcon/telcon table rows from ${allRows.length} total rows.`);
  for (const row of normalizedRows) {
    console.log(`${row.isoDate} ${row.type} ${row.participants} (${row.country}) NAID ${row.naid} ${row.status || ""}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
