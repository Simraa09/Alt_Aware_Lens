
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

  let findings = mode === "sample" ? examples.map(item => ({ ...item })) : [];
  let liveAuditId = null;
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
            <div class="finding-thumb">
              ${item.imageUrl
                ? `<img src="${escapeHtml(item.imageUrl)}"
                        alt="Preview of audited image"
                        loading="lazy"
                        onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
                  <span style="display:none;">${thumbnail(item.thumb)}</span>`
                : thumbnail(item.thumb)}
            </div>

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
      toast("Decision saved in this browser session. The scanned website was not changed.");

    } else if (button.dataset.action === "reject") {
      item.decision = "Dismissed";
      toast("Finding dismissed in this browser session.");

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

  
  // ==========================================
  // EXPORT PROFESSIONAL PDF AUDIT REPORT
  // ==========================================

  byId("exportButton").addEventListener("click", async () => {

    if (!window.jspdf) {
      toast("PDF library could not load. Please try again.");
      return;
    }

    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF("p", "mm", "a4");
    
async function loadLogo() {
  const image = new Image();

  image.src = "/static/images/AltAware%20Lens%20Logo%20Mark.png";

  await image.decode();

  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;

  const ctx = canvas.getContext("2d");
  ctx.drawImage(image, 0, 0);

  return canvas.toDataURL("image/png");
}


    const W = pdf.internal.pageSize.getWidth();
    const H = pdf.internal.pageSize.getHeight();

    const margin = 18;
    const contentWidth = W - margin * 2;
    const bottomLimit = H - 24;

    const navy = [22, 56, 95];
    const blue = [47, 116, 208];
    const text = [45, 55, 72];
    const muted = [100, 116, 139];
    const light = [242, 246, 251];
    const border = [222, 230, 239];

    let y = 18;

    // ------------------------------------------
    // BASIC DRAWING HELPERS
    // ------------------------------------------

    function setColor(color) {
      pdf.setTextColor(...color);
    }

    function newPage() {
      pdf.addPage();
      y = 20;
    }

    function checkSpace(required = 15) {
      if (y + required > bottomLimit) {
        newPage();
      }
    }

    function wrappedLines(value, width, size = 10) {
      pdf.setFontSize(size);

      return pdf.splitTextToSize(
        String(value ?? ""),
        width
      );
    }

    function writeText(value, options = {}) {
      const {
        size = 10,
        color = text,
        bold = false,
        width = contentWidth,
        lineHeight = 5.2,
        gap = 4,
        x = margin
      } = options;

      pdf.setFont(
        "helvetica",
        bold ? "bold" : "normal"
      );

      pdf.setFontSize(size);
      setColor(color);

      const lines = wrappedLines(value, width, size);

      for (const line of lines) {
        checkSpace(lineHeight + 2);
        pdf.text(line, x, y);
        y += lineHeight;
      }

      y += gap;
    }

    function sectionHeading(title) {
      checkSpace(20);

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(14);
      setColor(navy);

      pdf.text(title, margin, y);
      y += 9;
    }

    function divider() {
      checkSpace(5);

      pdf.setDrawColor(...border);
      pdf.setLineWidth(0.3);

      pdf.line(
        margin,
        y,
        W - margin,
        y
      );

      y += 9;
    }

    function labelValue(label, value) {
      checkSpace(12);

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(8);
      setColor(muted);

      pdf.text(label.toUpperCase(), margin, y);
      y += 5;

      writeText(value, {
        size: 10,
        gap: 5
      });
    }

    
    
    // ------------------------------------------
    // REPORT HEADER WITH LOGO
    // ------------------------------------------

    // Navy header background
    pdf.setFillColor(...navy);
    pdf.rect(0, 0, W, 48, "F");

    // White rounded rectangle behind logo
    pdf.setFillColor(255, 255, 255);
    pdf.roundedRect(
      margin,  // X position
      8,       // Y position
      34,      // Width
      32,      // Height
      3,       // Horizontal corner radius
      3,       // Vertical corner radius
      "F"
    );

    // Add logo inside white rectangle
    try {
      const logoData = await loadLogo();

      pdf.addImage(
        logoData,
        "PNG",
        margin + 4, // Small left padding
        10,         // Top padding
        26,         // Logo width
        28          // Logo height
      );

    } catch (error) {
      console.error("Logo could not be loaded:", error);
    }

    // Brand name
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(18);
    pdf.setTextColor(255, 255, 255);

    pdf.text("AltAware Lens", margin + 40, 18);

    // Report title
    pdf.setFontSize(13);
    pdf.text(
      "Image Accessibility Audit Report",
      margin + 40,
      29
    );

    // Subtitle
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    pdf.setTextColor(215, 230, 245);

    pdf.text(
      "Alternative text assessment and review summary",
      margin + 40,
      37
    );

    y = 60;


    // ------------------------------------------
    // REPORT DETAILS
    // ------------------------------------------

    sectionHeading("Report Information");

    labelValue("Page under review", requestedUrl);

    labelValue(
      "Generated on",
      new Date().toLocaleString()
    );

    labelValue(
      "Scan status",
      mode === "sample"
        ? "Illustrative sample - not a live scan"
        : "URL captured - live scan not connected"
    );

    divider();

    // ------------------------------------------
    // AUDIT OVERVIEW
    // ------------------------------------------

    sectionHeading("Audit Overview");

    const metrics = [
      {
        number: findings.length,
        label: "Images reviewed"
      },
      {
        number: findings.filter(
          item => item.status === "issue"
        ).length,
        label: "Potential issues"
      },
      {
        number: findings.filter(
          item => !item.decision
        ).length,
        label: "Awaiting review"
      }
    ];

    const cardGap = 4;
    const cardWidth =
      (contentWidth - cardGap * 2) / 3;

    checkSpace(35);

    metrics.forEach((metric, index) => {
      const x =
        margin + index * (cardWidth + cardGap);

      pdf.setFillColor(...light);
      pdf.roundedRect(
        x, y, cardWidth, 29, 2, 2, "F"
      );

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(19);
      setColor(navy);

      pdf.text(
        String(metric.number).padStart(2, "0"),
        x + 6,
        y + 13
      );

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8);
      setColor(muted);

      pdf.text(
        metric.label,
        x + 6,
        y + 22
      );
    });

    y += 39;

    // ------------------------------------------
    // DETAILED FINDINGS
    // ------------------------------------------

    sectionHeading("Detailed Findings");

    writeText(
      "Review the following findings against the actual image and surrounding page context before making changes.",
      {
        size: 9,
        color: muted,
        gap: 8
      }
    );

    findings.forEach((item, index) => {

      // Start each finding on a new page if
      // there is insufficient room for its title
      // and first content section.
      checkSpace(45);

      const cardX = margin;
      const cardWidth = contentWidth;

      // Finding heading background
      pdf.setFillColor(...light);
      pdf.roundedRect(
        cardX,
        y - 5,
        cardWidth,
        13,
        2,
        2,
        "F"
      );

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(10);
      setColor(navy);

      const heading = `${String(index + 1).padStart(2, "0")} - ${item.title}`;

      const headingLines = wrappedLines(
        heading,
        cardWidth - 12,
        10
      );

      // Increase heading height if title wraps
      if (headingLines.length > 1) {
        pdf.setFillColor(...light);
        pdf.roundedRect(
          cardX,
          y - 5,
          cardWidth,
          13 + (headingLines.length - 1) * 5,
          2,
          2,
          "F"
        );
      }

      headingLines.forEach((line, i) => {
        pdf.text(line, cardX + 6, y + i * 5);
      });

      y += 15 + (headingLines.length - 1) * 5;

      // Finding metadata
      writeText(
        `${item.type} | ${item.statusLabel} | ${item.altState}`,
        {
          size: 9,
          color: muted,
          gap: 7
        }
      );

      // Current alt text
      labelValue(
        "Current alt text / state",
        item.original
      );

      // Identified concern
      labelValue(
        "Identified concern",
        item.summary
      );

      // Evidence
      labelValue(
        "Evidence and rationale",
        item.evidence
      );

      // Suggested improvement
      checkSpace(20);

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(8);
      setColor(muted);

      pdf.text(
        "SUGGESTED IMPROVEMENT",
        margin,
        y
      );

      y += 5;

      const suggestionLines = wrappedLines(
        item.suggestion,
        contentWidth - 12,
        9.5
      );

      const suggestionHeight =
        suggestionLines.length * 5.5 + 9;

      // Draw suggested improvement in a
      // light-blue box, splitting at page
      // boundaries when necessary.
      let lineIndex = 0;

      while (lineIndex < suggestionLines.length) {
        checkSpace(12);

        const availableHeight =
          bottomLimit - y;

        const maxLines = Math.max(
          1,
          Math.floor((availableHeight - 9) / 5.5)
        );

        const chunk = suggestionLines.slice(
          lineIndex,
          lineIndex + maxLines
        );

        const boxHeight =
          chunk.length * 5.5 + 9;

        pdf.setFillColor(238, 245, 252);
        pdf.setDrawColor(218, 231, 245);

        pdf.roundedRect(
          margin,
          y,
          contentWidth,
          boxHeight,
          2,
          2,
          "FD"
        );

        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(9.5);
        setColor(navy);

        chunk.forEach((line, i) => {
          pdf.text(
            line,
            margin + 6,
            y + 7 + i * 5.5
          );
        });

        y += boxHeight + 4;
        lineIndex += chunk.length;

        if (lineIndex < suggestionLines.length) {
          newPage();
        }
      }

      // Review information
      y += 4;

      labelValue(
        "Confidence",
        item.confidence
      );

      labelValue(
        "Review decision",
        item.decision || "Awaiting review"
      );

      y += 3;
      divider();
    });

    // ------------------------------------------
    // DISCLAIMER
    // ------------------------------------------

    checkSpace(40);

    sectionHeading("Important Disclaimer");

    writeText(
      "AltAware Lens provides AI-assisted decision support, " +
      "not a compliance certification. Findings and suggested " +
      "text may be inaccurate and must be verified against " +
      "the actual image, surrounding content, and intended " +
      "function. This report contains " +
      (mode === "sample" ? "illustrative sample findings." : "live scan findings that require human review."),
      {
        size: 9,
        color: muted,
        lineHeight: 5,
        gap: 8
      }
    );

    // ------------------------------------------
    // FOOTER ON EVERY PAGE
    // ------------------------------------------

    const totalPages =
      pdf.internal.getNumberOfPages();

    for (let page = 1; page <= totalPages; page++) {

      pdf.setPage(page);

      pdf.setDrawColor(...border);
      pdf.line(
        margin,
        H - 18,
        W - margin,
        H - 18
      );

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8);
      setColor(muted);

      pdf.text(
        "AltAware Lens | AI-assisted accessibility review",
        margin,
        H - 12
      );

      pdf.text(
        `Page ${page} of ${totalPages}`,
        W - margin,
        H - 12,
        { align: "right" }
      );
    }

    // ------------------------------------------
    // DOWNLOAD
    // ------------------------------------------

    pdf.save("AltAware-Lens-Audit-Report.pdf");

    toast("Audit report exported successfully.");

  });

  

  // Live Django integration. Sample mode is kept only for the sample button.
  function mapFinding(item, index) {
    const issue = item.issue_type || "Human review required";
    const review = Boolean(item.human_review_required) || issue === "Human review required";
    const clean = issue === "None" && !review;
    const altState = item.alt_state === "missing" ? "Alt attribute missing" :
      item.alt_state === "empty" ? 'Empty alt=""' : "Alt text present";
    const title = (() => {
      try { return decodeURIComponent(new URL(item.image_url).pathname.split('/').pop() || 'Image'); }
      catch (_) { return `Image ${index + 1}`; }
    })();
    return {
      id: index + 1,
      title: title.slice(0, 95),
      type: item.image_purpose || "Image",
      status: review ? "review" : clean ? "pass" : "issue",
      statusLabel: review ? "Needs review" : clean ? "No issue detected" : "Potential issue",
      altState,
      original: item.current_alt || (item.alt_state === "missing" ? "No alt attribute detected" : '(empty)'),
      summary: item.suggested_action || issue,
      imageUrl: item.image_url || "",
      evidence: [item.nearby_context ? `Nearby page text: ${item.nearby_context}` : "", `Image URL: ${item.image_url || 'Unavailable'}`, "Verify the image visually; page context alone is not visual evidence."].filter(Boolean).join("\n"),
      suggestion: [item.suggested_action, item.proposed_alt_text ? `Proposed: ${item.proposed_alt_text}` : ""].filter(Boolean).join("\n"),
      confidence: item.confidence || "Unspecified",
      thumb: item.image_purpose === "decorative" ? "decor" : item.image_purpose === "functional" ? "logo" : "chart",
      decision: ""
    };
  }

  async function loadLiveAudit() {
    byId("pageDomain").textContent = pageHost;
    byId("scanMode").textContent = "Scanning website… this may take a minute";
    byId("resultsSubtitle").textContent = "Fetching images and running accessibility checks…";
    byId("findingList").innerHTML = '<div class="empty-state" role="status">Scanning website and evaluating images. Please wait…</div>';
    byId("exportButton").disabled = true;
    const form = new URLSearchParams();
    form.set("url", requestedUrl);
    try {
      const response = await fetch("/audit/run/", {method: "POST", body: form});
      let data;
      try { data = await response.json(); }
      catch (_) { throw new Error(`Server returned HTTP ${response.status} instead of JSON.`); }
      if (!response.ok) throw new Error(data.error || `HTTP ${response.status}`);
      liveAuditId = data.audit_id;
      findings = (data.findings || []).map(mapFinding);
      byId("scanMode").textContent = `Live scan complete · ${data.analysed_images || 0} images analysed`;
      byId("resultsSubtitle").textContent = data.disclaimer || "AI-assisted findings require human review.";
      byId("demoBanner").style.display = "none";
      byId("exportButton").disabled = false;
      render();
      if (!findings.length) byId("findingList").innerHTML = '<div class="empty-state">No analyzable images found on this page.</div>';
    } catch (error) {
      byId("scanMode").textContent = "Scan failed";
      byId("resultsSubtitle").textContent = error.message;
      byId("findingList").innerHTML = `<div class="empty-state" role="alert">Scan failed: ${escapeHtml(error.message)}. Check the Django terminal for details.</div>`;
      toast("Scan failed. Check the error message.");
    }
  }

  byId("pageDomain").textContent = mode === "sample" ? "Illustrative sample page" : pageHost;
  if (mode === "sample") {
    byId("scanMode").textContent = "Sample data · not a live scan";
    render();
  } else if (!params.get("url")) {
    byId("scanMode").textContent = "No URL provided";
    byId("findingList").innerHTML = '<div class="empty-state">Return to the homepage and enter a webpage URL.</div>';
    byId("exportButton").disabled = true;
  } else {
    loadLiveAudit();
  }
})();
