(() => {
  // Configuration
  const scriptOrigin = document.currentScript?.src
    ? new URL(document.currentScript.src).origin
    : "https://waitlyze.com";
  const BASE_URL = `${scriptOrigin}/forms`;
  const DEFAULT_HEIGHT = "380px";
  const MESSAGE_SOURCE = "waitlyze-embed";
  const MIN_HEIGHT = 120;
  const MAX_HEIGHT = 4000;
  let activeOverlayCleanup = null;
  let activeOverlayFrame = null;
  let activeOverlayCloseButton = null;

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
    if (!message || message.source !== MESSAGE_SOURCE) return;
    if (message.type === "ready" && activeOverlayFrame?.contentWindow === event.source) {
      activeOverlayFrame.contentWindow.postMessage(
        { source: MESSAGE_SOURCE, type: "overlay-init" },
        scriptOrigin,
      );
      return;
    }
    if (message.type === "close") {
      if (activeOverlayFrame?.contentWindow === event.source) activeOverlayCleanup?.();
      return;
    }
    if (message.type === "focus-boundary" && activeOverlayFrame?.contentWindow === event.source) {
      activeOverlayCloseButton?.focus();
      return;
    }
    if (message.type !== "resize") return;
    const height = Number(message.height);
    if (!Number.isFinite(height) || height <= 0) return;
    const next = Math.min(Math.max(Math.ceil(height), MIN_HEIGHT), MAX_HEIGHT);
    document.querySelectorAll("iframe[data-waitlyze-embed]").forEach((frame) => {
      if (frame.contentWindow !== event.source) return;
      frame.style.height = `${next}px`;
    });
  }

  const RADIUS_PX = {
    sharp: "0px",
    soft: "6px",
    round: "12px",
    pill: "9999px",
  };

  function buildIframeForContainer(container, queryParams) {
    const keyId = container.getAttribute("data-key-id");
    const height = container.getAttribute("data-height");
    const theme = container.getAttribute("data-theme");
    const mode = container.getAttribute("data-mode");
    const iframe = createIframe();
    iframe.setAttribute("data-waitlyze-embed", "");

    const params = new URLSearchParams(queryParams ? queryParams.slice(1) : "");
    if (theme === "dark" || theme === "light") params.set("theme", theme);
    if (mode === "pill") params.set("compact", "1");
    const qs = params.size ? `?${params}` : "";

    iframe.src = `${BASE_URL}/${encodeURIComponent(keyId)}${qs}`;
    iframe.style.height = height || (mode === "pill" ? "128px" : DEFAULT_HEIGHT);
    return iframe;
  }

  function mountOverlayTrigger(container, mode, queryParams) {
    const buttonText = (container.getAttribute("data-button-text") || "Join waitlist").slice(0, 40);
    const accentColor = /^#[0-9a-f]{6}$/i.test(container.getAttribute("data-accent-color") || "")
      ? container.getAttribute("data-accent-color")
      : "#c6fe1e";
    const textColor = /^#[0-9a-f]{6}$/i.test(container.getAttribute("data-button-text-color") || "")
      ? container.getAttribute("data-button-text-color")
      : "#00160d";
    const radius = RADIUS_PX[container.getAttribute("data-radius") || "round"] || "12px";

    const trigger = document.createElement("button");
    trigger.type = "button";
    trigger.textContent = buttonText;
    trigger.setAttribute("data-waitlyze-trigger", mode);
    trigger.style.cssText = `display:inline-flex;align-items:center;justify-content:center;min-height:44px;padding:10px 20px;font:600 14px/1.2 system-ui,-apple-system,sans-serif;cursor:pointer;border:1px solid ${textColor};background:${accentColor};color:${textColor};border-radius:${radius};`;

    trigger.addEventListener("click", () => {
      if (activeOverlayCleanup) activeOverlayCleanup({ restoreFocus: false });

      const backdrop = document.createElement("div");
      backdrop.setAttribute("data-waitlyze-overlay", mode);
      backdrop.setAttribute("role", "dialog");
      backdrop.setAttribute("aria-modal", "true");
      backdrop.setAttribute("aria-label", "Waitlist signup");
      backdrop.style.cssText =
        mode === "drawer"
          ? "position:fixed;inset:0;z-index:2147483647;background:rgba(0,0,0,0.45);display:flex;justify-content:flex-end;"
          : "position:fixed;inset:0;z-index:2147483647;background:rgba(0,0,0,0.45);display:flex;align-items:center;justify-content:center;padding:16px;";

      const panel = document.createElement("div");
      panel.style.cssText =
        mode === "drawer"
          ? "width:100%;max-width:440px;height:100%;background:#fff;padding:16px;overflow:auto;box-shadow:-12px 0 32px rgba(0,0,0,0.18);display:flex;flex-direction:column;gap:8px;"
          : `width:100%;max-width:460px;max-height:90vh;background:#fff;padding:16px;overflow:auto;border-radius:${radius === "9999px" ? "16px" : radius};box-shadow:0 20px 50px rgba(0,0,0,0.22);display:flex;flex-direction:column;gap:8px;`;

      const closeBtn = document.createElement("button");
      closeBtn.type = "button";
      closeBtn.textContent = "Close";
      closeBtn.setAttribute("aria-label", "Close waitlist dialog");
      closeBtn.style.cssText =
        "align-self:flex-end;border:1px solid #e5e7eb;background:#fff;color:#111827;border-radius:8px;padding:6px 12px;font:500 12px/1 system-ui,-apple-system,sans-serif;cursor:pointer;";

      const frame = buildIframeForContainer(container, queryParams);
      const previousInert = new Map();
      let closed = false;
      const focusFrame = () => frame.focus();
      const closeOverlay = ({ restoreFocus = true } = {}) => {
        if (closed) return;
        closed = true;
        document.removeEventListener("keydown", onKeyDown);
        for (const [element, wasInert] of previousInert) element.inert = wasInert;
        backdrop.remove();
        if (activeOverlayCleanup === cleanup) {
          activeOverlayCleanup = null;
          activeOverlayFrame = null;
          activeOverlayCloseButton = null;
        }
        if (restoreFocus) trigger.focus();
      };
      const onKeyDown = (event) => {
        if (event.key === "Escape") {
          closeOverlay();
          return;
        }
        if (event.key === "Tab" && document.activeElement === closeBtn) {
          event.preventDefault();
          frame.contentWindow.postMessage(
            { source: MESSAGE_SOURCE, type: event.shiftKey ? "focus-last" : "focus-first" },
            scriptOrigin,
          );
          focusFrame();
        }
      };
      const cleanup = (options) => closeOverlay(options);
      closeBtn.addEventListener("click", closeOverlay);
      backdrop.addEventListener("click", (event) => {
        if (event.target === backdrop) closeOverlay();
      });
      document.addEventListener("keydown", onKeyDown);
      for (const element of document.body.children) {
        if (element === backdrop) continue;
        previousInert.set(element, element.inert);
        element.inert = true;
      }
      activeOverlayCleanup = cleanup;
      activeOverlayFrame = frame;
      activeOverlayCloseButton = closeBtn;
      panel.append(closeBtn, frame);
      backdrop.append(panel);
      document.body.append(backdrop);
      closeBtn.focus();
    });

    container.setAttribute("data-waitlyze-initialized", "true");
    container.replaceChildren(trigger);
  }

  function initializeWidget() {
    const queryParams = getQueryParameters();

    document.querySelectorAll(".waitlyze-widget").forEach((container) => {
      const keyId = container.getAttribute("data-key-id");
      if (
        !keyId ||
        container.getAttribute("data-waitlyze-initialized") === "true" ||
        container.querySelector("iframe[data-waitlyze-embed]")
      ) {
        return;
      }

      const mode = container.getAttribute("data-mode") || "inline";
      if (mode === "modal" || mode === "drawer") {
        mountOverlayTrigger(container, mode, queryParams);
        return;
      }

      const iframeClone = buildIframeForContainer(container, queryParams);
      container.setAttribute("data-waitlyze-initialized", "true");
      container.replaceChildren(iframeClone);
    });
  }

  window.WaitlyzeEmbed = { init: initializeWidget };
  window.addEventListener("message", handleResize);

  function startObserver() {
    if (typeof MutationObserver === "undefined" || !document.body) return;
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (
            node.nodeType === 1 &&
            (node.matches?.(".waitlyze-widget") || node.querySelector?.(".waitlyze-widget"))
          ) {
            initializeWidget();
            return;
          }
        }
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  // Initialize when DOM is loaded
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      initializeWidget();
      startObserver();
    });
  } else {
    initializeWidget();
    startObserver();
  }
})();
