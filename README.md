# rachel heleva · creative archive

｡･:*˚:✧｡

Plain HTML, CSS and JavaScript. Open index.html locally. The original essay stylesheet and galaxy source are retained for compatibility/history; the homepage no longer loads them.

## Gallery
The three themes toggle visibility, and the adjacent arrow moves a theme to first priority. The leading matching image is used when present; otherwise the entry's cover remains. The star resets the gallery. Public categories are Games, Experiments, Gatherings, Curation, Talks, Writing and Press (with Projects or Recognition only if an entry requires them). Notion retains its existing type properties; the gallery maps them to public categories. Use the medium rather than Collaboration for new entries. The star cycles through text frames, respects reduced-motion preferences and pauses on hover, focus and when the tab is hidden. The homepage is an overview; project details open standalone reading pages in works/. Writing belongs to the same gallery and has its own category. The CV remains expandable on the homepage.

## Content
archive-data.js is the future Notion export (initially empty). Existing public items remain as a baseline in archive-gallery.js. Matching titles merge with their prior public entries. No private Notion drafts have been exported. Only explicitly approved fields and media should enter the public repository. The sync script and review workflow are included. Credential setup and live integration testing remain required.

Existing essays remain in essays/; add published essays to writings.js for the unified archive. Standalone pages share archive.css reading styles. New Notion-generated long-form pages still require an explicit public-body export implementation. Do not commit unpublished submissions or credentials.

The redesign is deployed on main. Review and test subsequent changes in coherent batches.

## Now and Upcoming

Edit the two authored Now statements in index.html, including inline links. The gallery's Notion Now checkbox does not generate these statements. Upcoming shows the manually curated public event links from index.html, plus approved event records from the Notion export when connected. Remove a curated event when its imported record should take over; duplicate titles or links are suppressed, and expired events are removed from the display. A month-only event uses start/end bounds for display, not a confirmed event day. Do not commit private event links.

## Connect Notion (one-time setup)

1. Create a read-only internal integration in Rachel Zone. Grant access only to Creative Archive, not the dashboard or editorial drafts. Do not make the archive public.
2. In GitHub Settings > Secrets and variables > Actions, create repository secret NOTION_TOKEN with the token, and variable NOTION_DATA_SOURCE_ID with the archive data-source UUID (not page ID). Never put credentials in Git, frontend code, or chat.
3. Review and merge redesign first. On main, manually trigger Prepare creative archive update. It exports approved entries, runs checks, and pushes a review branch only. Review and merge that branch via PR. A bot commit alone does not trigger a branch-based Pages build. Verify actual deployment settings before release.
4. Or run locally with Node 22: node scripts/sync-notion.mjs --test, then node scripts/sync-notion.mjs with environment variables set securely. Review and batch changes.

Only Publish=true records are exported; no page bodies, drafts, private notes or signed Notion file URLs are written. The first image in each designated file property is copied into images/archive (raster images up to 10 MB). Public Git history can retain previously published records or assets even after unchecking Publish; never approve confidential material. Existing public baseline items stay visible until deliberately removed from archive-gallery.js. Matching titles merge with the baseline; use unique titles. The initial workflow deliberately does not schedule or auto-merge updates.
