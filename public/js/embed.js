(() => {
  // Configuration
  const scriptOrigin = document.currentScript?.src
    ? new URL(document.currentScript.src).origin
    : "https://waitlyze.falakgala.dev";
  const BASE_URL = `${scriptOrigin}/forms`;
  const DEFAULT_HEIGHT = "380px";
  const MESSAGE_SOURCE = "waitlyze-embed";
  const MIN_HEIGHT = 120;
  const MAX_HEIGHT = 4000;

  function createIframe() {
    const iframe = document.createElement("iframe");
    iframe.title = "Waitlyze signup page";
    iframe.referrerPolicy = "strict-origin-when-cross-origin";
    iframe.style.width = "100%";
    iframe.style.border = "none";
    iframe.style.display = "block";
    iframe.style.maxWidth = "100%";
    iframe.style.background = "transparent";

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

  // The frame reports its own height so the embed never needs a manual size.
  // Only messages from this origin, and only from one of our own frames, are
  // accepted.
  function handleResize(event) {
    if (event.origin !== scriptOrigin) return;
    const message = event.data;
    if (!message || message.source !== MESSAGE_SOURCE || message.type !== "resize") return;
    const height = Number(message.height);
    if (!Number.isFinite(height) || height <= 0) return;
    const next = Math.min(Math.max(Math.ceil(height), MIN_HEIGHT), MAX_HEIGHT);
    document.querySelectorAll("iframe[data-waitlyze-embed]").forEach((frame) => {
      if (frame.contentWindow !== event.source) return;
      frame.style.height = `${next}px`;
    });
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

      // Starting height; the frame reports its real height as soon as it loads
      iframeClone.style.height = height || DEFAULT_HEIGHT;

      // Add to container
      container.appendChild(iframeClone);
    });
  }

  window.addEventListener("message", handleResize);

  // Initialize when DOM is loaded
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeWidget);
  } else {
    initializeWidget();
  }
})();
