<div align="center">

# 𓂃 ࣪˖𓉸 ִֶָ་༘࿐

### a little corner of the internet

Games, research, writing, and other experiments.

A personal website to wander through, play with, and discover things in.

✧˖*°࿐

**about · work · writings · contact**

｡･:*˚:✧｡

*Some things are obvious. Others reward curiosity.*

</div>

---

Made with HTML, CSS, JavaScript, and p5.js. A work in progress.

To run locally: open `index.html` in your browser.

## Publishing an essay

The homepage has a Writings section below Selected Work. Until the first essay is live, it displays a simple “First dispatch forthcoming” placeholder.

1. Copy `essays/_template.html` to `essays/my-essay-slug.html`.
2. Replace the example title, publication date, deck, and paragraphs with your writing. The standalone page inherits the site's typography from `style.css`.
3. Open `writings.js` and add an entry to the `writings` array:

```js
{
  title: "Your essay title",
  date: "2026-11-15",
  summary: "One or two sentences describing the essay.",
  url: "./essays/my-essay-slug.html"
}
```

Commit both files. The homepage automatically lists essays newest first, removes the placeholder once an entry exists, and links readers to the essay. No CMS, subscription, or additional hosting is needed.

The orbiting Writings glyph scrolls to the archive. The Work glyph scrolls to the selected project grid. The About and Contact glyphs navigate to their pages.
