import { Button } from "@/components/ui/button";

import { ImageUploadField } from "./image-upload-field";
import { Field, Toggle } from "./snapshot-editor-fields";
import { FormPanel } from "./snapshot-editor-form-panel";

const itemDefaults = {
  features: { title: "A clear benefit", body: "Explain how it helps." },
  steps: { title: "Next step", body: "Explain what happens here." },
  logos: "Company",
  stats: { value: "100+", label: "people waiting" },
  testimonials: { quote: "Add an honest quote.", name: "Customer name", role: "Role" },
  faq: { question: "What should people know?", answer: "Add a useful answer." },
  referralRewards: { referrals: 5, reward: "Early access" },
};

function StringItems({ section, fields, update }) {
  return (
    <div className="grid gap-5">
      {section.items.map((item, index) => (
        <div
          className="grid gap-2.5 border-t border-product-border-subtle pt-4 [&>button]:justify-self-start [&>span]:text-micro [&>span]:text-product-text-muted"
          key={index}
        >
          <span>{index + 1}</span>
          {fields.map(({ key, label, multiline, type = "text" }) => (
            <Field
              key={key}
              label={label}
              type={type}
              multiline={multiline}
              value={typeof item === "string" ? item : item[key]}
              onChange={(value) =>
                update({
                  ...section,
                  items: section.items.map((entry, itemIndex) =>
                    itemIndex === index
                      ? typeof entry === "string"
                        ? value
                        : { ...entry, [key]: type === "number" ? Number(value) : value }
                      : entry,
                  ),
                })
              }
            />
          ))}
          {section.items.length > 1 && (
            <Button
              variant="ghost"
              size="sm"
              type="button"
              onClick={() =>
                update({
                  ...section,
                  items: section.items.filter((_, itemIndex) => itemIndex !== index),
                })
              }
            >
              Remove
            </Button>
          )}
        </div>
      ))}
      {section.items.length < 8 && (
        <Button
          variant="outline"
          size="sm"
          type="button"
          onClick={() =>
            update({
              ...section,
              items: [...section.items, structuredClone(itemDefaults[section.type])],
            })
          }
        >
          Add item
        </Button>
      )}
    </div>
  );
}

function LogoItems({ section, update }) {
  const setItem = (index, next) =>
    update({
      ...section,
      items: section.items.map((entry, itemIndex) => (itemIndex === index ? next : entry)),
    });
  return (
    <div className="grid gap-5">
      {section.items.map((raw, index) => {
        const item = typeof raw === "string" ? { label: raw, imageUrl: "" } : raw;
        return (
          <div
            className="grid gap-2.5 border-t border-product-border-subtle pt-4 [&>button]:justify-self-start [&>span]:text-micro [&>span]:text-product-text-secondary"
            key={index}
          >
            <span>{index + 1}</span>
            <Field
              label="Name"
              value={item.label}
              onChange={(label) => setItem(index, { ...item, label })}
            />
            <ImageUploadField
              label="Logo image"
              hint="Optional. Shown instead of the name when set."
              value={item.imageUrl}
              onChange={(imageUrl) => setItem(index, { ...item, imageUrl })}
              previewClassName="aspect-16/9 object-contain bg-product-bg-inset"
            />
            {section.items.length > 1 && (
              <Button
                variant="ghost"
                size="sm"
                type="button"
                onClick={() =>
                  update({
                    ...section,
                    items: section.items.filter((_, itemIndex) => itemIndex !== index),
                  })
                }
              >
                Remove
              </Button>
            )}
          </div>
        );
      })}
      {section.items.length < 8 && (
        <Button
          variant="outline"
          size="sm"
          type="button"
          onClick={() => update({ ...section, items: [...section.items, "Company"] })}
        >
          Add item
        </Button>
      )}
    </div>
  );
}

function LinkItems({ section, update }) {
  return (
    <div className="grid gap-5">
      {section.links.map((link, index) => (
        <div
          className="grid gap-2.5 border-t border-product-border-subtle pt-4 [&>button]:justify-self-start"
          key={index}
        >
          <Field
            label="Label"
            value={link.label}
            onChange={(label) =>
              update({
                ...section,
                links: section.links.map((entry, itemIndex) =>
                  itemIndex === index ? { ...entry, label } : entry,
                ),
              })
            }
          />
          <Field
            label="Link"
            value={link.href}
            onChange={(href) =>
              update({
                ...section,
                links: section.links.map((entry, itemIndex) =>
                  itemIndex === index ? { ...entry, href } : entry,
                ),
              })
            }
          />
          <Button
            variant="ghost"
            size="sm"
            type="button"
            onClick={() =>
              update({
                ...section,
                links: section.links.filter((_, itemIndex) => itemIndex !== index),
              })
            }
          >
            Remove
          </Button>
        </div>
      ))}
      {section.links.length < 5 && (
        <Button
          variant="outline"
          size="sm"
          type="button"
          onClick={() =>
            update({ ...section, links: [...section.links, { label: "Link", href: "#" }] })
          }
        >
          Add link
        </Button>
      )}
    </div>
  );
}

