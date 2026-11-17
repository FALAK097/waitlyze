"use client";

import { CheckmarkBadge01Icon, Copy01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { trackClientEvent } from "@/lib/posthog/client";

const CLIENT_CONFIGS = [
  {
    id: "claude",
    name: "Claude Code",
    iconSrc: "/assets/icons/claude.svg",
    type: "cli",
    command: "claude mcp add --transport http waitlyze https://waitlyze.com/mcp",
  },
  {
    id: "cursor",
    name: "Cursor",
    iconSrc: "/assets/icons/cursor.svg",
    type: "json",
    snippet: JSON.stringify(
      {
        mcpServers: {
          waitlyze: {
            url: "https://waitlyze.com/mcp",
            headers: {
              Authorization: "Bearer wl2_YOUR_API_KEY",
            },
          },
        },
      },
      null,
      2,
    ),
  },
  {
    id: "codex",
    name: "Codex",
    iconSrc: "/assets/icons/codex.svg",
    type: "json",
    snippet: JSON.stringify(
      {
        mcpServers: {
          waitlyze: {
            url: "https://waitlyze.com/mcp",
          },
        },
      },
      null,
      2,
    ),
  },
  {
    id: "vscode",
    name: "VS Code",
    iconSrc: "/assets/icons/vscode.svg",
    type: "json",
    snippet: JSON.stringify(
      {
        "mcp.servers": {
          waitlyze: {
            type: "http",
            url: "https://waitlyze.com/mcp",
            headers: {
              Authorization: "Bearer wl2_YOUR_API_KEY",
            },
          },
        },
      },
      null,
      2,
    ),
  },
  {
    id: "opencode",
    name: "OpenCode",
    iconSrc: "/assets/icons/opencode.svg",
    type: "json",
    snippet: JSON.stringify(
      {
        $schema: "https://opencode.ai/config.json",
        mcp: {
          waitlyze: {
            type: "remote",
            url: "https://waitlyze.com/mcp",
            headers: {
              Authorization: "Bearer wl2_YOUR_API_KEY",
            },
          },
        },
      },
      null,
      2,
    ),
  },
];

export function ConnectAiButton({ className = "" }) {
  const [open, setOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState("claude");
  const [copied, setCopied] = useState(false);

  const handleOpen = () => {
    trackClientEvent("mcp_connect_clicked", { source: "landing_hero" });
    setOpen(true);
  };

  const activeConfig = CLIENT_CONFIGS.find((c) => c.id === selectedClient) || CLIENT_CONFIGS[0];
  const copyText = activeConfig.command || activeConfig.snippet;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(copyText);
      setCopied(true);
      toast.success("Configuration copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy to clipboard");
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className={`wl-secondary-button ${className}`}
        aria-label="Connect your AI agent to Waitlyze via Model Context Protocol"
      >
        <span className="flex items-center gap-1.5 text-neutral-900">
          <img
            src="/assets/icons/claude.svg"
            alt=""
            className="h-4 w-4 shrink-0 object-contain"
            aria-hidden="true"
          />
          <img
            src="/assets/icons/cursor.svg"
            alt=""
            className="h-3.5 w-3.5 shrink-0 object-contain"
            aria-hidden="true"
          />
          <img
            src="/assets/icons/codex.svg"
            alt=""
            className="h-3.5 w-3.5 shrink-0 object-contain"
            aria-hidden="true"
          />
          <img
            src="/assets/icons/vscode.svg"
            alt=""
            className="h-3.5 w-3.5 shrink-0 object-contain"
            aria-hidden="true"
          />
          <img
            src="/assets/icons/opencode.svg"
            alt=""
            className="h-3.5 w-3.5 shrink-0 object-contain"
            aria-hidden="true"
          />
        </span>
        <span className="tracking-tight">Connect your AI</span>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="w-full max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border-neutral-200 bg-white p-5 text-neutral-900 shadow-xl sm:max-w-xl sm:p-6">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 text-neutral-800">
                <img
                  src="/assets/icons/claude.svg"
                  alt=""
                  className="h-4 w-4 shrink-0 object-contain"
                  aria-hidden="true"
                />
                <img
                  src="/assets/icons/cursor.svg"
                  alt=""
                  className="h-4 w-4 shrink-0 object-contain"
                  aria-hidden="true"
                />
                <img
                  src="/assets/icons/codex.svg"
                  alt=""
                  className="h-4 w-4 shrink-0 object-contain"
                  aria-hidden="true"
                />
                <img
                  src="/assets/icons/vscode.svg"
                  alt=""
                  className="h-4 w-4 shrink-0 object-contain"
                  aria-hidden="true"
                />
                <img
                  src="/assets/icons/opencode.svg"
                  alt=""
                  className="h-4 w-4 shrink-0 object-contain"
                  aria-hidden="true"
                />
              </span>
              <DialogTitle className="text-base font-semibold tracking-tight text-neutral-900 sm:text-lg">
                Connect your AI agent to Waitlyze
              </DialogTitle>
            </div>
            <DialogDescription className="mt-1 text-xs text-neutral-500">
              Control your entire waitlist platform through Claude Code, Cursor, Codex, VS Code, or
              OpenCode via MCP.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 w-full min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 border-b border-neutral-200 pb-2.5">
              {CLIENT_CONFIGS.map((client) => {
                const isActive = selectedClient === client.id;
                return (
                  <button
                    key={client.id}
                    type="button"
                    onClick={() => setSelectedClient(client.id)}
                    className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-all ${
                      isActive
                        ? "border-neutral-900 bg-neutral-100 font-semibold text-neutral-950 shadow-xs ring-1 ring-neutral-900/10"
                        : "border-transparent bg-neutral-50/70 text-neutral-600 hover:border-neutral-200 hover:bg-neutral-100 hover:text-neutral-900"
                    }`}
                  >
                    <img
                      src={client.iconSrc}
                      alt=""
                      className="h-3.5 w-3.5 shrink-0 object-contain"
                      aria-hidden="true"
                    />
                    <span>{client.name}</span>
                  </button>
                );
              })}
            </div>

            <div className="relative mt-3 w-full min-w-0 overflow-hidden rounded-xl border border-neutral-800 bg-neutral-950">
              <pre className="max-h-60 w-full min-w-0 overflow-x-auto p-3.5 pr-20 font-mono text-xs text-neutral-100">
                <code>{copyText}</code>
              </pre>
              <button
                type="button"
                onClick={handleCopy}
                className="absolute top-2.5 right-2.5 inline-flex items-center gap-1 rounded-md bg-neutral-800/90 px-2 py-1 text-[11px] font-medium text-neutral-200 transition-colors hover:bg-neutral-700 hover:text-white"
              >
                <HugeiconsIcon
                  icon={copied ? CheckmarkBadge01Icon : Copy01Icon}
                  size={13}
                  aria-hidden="true"
                />
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-neutral-100 pt-2 text-xs">
              <span className="text-neutral-500">
                MCP URL:{" "}
                <code className="font-mono font-medium text-neutral-900 select-all">
                  https://waitlyze.com/mcp
                </code>
              </span>
              <Link
                href="/docs/mcp"
                onClick={() => setOpen(false)}
                className="inline-flex items-center gap-1 font-medium text-neutral-900 hover:underline"
              >
                <span>View full MCP docs</span>
                <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
