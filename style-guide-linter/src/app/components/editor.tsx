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
import type { Node as ProseMirrorNode } from "prosemirror-model";

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
          "Write or paste something here for our AI to validate against the Australian Style Guide…",
      }),
      Highlight,
    ],
    content: "",
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
        const result = findTextInDoc(editor.state.doc, feedback.relevantText);

        const from = result?.from;
        const to = result?.to;

        if (from !== undefined && to !== undefined) {
          editor
            .chain()
            .focus()
            .setTextSelection({ from, to })
            .setMark("highlight", { class: `highlight-${index + 1}` })
            .run();

          editor.chain().focus().setTextSelection(0).run();
        }
      });
    }
  }, [editor, lintResult]);

  /**
   * Find the position of the search text within the document.
   * @param doc - The ProseMirror document.
   * @param searchText - The text to search for within the document.
   * @returns The range (from, to) if found, otherwise undefined.
   */
  const findTextInDoc = (
    doc: ProseMirrorNode,
    searchText: string
  ): { from: number; to: number } | undefined => {
    let foundPos: { from: number; to: number } | undefined = undefined;

    doc.descendants((node, pos) => {
      if (node.isText && node.text) {
        const index = node.text.indexOf(searchText);
        if (index !== -1) {
          foundPos = {
            from: pos + index,
            to: pos + index + searchText.length,
          };
          return false; // Stop traversal once found
        }
      }
      return true; // Continue traversal
    });

    return foundPos;
  };

  const handleLint = async (): Promise<void> => {
    try {
      setIsLoading(true);

      if (!editor) {
        throw new Error("Editor is not available, please refresh the page.");
      }

      if (!editor.getText()) {
        throw new Error("Please provide some content to lint.");
      }

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

          {lintResult && lintResult.length > 0 && (
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
          )}

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
