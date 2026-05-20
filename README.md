# FRUS 1989-1992 Volume V Eastern Europe Compiler Workspace

A GitHub Pages website for source discovery and chapter planning for
*Foreign Relations of the United States, 1989-1992, Volume V, Eastern Europe*.

The Office of the Historian lists this volume as **Being Researched**. This
repository is a companion workspace for mapping likely document candidates,
overlapping Bush 41 source families, and country-by-country chronological chapters before
the full archival harvest is complete.

The current data lives in `data/records.json`, with a generated
`data/records.js` mirror so the page can render when opened directly from the
filesystem. The initial records are compiler cues, not finished FRUS document
citations. As source packets are confirmed, replace or supplement them with
fully cited memcons, telcons, cables, memoranda, briefing materials, and
declassification records.

Confirmed source-folder records include `pageCount`, measured from the linked
official PDF scan with `pdfinfo`. For folder-level leads, this counts the full
source-folder PDF rather than a trimmed individual document excerpt.

## Chapter Arrangement

1. Poland
2. Hungary
3. Czechoslovakia
4. Bulgaria
5. Romania
6. Albania
7. Yugoslavia
8. Slovenia
9. Croatia
10. Bosnia and Herzegovina
11. Serbia and Montenegro
12. Estonia
13. Latvia
14. Lithuania
15. Ukraine

Records inside each chapter are arranged chronologically by `sortDate`.

## Source Strategy

This workspace deliberately starts from the same source model as the
Western Europe project:

- Bush Library memcons and telcons
- FOIA 2000-0429-F presidential memcon/telcon finding aid
- Brent Scowcroft Papers, especially Presidential Correspondence and telcon files
- National Archives Catalog records and digital-object PDFs
- State Department Central Foreign Policy Files and embassy reporting
- NSC country, regional, NATO, CSCE, and Warsaw Pact transition files

The page also flags cross-volume overlap, especially where Western Europe,
Germany, Soviet Union, NATO, or Vatican records discuss Eastern Europe.

## Scowcroft Catalog Search

The report in `reports/scowcroft-memcon-telcon-search.json` records a Catalog
search of the Brent Scowcroft Papers collection, NAID 4522156, for declassified
memcons and telcons. The first pass found 221 Scowcroft hits, including 26
presidential meeting folders, 21 presidential telephone-call folders, and 69
Eastern Europe candidate source-folder hits. Ten source-folder leads selected
into the public chronology currently total 927 counted PDF pages: 210 pages in
the Poland trip-window folders and 717 pages in Scowcroft folders now assigned
to country chapters for Poland, Hungary, and Czechoslovakia.

## Bush Leader Memcons and Telcons

The report in `reports/bush-eastern-europe-leader-memcon-telcon-audit.json`
records a full pass through the Bush Library public Memcons and Telcons table.
It found 64 Eastern Europe memcon/telcon rows, including 56 head-of-state or
head-of-government rows and 8 adjacent senior-official or delegation rows. Those
64 official PDF records total 288 counted pages. The audit also runs a broad
sanity search for Baltic, Ukraine, and Balkan leader names so cross-border
records are not missed by strict country labels.

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
