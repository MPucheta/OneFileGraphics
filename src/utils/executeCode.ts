import { transform } from "@babel/standalone";

async function executeCode (
  code: string,
  showConsole: boolean = false,
  canvasId: string
) {
  try {
    const forbiddenPatterns = [
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
          if (resolved == null) {
            return '';
          }
          if (typeof resolved === 'object') {
            return JSON.stringify(resolved);
          }
          return String(resolved);
        } catch (error: any) {
          return `Promise rejected: ${error.message}`;
        }
      }

      if (evalResult == null) {
        return '';
      }
      if (typeof evalResult === 'object') {
        return JSON.stringify(evalResult);
      }
      return String(evalResult);
    }
  } catch (e: any) {
    return `Error: ${e.message}`;
  }
}


export default executeCode;