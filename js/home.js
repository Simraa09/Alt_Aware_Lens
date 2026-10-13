(() => {
  const form = document.getElementById("urlForm");
  const input = document.getElementById("pageUrl");
  const message = document.getElementById("homeMessage");

  function openReport(url, mode) {
    const target = new URL("audit.html", window.location.href);
    if (url) target.searchParams.set("url", url);
    target.searchParams.set("mode", mode);
    window.location.href = target.href;
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const value = input.value.trim();
    let parsed;
    try { parsed = new URL(value); } catch (_) {
      message.textContent = "Enter a complete, valid webpage URL.";
      message.classList.add("visible");
      input.focus();
      return;
    }
    if (!["http:", "https:"].includes(parsed.protocol)) {
      message.textContent = "Use a webpage URL beginning with http:// or https://.";
      message.classList.add("visible");
      input.focus();
      return;
    }
    message.classList.remove("visible");
    // Frontend-only demo. A Django endpoint can be called here when the API is ready.
    openReport(parsed.href, "demo");
  });

  document.getElementById("sampleButton").addEventListener("click", () => {
    openReport("https://example.gov.in/employment-trends", "sample");
  });
})();