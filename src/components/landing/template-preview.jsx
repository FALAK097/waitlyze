export default function TemplatePreview({ template }) {
  const hero = template.snapshot.sections.find((section) => section.type === "hero");
  return (
    <span
      className="flex aspect-video flex-col gap-1.5 overflow-hidden rounded-lg p-4"
      style={{
        backgroundColor: template.snapshot.brand.pageBackground,
        color: template.snapshot.brand.textColor,
      }}
      aria-hidden="true"
    >
      <span
        className="h-1.5 w-16 rounded-full opacity-80"
        style={{ backgroundColor: template.snapshot.brand.textColor }}
      />
      <span className="line-clamp-2 font-product-display text-lg leading-snug font-semibold tracking-tight">
        {hero?.heading || template.name}
      </span>
      <span className="line-clamp-1 text-xs opacity-70">{hero?.body || ""}</span>
      <span className="mt-auto flex items-center gap-2">
        <span
          className="inline-block h-6 w-24 rounded-full"
          style={{ backgroundColor: template.snapshot.brand.accentColor }}
        />
        <span
          className="inline-block h-6 w-12 rounded-full opacity-20"
          style={{ backgroundColor: template.snapshot.brand.textColor }}
        />
      </span>
    </span>
  );
}
