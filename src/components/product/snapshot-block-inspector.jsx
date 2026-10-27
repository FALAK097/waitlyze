import { useId, useMemo, useState } from "react";

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

function useStableItemKeys(sectionId, itemCount) {
  const prefix = useId();
  const [identity, setIdentity] = useState(() => ({
    sectionId,
    itemCount,
    keys: Array.from(
      { length: itemCount },
      (_, index) => `${prefix}-${sectionId}-${itemCount}-${index}`,
    ),
    nextKey: itemCount,
  }));
  const fallback = useMemo(
    () => ({
      sectionId,
      itemCount,
      keys: Array.from(
        { length: itemCount },
        (_, index) => `${prefix}-${sectionId}-${itemCount}-${index}`,
      ),
      nextKey: itemCount,
    }),
    [itemCount, prefix, sectionId],
  );
  const activeIdentity =
    identity.sectionId === sectionId && identity.itemCount === itemCount ? identity : fallback;

  return {
    keys: activeIdentity.keys,
    add() {
      setIdentity({
        ...activeIdentity,
        keys: [...activeIdentity.keys, `${prefix}-${sectionId}-${activeIdentity.nextKey}`],
        itemCount: itemCount + 1,
        nextKey: activeIdentity.nextKey + 1,
      });
    },
    remove(index) {
      setIdentity({
        ...activeIdentity,
        keys: activeIdentity.keys.filter((_, itemIndex) => itemIndex !== index),
        itemCount: itemCount - 1,
      });
    },
  };
}

function StringItems({ section, fields, update }) {
  const itemKeys = useStableItemKeys(section.id, section.items.length);
  return (
    <div className="grid gap-5">
      {section.items.map((item, index) => (
        <div
          className="grid gap-2.5 border-t border-product-border-subtle pt-4 [&>button]:justify-self-start [&>span]:text-micro [&>span]:text-product-text-muted"
          key={itemKeys.keys[index]}
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
              onClick={() => {
                itemKeys.remove(index);
                update({
                  ...section,
                  items: section.items.filter((_, itemIndex) => itemIndex !== index),
                });
              }}
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
          onClick={() => {
            itemKeys.add();
            update({
              ...section,
              items: [...section.items, structuredClone(itemDefaults[section.type])],
            });
          }}
        >
          Add item
        </Button>
      )}
    </div>
  );
}

function LogoItems({ section, update }) {
  const itemKeys = useStableItemKeys(section.id, section.items.length);
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
            key={itemKeys.keys[index]}
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
                onClick={() => {
                  itemKeys.remove(index);
                  update({
                    ...section,
                    items: section.items.filter((_, itemIndex) => itemIndex !== index),
                  });
                }}
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
          onClick={() => {
            itemKeys.add();
            update({ ...section, items: [...section.items, "Company"] });
          }}
        >
          Add item
        </Button>
      )}
    </div>
  );
}

