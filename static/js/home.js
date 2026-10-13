(() => {
  const form = document.getElementById("urlForm");
  const input = document.getElementById("pageUrl");
  const message = document.getElementById("homeMessage");

  function openReport(url, mode) {
    const target = new URL("/report/", window.location.origin);
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
    // Django report page will perform the live API request.
    openReport(parsed.href, "live");
  });

  document.getElementById("sampleButton").addEventListener("click", () => {
    openReport("https://example.gov.in/employment-trends", "sample");
  });
})();