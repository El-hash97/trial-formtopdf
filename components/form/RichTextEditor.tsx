"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import ResizeImage from "tiptap-extension-resize-image";
import type { ChangeEvent } from "react";
import { ImagePlus } from "lucide-react";
import { compressImageToDataUrl } from "../../lib/image-compress";
import { buttonVariants } from "../ui/button";
import { cn } from "../../lib/utils";

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
        class: "min-h-[120px] rounded-md border border-input p-3 text-sm focus:outline-none",
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
      <label className={cn(buttonVariants({ variant: "outline", size: "sm" }), "cursor-pointer")}>
        <ImagePlus className="h-4 w-4" />
        Upload Foto
        <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} />
      </label>
      <EditorContent editor={editor} />
    </div>
  );
}
