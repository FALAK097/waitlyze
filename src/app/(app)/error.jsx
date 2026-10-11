"use client";
import { StatusPage } from "@/components/product/status-page";
export default function ProductError({ retry }) { return <StatusPage code="500" title="Unable to load this page" description="Try loading the page again, or return to your waitlists." href="/wait-lists" linkLabel="Back to waitlists" retry={retry} />; }
