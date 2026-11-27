# rachel heleva · creative archive

｡･:*˚:✧｡

Plain HTML, CSS and JavaScript. Open index.html locally. The original essay stylesheet and galaxy source are retained for compatibility/history; the homepage no longer loads them.

## Gallery
The three themes toggle visibility, and the adjacent arrow moves a theme to first priority. The leading matching image is used when present; otherwise the entry's cover remains. The star resets the gallery. Public categories are Games, Experiments, Gatherings, Curation, Talks, Writing and Press (with Projects or Recognition only if an entry requires them). Notion retains its existing type properties; the gallery maps them to public categories. Use the medium rather than Collaboration for new entries. The star cycles through text frames, respects reduced-motion preferences and pauses on hover, focus and when the tab is hidden. The homepage is an overview; project details open standalone reading pages in works/. Writing belongs to the same gallery and has its own category. The CV remains expandable on the homepage.

## Content
archive-data.js is generated from approved Notion records. Existing public items remain as a baseline until their corresponding Notion entries have been exported. Migrated legacy entries use stable IDs and disappear from the JavaScript gallery when unapproved; old public Git history and static fallback links may remain. New entries have ID-based stable URLs. Only explicitly approved fields and media enter the public export.

Existing essays remain in essays/; add published essays to writings.js for the unified archive. Standalone pages share archive.css reading styles. For new content, use Notion as the editorial source (see below). Do not commit unpublished submissions or credentials.

The redesign is deployed on main. Review and test subsequent changes in coherent batches.

## Now and Upcoming

Edit the two authored Now statements in index.html, including inline links. The gallery's Notion Now checkbox does not generate these statements. Upcoming shows the manually curated public event links from index.html, plus approved event records from the Notion export when connected. Remove a curated event when its imported record should take over; duplicate titles or links are suppressed, and expired events are removed from the display. A month-only event uses start/end bounds for display, not a confirmed event day. Do not commit private event links.

## Connect Notion (one-time setup)

1. Create a read-only internal integration in Rachel Zone. Grant access only to Creative Archive, not the dashboard or editorial drafts. Do not make the archive public.
2. In GitHub Settings > Secrets and variables > Actions, create repository secret NOTION_TOKEN with the token, and variable NOTION_DATA_SOURCE_ID with the archive data-source UUID (not page ID). Never put credentials in Git, frontend code, or chat.
3. On main, manually trigger Prepare creative archive update (also triggered after changes to the exporter on main). It exports approved entries, runs checks, and pushes a review branch only. Review and merge that branch via PR. A bot commit alone does not trigger a branch-based Pages build. Verify actual deployment settings before release.
4. Or run locally with Node 22: node scripts/sync-notion.mjs --test, then node scripts/sync-notion.mjs with environment variables set securely. Review and batch changes.

## Publishing individual works

- Set Open as to Page, External link or Gallery card. Page generates a standalone HTML document. External link uses Link; Gallery card has no destination. Blank defaults to External link when Link exists, otherwise Gallery card.
- For Page, add headings named **Public content** and **End public content**. Put only publication-ready material between them. Everything before or after stays out of the export. Both markers are required; unsupported blocks fail the export.
- Add paragraphs, headings, quotations, lists, code, dividers, images and HTTPS media links. Poetry line breaks are preserved. Video and embeds are links, not interactive players. Add private notes outside the markers.
- The first image in each designated file property is copied into images/archive (PNG, JPEG, WebP, GIF or AVIF, up to 10 MB each). A theme image is a fallback when Cover is empty. Inline public images are copied too.
- Check Publish only when the public fields and section are reviewed. Unchecking removes generated pages and managed assets on the next export. Public Git history may retain earlier content; never approve confidential material.
- Review the generated branch before merging. The workflow does not schedule or auto-merge updates. Edit Notion, not generated pages.