export function BlockInspector({ section, update, form, updateForm }) {
  if (!section)
    return (
      <div className="px-5 py-8 text-caption leading-relaxed text-product-text-secondary">
        <p>Click a block in the preview or the list to edit it.</p>
      </div>
    );
  const field = (key, label, multiline = false) => (
    <Field
      label={label}
      multiline={multiline}
      value={section[key] ?? ""}
      onChange={(value) => update({ ...section, [key]: value })}
    />
  );
  return (
    <div className="grid gap-4 p-5">
      {section.type === "navigation" && (
        <>
          {field("brand", "Brand")}
          {field("buttonText", "Button")}
          <LinkItems section={section} update={update} />
        </>
      )}
      {section.type === "hero" && (
        <>
          {field("eyebrow", "Eyebrow")}
          {field("heading", "Headline")}
          {field("body", "Description", true)}
          <Toggle
            label="Show signup form"
            checked={section.showForm}
            onChange={(showForm) => update({ ...section, showForm })}
          />
        </>
      )}
      {["features", "steps"].includes(section.type) && (
        <>
          {field("heading", "Heading")}
          <StringItems
            section={section}
            fields={[
              { key: "title", label: "Title" },
              { key: "body", label: "Description", multiline: true },
            ]}
            update={update}
          />
        </>
      )}
      {section.type === "logos" && (
        <>
          {field("heading", "Heading")}
          <LogoItems section={section} update={update} />
        </>
      )}
      {section.type === "stats" && (
        <StringItems
          section={section}
          fields={[
            { key: "value", label: "Value" },
            { key: "label", label: "Label" },
          ]}
          update={update}
        />
      )}
      {section.type === "testimonials" && (
        <>
          {field("heading", "Heading")}
          <StringItems
            section={section}
            fields={[
              { key: "quote", label: "Quote", multiline: true },
              { key: "name", label: "Name" },
              { key: "role", label: "Role" },
            ]}
            update={update}
          />
        </>
      )}
      {section.type === "faq" && (
        <>
          {field("heading", "Heading")}
          <StringItems
            section={section}
            fields={[
              { key: "question", label: "Question" },
              { key: "answer", label: "Answer", multiline: true },
            ]}
            update={update}
          />
        </>
      )}
      {section.type === "media" && (
        <>
          {field("heading", "Heading")}
          {field("body", "Description", true)}
          <ImageUploadField
            label="Image"
            value={section.imageUrl}
            onChange={(imageUrl) => update({ ...section, imageUrl })}
            hint="PNG, JPEG, or WebP up to 4MB."
          />
          {field("imageAlt", "Image description")}
        </>
      )}
      {section.type === "form" && (
        <>
          {field("heading", "Heading")}
          {field("body", "Description", true)}
        </>
      )}
      {section.type === "signupCount" && (
        <>
          {field("prefix", "Before number")}
          {field("suffix", "After number")}
        </>
      )}
      {section.type === "referralRewards" && (
        <>
          {field("heading", "Heading")}
          <StringItems
            section={section}
            fields={[
              { key: "referrals", label: "Referrals", type: "number" },
              { key: "reward", label: "Reward" },
            ]}
            update={update}
          />
        </>
      )}
      {section.type === "cta" && (
        <>
          {field("heading", "Heading")}
          {field("body", "Description", true)}
          {field("buttonText", "Button")}
        </>
      )}
      {section.type === "footer" && (
        <>
          {field("note", "Footer note", true)}
          <LinkItems section={section} update={update} />
        </>
      )}
      {(section.type === "form" || (section.type === "hero" && section.showForm)) && (
        <div className="grid gap-4 border-t border-product-border-subtle pt-4">
          <div className="grid gap-1">
            <p className="text-micro font-bold tracking-widest text-product-text-secondary uppercase">
              Signup form
            </p>
            <p className="text-micro leading-relaxed text-product-text-secondary">
              The same form is used wherever it appears on your page or embed.
            </p>
          </div>
          <FormPanel form={form} update={updateForm} />
        </div>
      )}
    </div>
  );
}
