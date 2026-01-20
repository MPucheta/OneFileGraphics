import {
  useCallback,
  useEffect,
  useState,
  type ReactElement,
} from 'react';

import { Editor } from '@monaco-editor/react';

type Props = {
  code: string;
  onSubmit: (code: string) => void;
  saveCode: (code: string) => void;
};

function CodeEditor({ code, saveCode, onSubmit }: Props): ReactElement {
  const [editorCode, setEditorCode] = useState(code);

  const onCodeChange = useCallback(
    (value: string | undefined) => {
      value ??= '';

      setEditorCode(value);
      saveCode(value);
    },
    [saveCode]
  );

  const handleSubmit = useCallback(() => {
    onSubmit(editorCode);
  }, [onSubmit, editorCode]);

  useEffect(() => {
    setEditorCode(code);
  }, [code]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleSubmit();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [editorCode, handleSubmit]);

  return (
    <div
      className="
      cm-dark
      w-[55vw]
      h-[100%]
      bg-[#181818]
      rounded-lg
      overflow-hidden
      flex flex-col
    "
    >
      <div className="flex items-center justify-end p-2 border-b border-gray-700">
        <span className="mr-4 text-xs text-gray-400 font-mono select-none">
          CTRL + Alt + Enter to run
        </span>
        <button
          onClick={handleSubmit}
          title="Run"
          className="
          !bg-[#22c55e] hover:!bg-[#16a34a]
          text-white font-semibold
          flex items-center
          transition-colors
          shadow
          !p-0
        "
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            height="1em"
            viewBox="0 0 24 24"
            fill="white"
            width="16"
          >
            <path d="M8 5v14l11-7z" />
          </svg>
        </button>
      </div>
      <div className="flex-1">
        <Editor
          defaultLanguage="typescript"
          value={editorCode}
          theme="vs-dark"
          onChange={onCodeChange}
          height="100%"
        />
      </div>
    </div>
  );
}

export default CodeEditor;