function LinkItems({ section, update }) {
  const itemKeys = useStableItemKeys(section.id, section.links.length);
  return (
    <div className="grid gap-5">
      {section.links.map((link, index) => (
        <div
          className="grid gap-2.5 border-t border-product-border-subtle pt-4 [&>button]:justify-self-start"
          key={itemKeys.keys[index]}
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
            onClick={() => {
              itemKeys.remove(index);
              update({
                ...section,
                links: section.links.filter((_, itemIndex) => itemIndex !== index),
              });
            }}
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
          onClick={() => {
            itemKeys.add();
            update({ ...section, links: [...section.links, { label: "Link", href: "#" }] });
          }}
        >
          Add link
        </Button>
      )}
    </div>
  );
}

function SectionField({ section, update, field, label, multiline = false }) {
  return (
    <Field
      label={label}
      multiline={multiline}
      value={section[field] ?? ""}
      onChange={(value) => update({ ...section, [field]: value })}
    />
  );
}

const ITEM_FIELDS = {
  features: [
    { key: "title", label: "Title" },
    { key: "body", label: "Description", multiline: true },
  ],
  steps: [
    { key: "title", label: "Title" },
    { key: "body", label: "Description", multiline: true },
  ],
  stats: [
    { key: "value", label: "Value" },
    { key: "label", label: "Label" },
  ],
  testimonials: [
    { key: "quote", label: "Quote", multiline: true },
    { key: "name", label: "Name" },
    { key: "role", label: "Role" },
  ],
  faq: [
    { key: "question", label: "Question" },
    { key: "answer", label: "Answer", multiline: true },
  ],
  referralRewards: [
    { key: "referrals", label: "Referrals", type: "number" },
    { key: "reward", label: "Reward" },
  ],
};

function ItemBlockEditor({ section, update, includeHeading = true }) {
  return (
    <>
      {includeHeading ? (
        <SectionField section={section} update={update} field="heading" label="Heading" />
      ) : null}
      <StringItems section={section} fields={ITEM_FIELDS[section.type]} update={update} />
    </>
  );
}

function NavigationEditor({ section, update }) {
  return (
    <>
      <SectionField section={section} update={update} field="brand" label="Brand" />
      <SectionField section={section} update={update} field="buttonText" label="Button" />
      <LinkItems section={section} update={update} />
    </>
  );
}

function HeroEditor({ section, update }) {
  return (
    <>
      <SectionField section={section} update={update} field="eyebrow" label="Eyebrow" />
      <SectionField section={section} update={update} field="heading" label="Headline" />
      <SectionField section={section} update={update} field="body" label="Description" multiline />
      <Toggle
        label="Show signup form"
        checked={section.showForm}
        onChange={(showForm) => update({ ...section, showForm })}
      />
    </>
  );
}

function LogoEditor({ section, update }) {
  return (
    <>
      <SectionField section={section} update={update} field="heading" label="Heading" />
      <LogoItems section={section} update={update} />
    </>
  );
}

function MediaEditor({ section, update }) {
  return (
    <>
      <SectionField section={section} update={update} field="heading" label="Heading" />
      <SectionField section={section} update={update} field="body" label="Description" multiline />
      <ImageUploadField
        label="Image"
        value={section.imageUrl}
        onChange={(imageUrl) => update({ ...section, imageUrl })}
        hint="PNG, JPEG, or WebP up to 4MB."
      />
      <SectionField section={section} update={update} field="imageAlt" label="Image description" />
    </>
  );
}

function FormEditor({ section, update }) {
  return (
    <>
      <SectionField section={section} update={update} field="heading" label="Heading" />
      <SectionField section={section} update={update} field="body" label="Description" multiline />
    </>
  );
}

function SignupCountEditor({ section, update }) {
  return (
    <>
      <SectionField section={section} update={update} field="prefix" label="Before number" />
      <SectionField section={section} update={update} field="suffix" label="After number" />
    </>
  );
}

function CtaEditor({ section, update }) {
  return (
    <>
      <SectionField section={section} update={update} field="heading" label="Heading" />
      <SectionField section={section} update={update} field="body" label="Description" multiline />
      <SectionField section={section} update={update} field="buttonText" label="Button" />
    </>
  );
}

function FooterEditor({ section, update }) {
  return (
    <>
      <SectionField section={section} update={update} field="note" label="Footer note" multiline />
      <LinkItems section={section} update={update} />
    </>
  );
}

function SignupFormSettings({ form, updateForm }) {
  return (
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
  );
}

const BLOCK_EDITORS = {
  navigation: NavigationEditor,
  hero: HeroEditor,
  features: ItemBlockEditor,
  steps: ItemBlockEditor,
  logos: LogoEditor,
  stats: ItemBlockEditor,
  testimonials: ItemBlockEditor,
  faq: ItemBlockEditor,
  media: MediaEditor,
  form: FormEditor,
  signupCount: SignupCountEditor,
  referralRewards: ItemBlockEditor,
  cta: CtaEditor,
  footer: FooterEditor,
};

export function BlockInspector({ section, update, form, updateForm }) {
  if (!section)
    return (
      <div className="px-5 py-8 text-caption leading-relaxed text-product-text-secondary">
        <p>Click a block in the preview or the list to edit it.</p>
      </div>
    );

  const Editor = BLOCK_EDITORS[section.type];
  const showFormSettings = section.type === "form" || (section.type === "hero" && section.showForm);

  return (
    <div className="grid gap-4 p-5">
      {Editor ? <Editor section={section} update={update} /> : null}
      {showFormSettings ? <SignupFormSettings form={form} updateForm={updateForm} /> : null}
    </div>
  );
}
