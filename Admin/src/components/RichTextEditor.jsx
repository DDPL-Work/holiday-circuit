import React, { useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import { Mark, mergeAttributes } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import TiptapLink from "@tiptap/extension-link";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Link,
} from "lucide-react";

const FontSize = Mark.create({
  name: "fontSize",
  addOptions() {
    return { types: ["textStyle"] };
  },
  addAttributes() {
    return {
      size: {
        default: null,
        parseHTML: (element) => element.style.fontSize?.replace(/['"]+/g, ""),
        renderHTML: (attributes) => {
          if (!attributes.size) {
            return {};
          }
          return { style: `font-size: ${attributes.size}` };
        },
      },
    };
  },
  parseHTML() {
    return [{ tag: "span[style*=font-size]" }];
  },
  renderHTML({ HTMLAttributes }) {
    return [
      "span",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes),
      0,
    ];
  },
  addCommands() {
    return {
      setFontSize:
        (size) =>
        ({ chain }) => {
          return chain().setMark(this.name, { size }).run();
        },
      unsetFontSize:
        () =>
        ({ chain }) => {
          return chain().unsetMark(this.name).run();
        },
    };
  },
});

const RichTextEditor = ({ value, onChange }) => {
  const [activeTab, setActiveTab] = useState("write"); // 'write' or 'preview'

  const editor = useEditor({
    extensions: [
      StarterKit,
      FontSize,
      TiptapLink.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 underline cursor-pointer',
          rel: 'noopener noreferrer',
          target: '_blank',
        },
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-sm sm:prose-base max-w-none focus:outline-none min-h-[250px] p-4",
      },
    },
  });

  return (
    <div className="border border-slate-200 rounded-lg bg-white overflow-hidden flex flex-col shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-200 bg-[#fafafa] px-2 pt-2">
        {/* Left Side: Tabs */}
        <div className="flex items-end gap-1">
          <button
            type="button"
            className={`px-5 py-2 text-[13px] font-semibold rounded-t-lg transition-colors border-x border-t ${
              activeTab === "write"
                ? "bg-white text-slate-800 border-slate-200 -mb-[1px]"
                : "text-slate-500 hover:text-slate-700 bg-transparent border-transparent"
            }`}
            onClick={() => setActiveTab("write")}
          >
            Write
          </button>
          <button
            type="button"
            className={`px-5 py-2 text-[13px] font-semibold rounded-t-lg transition-colors border-x border-t ${
              activeTab === "preview"
                ? "bg-white text-slate-800 border-slate-200 -mb-[1px]"
                : "text-slate-500 hover:text-slate-700 bg-transparent border-transparent"
            }`}
            onClick={() => setActiveTab("preview")}
          >
            Preview
          </button>
        </div>

        {/* Right Side: Toolbar */}
        {editor && activeTab === "write" && (
          <div className="flex items-center gap-2 pb-2 pr-2">
            <div className="flex items-center gap-1 border-r border-slate-200 pr-2 mr-1">
              <select
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === "p") editor.chain().focus().setParagraph().run();
                  else
                    editor
                      .chain()
                      .focus()
                      .toggleHeading({ level: parseInt(val) })
                      .run();
                }}
                value={
                  editor.isActive("heading", { level: 1 })
                    ? "1"
                    : editor.isActive("heading", { level: 2 })
                      ? "2"
                      : editor.isActive("heading", { level: 3 })
                        ? "3"
                        : "p"
                }
                className="text-[13px] border border-transparent hover:border-slate-200 rounded px-1.5 py-1 text-slate-700 bg-transparent focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer font-medium h-8"
              >
                <option value="p">Normal</option>
                <option value="1">Heading 1</option>
                <option value="2">Heading 2</option>
                <option value="3">Heading 3</option>
              </select>

              <select
                onChange={(e) => {
                  const val = e.target.value;
                  if (val) editor.chain().focus().setFontSize(val).run();
                  else editor.chain().focus().unsetFontSize().run();
                }}
                value={editor.getAttributes("fontSize").size || ""}
                className="text-[13px] border border-transparent hover:border-slate-200 rounded px-1.5 py-1 text-slate-700 bg-transparent focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer font-medium h-8 w-[60px]"
              >
                <option value="">Size</option>
                <option value="12px">12px</option>
                <option value="14px">14px</option>
                <option value="16px">16px</option>
                <option value="18px">18px</option>
                <option value="24px">24px</option>
                <option value="32px">32px</option>
              </select>
            </div>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleBold().run()}
              className={`p-1.5 rounded transition-colors ${editor.isActive("bold") ? "text-indigo-600 bg-indigo-50" : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"}`}
              title="Bold"
            >
              <Bold size={17} strokeWidth={2.5} />
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleItalic().run()}
              className={`p-1.5 rounded transition-colors ${editor.isActive("italic") ? "text-indigo-600 bg-indigo-50" : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"}`}
              title="Italic"
            >
              <Italic size={17} strokeWidth={2.5} />
            </button>
            <button
              type="button"
              onClick={() => {
                if (editor.isActive('link')) {
                  editor.chain().focus().unsetLink().run();
                } else {
                  const url = window.prompt('Enter URL (must start with https:// or http://)');
                  if (url && (url.startsWith('https://') || url.startsWith('http://'))) {
                    editor.chain().focus().setLink({ href: url }).run();
                  } else if (url) {
                    alert('Please enter a valid URL starting with https:// or http://');
                  }
                }
              }}
              className={`p-1.5 rounded transition-colors ${editor.isActive('link') ? 'text-indigo-600 bg-indigo-50' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'}`}
              title={editor.isActive('link') ? 'Remove Link' : 'Add Link'}
            >
              <Link size={17} strokeWidth={2.5} />
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              className={`p-1.5 rounded transition-colors ${editor.isActive("orderedList") ? "text-indigo-600 bg-indigo-50" : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"}`}
              title="Ordered List"
            >
              <ListOrdered size={17} strokeWidth={2.5} />
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              className={`p-1.5 rounded transition-colors ${editor.isActive("bulletList") ? "text-indigo-600 bg-indigo-50" : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"}`}
              title="Bullet List"
            >
              <List size={17} strokeWidth={2.5} />
            </button>
          </div>
        )}
      </div>

      {activeTab === "write" ? (
        <div
          className="flex-1 overflow-y-auto cursor-text bg-white"
          onClick={() => editor?.commands.focus()}
        >
          <EditorContent editor={editor} />
        </div>
      ) : (
        <div
          className="rte-content p-4 min-h-[250px] bg-white"
          dangerouslySetInnerHTML={{
            __html:
              value ||
              '<p class="text-gray-400 italic">No content to preview.</p>',
          }}
        />
      )}
    </div>
  );
};

export default RichTextEditor;
