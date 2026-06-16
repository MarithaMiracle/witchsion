import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Bold, Italic, List, ListOrdered, Quote, Heading2, Heading3 } from "lucide-react";
import { useEffect } from "react";

export function RichTextEditor({ name, defaultValue, required }: { name: string, defaultValue?: string, required?: boolean }) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: defaultValue || '',
    editorProps: {
      attributes: {
        class: 'w-full bg-transparent p-4 min-h-[300px] focus:outline-none focus:ring-0 font-mono text-sm leading-relaxed prose prose-invert max-w-none'
      }
    }
  });

  useEffect(() => {
    if (editor && defaultValue && editor.getHTML() !== defaultValue) {
      editor.commands.setContent(defaultValue);
    }
  }, [defaultValue, editor]);

  if (!editor) {
    return null;
  }

  return (
    <div className="border border-border bg-card/10">
      <div className="flex flex-wrap items-center gap-1 border-b border-border p-2 bg-card/30">
        <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={`p-2 hover:bg-muted rounded transition-colors ${editor.isActive('heading', { level: 2 }) ? 'text-foreground bg-muted' : 'text-muted-foreground hover:text-foreground'}`} title="Heading 2"><Heading2 size={16} /></button>
        <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className={`p-2 hover:bg-muted rounded transition-colors ${editor.isActive('heading', { level: 3 }) ? 'text-foreground bg-muted' : 'text-muted-foreground hover:text-foreground'}`} title="Heading 3"><Heading3 size={16} /></button>
        <div className="w-px h-6 bg-border mx-1" />
        <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={`p-2 hover:bg-muted rounded transition-colors ${editor.isActive('bold') ? 'text-foreground bg-muted' : 'text-muted-foreground hover:text-foreground'}`} title="Bold"><Bold size={16} /></button>
        <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={`p-2 hover:bg-muted rounded transition-colors ${editor.isActive('italic') ? 'text-foreground bg-muted' : 'text-muted-foreground hover:text-foreground'}`} title="Italic"><Italic size={16} /></button>
        <div className="w-px h-6 bg-border mx-1" />
        <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className={`p-2 hover:bg-muted rounded transition-colors ${editor.isActive('bulletList') ? 'text-foreground bg-muted' : 'text-muted-foreground hover:text-foreground'}`} title="Bullet List"><List size={16} /></button>
        <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={`p-2 hover:bg-muted rounded transition-colors ${editor.isActive('orderedList') ? 'text-foreground bg-muted' : 'text-muted-foreground hover:text-foreground'}`} title="Numbered List"><ListOrdered size={16} /></button>
        <button type="button" onClick={() => editor.chain().focus().toggleBlockquote().run()} className={`p-2 hover:bg-muted rounded transition-colors ${editor.isActive('blockquote') ? 'text-foreground bg-muted' : 'text-muted-foreground hover:text-foreground'}`} title="Quote"><Quote size={16} /></button>
      </div>
      <EditorContent editor={editor} />
      <input type="hidden" name={name} value={editor.getHTML()} required={required} />
    </div>
  );
}