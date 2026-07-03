"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import ResizeImage from "tiptap-extension-resize-image";
import type { ChangeEvent } from "react";
import { compressImageToDataUrl } from "../../lib/image-compress";

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

export function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [StarterKit, ResizeImage.configure({ inline: true })],
    content: value,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class: "min-h-[120px] rounded border border-gray-300 p-2 text-sm focus:outline-none",
        "data-placeholder": placeholder ?? "",
      },
    },
  });

  async function handleImageUpload(event: ChangeEvent<HTMLInputElement>) {
    const files = event.target.files;
    if (!files || !editor) return;
    for (const file of Array.from(files)) {
      const dataUrl = await compressImageToDataUrl(file);
      editor.chain().focus().setImage({ src: dataUrl }).run();
    }
    event.target.value = "";
  }

  return (
    <div className="space-y-2">
      <label className="inline-block cursor-pointer rounded border border-gray-300 px-2 py-1 text-sm">
        Upload Foto
        <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} />
      </label>
      <EditorContent editor={editor} />
    </div>
  );
}
