import { listTemplates } from "./catalog.mjs";

const templates = listTemplates();

const copyFields = (section, sectionIndex) => {
  if (section.type === "hero") return [
    { label: "Introduction headline", value: section.heading },
    { label: "Introduction copy", value: section.body },
  ];
  if (section.type === "features") return section.items.flatMap((item, index) => [
    { label: `Highlight ${index + 1} title`, value: item.title },
    { label: `Highlight ${index + 1} description`, value: item.body },
  ]);
  if (section.type === "faq") return section.items.flatMap((item, index) => [
    { label: `Question ${index + 1}`, value: item.question },
    { label: `Answer ${index + 1}`, value: item.answer },
  ]);
  if (section.type === "footer") return [{ label: `Page note ${sectionIndex + 1}`, value: section.note }];
  return [];
};

export function findUnchangedStarterCopy(snapshot) {
  const starter = templates.find(({ id }) => id === snapshot?.templateId)?.snapshot;
  if (!starter) return [];

  const occurrenceByType = new Map();
  const starterSections = new Map();
  for (const section of starter.sections) {
    const sections = starterSections.get(section.type) || [];
    sections.push(section);
    starterSections.set(section.type, sections);
  }

  return snapshot.sections.flatMap((section, sectionIndex) => {
    const occurrence = occurrenceByType.get(section.type) || 0;
    occurrenceByType.set(section.type, occurrence + 1);
    const starterSection = starterSections.get(section.type)?.[occurrence];
    if (!starterSection) return [];

    const starterFields = copyFields(starterSection, occurrence);
    return copyFields(section, sectionIndex)
      .filter((field, index) => field.value === starterFields[index]?.value)
      .map(({ label, value }) => ({ label, value, key: `${section.type}-${occurrence}-${label}` }));
  });
}
