# FRUS 1989-1992 Volume V Eastern Europe Compiler Workspace

A GitHub Pages website for source discovery and chapter planning for
*Foreign Relations of the United States, 1989-1992, Volume V, Eastern Europe*.

The Office of the Historian lists this volume as **Being Researched**. This
repository is a companion workspace for mapping likely document candidates,
overlapping Bush 41 source families, and chronological chapter queues before
the full archival harvest is complete.

The current data lives in `data/records.json`, with a generated
`data/records.js` mirror so the page can render when opened directly from the
filesystem. The initial records are compiler cues, not finished FRUS document
citations. As source packets are confirmed, replace or supplement them with
fully cited memcons, telcons, cables, memoranda, briefing materials, and
declassification records.

## Chapter Arrangement

1. Poland
2. Hungary
3. Czechoslovakia
4. Romania, Bulgaria, and Albania
5. Yugoslavia and Regional

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

## Local Preview

Run a local static server so the page can fetch `data/records.json`:

```bash
python3 -m http.server 4186
```

Then open <http://127.0.0.1:4186/>.

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
