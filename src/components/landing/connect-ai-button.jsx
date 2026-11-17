"use client";

import {
  ArrowRight01Icon,
  ArrowUpRight01Icon,
  CodeIcon,
  Copy01Icon,
  FlashIcon,
  Tick01Icon,
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

const CONNECTION_PROMPT = `Help me connect this AI assistant to my Waitlyze account using the remote MCP server at https://waitlyze.com/mcp.

Follow https://waitlyze.com/docs/mcp for this client's setup. Use OAuth and let me complete sign-in and approve access in my browser. If this client cannot connect to a remote MCP server, tell me and suggest a supported option.

Once connected, ask what waitlist I want to manage or analyze. Keep new changes as a draft for my review. Ask before publishing or deleting a waitlist.`;

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
  const [activeTab, setActiveTab] = useState("quick"); // "quick" | "developer"
  const [selectedClient, setSelectedClient] = useState("claude");
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [copiedConfig, setCopiedConfig] = useState(false);

  const handleOpen = () => {
    trackClientEvent("mcp_connect_clicked", { source: "landing_hero" });
    setOpen(true);
  };

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(CONNECTION_PROMPT);
      setCopiedPrompt(true);
      toast.success("Connection prompt copied to clipboard!");
      setTimeout(() => setCopiedPrompt(false), 2000);
    } catch {
      toast.error("Failed to copy connection prompt");
    }
  };

  const activeConfig = CLIENT_CONFIGS.find((c) => c.id === selectedClient) || CLIENT_CONFIGS[0];
  const copyRawText = activeConfig.command || activeConfig.snippet;

  const handleCopyConfig = async () => {
    try {
      await navigator.clipboard.writeText(copyRawText);
      setCopiedConfig(true);
      toast.success("Configuration copied to clipboard!");
      setTimeout(() => setCopiedConfig(false), 2000);
    } catch {
      toast.error("Failed to copy configuration");
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
            src="/assets/icons/chatgpt.svg"
            alt=""
            className="h-4 w-4 shrink-0 object-contain"
            aria-hidden="true"
          />
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
        </span>
        <span className="tracking-tight">Connect your AI</span>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[92vh] w-[calc(100vw-2rem)] min-w-0 overflow-y-auto rounded-2xl border border-neutral-200/90 bg-white p-5 text-neutral-900 shadow-xl sm:w-full sm:max-w-xl sm:p-6">
          <DialogHeader className="text-left">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200/80 bg-neutral-50 px-2.5 py-0.5 text-[11px] font-medium text-neutral-600">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                <span>Model Context Protocol</span>
              </span>
            </div>
            <DialogTitle className="mt-2 text-lg font-bold tracking-tight text-neutral-900 sm:text-xl">
              Connect your AI agent to Waitlyze
            </DialogTitle>
            <DialogDescription className="mt-1 text-xs leading-relaxed text-neutral-500">
              Manage waitlists, evaluate viral referrals, and inspect signups directly from your
              favorite AI assistant.
            </DialogDescription>
          </DialogHeader>

          {/* Mode Switcher Tabs */}
          <div className="mt-4 grid grid-cols-2 gap-1 rounded-xl border border-neutral-200/80 bg-neutral-100/70 p-1">
            <button
              type="button"
              onClick={() => setActiveTab("quick")}
              className={`flex items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium transition-all ${
                activeTab === "quick"
                  ? "bg-white font-semibold text-neutral-900 shadow-2xs"
                  : "text-neutral-600 hover:text-neutral-900"
              }`}
            >
              <HugeiconsIcon icon={FlashIcon} size={14} aria-hidden="true" className="shrink-0" />
              <span>Direct connect</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("developer")}
              className={`flex items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium transition-all ${
                activeTab === "developer"
                  ? "bg-white font-semibold text-neutral-900 shadow-2xs"
                  : "text-neutral-600 hover:text-neutral-900"
              }`}
            >
              <HugeiconsIcon icon={CodeIcon} size={14} aria-hidden="true" className="shrink-0" />
              <span>Coding agents</span>
            </button>
          </div>

          {activeTab === "quick" ? (
            <div className="mt-4 min-w-0 space-y-3">
              {/* Top AI Assistants */}
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                <a
                  href="https://waitlyze.com/docs/mcp#set-up-chatgpt"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() =>
                    trackClientEvent("mcp_chatgpt_connect_clicked", { source: "connect_ai_modal" })
                  }
                  className="group flex items-center justify-between rounded-xl border border-neutral-200/90 bg-white p-3 transition-all hover:border-neutral-900 hover:shadow-2xs"
                >
                  <div className="flex items-center gap-2.5">
                    <img
                      src="/assets/icons/chatgpt.svg"
                      alt=""
                      className="h-5 w-5 shrink-0 object-contain"
                      aria-hidden="true"
                    />
                    <div>
                      <div className="text-xs font-semibold text-neutral-900 group-hover:text-black">
                        ChatGPT
                      </div>
                      <div className="text-[11px] text-neutral-500">Plugin / Custom action</div>
                    </div>
                  </div>
                  <HugeiconsIcon
                    icon={ArrowRight01Icon}
                    size={15}
                    className="text-neutral-400 transition-colors group-hover:text-neutral-900"
                    aria-hidden="true"
                  />
                </a>

                <a
                  href="https://waitlyze.com/docs/mcp#set-up-claude"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() =>
                    trackClientEvent("mcp_claude_connect_clicked", { source: "connect_ai_modal" })
                  }
                  className="group flex items-center justify-between rounded-xl border border-neutral-200/90 bg-white p-3 transition-all hover:border-neutral-900 hover:shadow-2xs"
                >
                  <div className="flex items-center gap-2.5">
                    <img
                      src="/assets/icons/claude.svg"
                      alt=""
                      className="h-5 w-5 shrink-0 object-contain"
                      aria-hidden="true"
                    />
                    <div>
                      <div className="text-xs font-semibold text-neutral-900 group-hover:text-black">
                        Claude
                      </div>
                      <div className="text-[11px] text-neutral-500">Custom connector</div>
                    </div>
                  </div>
                  <HugeiconsIcon
                    icon={ArrowRight01Icon}
                    size={15}
                    className="text-neutral-400 transition-colors group-hover:text-neutral-900"
                    aria-hidden="true"
                  />
                </a>
              </div>

              {/* Conversational Auto-Connect Box */}
              <div className="rounded-xl border border-neutral-200/90 bg-neutral-50/60 p-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-neutral-900">
                    Auto-connect via prompt
                  </span>
                  <span className="text-[11px] text-neutral-500">
                    Paste into Cursor, Claude Code, or Codex
                  </span>
                </div>
                <div className="relative mt-2.5">
                  <div className="max-h-36 overflow-y-auto rounded-lg border border-neutral-200 bg-white p-3 pr-11 font-mono text-[11px] leading-relaxed whitespace-pre-wrap text-neutral-800 select-all sm:max-h-none">
                    {CONNECTION_PROMPT}
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyPrompt}
                    aria-label={copiedPrompt ? "Copied" : "Copy connection prompt"}
                    title={copiedPrompt ? "Copied" : "Copy connection prompt"}
                    className="absolute top-2.5 right-2.5 flex h-7 w-7 items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-600 shadow-2xs transition-all hover:bg-neutral-50 hover:text-neutral-900"
                  >
                    <HugeiconsIcon
                      icon={copiedPrompt ? Tick01Icon : Copy01Icon}
                      size={15}
                      className={copiedPrompt ? "text-emerald-600" : "text-neutral-600"}
                      aria-hidden="true"
                    />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={handleCopyPrompt}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-neutral-900 px-4 py-2.5 text-xs font-semibold text-white shadow-xs transition-all hover:bg-black active:scale-[0.99]"
                >
                  <HugeiconsIcon
                    icon={copiedPrompt ? Tick01Icon : Copy01Icon}
                    size={14}
                    className={copiedPrompt ? "text-emerald-400" : "text-white"}
                    aria-hidden="true"
                  />
                  <span>
                    {copiedPrompt ? "Copied connection prompt!" : "Copy connection prompt"}
                  </span>
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-4 min-w-0 space-y-3">
              {/* Responsive Coding Agent Pill Selector */}
              <div className="flex min-w-0 flex-wrap items-center gap-1.5 rounded-xl border border-neutral-200/80 bg-neutral-100/70 p-1">
                {CLIENT_CONFIGS.map((client) => {
                  const isActive = selectedClient === client.id;
                  return (
                    <button
                      key={client.id}
                      type="button"
                      onClick={() => setSelectedClient(client.id)}
                      className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all ${
                        isActive
                          ? "border border-neutral-200/80 bg-white font-semibold text-neutral-950 shadow-2xs"
                          : "border border-transparent text-neutral-600 hover:bg-white/60 hover:text-neutral-900"
                      }`}
                    >
                      <img
                        src={client.iconSrc}
                        alt=""
                        className="h-3.5 w-3.5 shrink-0 object-contain"
                        aria-hidden="true"
                      />
                      <span className="whitespace-nowrap">{client.name}</span>
                    </button>
                  );
                })}
              </div>

              {/* Light-style Command / Config Box with Icon-Only Green Tick Copy */}
              <div className="relative w-full min-w-0 overflow-hidden rounded-xl border border-neutral-200 bg-neutral-50/80">
                <pre className="max-h-56 w-full min-w-0 overflow-x-auto p-3.5 pr-12 font-mono text-xs leading-relaxed text-neutral-800">
                  <code>{copyRawText}</code>
                </pre>
                <button
                  type="button"
                  onClick={handleCopyConfig}
                  aria-label={copiedConfig ? "Copied" : "Copy configuration"}
                  title={copiedConfig ? "Copied" : "Copy configuration"}
                  className="absolute top-2.5 right-2.5 flex h-7 w-7 items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-600 shadow-2xs transition-all hover:bg-neutral-50 hover:text-neutral-900"
                >
                  <HugeiconsIcon
                    icon={copiedConfig ? Tick01Icon : Copy01Icon}
                    size={15}
                    className={copiedConfig ? "text-emerald-600" : "text-neutral-600"}
                    aria-hidden="true"
                  />
                </button>
              </div>
            </div>
          )}

          {/* Dialog Footer */}
          <div className="mt-4 flex min-w-0 flex-col gap-2 border-t border-neutral-100 pt-3 text-xs sm:flex-row sm:items-center sm:justify-between">
            <span className="truncate text-neutral-500">
              Endpoint:{" "}
              <code className="font-mono font-medium text-neutral-900 select-all">
                https://waitlyze.com/mcp
              </code>
            </span>
            <Link
              href="/docs/mcp"
              onClick={() => setOpen(false)}
              className="inline-flex shrink-0 items-center gap-1 font-medium text-neutral-900 hover:underline"
            >
              <span>Documentation & permissions</span>
              <HugeiconsIcon icon={ArrowUpRight01Icon} size={13} aria-hidden="true" />
            </Link>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
