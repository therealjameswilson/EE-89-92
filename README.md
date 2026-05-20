# FRUS 1989-1992 Volume V Eastern Europe Memcons and Telcons

A GitHub Pages website for declassified presidential memcons and telcons for
*Foreign Relations of the United States, 1989-1992, Volume V, Eastern Europe*.

The Office of the Historian lists this volume as **Being Researched**. This
repository is a companion workspace for the released Bush 41 memcon/telcon set:
official Catalog/PDF records, counted pages, release status, and country chapter
assignment.

The current data lives in `data/records.json`, with a generated
`data/records.js` mirror so the page can render when opened directly from the
filesystem. The public dataset is intentionally limited to declassified memcons
and telcons. Event anchors, source-folder leads, presidential trip scaffolding,
policy-gap records, and broader candidate packets are excluded from the page.

Each retained record includes `pageCount`, measured from the linked official PDF
scan with `pdfinfo`.

## Chapter Arrangement

1. Poland
2. Hungary
3. Czechoslovakia
4. Bulgaria
5. Romania

Only country chapters with retained declassified memcons or telcons appear on
the public page. Records inside each chapter are arranged chronologically by
`sortDate`.

## Current Dataset

- 48 retained declassified memcons/telcons
- 216 counted PDF pages
- 46 full releases and 2 partial releases
- 16 Estonia/Latvia/Lithuania/Yugoslavia/Ukraine records excluded for adjacent-volume scope
- 0 duplicate document records removed in the current pass
- 36 scaffolding/candidate records removed from the public chronology

Deduplication uses NAID first, PDF URL second, and a date/type/title fallback
only when a record has no Catalog identifier.

The report in `reports/declassified-memcon-telcon-dedup.json` records the
filtering and deduplication pass.

## Compiler Usability

The page is tuned to FRUS production practice described in the Office of the
Historian's "About the Series" note:

- Country chapters display only retained memcon/telcon documents.
- Rows are chronological and carry stable candidate numbers for review.
- Release status, NAID, Catalog link, PDF link, page count, source note, and
  next action stay visible in each document packet.
- Source notes follow the Volume XXXI pattern: repository and archival path
  first, then Catalog/digital-object locator and release-status caveat.
- Checklist badges flag source-note, Catalog, PDF, page-count, release-status,
  and conversation-time verification needs.
- Source-note and working-citation copy buttons reduce repetitive compiler
  transcription.
- Filters support country chapter, document type, release status, and text/NAID
  search.

## Source Strategy

This workspace now starts from the Bush Library Memcons and Telcons table,
matches those rows to National Archives Catalog records and digital-object PDFs,
and keeps only released memcons and telcons in the public chronology.

The Scowcroft Catalog search report remains in `reports/` as background
research, but source folders are no longer part of `data/records.json`.

## Bush Leader Memcons and Telcons

The report in `reports/bush-eastern-europe-leader-memcon-telcon-audit.json`
records a full pass through the Bush Library public Memcons and Telcons table.
It found 64 Eastern Europe memcon/telcon rows, including 56 head-of-state or
head-of-government rows and 8 adjacent senior-official or delegation rows. Those
64 official PDF records total 288 counted pages. The audit also runs a broad
sanity search for Baltic, Ukraine, and Balkan leader names so cross-border
records are not missed by strict country labels. The public page excludes the
Estonia/Latvia/Lithuania, Yugoslavia, and Ukraine records from that audit
because they belong in adjacent volume scopes.

## Local Preview

Run a local static server so the page can fetch `data/records.json`:

```bash
python3 -m http.server 4186
```

Then open <http://127.0.0.1:4186/>.

To refresh page counts for linked PDF scans:

```bash
node scripts/count-pdf-pages.js
```

To rerun the Bush Library Eastern Europe leader coverage pass:

```bash
node scripts/audit-bush-eastern-europe-leaders.js
node scripts/harvest-bush-eastern-europe-leaders.js
node scripts/count-pdf-pages.js
```

## Source Anchors

- FRUS 1989-1992, Volume V, Eastern Europe: <https://history.state.gov/historicaldocuments/frus1989-92v05>
- FRUS 1989-1992, Volume XXXI, START I source-note model: <https://history.state.gov/historicaldocuments/frus1989-92v31>
- Western Europe model repository: <https://github.com/therealjameswilson/Bush41-Western-Europe>
- Bush Library Memcons and Telcons index: <https://www.bush41library.gov/digital-research-room/about-textual-collections/memcons-and-telcons>
- FOIA 2000-0429-F finding aid: <https://www.bush41library.gov/digital-research-room/finding-aid/foia/records-memcons-and-telcons-january-1989-december-1991>
- Brent Scowcroft Papers: <https://www.bush41library.gov/digital-research-room/finding-aid/brent-scowcroft-papers>
- National Archives Catalog: <https://catalog.archives.gov/>

## Visual Asset

`assets/eastern-europe-small.png` is vendored from Wikimedia Commons:
<https://commons.wikimedia.org/wiki/File:Eastern-Europe-small.png>.

## Publish

This repository deploys through GitHub Pages with `.github/workflows/deploy-pages.yml`.

After the first push to `main`, open the repository settings on GitHub, go to
**Pages**, and set the source to **GitHub Actions** if it is not already selected.
