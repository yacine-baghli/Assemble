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
})();
