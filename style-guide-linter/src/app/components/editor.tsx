"use client";

import type React from "react";
import { useEffect, useState } from "react";
import {
  useEditor,
  EditorContent,
  Editor as TipTapEditor,
  Mark,
  mergeAttributes,
} from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { Button } from "@/components/ui/button";
import { cn } from "../util";
import "./styles.scss";

// Type definitions
export type FeedbackItem = {
  relevantText: string;
  styleGuideRuleReferenceName: string;
  suggestion: string;
  comment: string;
};

type HighlightOptions = {
  HTMLAttributes: Record<string, any>;
};

type HighlightAttributes = {
  class: string | null;
};

// Highlight Mark
const Highlight = Mark.create<HighlightOptions, HighlightAttributes>({
  name: "highlight",

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      class: {
        default: null,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "span",
        getAttrs: (element): false | HighlightAttributes => {
          const classAttr = (element as HTMLElement).getAttribute("class");
          if (classAttr?.includes("highlight")) {
            return { class: classAttr };
          }
          return false;
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "span",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes),
      0,
    ];
  },
});

const Editor: React.FC = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [lintResult, setLintResult] = useState<FeedbackItem[]>([]);
  const [lintError, setLintError] = useState<string>("");

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder:
          "Write something for our AI to validate against the Australian Style Guide …",
      }),
      Highlight,
    ],
    content:
      "Once you have started a business, you need to meet specific business obligations. This includes any required registrations or business. You may need an Australian business number (ABN). This unique 11-digit number identifies your business or organisation to the government and community. An ABN has its own set of obligations.",
    editorProps: {
      attributes: {
        class:
          "prose prose-sm sm:prose-base lg:prose-lg xl:prose-2xl focus:outline-none min-h-24",
      },
    },
  });

  useEffect(() => {
    if (editor && lintResult.length > 0) {
      editor.commands.unsetAllMarks();

      lintResult.forEach((feedback, index) => {
        const { from, to } = findTextInDoc(
          editor.state.doc,
          feedback.relevantText
        );

        if (from !== undefined && to !== undefined) {
          editor
            .chain()
            .focus()
            .setTextSelection({ from, to })
            .setMark("highlight", { class: `highlight-${index + 1}` })
            .run();
        }
      });
    }
  }, [editor, lintResult]);

  const findTextInDoc = (
    doc: any,
    searchText: string
  ): { from?: number; to?: number } => {
    let from: number | undefined;
    let to: number | undefined;
    doc.descendants((node: any, pos: number) => {
      if (node.isText && node.text.includes(searchText)) {
        from = pos;
        to = pos + searchText.length;
        return false;
      }
    });
    return { from, to };
  };

  const handleLint = async (): Promise<void> => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/lint", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: editor?.getText(),
        }),
      });
      if (response.ok) {
        const data: FeedbackItem[] = await response.json();
        setLintResult(data);
      } else {
        setLintError("An error occurred while linting the content");
      }
    } catch (error) {
      setLintError(
        error instanceof Error ? error.message : "An unknown error occurred"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {editor && (
        <>
          <div className="border rounded-md p-4">
            <EditorContent editor={editor} />
          </div>

          <div className="mt-4">
            <h3 className="text-lg font-semibold mb-2">Feedback:</h3>
            {lintResult?.map((feedback, index) => (
              <div
                key={`feedback-${index}`}
                className={`p-2 mb-2 rounded highlight-${index + 1}`}
              >
                <p>
                  <strong>{feedback.styleGuideRuleReferenceName}:</strong>{" "}
                  {feedback.comment}
                </p>
                <p>
                  <strong>Suggestion:</strong> {feedback.suggestion}
                </p>
              </div>
            ))}
          </div>

          <div className="flex mt-4">
            <Button
              className="ml-auto"
              onClick={handleLint}
              disabled={isLoading}
            >
              <span>⭐</span>
              <span className="ml-2">
                {isLoading ? "Linting..." : "Lint with AI"}
              </span>
            </Button>
          </div>

          {lintError && <p className="text-red-500 mt-2">{lintError}</p>}
        </>
      )}
    </>
  );
};

export default Editor;
