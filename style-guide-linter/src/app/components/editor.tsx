"use client";

import { useEditor, EditorContent, BubbleMenu } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { cn } from "../util";
import Placeholder from "@tiptap/extension-placeholder";
import { Button } from "@/components/ui/button";
import "./styles.scss";

const Editor = () => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder:
          "Write something for our AI to validate against the Australian Style Guide …",
      }),
    ],
    content:
      "Once you have started a business, you need to meet specific business obligations. This includes any required registrations or business. You may need an Australian business number (ABN). This unique 11-digit number identifies your business or organisation to the government and community. An ABN has its own set of obligations.",

    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "prose prose-sm sm:prose-base lg:prose-lg xl:prose-2xl focus:outline-none min-h-24 ",
      },
    },
  });

  return (
    <>
      <div className="border rounded-md p-4">
        {/* {editor && (
        <BubbleMenu editor={editor} tippyOptions={{ duration: 100 }}>
          <div className="bg-white rounded-xl shadow-md flex gap-2">
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleBold().run()}
              className={cn(
                "rounded-xl bg-none hover:bg-gray-300 px-2 py-1 transition-colors"
              )}
            >
              ⭐<span className="ml-2">Lint with AI</span>
            </button>
          </div>
        </BubbleMenu>
      )} */}

        <EditorContent editor={editor} />
      </div>

      <div className="flex mt-4">
        <Button
          className="ml-auto"
          onClick={() => {
            console.log("Linting with AI");
            console.log(editor?.getText());
          }}
        >
          <span>⭐</span>
          <span className="ml-2">Lint with AI</span>
        </Button>
      </div>
    </>
  );
};

export default Editor;
