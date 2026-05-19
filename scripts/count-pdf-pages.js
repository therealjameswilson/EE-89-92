const fs = require("fs");
const http = require("http");
const https = require("https");
const path = require("path");
const { execFileSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const DATA_PATH = path.join(ROOT, "data", "records.json");
const MIRROR_PATH = path.join(ROOT, "data", "records.js");
const REPORT_PATH = path.join(ROOT, "reports", "scowcroft-memcon-telcon-search.json");
const CACHE_DIR = path.join("/private/tmp", "ee-89-92-pdfs");

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

function findPdfLink(record) {
  return (record.links || []).find(
    (link) => /\.pdf(?:[?#].*)?$/i.test(link.url) || /pdf/i.test(link.label)
  );
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
  if (!match) throw new Error(`Could not read Pages from ${pdfPath}`);
  return Number(match[1]);
}

function updateReport(records) {
  if (!fs.existsSync(REPORT_PATH)) return;

  const report = JSON.parse(fs.readFileSync(REPORT_PATH, "utf8"));
  const counted = records
    .filter((record) => record.id.startsWith("scowcroft-") && record.pageCount)
    .map((record) => {
      const pdf = findPdfLink(record);
      const catalog = (record.links || []).find(
        (link) => /catalog/i.test(link.label) || /catalog\.archives\.gov/.test(link.url)
      );
      return {
        id: record.id,
        naid: record.id.replace("scowcroft-", ""),
        title: record.title,
        chapter: record.chapter.name,
        pageCount: record.pageCount,
        countMethod: "pdfinfo Pages value from downloaded official NARA PDF scan",
        catalogUrl: catalog?.url,
        objectUrl: pdf?.url
      };
    });

  const byNaid = Object.fromEntries(counted.map((record) => [record.naid, record]));
  for (const hit of report.easternEuropeCandidateHits || []) {
    if (byNaid[hit.naid]) hit.pageCount = byNaid[hit.naid].pageCount;
  }

  report.countedSourceFolders = {
    generatedAt: new Date().toISOString(),
    countMethod:
      "Downloaded official NARA PDF scans and read pdfinfo Pages values; counts are full source-folder scan pages.",
    totalFolders: counted.length,
    totalPages: counted.reduce((sum, record) => sum + record.pageCount, 0),
    folders: counted
  };

  fs.writeFileSync(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`);
}

async function main() {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  const records = JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));

  for (const record of records) {
    const pdf = findPdfLink(record);
    if (!pdf) continue;

    const targetPath = path.join(CACHE_DIR, `${record.id}.pdf`);
    await download(pdf.url, targetPath);
    record.pageCount = pageCount(targetPath);
    console.log(`${String(record.pageCount).padStart(4, " ")} pages ${record.id}`);
  }

  fs.writeFileSync(DATA_PATH, `${formatJson(records)}\n`);
  fs.writeFileSync(MIRROR_PATH, `window.EE_RECORDS = ${JSON.stringify(records, null, 2)};\n`);
  updateReport(records);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
