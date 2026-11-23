"use client";

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function escapeCsvCell(value) {
  const str = String(value ?? "");
  if (/[",\n\r]/.test(str)) {
    return `"${str.replaceAll('"', '""')}"`;
  }
  return str;
}

export function downloadCsv(filename, headers, rows, metadataLines = []) {
  const lines = [];
  for (const note of metadataLines) {
    lines.push(`# ${note}`);
  }
  lines.push(headers.map(escapeCsvCell).join(","));
  for (const row of rows) {
    lines.push(row.map(escapeCsvCell).join(","));
  }
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  triggerDownload(blob, filename);
}

export function downloadJson(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json;charset=utf-8;",
  });
  triggerDownload(blob, filename);
}

export function downloadTextFile(filename, text, mimeType = "text/plain;charset=utf-8;") {
  const blob = new Blob([text], { type: mimeType });
  triggerDownload(blob, filename);
}

export async function copyToClipboard(text) {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return true;
  }
  return false;
}

/**
 * Generates a crisp Waitlyze-branded light editorial PNG summary card on an
 * offscreen HTML5 Canvas, including formula, key metrics, and date stamp.
 */
export function downloadSummaryPng({
  filename = "waitlyze-launch-lab.png",
  title,
  subtitle = "",
  metrics = [],
  formula = "",
  footnote = "Generated with Waitlyze Launch Lab · waitlyze.com/tools",
}) {
  const width = 1200;
  const height = 630;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  // Light editorial canvas
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);

  // Subtle right lime brand bar
  ctx.fillStyle = "#c6fe1e";
  ctx.fillRect(width - 18, 0, 18, height);

  // Subtle top border line
  ctx.strokeStyle = "#e4e6e8";
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, width - 2, height - 2);

  // Eyebrow
  ctx.fillStyle = "#19673c";
  ctx.font = "600 16px ui-monospace, SFMono-Regular, Menlo, monospace";
  ctx.fillText("WAITLYZE LAUNCH LAB", 64, 72);

  // Date stamp
  const today = new Date().toISOString().slice(0, 10);
  ctx.fillStyle = "#5d6b60";
  ctx.textAlign = "right";
  ctx.fillText(today, width - 64, 72);
  ctx.textAlign = "left";

  // Title
  ctx.fillStyle = "#00160d";
  ctx.font = "700 44px system-ui, -apple-system, sans-serif";
  ctx.fillText(String(title || "").slice(0, 56), 64, 136);

  // Subtitle
  if (subtitle) {
    ctx.fillStyle = "#4d5659";
    ctx.font = "400 21px system-ui, -apple-system, sans-serif";
    ctx.fillText(String(subtitle).slice(0, 96), 64, 178);
  }

  // Four metrics keep the established single-row card layout. A fifth metric
  // uses a centered 3+2 grid so exports never silently drop result details.
  const visibleMetrics = metrics.slice(0, 5);
  if (visibleMetrics.length > 0) {
    const hasSecondRow = visibleMetrics.length > 4;
    const gap = hasSecondRow ? 16 : 20;
    const totalW = width - 128;
    const columns = hasSecondRow ? 3 : visibleMetrics.length;
    const cardW = (totalW - gap * (columns - 1)) / columns;
    const cardY = hasSecondRow ? 204 : 224;
    const cardH = hasSecondRow ? 96 : 164;

    visibleMetrics.forEach((metric, index) => {
      const row = hasSecondRow ? Math.floor(index / columns) : 0;
      const column = hasSecondRow ? index % columns : index;
      const rowCount = hasSecondRow && row === 1 ? visibleMetrics.length - columns : columns;
      const rowOffset = row === 1 ? (totalW - (rowCount * cardW + (rowCount - 1) * gap)) / 2 : 0;
      const x = 64 + rowOffset + column * (cardW + gap);
      const y = cardY + row * (cardH + 12);
      ctx.fillStyle = "#f4f5f6";
      ctx.beginPath();
      ctx.roundRect(x, y, cardW, cardH, 12);
      ctx.fill();

      ctx.strokeStyle = "#e4e6e8";
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = "#4d5659";
      ctx.font = "600 15px system-ui, -apple-system, sans-serif";
      ctx.fillText(
        String(metric.label || "").slice(0, 28),
        x + 22,
        y + (hasSecondRow ? 25 : 42),
        cardW - 44,
      );

      ctx.fillStyle = "#00160d";
      ctx.font = hasSecondRow
        ? "700 25px system-ui, -apple-system, sans-serif"
        : "700 34px system-ui, -apple-system, sans-serif";
      ctx.fillText(
        String(metric.value || "").slice(0, hasSecondRow ? 32 : 16),
        x + 22,
        y + (hasSecondRow ? 56 : 102),
        cardW - 44,
      );

      if (metric.hint) {
        ctx.fillStyle = "#5d6b60";
        ctx.font = hasSecondRow
          ? "400 12px system-ui, -apple-system, sans-serif"
          : "400 14px system-ui, -apple-system, sans-serif";
        ctx.fillText(
          String(metric.hint).slice(0, 32),
          x + 22,
          y + (hasSecondRow ? 79 : 138),
          cardW - 44,
        );
      }
    });
  }

  // Formula block
  if (formula) {
    ctx.fillStyle = "#f9faf6";
    ctx.beginPath();
    ctx.roundRect(64, 424, width - 128, 78, 10);
    ctx.fill();
    ctx.strokeStyle = "#e4e6e8";
    ctx.stroke();

    ctx.fillStyle = "#4d5659";
    ctx.font = "600 13px ui-monospace, SFMono-Regular, Menlo, monospace";
    ctx.fillText("FORMULA / METHOD", 86, 452);

    ctx.fillStyle = "#00160d";
    ctx.font = "500 17px ui-monospace, SFMono-Regular, Menlo, monospace";
    ctx.fillText(String(formula).slice(0, 92), 86, 482);
  }

  // Footer hairline + source line
  ctx.strokeStyle = "#e4e6e8";
  ctx.beginPath();
  ctx.moveTo(64, 548);
  ctx.lineTo(width - 64, 548);
  ctx.stroke();

  ctx.fillStyle = "#5d6b60";
  ctx.font = "500 16px system-ui, -apple-system, sans-serif";
  ctx.fillText(footnote, 64, 584);

  canvas.toBlob((blob) => {
    if (blob) triggerDownload(blob, filename);
  }, "image/png");
}

