(function () {
  const root = document.documentElement;
  const toggle = document.getElementById("theme-toggle");

  function updateThemeControl() {
    const isDark = root.classList.contains("dark");
    const themeMeta = document.querySelector('meta[name="theme-color"]');
    if (themeMeta) themeMeta.setAttribute("content", isDark ? "#101010" : "#f4f3ee");
    if (!toggle) return;
    const label = isDark ? "Switch to light mode" : "Switch to dark mode";
    toggle.setAttribute("aria-pressed", String(isDark));
    toggle.setAttribute("aria-label", label);
    toggle.title = label;
  }

  if (toggle) {
    updateThemeControl();
    toggle.addEventListener("click", function () {
      root.classList.toggle("dark");
      const isDark = root.classList.contains("dark");
      try {
        localStorage.setItem("assemble-theme", isDark ? "dark" : "light");
      } catch (_) {}
      updateThemeControl();
    });
  }

  updateThemeControl();

  const canvas = document.getElementById("network-canvas");
  if (!canvas) return;

  const context = canvas.getContext("2d");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const labels = ["CTO", "GTM", "OPS", "ENG", "DES", "AI", "MATCH", "PM"];
  let width = 0;
  let height = 0;
  let nodes = [];

  function createNodes() {
    nodes = labels.map(function (label, index) {
      return {
        label: label,
        match: label === "MATCH",
        x: width * (0.08 + ((index * 0.137) % 0.84)),
        y: height * (0.14 + ((index * 0.233) % 0.72)),
        vx: (index % 2 ? 1 : -1) * (0.08 + index * 0.008),
        vy: (index % 3 ? -1 : 1) * (0.06 + index * 0.006)
      };
    });
  }

  function resize() {
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    width = canvas.clientWidth;
    height = canvas.clientHeight;
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    createNodes();
  }

  function draw() {
    const isDark = root.classList.contains("dark");
    const text = isDark ? "#f5f4ef" : "#111111";
    const line = isDark ? "rgba(245,244,239,.16)" : "rgba(17,17,17,.14)";
    const accent = "#e8ff3d";

    context.clearRect(0, 0, width, height);

    nodes.forEach(function (node, index) {
      if (!reducedMotion) {
        node.x += node.vx;
        node.y += node.vy;
        if (node.x < 8 || node.x > width - 8) node.vx *= -1;
        if (node.y < 8 || node.y > height - 8) node.vy *= -1;
      }

      nodes.slice(index + 1).forEach(function (other) {
        const dx = node.x - other.x;
        const dy = node.y - other.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < Math.min(320, width * 0.34)) {
          context.beginPath();
          context.moveTo(node.x, node.y);
          context.lineTo(other.x, other.y);
          context.strokeStyle = line;
          context.lineWidth = 0.7;
          context.stroke();
        }
      });

      context.beginPath();
      context.arc(node.x, node.y, node.match ? 6 : 3, 0, Math.PI * 2);
      context.fillStyle = node.match ? accent : text;
      context.fill();

      if (node.match) {
        context.beginPath();
        context.arc(node.x, node.y, 14, 0, Math.PI * 2);
        context.strokeStyle = accent;
        context.lineWidth = 1;
        context.stroke();
      }

      context.fillStyle = node.match ? accent : text;
      context.font = "600 9px ui-sans-serif, sans-serif";
      context.textAlign = "center";
      context.fillText(node.label, node.x, node.y + 20);
    });

    if (!reducedMotion) window.requestAnimationFrame(draw);
  }

  window.addEventListener("resize", resize);
  resize();
  draw();
})();
