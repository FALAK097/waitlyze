"use client";

import { useMemo, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatProductDate } from "@/lib/product-date.mjs";

const ACTION_LABELS = {
  "workspace.created": ["Created", "success"],
  "workspace.deleted": ["Deleted", "danger"],
  "member.invited": ["Invited", "success"],
  "member.removed": ["Removed", "danger"],
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

function describeAction(action) {
  if (ACTION_LABELS[action]) return ACTION_LABELS[action];
  const [resource, verb] = action.split(".");
  const label = verb ? verb.charAt(0).toUpperCase() + verb.slice(1) : action;
  return [label, resource === "workspace" ? "info" : "muted"];
}

export function AuditLog({ events }) {
  const [query, setQuery] = useState("");
  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return events;
    return events.filter((event) => [event.action, event.resourceType, event.resourceName, event.detail, event.userName, event.userEmail].some((field) => (field || "").toLowerCase().includes(needle)));
  }, [events, query]);
  return <div className="product-audit">
    <div className="product-team-toolbar">
      <div className="product-team-search" role="search">
        <Label className="sr-only" htmlFor="audit-search">Search audit events</Label>
        <Input id="audit-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search people and resources" autoComplete="off" maxLength={120} />
      </div>
    </div>
    <div className="product-table-wrap"><Table>
      <TableHeader><TableRow><TableHead scope="col">Time</TableHead><TableHead scope="col">Action</TableHead><TableHead scope="col">Resource</TableHead><TableHead scope="col">Change</TableHead><TableHead scope="col">Changed by</TableHead></TableRow></TableHeader>
      <TableBody>
        {visible.map((event) => {
          const [label, tone] = describeAction(event.action);
          return <TableRow key={event.id}>
            <TableCell><time dateTime={event.createdAt}>{formatProductDate(event.createdAt, { includeTime: true })}</time></TableCell>
            <TableCell><span className="product-audit-action" data-tone={tone}><span aria-hidden="true">●</span>{label}</span></TableCell>
            <TableCell>{event.resourceName ? <span className="product-team-person"><strong>{event.resourceName}</strong>{event.resourceType && <span>{event.resourceType}</span>}</span> : <span className="product-team-person"><span>—</span></span>}</TableCell>
            <TableCell>{event.detail || "—"}</TableCell>
            <TableCell>{event.userName || event.userEmail ? <span className="product-team-person"><strong>{event.userName || event.userEmail}</strong>{event.userName && event.userEmail && <span>{event.userEmail}</span>}</span> : "System"}</TableCell>
          </TableRow>;
        })}
          {!visible.length && <TableRow><TableCell colSpan={5}><p className="product-table-empty">{events.length ? "No audit events match this search." : "No workspace activity recorded yet."}</p></TableCell></TableRow>}
      </TableBody>
    </Table>
    </div>
    <p className="product-team-results" aria-live="polite">{visible.length} of {events.length} {events.length === 1 ? "event" : "events"}</p>
  </div>;
}
