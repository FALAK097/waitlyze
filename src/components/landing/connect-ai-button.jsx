"use client";

import {
  ChatGptIcon,
  CheckmarkBadge01Icon,
  ClaudeIcon,
  CommandLineIcon,
  Copy01Icon,
} from "@hugeicons/core-free-icons";
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

function CursorIcon({ className = "h-3.5 w-3.5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M11.523 0 2.2 5.38a1.68 1.68 0 0 0-.84 1.455v10.33a1.68 1.68 0 0 0 .84 1.455l9.323 5.38a1.68 1.68 0 0 0 1.68 0l9.324-5.38a1.68 1.68 0 0 0 .84-1.455V6.835a1.68 1.68 0 0 0-.84-1.455L13.203 0a1.68 1.68 0 0 0-1.68 0Zm-.24 2.215a.56.56 0 0 1 .56 0l8.03 4.636-8.03 4.637a.56.56 0 0 1-.56 0L3.253 6.85l8.03-4.636ZM2.72 8.337l8.03 4.636v9.273a.56.56 0 0 1-.28-.078L2.72 17.532V8.337Zm17.927 0v9.195l-7.75 4.475a.56.56 0 0 1-.28.078V12.973l8.03-4.636Z" />
    </svg>
  );
}

function VsCodeIcon({ className = "h-3.5 w-3.5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M23.15 2.587 18.21.21a1.494 1.494 0 0 0-1.705.29l-9.46 8.63-4.12-3.128a.999.999 0 0 0-1.276.057L.327 7.261A1 1 0 0 0 .32 8.704L4.17 12 .32 15.296a1 1 0 0 0 .007 1.443l1.322 1.202c.38.345.952.368 1.276.057l4.12-3.128 9.46 8.63a1.492 1.492 0 0 0 1.704.29l4.942-2.377A1.5 1.5 0 0 0 24 20.06V3.939a1.5 1.5 0 0 0-.85-1.352ZM18 16.54l-5.646-4.54L18 7.46v9.08Z" />
    </svg>
  );
}

const CLIENT_CONFIGS = [
  {
    id: "claude",
    name: "Claude Code",
    icon: function ClaudeClientIcon(props) {
      return <HugeiconsIcon icon={ClaudeIcon} size={14} className="shrink-0" {...props} />;
    },
    type: "cli",
    command: "claude mcp add --transport http waitlyze https://waitlyze.com/mcp",
  },
  {
    id: "cursor",
    name: "Cursor",
    icon: function CursorClientIcon(props) {
      return <CursorIcon className="h-3.5 w-3.5 shrink-0" {...props} />;
    },
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
    icon: function CodexClientIcon(props) {
      return <HugeiconsIcon icon={ChatGptIcon} size={14} className="shrink-0" {...props} />;
    },
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
    icon: function VsCodeClientIcon(props) {
      return <VsCodeIcon className="h-3.5 w-3.5 shrink-0" {...props} />;
    },
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
    icon: function OpenCodeClientIcon(props) {
      return <HugeiconsIcon icon={CommandLineIcon} size={14} className="shrink-0" {...props} />;
    },
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
          <HugeiconsIcon icon={ClaudeIcon} size={15} aria-hidden="true" />
          <CursorIcon className="h-3.5 w-3.5" />
          <HugeiconsIcon icon={ChatGptIcon} size={15} aria-hidden="true" />
        </span>
        <span className="tracking-tight">Connect your AI</span>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl border-neutral-200 bg-white p-6 text-neutral-900">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 text-neutral-800">
                <HugeiconsIcon icon={ClaudeIcon} size={18} aria-hidden="true" />
                <CursorIcon className="h-4 w-4" />
                <HugeiconsIcon icon={ChatGptIcon} size={18} aria-hidden="true" />
                <VsCodeIcon className="h-4 w-4" />
                <HugeiconsIcon icon={CommandLineIcon} size={18} aria-hidden="true" />
              </span>
              <DialogTitle className="text-lg font-semibold tracking-tight text-neutral-900">
                Connect your AI Agent to Waitlyze
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-neutral-500">
              Control your entire waitlist platform through Cursor, Claude Code, Codex, VS Code, or
              OpenCode via hosted MCP.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4">
            <div className="flex flex-wrap gap-1.5 border-b border-neutral-200 pb-2">
              {CLIENT_CONFIGS.map((client) => {
                const Icon = client.icon;
                return (
                  <button
                    key={client.id}
                    type="button"
                    onClick={() => setSelectedClient(client.id)}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
                      selectedClient === client.id
                        ? "bg-neutral-900 text-white"
                        : "text-neutral-600 hover:bg-neutral-100"
                    }`}
                  >
                    <Icon />
                    <span>{client.name}</span>
                  </button>
                );
              })}
            </div>

            <div className="relative mt-3">
              <pre className="max-h-60 overflow-x-auto rounded-xl border border-neutral-200 bg-neutral-950 p-3.5 font-mono text-xs text-neutral-100">
                <code>{copyText}</code>
              </pre>
              <button
                type="button"
                onClick={handleCopy}
                className="absolute top-2.5 right-2.5 inline-flex items-center gap-1 rounded-md bg-neutral-800 px-2 py-1 text-[11px] font-medium text-neutral-200 hover:bg-neutral-700 hover:text-white"
              >
                <HugeiconsIcon
                  icon={copied ? CheckmarkBadge01Icon : Copy01Icon}
                  size={13}
                  aria-hidden="true"
                />
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>

            <div className="mt-4 flex items-center justify-between pt-2 text-xs">
              <span className="text-neutral-500">
                Hosted URL:{" "}
                <code className="font-mono text-neutral-800">https://waitlyze.com/mcp</code>
              </span>
              <Link
                href="/docs/mcp"
                onClick={() => setOpen(false)}
                className="font-medium text-blue-600 hover:underline"
              >
                View full MCP docs →
              </Link>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
