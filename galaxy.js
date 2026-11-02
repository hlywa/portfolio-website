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
  const bodies = [
    { name: "about", phase: -2.47, period: 35, direction: 1, scaleX: 0.88, scaleY: 0.77 },
    { name: "work", phase: 1.10, period: 52, direction: -1, scaleX: 0.94, scaleY: 1.05 },
    { name: "contact", phase: -3.25, period: 68, direction: 1, scaleX: 1.05, scaleY: 0.81 }
  ].map((orbit) => ({
    ...orbit,
    element: scene.querySelector('[data-target="' + orbit.name + '"]')
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
      for (const body of bodies) {
        if (!body.element) continue;
        const theta = body.phase + body.direction * (p.TWO_PI * elapsed / body.period);
        // An elliptical orbit, calculated from sine and cosine.
        const x = cx + Math.cos(theta) * rx * body.scaleX;
        const y = cy + Math.sin(theta) * ry * body.scaleY;
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
      scene.classList.add("p5-ready");
      placeNavigation();
    };

    p.draw = () => {
      if (scene.hidden) return;
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

    p.windowResized = () => {
      p.resizeCanvas(scene.clientWidth, scene.clientHeight);
      placeNavigation();
    };
  }, scene);
})();
