
document.addEventListener("DOMContentLoaded", () => {
  const tabs = Array.from(document.querySelectorAll(".legal-tab"));
  const panels = Array.from(document.querySelectorAll(".legal-panel"));
  const footerLinks = document.querySelectorAll("[data-legal-tab]");
  const yearElement = document.getElementById("current-year");

  if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
  }

  function activateTab(tab, updateHash = true) {
    if (!tab) return;

    const targetPanelId = tab.getAttribute("aria-controls");
    const targetPanel = document.getElementById(targetPanelId);

    if (!targetPanel) return;

    tabs.forEach((item) => {
      const isActive = item === tab;

      item.classList.toggle("active", isActive);
      item.setAttribute("aria-selected", String(isActive));
      item.setAttribute("tabindex", isActive ? "0" : "-1");
    });

    panels.forEach((panel) => {
      panel.hidden = panel !== targetPanel;
    });

    if (updateHash) {
      const cleanId = targetPanel.id;
      history.replaceState(null, "", `#${cleanId}`);
    }
  }

  function activateFromHash() {
    const hash = window.location.hash;

    if (!hash) {
      activateTab(document.getElementById("tab-disclaimer"), false);
      return;
    }

    const targetPanel = document.querySelector(hash);

    if (targetPanel && targetPanel.classList.contains("legal-panel")) {
      const tab = tabs.find(
        (item) => item.getAttribute("aria-controls") === targetPanel.id
      );

      if (tab) {
        activateTab(tab, false);
        return;
      }
    }

    activateTab(document.getElementById("tab-disclaimer"), false);
  }

  tabs.forEach((tab, index) => {
    tab.addEventListener("click", () => {
      activateTab(tab);
    });

    tab.addEventListener("keydown", (event) => {
      let nextIndex = index;

      if (event.key === "ArrowRight") {
        nextIndex = (index + 1) % tabs.length;
      } else if (event.key === "ArrowLeft") {
        nextIndex = (index - 1 + tabs.length) % tabs.length;
      } else if (event.key === "Home") {
        nextIndex = 0;
      } else if (event.key === "End") {
        nextIndex = tabs.length - 1;
      } else {
        return;
      }

      event.preventDefault();
      tabs[nextIndex].focus();
      activateTab(tabs[nextIndex]);
    });
  });

  footerLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      const tabId = link.dataset.legalTab;
      const tab = document.getElementById(tabId);

      if (!tab) return;

      event.preventDefault();
      activateTab(tab);
      tab.focus();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  });

  window.addEventListener("hashchange", activateFromHash);

  activateFromHash();
});