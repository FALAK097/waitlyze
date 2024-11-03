(() => {
	// Configuration
	const BASE_URL = "http://www.hypeitup.me/forms";
	const DEFAULT_HEIGHT = "380px";

	function createIframe() {
		const iframe = document.createElement("iframe");
		iframe.scrolling = "no";
		iframe.style.width = "100%";
		iframe.style.border = "none";

		// Add security and permission attributes
		iframe.setAttribute("loading", "lazy");
		iframe.setAttribute("allow", "clipboard-write");
		iframe.setAttribute(
			"sandbox",
			"allow-same-origin allow-scripts allow-forms allow-popups",
		);

		return iframe;
	}

	function getQueryParameters() {
		const url = window.location.toString();
		const queryString = url.split("?")[1];
		return queryString ? `?${queryString}` : "";
	}

	function initializeWidget() {
		const iframe = createIframe();
		const queryParams = getQueryParameters();

		// Find and process all widget containers
		// biome-ignore lint/complexity/noForEach: <explanation>
		document.querySelectorAll(".hypeitup-widget").forEach((container) => {
			const keyId = container.getAttribute("data-key-id");
			const height = container.getAttribute("data-height");

			if (!keyId) return;

			// Clone the iframe for each instance
			const iframeClone = iframe.cloneNode(true);

			// Set source URL with query parameters
			iframeClone.src = `${BASE_URL}/${keyId}${queryParams}`;

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
