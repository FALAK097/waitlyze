(() => {
  // Configuration
  const scriptOrigin = document.currentScript?.src
    ? new URL(document.currentScript.src).origin
    : "https://waitlyze.falakgala.dev";
  const BASE_URL = `${scriptOrigin}/forms`;
  const DEFAULT_HEIGHT = "380px";

  function createIframe() {
    const iframe = document.createElement("iframe");
    iframe.title = "Waitlyze signup page";
    iframe.referrerPolicy = "strict-origin-when-cross-origin";
    iframe.style.width = "100%";
    iframe.style.border = "none";

    // Add security and permission attributes
    iframe.setAttribute("loading", "lazy");
    iframe.setAttribute("allow", "clipboard-write");
    iframe.setAttribute(
      "sandbox",
      "allow-same-origin allow-scripts allow-forms allow-popups"
    );

    return iframe;
  }

  function getQueryParameters() {
    const current = new URLSearchParams(window.location.search);
    const forwarded = new URLSearchParams();
    for (const key of ["r", "utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"]) {
      const value = current.get(key);
      if (value && value.length <= 256) forwarded.set(key, value);
    }
    return forwarded.size ? `?${forwarded}` : "";
  }

  function initializeWidget() {
    const iframe = createIframe();
    const queryParams = getQueryParameters();

    document.querySelectorAll(".waitlyze-widget").forEach((container) => {
      const keyId = container.getAttribute("data-key-id");
      const height = container.getAttribute("data-height");

      if (!keyId || container.querySelector("iframe[data-waitlyze-embed]")) return;

      // Clone the iframe for each instance
      const iframeClone = iframe.cloneNode(true);
      iframeClone.setAttribute("data-waitlyze-embed", "");

      // Set source URL with query parameters
      iframeClone.src = `${BASE_URL}/${encodeURIComponent(keyId)}${queryParams}`;

      // Set height (use provided height or default)
      iframeClone.style.height = height || DEFAULT_HEIGHT;

      // Add to container
      container.appendChild(iframeClone);
    });
  }

  // Initialize when DOM is loaded
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeWidget);
  } else {
    initializeWidget();
  }
})();
