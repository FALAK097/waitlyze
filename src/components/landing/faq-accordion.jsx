import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";

export default function FAQAccordion({ items }) {
  return (
    <Accordion defaultValue={["question-0"]} className="grid gap-2 lg:w-3/5">
      {items.map(([question, answer], index) => (
        <AccordionItem value={`question-${index}`} key={question} className="border-0">
          <AccordionTrigger className="min-h-14 bg-transparent py-5 text-body hover:no-underline focus-visible:ring-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-neutral-900">
            {question}
          </AccordionTrigger>
          <AccordionContent>
            <p className="pr-8 text-body leading-relaxed text-product-text-secondary">{answer}</p>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
