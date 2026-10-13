(() => {
  const params = new URLSearchParams(window.location.search);
  const requestedUrl = params.get("url") || "https://example.gov.in/employment-trends";
  const mode = params.get("mode") || "sample";
  let pageHost = "Illustrative sample page";
  try { pageHost = new URL(requestedUrl).hostname; } catch (_) {}

  const examples = [
    {
      id: 1, title: "Employment trends infographic", type: "Informative image",
      status: "issue", statusLabel: "Potential issue", altState: "Alt text present",
      original: "Employment statistics chart",
      summary: "The description names the visual but may not communicate the comparison or trend that makes it useful.",
      evidence: "The example is represented as a comparative chart. The actual labels, units and data have not been inspected by this demo.",
      suggestion: "Describe the chart's subject and its verified main comparison. Include values only when they can be read and checked reliably.",
      confidence: "Illustrative only", thumb: "chart", decision: ""
    },
    {
      id: 2, title: "Organisation logo", type: "Potentially functional",
      status: "review", statusLabel: "Needs review", altState: "Alt text present",
      original: "Organisation logo",
      summary: "The right alternative depends on whether the logo identifies the organisation, links to a destination or duplicates nearby text.",
      evidence: "Check whether the image is inside a link, whether that link already has an accessible name, and whether adjacent text provides the same information.",
      suggestion: "If the logo is a home link, a concise organisation name may be appropriate. If it is redundant or decorative, an empty alt may be appropriate.",
      confidence: "Human decision needed", thumb: "logo", decision: ""
    },
    {
      id: 3, title: "Decorative section flourish", type: "Potentially decorative",
      status: "review", statusLabel: "Needs review", altState: "Alt attribute missing",
      original: "No alt attribute detected",
      summary: "The example may be ornamental, but its purpose must be confirmed from the surrounding page before changing the markup.",
      evidence: "Position near a section boundary is not enough to establish that an image is decorative. Inspect its visual meaning and context.",
      suggestion: "If confirmed as purely decorative, use alt=\"\". If it conveys information or performs a function, provide a suitable text alternative.",
      confidence: "Human decision needed", thumb: "decor", decision: ""
    }
  ];

  let findings = examples.map(item => ({ ...item }));
  let activeFilter = "all";
  const list = document.getElementById("findingList");
  const byId = (id) => document.getElementById(id);

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, char => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[char]);
  }

  function thumbnail(type) {
    if (type === "chart") return `<svg viewBox="0 0 48 48" fill="none" aria-hidden="true"><path d="M6 5v37h37" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="m11 32 9-10 8 5 13-17" stroke="#2f74d0" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
    if (type === "logo") return `<svg viewBox="0 0 48 48" fill="none" aria-hidden="true"><circle cx="24" cy="24" r="17" stroke="currentColor" stroke-width="2"/><path d="M14 27c6-12 14-12 20 0M17 32h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`;
    return `<svg viewBox="0 0 48 48" fill="none" aria-hidden="true"><path d="M8 10h32M8 19h32M8 28h32M8 37h32" stroke="currentColor" stroke-width="2" stroke-linecap="round" opacity=".65"/><path d="M5 5h38v38H5z" stroke="currentColor" stroke-dasharray="3 3"/></svg>`;
  }

  function isPotentialIssue(item) { return item.status === "issue"; }
  function needsReview(item) { return !item.decision; }

  function render() {
    const filtered = findings.filter(item => {
      if (activeFilter === "issue") return isPotentialIssue(item);
      if (activeFilter === "review") return needsReview(item);
      if (activeFilter === "decided") return Boolean(item.decision);
      return true;
    });

    list.innerHTML = filtered.length ? filtered.map(item => `
      <article class="finding-card ${item.expanded ? "is-expanded" : ""}" data-id="${item.id}">
        <div class="finding-main">
          <div class="finding-thumb">${thumbnail(item.thumb)}</div>
          <div>
            <div class="finding-title-row">
              <h3>${escapeHtml(item.title)}</h3>
              <span class="status-tag ${item.decision ? "decided" : item.status}">${item.decision ? "Reviewed: " + escapeHtml(item.decision) : item.statusLabel}</span>
            </div>
            <div class="finding-meta">${escapeHtml(item.type)} · ${escapeHtml(item.altState)}</div>
            <p class="finding-summary">${escapeHtml(item.summary)}</p>
            <div class="finding-actions">
              <button class="small-action primary" type="button" data-action="details" data-id="${item.id}" aria-expanded="${Boolean(item.expanded)}">${item.expanded ? "Hide details" : "View evidence"}</button>
              <button class="small-action" type="button" data-action="approve" data-id="${item.id}">Accept suggestion</button>
              <button class="small-action" type="button" data-action="edit" data-id="${item.id}">Edit</button>
              <button class="small-action" type="button" data-action="reject" data-id="${item.id}">Dismiss</button>
            </div>
          </div>
        </div>
        <div class="finding-detail">
          <div class="detail-grid">
            <div class="detail-box"><div class="detail-label">Current alt text / state</div><div class="detail-text">${escapeHtml(item.original)}</div></div>
            <div class="detail-box suggestion"><div class="detail-label">Suggested action</div><div class="detail-text" id="suggestion-${item.id}">${escapeHtml(item.suggestion)}</div></div>
            <div class="detail-box full"><div class="detail-label">Evidence and rationale</div><div class="detail-text">${escapeHtml(item.evidence)}</div><div class="detail-foot">Confidence: ${escapeHtml(item.confidence)}. Verify against the actual image and page.</div></div>
          </div>
        </div>
      </article>`).join("") : `<div class="empty-state">No findings match this filter.</div>`;

    const issueCount = findings.filter(isPotentialIssue).length;
    const reviewCount = findings.filter(needsReview).length;
    byId("metricImages").textContent = String(findings.length).padStart(2, "0");
    byId("metricIssues").textContent = String(issueCount).padStart(2, "0");
    byId("metricReview").textContent = String(reviewCount).padStart(2, "0");
    byId("countAll").textContent = findings.length;
    byId("countIssues").textContent = issueCount;
    byId("countReview").textContent = reviewCount;
    byId("countDecided").textContent = findings.filter(item => item.decision).length;
    document.querySelectorAll("[data-filter]").forEach(button => {
      button.classList.toggle("is-active", button.dataset.filter === activeFilter);
    });
  }

  let toastTimer;
  function toast(message) {
    const node = byId("toast");
    node.textContent = message;
    node.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => node.classList.remove("show"), 2800);
  }

  document.addEventListener("click", event => {
    const filterButton = event.target.closest("[data-filter]");
    if (filterButton) {
      activeFilter = filterButton.dataset.filter;
      render();
      return;
    }
    const button = event.target.closest("[data-action]");
    if (!button) return;
    const item = findings.find(entry => entry.id === Number(button.dataset.id));
    if (!item) return;

    if (button.dataset.action === "details") {
      item.expanded = !item.expanded;
    } else if (button.dataset.action === "approve") {
      item.decision = "Accepted";
      toast("Recorded for this demo only. The website was not changed.");
    } else if (button.dataset.action === "reject") {
      item.decision = "Dismissed";
      toast("Finding dismissed in this demo only.");
    } else if (button.dataset.action === "edit") {
      const updated = window.prompt("Edit the suggested text or action:", item.suggestion);
      if (updated === null || !updated.trim()) return;
      item.suggestion = updated.trim();
      item.decision = "Edited";
      item.expanded = true;
      toast("Suggestion updated in this browser session.");
    }
    render();
  });

  byId("exportButton").addEventListener("click", () => {
    const report = {
      page: requestedUrl,
      mode,
      note: "Illustrative frontend data only; not a live scan or compliance certification.",
      findings: findings.map(({ id, title, original, suggestion, decision, statusLabel }) =>
        ({ id, title, original, suggestion, decision: decision || "Awaiting review", status: statusLabel }))
    };
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "altsight-audit-summary.json";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    toast("Demo summary exported as JSON.");
  });

  byId("pageDomain").textContent = pageHost;
  if (mode === "sample") {
    byId("pageDomain").textContent = "Illustrative sample page";
    byId("scanMode").textContent = "Sample data · not a live scan";
  } else {
    byId("scanMode").textContent = "URL captured · live scan not connected";
  }
  render();
})();