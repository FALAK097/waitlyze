import { Accordion, Accordions } from "fumadocs-ui/components/accordion";
import { Banner } from "fumadocs-ui/components/banner";
import { Callout } from "fumadocs-ui/components/callout";
import { Card, Cards } from "fumadocs-ui/components/card";
import { File, Files, Folder } from "fumadocs-ui/components/files";
import { ImageZoom } from "fumadocs-ui/components/image-zoom";
import { InlineTOC } from "fumadocs-ui/components/inline-toc";
import { Step, Steps } from "fumadocs-ui/components/steps";
import { Tab, Tabs } from "fumadocs-ui/components/tabs";
import { TypeTable } from "fumadocs-ui/components/type-table";
import defaultMdxComponents from "fumadocs-ui/mdx";

export function getMDXComponents(components) {
  return {
    ...defaultMdxComponents,
    Accordion,
    Accordions,
    Banner,
    Callout,
    Card,
    Cards,
    File,
    Files,
    Folder,
    ImageZoom,
    InlineTOC,
    Step,
    Steps,
    Tab,
    Tabs,
    TypeTable,
    ...components,
  };
}
