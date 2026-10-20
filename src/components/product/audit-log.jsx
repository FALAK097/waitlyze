"use client";

import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  Calendar01Icon,
  Download01Icon,
  FilterHorizontalIcon,
  RefreshIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatProductDate } from "@/lib/product-date.mjs";

const ACTION_LABELS = {
  "workspace.created": ["Created", "success"],
  "workspace.renamed": ["Renamed", "info"],
  "workspace.deleted": ["Deleted", "danger"],
  "member.invited": ["Invited", "success"],
  "member.removed": ["Removed", "danger"],
  "member.left": ["Left", "muted"],
  "member.role_changed": ["Role changed", "info"],
  "invitation.resent": ["Resent", "info"],
  "invitation.revoked": ["Revoked", "muted"],
  "member.joined": ["Joined", "success"],
  "waitlist.created": ["Created", "success"],
  "waitlist.deleted": ["Deleted", "danger"],
  "waitlist.published": ["Published", "success"],
  "waitlist.paused": ["Paused", "muted"],
  "api_key.created": ["Created", "success"],
  "api_key.revoked": ["Revoked", "muted"],
  "resend.connected": ["Connected", "success"],
  "resend.disconnected": ["Disconnected", "muted"],
  "broadcast.sent": ["Sent", "success"],
};

const DATE_RANGES = [
  { value: "all", label: "All time", ms: null },
  { value: "day", label: "Last 24 hours", ms: 24 * 60 * 60 * 1000 },
  { value: "week", label: "Last 7 days", ms: 7 * 24 * 60 * 60 * 1000 },
  { value: "month", label: "Last 30 days", ms: 30 * 24 * 60 * 60 * 1000 },
];

const PER_PAGE_OPTIONS = [10, 25, 50];

function describeAction(action) {
  if (ACTION_LABELS[action]) return ACTION_LABELS[action];
  const [resource, verb] = action.split(".");
  const label = verb ? verb.charAt(0).toUpperCase() + verb.slice(1) : action;
  return [label, resource === "workspace" ? "info" : "muted"];
}

function csvCell(value) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

