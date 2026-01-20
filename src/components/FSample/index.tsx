import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactElement,
} from 'react';
import CodeEditor from '../CodeEditor';
import { transform } from '@babel/standalone';

const F_SAMPLE_CACHE_KEY = 'code-editor-f-orthographic-sample';

async function executeCode(
  code: string,
  showConsole: boolean = false,
  canvasId: string = 'cubeSample'
) {
  try {
    const forbiddenPatterns = [
      /window\s*\./i,
      /eval\s*\(/i,
      /<script/i,
      /process\s*\./i,
      /localStorage\s*\./i,
      /sessionStorage\s*\./i,
      /globalThis\s*\./i,
      /Function\s*\(/i,
      /new\s+Function/i,
      /fetch\s*\(/i,
      /XMLHttpRequest/i,
    ];
    for (const pattern of forbiddenPatterns) {
      if (pattern.test(code)) {
        throw new Error(
          `Code contains forbidden patterns and cannot be run. ${pattern}`
        );
      }
    }

    code.replaceAll('3dCanvas', canvasId);

    const transpiled = transform(code, {
      presets: ['typescript', 'env'],
      plugins: [],
      filename: './index.tsx',
    }).code as string;

    let result: string[] = [];

    if (showConsole) {
      const fakeConsole = {
        log: (...args: any[]) => {
          result.push(args.map(String).join(' '));
        },
        error: (...args: any[]) => {
          result.push(args.map(String).join(' '));
        },
        warn: (...args: any[]) => {
          result.push(args.map(String).join(' '));
        },
      };

      const wrappedCode = `(function(console){\n${transpiled}\n})`;
      const evalResult = eval(wrappedCode)(fakeConsole);

      if (evalResult instanceof Promise) {
        await evalResult;
      }

      return result.join('\n');
    } else {
      const evalResult = eval(transpiled);

      if (evalResult instanceof Promise) {
        try {
          const resolved = await evalResult;
          if (resolved === null || resolved === undefined) {
            return '';
          }
          if (typeof resolved === 'object') {
            return JSON.stringify(resolved, null, 2);
          }
          return String(resolved);
        } catch (error: any) {
          return `Promise rejected: ${error.message}`;
        }
      }

      if (evalResult === null || evalResult === undefined) {
        return '';
      }
      if (typeof evalResult === 'object') {
        return JSON.stringify(evalResult, null, 2);
      }
      return String(evalResult);
    }
  } catch (e: any) {
    return `Error: ${e.message}`;
  }
}

function CubeSample(): ReactElement {
  const [code, setCode] = useState(
    () => localStorage.getItem(F_SAMPLE_CACHE_KEY) || ''
  );

  const [consoleOutput, setConsoleOutput] = useState<string>('');
  const [canvasKey, setCanvasKey] = useState(0);
  const initialized = useRef(false);

  const onSubmit = (code: string) => {
    initialized.current = false;
    setCode(code);
    setCanvasKey((prev) => prev + 1);
  };

  const saveCode = useCallback((code: string) => {
    localStorage.setItem(F_SAMPLE_CACHE_KEY, code);
  }, []);

  useEffect(() => {
    const existingCode = localStorage.getItem(F_SAMPLE_CACHE_KEY);

    if (existingCode) {
      setCode(existingCode);
    } else {
      const filePath = `F.sample.ts`;

      fetch(filePath)
        .then((response) => {
          if (!response.ok) {
            throw new Error('Failed to fetch code');
          }
          return response.text();
        })
        .then((fileContents) => {
          setCode(fileContents);
          saveCode(fileContents);
        })
        .catch((error) => {
          console.error('Error fetching the file:', error);
        });
    }
  }, []);

  useEffect(() => {
    if (code.trim()) {
      requestAnimationFrame(() => {
        if (!initialized.current) {
          initialized.current = true;
          executeCode(code, true, '3dCanvas')
            .then(setConsoleOutput)
            .catch((err) => setConsoleOutput(`Error: ${err.message}`));
        }
      });
    }
  }, [code, canvasKey]);

  return (
    <div className="flex flex-row p-[16px] h-[80vh]">
      <div className="flex">
        <CodeEditor code={code} onSubmit={onSubmit} saveCode={saveCode} />
      </div>
      <div className="flex flex-col px-[8px] justify-between">
        <canvas key={canvasKey} id="3dCanvas" width={600} height={550} />
        <div className="mt-[4px] bg-[#1e2225] text-[#6ed4fb] rounded-b-lg p-4 min-h-[80px] font-mono text-[0.95rem]">
          <div className="font-semibold text-[#58bcff] mb-2">
            Console Log Output:
          </div>
          <pre className="m-0 whitespace-pre-wrap max-h-[100px] overflow-y-auto">
            {consoleOutput}
          </pre>
        </div>
      </div>
    </div>
  );
}

export default CubeSample;
