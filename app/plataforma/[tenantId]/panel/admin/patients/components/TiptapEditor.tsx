"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Button } from "@heroui/react";
import { Bold, Italic, List, ListOrdered, Heading2, Undo, Redo } from "lucide-react";

interface TiptapEditorProps {
  content: string;
  onChange: (html: string) => void;
}

export const TiptapEditor = ({ content, onChange }: TiptapEditorProps) => {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [StarterKit],
    content,
    onUpdate: ({ editor: e }) => {
      onChange(e.getHTML());
    },
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none focus:outline-none min-h-[120px] px-3 py-2 text-gray-800",
      },
    },
  });

  if (!editor) return null;

  const btnClass = "!min-w-0 !w-8 !h-8 !p-0";

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <div className="flex items-center gap-1 border-b border-gray-200 bg-gray-50 px-2 py-1 flex-wrap">
        <Button
          isIconOnly
          size="sm"
          variant={editor.isActive("bold") ? "solid" : "light"}
          onPress={() => editor.chain().focus().toggleBold().run()}
          className={btnClass}
          aria-label="Negrita"
        >
          <Bold className="w-3.5 h-3.5" />
        </Button>
        <Button
          isIconOnly
          size="sm"
          variant={editor.isActive("italic") ? "solid" : "light"}
          onPress={() => editor.chain().focus().toggleItalic().run()}
          className={btnClass}
          aria-label="Cursiva"
        >
          <Italic className="w-3.5 h-3.5" />
        </Button>
        <Button
          isIconOnly
          size="sm"
          variant={editor.isActive("heading", { level: 2 }) ? "solid" : "light"}
          onPress={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={btnClass}
          aria-label="Título"
        >
          <Heading2 className="w-3.5 h-3.5" />
        </Button>
        <Button
          isIconOnly
          size="sm"
          variant={editor.isActive("bulletList") ? "solid" : "light"}
          onPress={() => editor.chain().focus().toggleBulletList().run()}
          className={btnClass}
          aria-label="Lista"
        >
          <List className="w-3.5 h-3.5" />
        </Button>
        <Button
          isIconOnly
          size="sm"
          variant={editor.isActive("orderedList") ? "solid" : "light"}
          onPress={() => editor.chain().focus().toggleOrderedList().run()}
          className={btnClass}
          aria-label="Lista numerada"
        >
          <ListOrdered className="w-3.5 h-3.5" />
        </Button>
        <div className="w-px h-5 bg-gray-300 mx-1" />
        <Button
          isIconOnly
          size="sm"
          variant="light"
          onPress={() => editor.chain().focus().undo().run()}
          isDisabled={!editor.can().undo()}
          className={btnClass}
          aria-label="Deshacer"
        >
          <Undo className="w-3.5 h-3.5" />
        </Button>
        <Button
          isIconOnly
          size="sm"
          variant="light"
          onPress={() => editor.chain().focus().redo().run()}
          isDisabled={!editor.can().redo()}
          className={btnClass}
          aria-label="Rehacer"
        >
          <Redo className="w-3.5 h-3.5" />
        </Button>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
};
