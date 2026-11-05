import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";

export default function FAQAccordion({ items }) {
  return (
    <Accordion defaultValue={["question-0"]} className="grid w-full gap-1">
      {items.map(([question, answer], index) => (
        <AccordionItem
          value={`question-${index}`}
          key={question}
          className="border-0 not-last:border-0"
        >
          <AccordionTrigger className="min-h-16 bg-transparent py-5 text-left text-lg font-medium hover:no-underline focus-visible:ring-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-neutral-900">
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
