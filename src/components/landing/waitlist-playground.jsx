"use client";

export default function WaitlistPlayground() {
  return <div className="wl-playground" id="preview">
    <div className="wl-preview-stage"><div className="wl-preview-page">
      <div className="wl-preview-brand"><span className="wl-preview-brand-mark" aria-hidden="true">w.</span><span>weekend</span></div>
      <h2>Go outside.</h2><p className="wl-preview-intro">A fresh way to find your next weekend escape.</p>
      <div className="wl-preview-form-space">
        <form noValidate onSubmit={(event) => event.preventDefault()} aria-label="Example waitlist form">
          <label className="sr-only" htmlFor="preview-example-email">Example email address</label>
          <input id="preview-example-email" aria-label="Example email address" type="email" placeholder="you@example.com" autoComplete="off" />
          <button type="submit">Join the waitlist</button>
        </form>
        <p className="wl-preview-notice">Demo form · No email is collected or sent.</p>
      </div>
    </div></div>
  </div>;
}
