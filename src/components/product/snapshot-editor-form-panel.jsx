import { Button } from "@/components/ui/button";

import { Field, ListField, SelectField, Toggle } from "./snapshot-editor-fields";

export function FormPanel({ form, update }) {
  const customFields = Array.isArray(form.customFields) ? form.customFields : [];
  const updateField = (id, patch) =>
    update({
      customFields: customFields.map((field) => (field.id === id ? { ...field, ...patch } : field)),
    });
  return (
    <div className="grid gap-4">
      <Field label="Field label" value={form.label} onChange={(label) => update({ label })} />
      <Field
        label="Placeholder"
        value={form.placeholder}
        onChange={(placeholder) => update({ placeholder })}
      />
      <Field
        label="Button"
        value={form.buttonText}
        onChange={(buttonText) => update({ buttonText })}
      />
      <SelectField
        label="Layout"
        value={form.layout}
        options={[
          { id: "inline", label: "Inline" },
          { id: "stacked", label: "Stacked" },
        ]}
        onChange={(layout) => update({ layout })}
      />
      <Toggle
        label="Require marketing consent"
        checked={form.requireConsent}
        onChange={(requireConsent) => update({ requireConsent })}
      />
      {form.requireConsent && (
        <Field
          label="Consent copy"
          value={form.consentLabel}
          multiline
          onChange={(consentLabel) => update({ consentLabel })}
        />
      )}
      <Toggle
        label="Double opt-in (verify email before counting the signup)"
        checked={(form.doubleOptIn ?? true) && (form.verification ?? true)}
        onChange={(doubleOptIn) => update({ doubleOptIn, verification: doubleOptIn })}
      />
      <ListField
        label="Allowed email domains (comma-separated, empty = all)"
        value={form.allowedEmailDomains}
        placeholder="company.com, partner.org"
        onChange={(allowedEmailDomains) => update({ allowedEmailDomains })}
      />
      <ListField
        label="Blocked email domains (comma-separated)"
        value={form.blockedEmailDomains}
        placeholder="competitor.com"
        onChange={(blockedEmailDomains) => update({ blockedEmailDomains })}
      />
      <ListField
        label="Allowed countries (ISO codes, empty = all)"
        value={form.allowedCountries}
        placeholder="US, DE, IN"
        normalize={(code) => code.toUpperCase()}
        onChange={(allowedCountries) => update({ allowedCountries })}
      />
      <ListField
        label="Blocked countries (ISO codes)"
        value={form.blockedCountries}
        placeholder="RU, CN"
        normalize={(code) => code.toUpperCase()}
        onChange={(blockedCountries) => update({ blockedCountries })}
      />
      <Toggle
        label="Collect phone number"
        checked={form.collectPhone === true || form.requirePhone === true}
        onChange={(collectPhone) =>
          update(collectPhone ? { collectPhone } : { collectPhone, requirePhone: false })
        }
      />
      {(form.collectPhone || form.requirePhone) && (
        <Toggle
          label="Require phone number"
          checked={form.requirePhone === true}
          onChange={(requirePhone) => update({ requirePhone })}
        />
      )}
      <Toggle
        label="Bot protection (Cloudflare Turnstile)"
        checked={form.requireTurnstile === true}
        onChange={(requireTurnstile) => update({ requireTurnstile })}
        hint={
          form.requireTurnstile === true
            ? "Signups fail while the server's TURNSTILE_SECRET_KEY is missing."
            : ""
        }
      />
      {form.requireTurnstile && (
        <Field
          label="Turnstile site key (must match this server's widget)"
          value={form.turnstileSiteKey ?? ""}
          onChange={(turnstileSiteKey) => update({ turnstileSiteKey })}
        />
      )}
      <div className="grid gap-3 border-t border-product-border-subtle pt-4">
        <span className="block text-micro font-bold tracking-widest text-product-text-secondary uppercase">
          Custom fields
        </span>
        {customFields.map((field) => (
          <div
            className="grid gap-2.5 rounded-lg border border-product-border-subtle p-3"
            key={field.id}
          >
            <Field
              label="Label"
              value={field.label}
              onChange={(label) => updateField(field.id, { label })}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <SelectField
                label="Type"
                value={field.type}
                options={[
                  { id: "text", label: "Short text" },
                  { id: "textarea", label: "Long text" },
                  { id: "number", label: "Number" },
                  { id: "select", label: "Dropdown" },
                  { id: "checkbox", label: "Checkbox" },
                ]}
                onChange={(type) => updateField(field.id, { type })}
              />
              <Field
                label="Placeholder"
                value={field.placeholder ?? ""}
                onChange={(placeholder) => updateField(field.id, { placeholder })}
              />
            </div>
            {field.type === "select" && (
              <ListField
                label="Options (comma-separated)"
                value={field.options}
                onChange={(options) => updateField(field.id, { options })}
              />
            )}
            <Toggle
              label="Required"
              checked={field.required === true}
              onChange={(required) => updateField(field.id, { required })}
            />
            <Button
              variant="ghost"
              size="sm"
              type="button"
              onClick={() =>
                update({
                  customFields: customFields.filter((entry) => entry.id !== field.id),
                })
              }
            >
              Remove
            </Button>
          </div>
        ))}
        {customFields.length < 10 && (
          <Button
            variant="outline"
            size="sm"
            type="button"
            onClick={() =>
              update({
                customFields: [
                  ...customFields,
                  {
                    id: `field-${crypto.randomUUID().slice(0, 8).toLowerCase()}`,
                    label: "New question",
                    type: "text",
                    required: false,
                    placeholder: "",
                    options: [],
                  },
                ],
              })
            }
          >
            Add field
          </Button>
        )}
      </div>
      <div className="grid gap-4 border-t border-product-border-subtle pt-4">
        <span className="block text-micro font-bold tracking-widest text-product-text-secondary uppercase">
          After signup
        </span>
        <Field
          label="Redirect URL (empty = stay on the thank-you screen)"
          value={form.successRedirectUrl ?? ""}
          placeholder="/thanks"
          onChange={(successRedirectUrl) => update({ successRedirectUrl })}
        />
        <ListField
          label="Redirect host allowlist (for https:// URLs)"
          value={form.successRedirectAllowlist}
          placeholder="app.example.com"
          onChange={(successRedirectAllowlist) => update({ successRedirectAllowlist })}
        />
      </div>
    </div>
  );
}