function exportCsv(rows) {
  const header = ["Time", "Action", "Resource type", "Resource", "Change", "Changed by"].join(",");
  const body = rows
    .map((event) => {
      const [label] = describeAction(event.action);
      return [
        event.createdAt,
        label,
        event.resourceType,
        event.resourceName,
        event.detail,
        event.userEmail || event.userName || "System",
      ]
        .map(csvCell)
        .join(",");
    })
    .join("\r\n");
  const blob = new Blob([[header, body].join("\r\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "waitlyze-audit.csv";
  anchor.click();
  URL.revokeObjectURL(url);
}

export function AuditLog({ events }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [range, setRange] = useState("all");
  const [perPage, setPerPage] = useState(25);
  const [page, setPage] = useState(1);
  const availableActions = useMemo(
    () => [...new Set(events.map((event) => event.action))].sort(),
    [events],
  );
  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const since = DATE_RANGES.find((item) => item.value === range)?.ms;
    const cutoff = since ? Date.now() - since : null;
    return events.filter((event) => {
      if (actionFilter !== "all" && event.action !== actionFilter) return false;
      if (cutoff && new Date(event.createdAt).getTime() < cutoff) return false;
      if (!needle) return true;
      return [
        event.action,
        event.resourceType,
        event.resourceName,
        event.detail,
        event.userName,
        event.userEmail,
      ].some((field) => (field || "").toLowerCase().includes(needle));
    });
  }, [events, query, actionFilter, range]);
  const totalPages = Math.max(1, Math.ceil(visible.length / perPage));
  const currentPage = Math.min(page, totalPages);
  const rangeStart = visible.length ? (currentPage - 1) * perPage + 1 : 0;
  const rangeEnd = Math.min(currentPage * perPage, visible.length);
  const pageRows = visible.slice((currentPage - 1) * perPage, currentPage * perPage);
  const resultsLabel = visible.length
    ? `${rangeStart}–${rangeEnd} of ${visible.length} ${visible.length === 1 ? "event" : "events"}`
    : `0 of ${events.length} ${events.length === 1 ? "event" : "events"}`;
  return (
    <div className="product-audit">
      <div className="product-audit-heading">
        <div>
          <h2 id="settings-panel-heading">Audit</h2>
          <p>Every change in this workspace, newest first.</p>
        </div>
        <div className="product-audit-controls">
          <Select
            value={range}
            onValueChange={(value) => {
              setRange(value);
              setPage(1);
            }}
          >
            <SelectTrigger aria-label="Filter by date range">
              <HugeiconsIcon icon={Calendar01Icon} aria-hidden="true" />
              <SelectValue>{DATE_RANGES.find((item) => item.value === range)?.label}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {DATE_RANGES.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="Refresh audit log"
            onClick={() => router.refresh()}
          >
            <HugeiconsIcon icon={RefreshIcon} aria-hidden="true" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="Export audit log as CSV"
            disabled={!visible.length}
            onClick={() => exportCsv(visible)}
          >
            <HugeiconsIcon icon={Download01Icon} aria-hidden="true" />
          </Button>
        </div>
      </div>
      <div className="product-audit-toolbar">
        <div className="product-team-search" role="search">
          <Label className="sr-only" htmlFor="audit-search">
            Search audit events
          </Label>
          <Input
            id="audit-search"
            type="search"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setPage(1);
            }}
            placeholder="Search people and resources"
            autoComplete="off"
            maxLength={120}
          />
        </div>
        <Select
          value={actionFilter}
          onValueChange={(value) => {
            setActionFilter(value);
            setPage(1);
          }}
        >
          <SelectTrigger aria-label="Filter by action type">
            <HugeiconsIcon icon={FilterHorizontalIcon} aria-hidden="true" />
            <SelectValue>
              {actionFilter === "all" ? "Filter" : describeAction(actionFilter)[0]}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All actions</SelectItem>
            {availableActions.map((action) => (
              <SelectItem key={action} value={action}>
                {describeAction(action)[0]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="product-table-wrap">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead scope="col">Time</TableHead>
              <TableHead scope="col">Action</TableHead>
              <TableHead scope="col">Resource</TableHead>
              <TableHead scope="col">Change</TableHead>
              <TableHead scope="col">Changed by</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageRows.map((event) => {
              const [label, tone] = describeAction(event.action);
              const actor = event.userName || event.userEmail;
              return (
                <TableRow key={event.id}>
                  <TableCell>
                    <time dateTime={event.createdAt}>
                      {formatProductDate(event.createdAt, { includeTime: true })}
                    </time>
                  </TableCell>
                  <TableCell>
                    <span className="product-audit-action" data-tone={tone}>
                      <span aria-hidden="true">●</span>
                      {label}
                    </span>
                  </TableCell>
                  <TableCell>
                    {event.resourceName ? (
                      <span className="product-team-person">
                        <strong>{event.resourceName}</strong>
                        {event.resourceType && <span>{event.resourceType}</span>}
                      </span>
                    ) : (
                      <span className="product-team-person">
                        <span>—</span>
                      </span>
                    )}
                  </TableCell>
                  <TableCell>{event.detail || "—"}</TableCell>
                  <TableCell>
                    {actor ? (
                      <span className="product-audit-actor">
                        <Avatar size="sm">
                          <AvatarFallback>
                            {(event.userName || event.userEmail || "?").slice(0, 1).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span>{event.userEmail || event.userName}</span>
                      </span>
                    ) : (
                      <span className="product-audit-system">System</span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
            {!visible.length && (
              <TableRow>
                <TableCell colSpan={5}>
                  <p className="product-table-empty">
                    {events.length
                      ? "No audit events match these filters."
                      : "No workspace activity recorded yet."}
                  </p>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="product-audit-footer">
        <p className="product-team-results" aria-live="polite">
          {resultsLabel}
        </p>
        {visible.length > 0 && (
          <div className="product-audit-pagination">
            <Select
              value={String(perPage)}
              onValueChange={(value) => {
                setPerPage(Number(value));
                setPage(1);
              }}
            >
              <SelectTrigger size="sm" aria-label="Rows per page">
                <SelectValue>{perPage} per page</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {PER_PAGE_OPTIONS.map((option) => (
                  <SelectItem key={option} value={String(option)}>
                    {option} per page
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <nav className="product-audit-pages" aria-label="Audit log pages">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={currentPage <= 1}
                onClick={() => setPage(Math.max(1, currentPage - 1))}
              >
                <HugeiconsIcon icon={ArrowLeft01Icon} aria-hidden="true" />
                Previous
              </Button>
              <span>
                Page {currentPage} of {totalPages}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={currentPage >= totalPages}
                onClick={() => setPage(Math.min(totalPages, currentPage + 1))}
              >
                Next
                <HugeiconsIcon icon={ArrowRight01Icon} aria-hidden="true" />
              </Button>
            </nav>
          </div>
        )}
      </div>
    </div>
  );
}
