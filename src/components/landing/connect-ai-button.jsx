"use client";

import {
  ArrowDown01Icon,
  ArrowRight01Icon,
  ArrowUp01Icon,
  ArrowUpRight01Icon,
  CheckmarkBadge01Icon,
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

const CONNECTION_MESSAGE = `Help me connect this AI assistant to my Waitlyze account using the remote MCP server at https://waitlyze.com/mcp.

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
  const [anotherAgentOpen, setAnotherAgentOpen] = useState(false);
  const [showRawConfigs, setShowRawConfigs] = useState(false);
  const [selectedClient, setSelectedClient] = useState("claude");
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [copiedRaw, setCopiedRaw] = useState(false);

  const handleOpen = () => {
    trackClientEvent("mcp_connect_clicked", { source: "landing_hero" });
    setOpen(true);
  };

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(CONNECTION_MESSAGE);
      setCopiedPrompt(true);
      toast.success("Connection message copied to clipboard!");
      setTimeout(() => setCopiedPrompt(false), 2000);
    } catch {
      toast.error("Failed to copy connection message");
    }
  };

  const activeConfig = CLIENT_CONFIGS.find((c) => c.id === selectedClient) || CLIENT_CONFIGS[0];
  const copyRawText = activeConfig.command || activeConfig.snippet;

  const handleCopyRaw = async () => {
    try {
      await navigator.clipboard.writeText(copyRawText);
      setCopiedRaw(true);
      toast.success("Configuration copied to clipboard!");
      setTimeout(() => setCopiedRaw(false), 2000);
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
        <DialogContent className="max-h-[90vh] w-full max-w-[calc(100vw-2rem)] overflow-y-auto rounded-3xl border-neutral-200 bg-white p-6 text-neutral-900 shadow-2xl sm:max-w-xl sm:p-8">
          <DialogHeader className="text-left">
            <DialogTitle className="text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl">
              Your favorite AI.
              <span className="block font-serif font-normal text-neutral-800 italic">
                Meet Waitlyze.
              </span>
            </DialogTitle>
            <DialogDescription className="mt-1.5 text-xs leading-relaxed text-neutral-600 sm:text-sm">
              Manage waitlists and explore referrals from the conversation you already have open.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-5 space-y-3">
            <a
              href="https://waitlyze.com/docs/mcp#set-up-chatgpt"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() =>
                trackClientEvent("mcp_chatgpt_connect_clicked", { source: "connect_ai_modal" })
              }
              className="group flex items-center justify-between rounded-2xl border border-neutral-200/90 bg-white p-3.5 transition-all hover:border-neutral-900 hover:shadow-xs sm:p-4"
            >
              <div className="flex items-center gap-3.5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-neutral-100 bg-neutral-50 shadow-2xs">
                  <img
                    src="/assets/icons/chatgpt.svg"
                    alt=""
                    className="h-5 w-5 object-contain"
                    aria-hidden="true"
                  />
                </div>
                <div>
                  <div className="text-sm font-semibold text-neutral-900 group-hover:text-black">
                    Connect ChatGPT
                  </div>
                  <div className="text-xs text-neutral-500">ChatGPT plugin</div>
                </div>
              </div>
              <HugeiconsIcon
                icon={ArrowRight01Icon}
                size={18}
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
              className="group flex items-center justify-between rounded-2xl border border-neutral-200/90 bg-white p-3.5 transition-all hover:border-neutral-900 hover:shadow-xs sm:p-4"
            >
              <div className="flex items-center gap-3.5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-neutral-100 bg-neutral-50 shadow-2xs">
                  <img
                    src="/assets/icons/claude.svg"
                    alt=""
                    className="h-5 w-5 object-contain"
                    aria-hidden="true"
                  />
                </div>
                <div>
                  <div className="text-sm font-semibold text-neutral-900 group-hover:text-black">
                    Connect Claude
                  </div>
                  <div className="text-xs text-neutral-500">Community connector</div>
                </div>
              </div>
              <HugeiconsIcon
                icon={ArrowRight01Icon}
                size={18}
                className="text-neutral-400 transition-colors group-hover:text-neutral-900"
                aria-hidden="true"
              />
            </a>
          </div>

          <div className="mt-4 border-t border-neutral-100 pt-3">
            <button
              type="button"
              onClick={() => setAnotherAgentOpen((prev) => !prev)}
              className="flex w-full items-center justify-between py-1 text-left text-sm font-medium text-neutral-900 transition-colors hover:text-black"
            >
              <span>Using another agent?</span>
              <HugeiconsIcon
                icon={anotherAgentOpen ? ArrowUp01Icon : ArrowDown01Icon}
                size={16}
                className="text-neutral-500"
                aria-hidden="true"
              />
            </button>

            {anotherAgentOpen && (
              <div className="mt-2 space-y-3">
                <p className="text-xs leading-relaxed text-neutral-500">
                  For Claude Code, Cursor, or another agent that supports remote MCP. Copy this
                  message and paste it into your agent.
                </p>

                <div>
                  <span className="mb-1.5 block text-[11px] font-semibold tracking-wider text-neutral-600 uppercase">
                    Connection message
                  </span>
                  <div className="relative rounded-2xl border border-neutral-200 bg-neutral-50/80 p-3.5 font-sans text-xs leading-relaxed whitespace-pre-wrap text-neutral-800 select-all">
                    {CONNECTION_MESSAGE}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleCopyPrompt}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-400 px-4 py-2.5 text-xs font-semibold text-neutral-950 shadow-2xs transition-all hover:bg-amber-500 active:scale-[0.99]"
                >
                  <HugeiconsIcon
                    icon={copiedPrompt ? CheckmarkBadge01Icon : Copy01Icon}
                    size={15}
                    aria-hidden="true"
                  />
                  <span>
                    {copiedPrompt ? "Copied connection message!" : "Copy connection message"}
                  </span>
                </button>

                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => setShowRawConfigs((prev) => !prev)}
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-neutral-500 underline underline-offset-2 hover:text-neutral-800"
                  >
                    <span>
                      {showRawConfigs
                        ? "Hide manual config snippets"
                        : "Need raw CLI command or config JSON?"}
                    </span>
                  </button>

                  {showRawConfigs && (
                    <div className="mt-2.5 w-full min-w-0 rounded-xl border border-neutral-200 bg-neutral-50/50 p-2.5">
                      <div className="flex flex-wrap items-center gap-1.5 border-b border-neutral-200 pb-2">
                        {CLIENT_CONFIGS.map((client) => {
                          const isActive = selectedClient === client.id;
                          return (
                            <button
                              key={client.id}
                              type="button"
                              onClick={() => setSelectedClient(client.id)}
                              className={`inline-flex items-center gap-1.5 rounded-lg border px-2 py-1 text-[11px] font-medium transition-all ${
                                isActive
                                  ? "border-neutral-900 bg-white font-semibold text-neutral-950 shadow-2xs ring-1 ring-neutral-900/10"
                                  : "border-transparent text-neutral-600 hover:border-neutral-200 hover:bg-white hover:text-neutral-900"
                              }`}
                            >
                              <img
                                src={client.iconSrc}
                                alt=""
                                className="h-3 w-3 shrink-0 object-contain"
                                aria-hidden="true"
                              />
                              <span>{client.name}</span>
                            </button>
                          );
                        })}
                      </div>

                      <div className="relative mt-2 w-full min-w-0 overflow-hidden rounded-lg border border-neutral-800 bg-neutral-950">
                        <pre className="max-h-44 w-full min-w-0 overflow-x-auto p-3 pr-16 font-mono text-[11px] text-neutral-100">
                          <code>{copyRawText}</code>
                        </pre>
                        <button
                          type="button"
                          onClick={handleCopyRaw}
                          className="absolute top-2 right-2 inline-flex items-center gap-1 rounded-md bg-neutral-800/90 px-2 py-1 text-[10px] font-medium text-neutral-200 transition-colors hover:bg-neutral-700 hover:text-white"
                        >
                          <HugeiconsIcon
                            icon={copiedRaw ? CheckmarkBadge01Icon : Copy01Icon}
                            size={12}
                            aria-hidden="true"
                          />
                          {copiedRaw ? "Copied!" : "Copy"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-neutral-100 pt-3 text-xs text-neutral-500">
            <span>You&apos;ll sign in to Waitlyze and approve access.</span>
            <Link
              href="/docs/mcp"
              onClick={() => setOpen(false)}
              className="inline-flex items-center gap-1 font-medium text-neutral-900 underline underline-offset-2 hover:text-neutral-700"
            >
              <span>Setup & permissions</span>
              <HugeiconsIcon icon={ArrowUpRight01Icon} size={13} aria-hidden="true" />
            </Link>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
