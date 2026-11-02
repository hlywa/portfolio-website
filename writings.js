/*
 * Writing archive.
 *
 * To publish an essay:
 * 1. Copy essays/_template.html to essays/your-essay-slug.html and write it.
 * 2. Add an entry below with title, date (YYYY-MM-DD), summary, and url.
 *
 * Keep this empty until the first essay is actually published.
 */
const writings = [];

const list = document.getElementById("writings-list");
if (list && writings.length) {
  list.replaceChildren();
  const sorted = [...writings].sort((a, b) => b.date.localeCompare(a.date));
  for (const entry of sorted) {
    const item = document.createElement("a");
    item.className = "writing-entry";
    item.href = entry.url;

    const heading = document.createElement("h3");
    heading.textContent = entry.title;
    const meta = document.createElement("time");
    meta.dateTime = entry.date;
    meta.textContent = new Date(entry.date + "T12:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
    const summary = document.createElement("p");
    summary.textContent = entry.summary;
    item.append(meta, heading, summary);
    list.append(item);
  }
}
