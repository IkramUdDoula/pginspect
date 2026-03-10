import { useRef, useEffect } from "react";
import Editor, { type OnMount } from "@monaco-editor/react";
import { useConnection } from "@/contexts/ConnectionContext";
import { useTheme } from "@/hooks/use-theme";

export function SQLEditor() {
  const { sqlText, setSqlText, currentTables } = useConnection();
  const { theme } = useTheme();
  const editorRef = useRef<any>(null);

  const handleMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;

    // Register SQL completions from schema
    monaco.languages.registerCompletionItemProvider("sql", {
      provideCompletionItems: (model, position) => {
        const word = model.getWordUntilPosition(position);
        const range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: word.endColumn,
        };
        const suggestions = [
          ...currentTables.map((t) => ({
            label: t.name,
            kind: monaco.languages.CompletionItemKind.Class,
            insertText: t.name,
            detail: `Table (${t.rowCount} rows)`,
            range,
          })),
          ...currentTables.flatMap((t) =>
            t.columns.map((c) => ({
              label: `${t.name}.${c.name}`,
              kind: monaco.languages.CompletionItemKind.Field,
              insertText: c.name,
              detail: c.type,
              range,
            }))
          ),
        ];
        return { suggestions };
      },
    });

    // Define dark theme
    monaco.editor.defineTheme("pgInspect-dark", {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "keyword", foreground: "f59e0b", fontStyle: "bold" },
        { token: "string", foreground: "22c55e" },
        { token: "number", foreground: "3b82f6" },
        { token: "comment", foreground: "666666" },
      ],
      colors: {
        "editor.background": "#0a0a0a",
        "editor.foreground": "#e5e5e5",
        "editor.lineHighlightBackground": "#141414",
        "editor.selectionBackground": "#f59e0b33",
        "editorCursor.foreground": "#f59e0b",
      },
    });

    // Define light theme
    monaco.editor.defineTheme("pgInspect-light", {
      base: "vs",
      inherit: true,
      rules: [
        { token: "keyword", foreground: "d97706", fontStyle: "bold" },
        { token: "string", foreground: "16a34a" },
        { token: "number", foreground: "2563eb" },
        { token: "comment", foreground: "9ca3af" },
      ],
      colors: {
        "editor.background": "#ffffff",
        "editor.foreground": "#1f2937",
        "editor.lineHighlightBackground": "#f9fafb",
        "editor.selectionBackground": "#d97706aa",
        "editorCursor.foreground": "#d97706",
      },
    });

    // Set initial theme
    monaco.editor.setTheme(theme === "dark" ? "pgInspect-dark" : "pgInspect-light");
  };

  // Update theme when it changes
  useEffect(() => {
    if (editorRef.current) {
      const monaco = editorRef.current.getModel()?.getLanguageId ? window.monaco : null;
      if (monaco) {
        monaco.editor.setTheme(theme === "dark" ? "pgInspect-dark" : "pgInspect-light");
      }
    }
  }, [theme]);

  return (
    <div className="h-full flex flex-col">
      <Editor
        height="100%"
        defaultLanguage="sql"
        value={sqlText}
        onChange={(v) => setSqlText(v || "")}
        onMount={handleMount}
        options={{
          fontSize: 13,
          fontFamily: "'JetBrains Mono', monospace",
          minimap: { enabled: false },
          lineNumbers: "on",
          scrollBeyondLastLine: false,
          padding: { top: 12 },
          wordWrap: "on",
          automaticLayout: true,
          tabSize: 2,
          renderLineHighlight: "line",
          scrollbar: { verticalScrollbarSize: 6, horizontalScrollbarSize: 6 },
        }}
        theme={theme === "dark" ? "pgInspect-dark" : "pgInspect-light"}
      />
    </div>
  );
}
