'use client';

import { Editor } from '@tiptap/react';

import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
  Link as LinkIcon,
  Image as ImageIcon,
  Table,
  Highlighter,
  Code2,
  CheckSquare,
  Minus,
  Upload,
} from 'lucide-react';
import { useCallback, useState, useRef } from 'react';

interface EditorToolbarProps {
  editor: Editor;
}

export function EditorToolbar({ editor }: EditorToolbarProps) {
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [showImageInput, setShowImageInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

  const addLink = useCallback(() => {
    if (linkUrl) {
      editor.chain().focus().extendMarkRange('link').setLink({ href: linkUrl }).run();
      setLinkUrl('');
      setShowLinkInput(false);
    }
  }, [editor, linkUrl]);

  const addImage = useCallback(() => {
    if (imageUrl) {
      editor.chain().focus().setImage({ src: imageUrl }).run();
      setImageUrl('');
      setShowImageInput(false);
    }
  }, [editor, imageUrl]);

  const handleImageUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        alert('Invalid file type. Please select a JPEG, PNG, WebP, or GIF image');
        return;
      }

      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        alert('File too large. Please select an image smaller than 10MB');
        return;
      }

      setUploading(true);
      try {
        const formData = new FormData();
        formData.append('image', file);

        const response = await fetch(`${API_URL}/upload/article-image`, {
          method: 'POST',
          credentials: 'include',
          body: formData,
        });

        if (!response.ok) throw new Error('Failed to upload image');

        const data = await response.json();
        const imageUrl = data.imageUrl;

        // Insert image into editor
        editor.chain().focus().setImage({ src: imageUrl }).run();
        setShowImageInput(false);
      } catch (error) {
        console.error('Error uploading image:', error);
        alert('Failed to upload image. Please try again.');
      } finally {
        setUploading(false);
        if (imageInputRef.current) {
          imageInputRef.current.value = '';
        }
      }
    },
    [editor, API_URL]
  );

  const addTable = useCallback(() => {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  }, [editor]);

  return (
    <div className="border-b border-border/50 dark:border-border/30 bg-muted/20 dark:bg-card px-2 py-1.5">
      <div className="flex flex-wrap items-center gap-0.5">
        {/* Text Formatting */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive('bold')}
          title="Bold"
        >
          <Bold className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive('italic')}
          title="Italic"
        >
          <Italic className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          isActive={editor.isActive('strike')}
          title="Strikethrough"
        >
          <Strikethrough className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleCode().run()}
          isActive={editor.isActive('code')}
          title="Inline Code"
        >
          <Code className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHighlight().run()}
          isActive={editor.isActive('highlight')}
          title="Highlight"
        >
          <Highlighter className="h-4 w-4" />
        </ToolbarButton>

        <div className="w-px h-5 bg-border/60 dark:bg-border/30 mx-1 self-center" />

        {/* Headings */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          isActive={editor.isActive('heading', { level: 1 })}
          title="Heading 1"
        >
          <Heading1 className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          isActive={editor.isActive('heading', { level: 2 })}
          title="Heading 2"
        >
          <Heading2 className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          isActive={editor.isActive('heading', { level: 3 })}
          title="Heading 3"
        >
          <Heading3 className="h-4 w-4" />
        </ToolbarButton>

        <div className="w-px h-5 bg-border/60 dark:bg-border/30 mx-1 self-center" />

        {/* Lists */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editor.isActive('bulletList')}
          title="Bullet List"
        >
          <List className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editor.isActive('orderedList')}
          title="Ordered List"
        >
          <ListOrdered className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleTaskList().run()}
          isActive={editor.isActive('taskList')}
          title="Task List"
        >
          <CheckSquare className="h-4 w-4" />
        </ToolbarButton>

        <div className="w-px h-5 bg-border/60 dark:bg-border/30 mx-1 self-center" />

        {/* Block Elements */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          isActive={editor.isActive('blockquote')}
          title="Blockquote"
        >
          <Quote className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          isActive={editor.isActive('codeBlock')}
          title="Code Block"
        >
          <Code2 className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          title="Horizontal Rule"
        >
          <Minus className="h-4 w-4" />
        </ToolbarButton>

        <div className="w-px h-5 bg-border/60 dark:bg-border/30 mx-1 self-center" />

        {/* Link */}
        <div className="relative">
          <ToolbarButton
            onClick={() => {
              if (editor.isActive('link')) {
                editor.chain().focus().unsetLink().run();
              } else {
                setShowLinkInput(!showLinkInput);
              }
            }}
            isActive={editor.isActive('link')}
            title="Link"
          >
            <LinkIcon className="h-4 w-4" />
          </ToolbarButton>
          {showLinkInput && (
            <div className="absolute top-full left-0 mt-2 z-50
              rounded-2xl border border-border/60 dark:border-border/30
              bg-card shadow-xl shadow-black/10 dark:shadow-black/50 p-3 w-64">
              <input
                type="url"
                placeholder="https://example.com"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') addLink();
                  if (e.key === 'Escape') setShowLinkInput(false);
                }}
                className="w-full rounded-xl border border-border/60 dark:border-border/30
                  bg-muted/30 dark:bg-background/40 px-3 py-2
                  text-[13px] text-foreground placeholder:text-muted-foreground/40
                  focus:outline-none focus:ring-1 focus:ring-primary/40"
                autoFocus
              />
              <div className="flex gap-2 mt-2">
                <button
                  onClick={addLink}
                  className="flex-1 rounded-xl bg-primary px-3 py-1.5
                    text-[12px] font-bold text-primary-foreground
                    hover:brightness-105 transition-all"
                >
                  Add Link
                </button>
                <button
                  onClick={() => setShowLinkInput(false)}
                  className="flex-1 rounded-xl border border-border/60 dark:border-border/30
                    bg-muted/30 px-3 py-1.5 text-[12px] font-semibold
                    text-muted-foreground/70 hover:text-foreground transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Image */}
        <div className="relative">
          <ToolbarButton onClick={() => setShowImageInput(!showImageInput)} title="Image">
            <ImageIcon className="h-4 w-4" />
          </ToolbarButton>
          {showImageInput && (
            <div className="absolute top-full left-0 mt-2 z-50
              rounded-2xl border border-border/60 dark:border-border/30
              bg-card shadow-xl shadow-black/10 dark:shadow-black/50 p-3 w-72">
              <div className="space-y-2.5">
                {/* File Upload */}
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                  onChange={handleImageUpload}
                  className="hidden"
                  disabled={uploading}
                />
                <button
                  onClick={() => imageInputRef.current?.click()}
                  disabled={uploading}
                  className="w-full flex items-center justify-center gap-2 rounded-xl
                    border border-border/60 dark:border-border/30 bg-muted/30 dark:bg-background/30
                    px-3 py-2 text-[12px] font-semibold
                    text-muted-foreground/70 hover:text-foreground
                    disabled:opacity-50 transition-colors"
                >
                  {uploading ? (
                    <><div className="h-3.5 w-3.5 border-2 border-border border-t-primary rounded-full animate-spin" /> Uploading…</>
                  ) : (
                    <><Upload className="h-3.5 w-3.5" /> Upload from Device</>
                  )}
                </button>

                {/* Or separator */}
                <div className="flex items-center gap-2">
                  <div className="flex-1 border-t border-border/50 dark:border-border/25" />
                  <span className="font-mono text-[9px] tracking-widest uppercase text-muted-foreground/40">or</span>
                  <div className="flex-1 border-t border-border/50 dark:border-border/25" />
                </div>

                {/* URL Input */}
                <input
                  type="url"
                  placeholder="https://example.com/image.jpg"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') addImage();
                    if (e.key === 'Escape') setShowImageInput(false);
                  }}
                  className="w-full rounded-xl border border-border/60 dark:border-border/30
                    bg-muted/30 dark:bg-background/40 px-3 py-2
                    text-[13px] text-foreground placeholder:text-muted-foreground/40
                    focus:outline-none focus:ring-1 focus:ring-primary/40"
                  disabled={uploading}
                />

                <div className="flex gap-2">
                  <button
                    onClick={addImage}
                    disabled={uploading || !imageUrl}
                    className="flex-1 rounded-xl bg-primary px-3 py-1.5
                      text-[12px] font-bold text-primary-foreground
                      hover:brightness-105 disabled:opacity-40 transition-all"
                  >
                    Insert URL
                  </button>
                  <button
                    onClick={() => { setShowImageInput(false); setImageUrl(''); }}
                    disabled={uploading}
                    className="flex-1 rounded-xl border border-border/60 dark:border-border/30
                      bg-muted/30 px-3 py-1.5 text-[12px] font-semibold
                      text-muted-foreground/70 hover:text-foreground transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Table */}
        <ToolbarButton onClick={addTable} title="Insert Table">
          <Table className="h-4 w-4" />
        </ToolbarButton>

        <div className="w-px h-5 bg-border/60 dark:bg-border/30 mx-1 self-center" />

        {/* Undo/Redo */}
        <ToolbarButton
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          title="Undo"
        >
          <Undo className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          title="Redo"
        >
          <Redo className="h-4 w-4" />
        </ToolbarButton>
      </div>
    </div>
  );
}

interface ToolbarButtonProps {
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  title?: string;
  children: React.ReactNode;
}

function ToolbarButton({
  onClick,
  isActive = false,
  disabled = false,
  title,
  children,
}: ToolbarButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`flex items-center justify-center h-7 w-7 rounded-lg transition-colors duration-100
        ${isActive
          ? 'bg-primary/10 dark:bg-primary/15 text-primary'
          : 'text-muted-foreground/60 hover:text-foreground hover:bg-muted/50 dark:hover:bg-muted/30'
        }
        ${disabled ? 'opacity-35 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      {children}
    </button>
  );
}
