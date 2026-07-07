"use client";

import { useState, useRef } from "react";
import { Textarea } from "@/components/ui/textarea";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Link as LinkIcon,
  Image,
  Heading1,
  Heading2,
  Quote,
  Code,
  Undo,
  Redo
} from "lucide-react";
import { Button } from "@/components/ui/button";

export function MarkdownEditor({ value, onChange, placeholder }) {
  const [content, setContent] = useState(value || "");
  const [history, setHistory] = useState(() => [value || ""]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const textareaRef = useRef(null);
  const prevValueRef = useRef(value);

  if (value !== prevValueRef.current) {
    prevValueRef.current = value;
    setContent(value || "");
  }

  const handleChange = (e) => {
    const newValue = e.target.value;
    setContent(newValue);
    onChange(newValue);

    if (newValue !== history[historyIndex]) {
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(newValue);
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
    }
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setContent(history[newIndex]);
      onChange(history[newIndex]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setContent(history[newIndex]);
      onChange(history[newIndex]);
    }
  };

  const insertMarkdown = (before, after = '', cursorOffset = 0) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    const newContent =
      content.substring(0, start) +
      before + selectedText + after +
      content.substring(end);

    setContent(newContent);
    onChange(newContent);

    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newContent);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);

    setTimeout(() => {
      textarea.focus();

      if (selectedText.length > 0) {
        textarea.setSelectionRange(
          start + before.length,
          start + before.length + selectedText.length
        );
      } else {
        const cursorPosition = start + before.length + cursorOffset;
        textarea.setSelectionRange(cursorPosition, cursorPosition);
      }
    }, 0);
  };

  const formatHandlers = {
    bold: () => insertMarkdown('**', '**'),
    italic: () => insertMarkdown('*', '*'),
    h1: () => insertMarkdown('# '),
    h2: () => insertMarkdown('## '),
    list: () => insertMarkdown('- '),
    orderedList: () => insertMarkdown('1. '),
    quote: () => insertMarkdown('> '),
    code: () => insertMarkdown('```\n', '\n```'),
    link: () => insertMarkdown('[', '](url)'),
    image: () => insertMarkdown('![alt text](url)'),
    variable: (name) => {
      insertMarkdown(`{{${name}}}`);
    }
  };

  return (
    <div className="border rounded-md">
      <div className="flex items-center px-2 py-1 space-x-1 overflow-x-auto border-b">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={handleUndo}
          disabled={historyIndex === 0}
          title="Undo"
        >
          <Undo className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={handleRedo}
          disabled={historyIndex === history.length - 1}
          title="Redo"
        >
          <Redo className="w-4 h-4" />
        </Button>
        <div className="w-px h-4 mx-1 bg-gray-300" />
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={formatHandlers.bold}
          title="Bold"
        >
          <Bold className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={formatHandlers.italic}
          title="Italic"
        >
          <Italic className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={formatHandlers.h1}
          title="Heading 1"
        >
          <Heading1 className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={formatHandlers.h2}
          title="Heading 2"
        >
          <Heading2 className="w-4 h-4" />
        </Button>
        <div className="w-px h-4 mx-1 bg-gray-300" />
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={formatHandlers.list}
          title="Bullet List"
        >
          <List className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={formatHandlers.orderedList}
          title="Numbered List"
        >
          <ListOrdered className="w-4 h-4" />
        </Button>
        <div className="w-px h-4 mx-1 bg-gray-300" />
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={formatHandlers.link}
          title="Insert Link"
        >
          <LinkIcon className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={formatHandlers.image}
          title="Insert Image"
        >
          <Image className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={formatHandlers.quote}
          title="Blockquote"
        >
          <Quote className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={formatHandlers.code}
          title="Code Block"
        >
          <Code className="w-4 h-4" />
        </Button>
        <div className="w-px h-4 mx-1 bg-gray-300" />
        <Button
          variant="ghost"
          size="sm"
          className="text-xs h-7"
          onClick={() => formatHandlers.variable('waitlist')}
          title="Insert Waitlist Variable"
        >
          + Waitlist
        </Button>
      </div>

      <Textarea
        ref={textareaRef}
        value={content}
        onChange={handleChange}
        placeholder={placeholder}
        className="min-h-[150px] border-0 rounded-none font-mono text-sm resize-y"
      />
    </div>
  );
}
