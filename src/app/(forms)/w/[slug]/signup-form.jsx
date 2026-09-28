"use client";

import { useState } from "react";

export function SignupForm({ waitListId, label, buttonText, thankYou }) {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const email = new FormData(form).get("email");
    setBusy(true); setMessage("");
    try {
      let hypeSession = localStorage.getItem("hypeSession");
      if (!hypeSession) { hypeSession = crypto.randomUUID(); localStorage.setItem("hypeSession", hypeSession); }
      const response = await fetch("/api/v1/sign_up", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, waitListId, hypeSession }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Couldn't join the waitlist. Try again.");
      setMessage(`${thankYou.heading} ${thankYou.body}`); form.reset();
    } catch (error) { setMessage(error.message || "Couldn't join the waitlist. Try again."); }
    finally { setBusy(false); }
  }
  return <form className="published-signup" onSubmit={submit}>
    <label htmlFor="waitlist-email">{label}</label>
    <div className="published-signup-row"><input id="waitlist-email" name="email" type="email" autoComplete="email" required maxLength={320} /><button type="submit" disabled={busy}>{busy ? "Joining…" : buttonText}</button></div>
    <p className="published-signup-status" aria-live="polite" role="status">{message}</p>
  </form>;
}