/**
 * Renders a crisp high-resolution QR code image (PNG or JPG) with a white
 * quiet-zone background so it works cleanly in print, slides, and JPG viewers.
 */
export function downloadQrImage({
  matrix,
  filename = "waitlyze-qr.png",
  format = "png",
  size = 1024,
}) {
  if (!Array.isArray(matrix) || matrix.length === 0) return;
  const quiet = 4;
  const totalModules = matrix.length + quiet * 2;
  const modulePx = Math.max(1, Math.floor(size / totalModules));
  const canvasSize = Math.max(size, modulePx * totalModules);
  const gridPx = modulePx * matrix.length;
  const offset = Math.floor((canvasSize - gridPx) / 2);

  const canvas = document.createElement("canvas");
  canvas.width = canvasSize;
  canvas.height = canvasSize;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvasSize, canvasSize);

  ctx.fillStyle = "#00160d";
  for (let r = 0; r < matrix.length; r += 1) {
    for (let c = 0; c < matrix.length; c += 1) {
      if (matrix[r][c] === 1) {
        ctx.fillRect(offset + c * modulePx, offset + r * modulePx, modulePx, modulePx);
      }
    }
  }

  const mimeType = format === "jpg" || format === "jpeg" ? "image/jpeg" : "image/png";
  const quality = mimeType === "image/jpeg" ? 0.96 : undefined;
  canvas.toBlob(
    (blob) => {
      if (blob) triggerDownload(blob, filename);
    },
    mimeType,
    quality,
  );
}
