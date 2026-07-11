(function () {
  const root = document.documentElement;
  const toggle = document.getElementById("theme-toggle");
  const tallyFrame = document.querySelector(".tally-frame");
  const signupSuccess = document.getElementById("signup-success");

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

  window.addEventListener("message", function (event) {
    if (!tallyFrame || !signupSuccess || event.source !== tallyFrame.contentWindow) return;
    if (!/^https:\/\/([a-z0-9-]+\.)*tally\.so$/i.test(event.origin)) return;
    if (typeof event.data !== "string" || !event.data.includes("Tally.FormSubmitted")) return;

    try {
      const message = JSON.parse(event.data);
      if (message.payload?.formId !== "kd19y6") return;
      signupSuccess.hidden = false;
    } catch (_) {}
  });
})();
