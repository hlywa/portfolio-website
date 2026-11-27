# rachel heleva · creative archive

｡･:*˚:✧｡

Plain HTML, CSS and JavaScript. Open index.html locally. The original essay stylesheet and galaxy source are retained for compatibility/history; the homepage no longer loads them.

## Gallery
The three themes toggle visibility, and the adjacent arrow moves a theme to first priority. The leading matching image is used when present; otherwise the entry's cover remains. The star resets the gallery. Type and featured filters are independent. Existing public project details and CV are on the same page.

## Content
archive-data.js is the future Notion export (initially empty). Existing public items remain as a baseline in archive-gallery.js. Matching titles merge with their prior public entries. No private Notion drafts have been exported. Only explicitly approved fields and media should enter the public repository. The sync script and review workflow are included. Credential setup and live integration testing remain required.

Existing essays remain in essays/; add published essays to writings.js as before. Do not commit unpublished submissions or credentials.

Design review branch: creative-archive-redesign. Do not merge until the preview is reviewed.

## Now and Upcoming

Edit the two authored Now statements in index.html, including inline links. The gallery's Notion Now checkbox does not generate these statements. Upcoming shows the manually curated public event links from index.html, plus approved event records from the Notion export when connected. Remove a curated event when its imported record should take over; duplicate titles or links are suppressed, and expired events are removed from the display. A month-only event uses start/end bounds for display, not a confirmed event day. Do not commit private event links.

## Connect Notion (one-time setup)

1. Create a read-only internal integration in Rachel Zone. Grant access only to Creative Archive, not the dashboard or editorial drafts. Do not make the archive public.
2. In GitHub Settings > Secrets and variables > Actions, create repository secret NOTION_TOKEN with the token, and variable NOTION_DATA_SOURCE_ID with the archive data-source UUID (not page ID). Never put credentials in Git, frontend code, or chat.
3. Review and merge redesign first. On main, manually trigger Prepare creative archive update. It exports approved entries, runs checks, and pushes a review branch only. Review and merge that branch via PR. A bot commit alone does not trigger a branch-based Pages build. Verify actual deployment settings before release.
4. Or run locally with Node 22: node scripts/sync-notion.mjs --test, then node scripts/sync-notion.mjs with environment variables set securely. Review and batch changes.

Only Publish=true records are exported; no page bodies, drafts, private notes or signed Notion file URLs are written. The first image in each designated file property is copied into images/archive (raster images up to 10 MB). Public Git history can retain previously published records or assets even after unchecking Publish; never approve confidential material. Existing public baseline items stay visible until deliberately removed from archive-gallery.js. Matching titles merge with the baseline; use unique titles. The initial workflow deliberately does not schedule or auto-merge updates.
