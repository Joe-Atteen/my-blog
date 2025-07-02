import React from "react";
import {
  MDXEditor,
  headingsPlugin,
  listsPlugin,
  quotePlugin,
  thematicBreakPlugin,
  markdownShortcutPlugin,
  linkPlugin,
  imagePlugin,
  tablePlugin,
  codeBlockPlugin,
  codeMirrorPlugin,
} from "@mdxeditor/editor";

import "@mdxeditor/editor/style.css";

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export function MarkdownEditor({ value, onChange }: MarkdownEditorProps) {
  return (
    <div className="border rounded-md">
      <MDXEditor
        className="min-h-[400px] p-4"
        markdown={value}
        onChange={onChange}
        plugins={[
          headingsPlugin(),
          listsPlugin(),
          quotePlugin(),
          thematicBreakPlugin(),
          markdownShortcutPlugin(),
          linkPlugin(),
          imagePlugin(),
          tablePlugin(),
          codeBlockPlugin(),
          codeMirrorPlugin(),
        ]}
      />
    </div>
  );
}
