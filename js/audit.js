
(() => {

  const params = new URLSearchParams(window.location.search);
  const requestedUrl = params.get("url") || "https://example.gov.in/employment-trends";
  const mode = params.get("mode") || "sample";

  let pageHost = "Illustrative sample page";

  try {
    pageHost = new URL(requestedUrl).hostname;
  } catch (_) {}

  // Sample audit findings
  const examples = [
    {
      id: 1,
      title: "Employment trends infographic",
      type: "Informative image",
      status: "issue",
      statusLabel: "Potential issue",
      altState: "Alt text present",
      original: "Employment statistics chart",
      summary: "The description names the visual but may not communicate the comparison or trend that makes it useful.",
      evidence: "The example is represented as a comparative chart. The actual labels, units and data have not been inspected by this demo.",
      suggestion: "Describe the chart's subject and its verified main comparison. Include values only when they can be read and checked reliably.",
      confidence: "Illustrative only",
      thumb: "chart",
      decision: ""
    },
    {
      id: 2,
      title: "Organisation logo",
      type: "Potentially functional",
      status: "review",
      statusLabel: "Needs review",
      altState: "Alt text present",
      original: "Organisation logo",
      summary: "The right alternative depends on whether the logo identifies the organisation, links to a destination or duplicates nearby text.",
      evidence: "Check whether the image is inside a link, whether that link already has an accessible name, and whether adjacent text provides the same information.",
      suggestion: "If the logo is a home link, a concise organisation name may be appropriate. If it is redundant or decorative, an empty alt may be appropriate.",
      confidence: "Human decision needed",
      thumb: "logo",
      decision: ""
    },
    {
      id: 3,
      title: "Decorative section flourish",
      type: "Potentially decorative",
      status: "review",
      statusLabel: "Needs review",
      altState: "Alt attribute missing",
      original: "No alt attribute detected",
      summary: "The example may be ornamental, but its purpose must be confirmed from the surrounding page before changing the markup.",
      evidence: "Position near a section boundary is not enough to establish that an image is decorative. Inspect its visual meaning and context.",
      suggestion: 'If confirmed as purely decorative, use alt="". If it conveys information or performs a function, provide a suitable text alternative.',
      confidence: "Human decision needed",
      thumb: "decor",
      decision: ""
    }
  ];

  let findings = examples.map(item => ({ ...item }));
  let activeFilter = "all";

  const list = document.getElementById("findingList");
  const byId = id => document.getElementById(id);

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, char => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[char]);
  }

  function thumbnail(type) {
    if (type === "chart") {
      return `<svg viewBox="0 0 48 48" fill="none" aria-hidden="true">
        <path d="M6 5v37h37" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        <path d="m11 32 9-10 8 5 13-17" stroke="#2f74d0" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>`;
    }

    if (type === "logo") {
      return `<svg viewBox="0 0 48 48" fill="none" aria-hidden="true">
        <circle cx="24" cy="24" r="17" stroke="currentColor" stroke-width="2"/>
        <path d="M14 27c6-12 14-12 20 0M17 32h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>`;
    }

    return `<svg viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <path d="M8 10h32M8 19h32M8 28h32M8 37h32" stroke="currentColor" stroke-width="2" stroke-linecap="round" opacity=".65"/>
      <path d="M5 5h38v38H5z" stroke="currentColor" stroke-dasharray="3 3"/>
    </svg>`;
  }

  function isPotentialIssue(item) {
    return item.status === "issue";
  }

  function needsReview(item) {
    return !item.decision;
  }

  // Display findings and update counts
  function render() {
    const filtered = findings.filter(item => {
      if (activeFilter === "issue") return isPotentialIssue(item);
      if (activeFilter === "review") return needsReview(item);
      if (activeFilter === "decided") return Boolean(item.decision);
      return true;
    });

    list.innerHTML = filtered.length
      ? filtered.map(item => `
        <article class="finding-card ${item.expanded ? "is-expanded" : ""}" data-id="${item.id}">
          <div class="finding-main">
            <div class="finding-thumb">${thumbnail(item.thumb)}</div>

            <div>
              <div class="finding-title-row">
                <h3>${escapeHtml(item.title)}</h3>
                <span class="status-tag ${item.decision ? "decided" : item.status}">
                  ${item.decision ? "Reviewed: " + escapeHtml(item.decision) : item.statusLabel}
                </span>
              </div>

              <div class="finding-meta">
                ${escapeHtml(item.type)} · ${escapeHtml(item.altState)}
              </div>

              <p class="finding-summary">${escapeHtml(item.summary)}</p>

              <div class="finding-actions">
                <button class="small-action primary" type="button"
                  data-action="details" data-id="${item.id}"
                  aria-expanded="${Boolean(item.expanded)}">
                  ${item.expanded ? "Hide details" : "View evidence"}
                </button>

                <button class="small-action" type="button"
                  data-action="approve" data-id="${item.id}">
                  Accept suggestion
                </button>

                <button class="small-action" type="button"
                  data-action="edit" data-id="${item.id}">
                  Edit
                </button>

                <button class="small-action" type="button"
                  data-action="reject" data-id="${item.id}">
                  Dismiss
                </button>
              </div>
            </div>
          </div>

          <div class="finding-detail">
            <div class="detail-grid">
              <div class="detail-box">
                <div class="detail-label">Current alt text / state</div>
                <div class="detail-text">${escapeHtml(item.original)}</div>
              </div>

              <div class="detail-box suggestion">
                <div class="detail-label">Suggested action</div>
                <div class="detail-text" id="suggestion-${item.id}">
                  ${escapeHtml(item.suggestion)}
                </div>
              </div>

              <div class="detail-box full">
                <div class="detail-label">Evidence and rationale</div>
                <div class="detail-text">${escapeHtml(item.evidence)}</div>
                <div class="detail-foot">
                  Confidence: ${escapeHtml(item.confidence)}.
                  Verify against the actual image and page.
                </div>
              </div>
            </div>
          </div>
        </article>
      `).join("")
      : `<div class="empty-state">No findings match this filter.</div>`;

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

  // Toast notifications
  let toastTimer;

  function toast(message) {
    const node = byId("toast");

    node.textContent = message;
    node.classList.add("show");

    clearTimeout(toastTimer);

    toastTimer = setTimeout(() => node.classList.remove("show"), 2800);
  }

  // Filters and review actions
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
      const updated = window.prompt(
        "Edit the suggested text or action:",
        item.suggestion
      );

      if (updated === null || !updated.trim()) return;

      item.suggestion = updated.trim();
      item.decision = "Edited";
      item.expanded = true;

      toast("Suggestion updated in this browser session.");
    }

    render();
  });

  // Export complete audit report as PDF
  byId("exportButton").addEventListener("click", () => {

    if (!window.jspdf) {
      toast("PDF library could not load. Please try again.");
      return;
    }

    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF();

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    const margin = 20;
    const contentWidth = pageWidth - margin * 2;
    const bottomLimit = pageHeight - 20;

    let y = 20;

    // Check remaining space before adding content
    function checkPage(height = 15) {
      if (y + height > bottomLimit) {
        pdf.addPage();
        y = 20;
      }
    }

    // Add a section heading
    function addHeading(text) {
      checkPage(20);

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(15);
      pdf.setTextColor(22, 56, 95);

      pdf.text(text, margin, y);
      y += 11;
    }

    // Add wrapped text, with automatic page breaks
    function addText(label, value, fontSize = 10) {
      const text = value === undefined
        ? String(label)
        : `${label}: ${value}`;

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(fontSize);
      pdf.setTextColor(40, 40, 40);

      const lines = pdf.splitTextToSize(text, contentWidth);
      const lineHeight = fontSize * 0.48;

      for (const line of lines) {
        checkPage(lineHeight + 2);
        pdf.text(line, margin, y);
        y += lineHeight;
      }

      y += 5;
    }

    // Main report title
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(21);
    pdf.setTextColor(22, 56, 95);

    pdf.text("AltAware Lens", margin, y);
    y += 11;

    pdf.setFontSize(14);
    pdf.text("Image Accessibility Audit Report", margin, y);
    y += 12;

    pdf.setDrawColor(200, 210, 220);
    pdf.line(margin, y, pageWidth - margin, y);
    y += 12;

    // Report information
    addText("Report Date", new Date().toLocaleDateString());
    addText("Page URL", requestedUrl);
    addText(
      "Scan Mode",
      mode === "sample"
        ? "Illustrative sample - not a live scan"
        : "URL captured - live scan not connected"
    );

    y += 5;

    // Summary section
    addHeading("Audit Summary");

    addText("Images Reviewed", findings.length);
    addText(
      "Potential Issues",
      findings.filter(item => item.status === "issue").length
    );
    addText(
      "Awaiting Decision",
      findings.filter(item => !item.decision).length
    );
    addText(
      "Reviewed by User",
      findings.filter(item => item.decision).length
    );

    y += 6;

    // Individual findings
    addHeading("Detailed Findings");

    findings.forEach((item, index) => {
      checkPage(30);

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(13);
      pdf.setTextColor(22, 56, 95);

      const titleLines = pdf.splitTextToSize(
        `${index + 1}. ${item.title}`,
        contentWidth
      );

      for (const line of titleLines) {
        checkPage(8);
        pdf.text(line, margin, y);
        y += 7;
      }

      y += 5;

      addText("Image Type", item.type);
      addText("Finding Status", item.statusLabel);
      addText("Alt Text State", item.altState);
      addText("Current Alt Text", item.original);
      addText("Identified Issue", item.summary);
      addText("Evidence and Rationale", item.evidence);
      addText("Suggested Action", item.suggestion);
      addText("Confidence", item.confidence);
      addText("Review Decision", item.decision || "Awaiting review");

      y += 5;

      checkPage(8);

      pdf.setDrawColor(220, 220, 220);
      pdf.line(margin, y, pageWidth - margin, y);
      y += 12;
    });

    // Disclaimer
    addHeading("Important Disclaimer");

    addText(
      "This report contains illustrative frontend data only. " +
      "It does not represent a completed live website scan. " +
      "The findings and suggestions may be inaccurate and require " +
      "human verification. AltAware Lens does not certify " +
      "accessibility or legal compliance."
    );

    // Page numbers
    const totalPages = pdf.internal.getNumberOfPages();

    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9);
      pdf.setTextColor(130, 130, 130);

      pdf.text(
        `Page ${i} of ${totalPages}`,
        pageWidth - margin,
        pageHeight - 10,
        { align: "right" }
      );
    }

    // Download PDF
    pdf.save("AltAware-Lens-Audit-Report.pdf");

    toast("Audit report exported as PDF.");
  });

  // Display page information
  byId("pageDomain").textContent = pageHost;

  if (mode === "sample") {
    byId("pageDomain").textContent = "Illustrative sample page";
    byId("scanMode").textContent = "Sample data · not a live scan";
  } else {
    byId("scanMode").textContent = "URL captured · live scan not connected";
  }

  // Initial rendering
  render();

})();
