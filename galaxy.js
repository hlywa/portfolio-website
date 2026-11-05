/*
 * Rachel Heleva / glyph galaxy
 * p5.js draws the nearly invisible orbit and stars, and calculates where
 * the accessible HTML navigation charms belong.
 *
 * Angle, orbital radius, speed, and direction are all editable parameters.
 * The About and Contact pages remain regular HTML; Work and Writings scroll to their sections.
 */
(function () {
  const scene = document.getElementById("home");
  if (!scene || typeof window.p5 !== "function") return;

  const prefersLessMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  // All four glyphs use ONE clock and one coordinate system. Keeping their
  // angular slots evenly spaced prevents clustering and overlapping labels.
  const bodies = ["about", "work", "contact", "writings"].map((name, index) => ({
    name,
    index,
    element: scene.querySelector('[data-target="' + name + '"]')
  }));

  new window.p5((p) => {
    let stars = [];
    let startedAt = 0;

    function geometry() {
      const w = p.width, h = p.height;
      // Responsive bounds keep the click targets inside the viewport.
      return {
        cx: w / 2,
        cy: h / 2,
        rx: Math.min(w * 0.35, 300),
        ry: Math.min(h * 0.32, 265)
      };
    }

    function rebuildStars() {
      p.randomSeed(2406);
      stars = Array.from({ length: 7 }, () => ({
        x: p.random(0.06, 0.94),
        y: p.random(0.13, 0.91),
        size: p.random(0.7, 1.3)
      }));
    }

    function placeNavigation() {
      const { cx, cy, rx, ry } = geometry();
      const elapsed = prefersLessMotion.matches ? 0 : (p.millis() - startedAt) / 1000;
      const spin = (p.TWO_PI * elapsed) / 96; // slow, shared revolution
      // Slots are separated by at least 78 degrees, even with the drift.
      const initial = -2.20;
      for (const body of bodies) {
        if (!body.element) continue;
        const drift = Math.sin(elapsed * 0.16 + body.index * 1.8) * 0.09;
        const theta = initial + body.index * (p.TWO_PI / 4) + spin + drift;
        const x = cx + Math.cos(theta) * rx;
        const y = cy + Math.sin(theta) * ry;
        body.element.style.left = x + "px";
        body.element.style.top = y + "px";
      }
    }

    p.setup = () => {
      const canvas = p.createCanvas(scene.clientWidth, scene.clientHeight);
      canvas.parent(scene);
      canvas.addClass("galaxy-canvas");
      p.pixelDensity(Math.min(window.devicePixelRatio || 1, 2));
      rebuildStars();
      startedAt = p.millis();
      scene.classList.add("p5-ready", "orbit-managed");
      placeNavigation();
    };

    // Browsers report a hidden route's width and height as zero.
    // Restore the canvas whenever #home becomes visible again, including
    // browser Back/Forward and direct navigation to a project URL.
    function syncCanvasSize() {
      if (scene.hidden) return;
      const w = scene.clientWidth, h = scene.clientHeight;
      if (w < 1 || h < 1) return;
      if (p.width !== w || p.height !== h) p.resizeCanvas(w, h, true);
      placeNavigation();
    }

    window.addEventListener("galaxy:route-visible", () => {
      requestAnimationFrame(() => requestAnimationFrame(syncCanvasSize));
    });

    p.draw = () => {
      if (scene.hidden) return;
      syncCanvasSize();
      p.clear();
      const { cx, cy } = geometry();

      // The same large, subtle, tilted orbital trace as the original.
      p.push();
      p.translate(cx, cy);
      p.rotate(-p.PI / 6);
      p.noFill();
      p.stroke(255, 10);
      p.strokeWeight(1.5);
      p.ellipse(0, 0, Math.min(p.width * 1.38, 1450), Math.min(p.height * 0.87, 760));
      p.pop();

      p.noStroke();
      p.fill(255, 105);
      for (const star of stars) p.circle(star.x * p.width, star.y * p.height, star.size);

      placeNavigation();
    };

    p.windowResized = syncCanvasSize;
  }, scene);
})();
