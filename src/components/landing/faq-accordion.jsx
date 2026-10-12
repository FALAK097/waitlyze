"use client";

import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";

export default function FAQAccordion({ items }) {
  return <Accordion defaultValue={["question-0"]} className="wl-faq-list">
    {items.map(([question, answer], index) => <AccordionItem value={`question-${index}`} key={question} className="wl-faq-item border-0">
      <AccordionTrigger className="wl-faq-trigger">{question}</AccordionTrigger>
      <AccordionContent className="wl-faq-answer"><p>{answer}</p></AccordionContent>
    </AccordionItem>)}
  </Accordion>;
}
