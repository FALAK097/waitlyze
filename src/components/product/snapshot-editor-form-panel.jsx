import { Add01Icon, Delete02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { CountryMultiSelect } from "@/components/reui/country-multi-select";
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
      <CountryMultiSelect
        label="Allowed countries (empty = all)"
        value={form.allowedCountries}
        onChange={(allowedCountries) => update({ allowedCountries })}
      />
      <CountryMultiSelect
        label="Blocked countries"
        value={form.blockedCountries}
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
      />
      <div className="grid gap-4 border-t border-product-border-subtle pt-4">
        <div className="flex items-center justify-between gap-2">
          <span className="block text-micro font-bold tracking-widest text-product-text-secondary uppercase">
            Custom fields
          </span>
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
              <HugeiconsIcon icon={Add01Icon} size={14} aria-hidden="true" />
              Add field
            </Button>
          )}
        </div>
        {customFields.map((field, index) => (
          <div
            className="grid gap-3 [&+&]:border-t [&+&]:border-product-border-subtle [&+&]:pt-4"
            key={field.id}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-micro font-semibold text-product-text-secondary">
                Field {index + 1}
              </span>
              <div className="flex items-center gap-3">
                <Toggle
                  label="Required"
                  checked={field.required === true}
                  onChange={(required) => updateField(field.id, { required })}
                />
                <Button
                  variant="ghost"
                  size="icon-sm"
                  type="button"
                  aria-label={`Remove ${field.label || `field ${index + 1}`}`}
                  onClick={() =>
                    update({
                      customFields: customFields.filter((entry) => entry.id !== field.id),
                    })
                  }
                >
                  <HugeiconsIcon icon={Delete02Icon} size={15} aria-hidden="true" />
                </Button>
              </div>
            </div>
            <Field
              label="Label"
              value={field.label}
              onChange={(label) => updateField(field.id, { label })}
            />
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
              onChange={(type) =>
                updateField(
                  field.id,
                  type === "select" && (!Array.isArray(field.options) || field.options.length === 0)
                    ? { type, options: ["Option 1", "Option 2"] }
                    : { type },
                )
              }
            />
            {field.type !== "checkbox" && (
              <Field
                label="Placeholder"
                value={field.placeholder ?? ""}
                onChange={(placeholder) => updateField(field.id, { placeholder })}
              />
            )}
            {field.type === "select" && (
              <ListField
                label="Options (comma-separated)"
                value={field.options}
                placeholder="Option 1, Option 2"
                onChange={(options) =>
                  updateField(field.id, {
                    options: options.length > 0 ? options : ["Option 1"],
                  })
                }
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
