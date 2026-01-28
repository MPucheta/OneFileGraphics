import { useEffect, useRef, useState } from 'react'
import useCode from '../../hooks/useCode';
import CodeEditor from '../CodeEditor';
import executeCode from '../../utils/executeCode';
import ConsoleOutput from '../ConsoleOutput';

type Props = {
  cacheKey: string;
  codePath: string;
  canvasId: string;
}

/**
 * Renders a canvas along with an editor to showcase a 3D sample
 * @param props: { cacheKey: string, codePath: string, canvasId: string }
 * @returns 
 */
function CanvasWithEditor ({ cacheKey, codePath, canvasId }: Props) {
  const { code, setCode } = useCode(cacheKey, codePath);

  const [consoleOutput, setConsoleOutput] = useState<string>('');
  const [canvasKey, setCanvasKey] = useState(0);
  const initialized = useRef(false);

  const onSubmit = (code: string) => {
    initialized.current = false;
    setCode(code);
    setCanvasKey((prev) => prev + 1);
  };

  useEffect(() => {
    return () => {
      document.querySelector('muigui-element')?.remove();
    }
  }, [])

  useEffect(() => {
    if (code.trim()) {
      requestAnimationFrame(() => {
        if (!initialized.current) {
          initialized.current = true;
          executeCode(code, true, canvasId)
            .then(setConsoleOutput)
            .catch((err) => setConsoleOutput(`Error: ${err.message}`));
        }
      });
    }
  }, [code, canvasKey]);

  return (
    <div className="flex flex-row h-[80vh]">
      <div className="flex">
        <CodeEditor code={code} onSubmit={onSubmit} saveCode={setCode} />
      </div>
      <div className="flex flex-col px-[8px] justify-between">
        <canvas key={canvasKey} id={'3dCanvas'} width={600} height={550} />
        <ConsoleOutput consoleOutput={consoleOutput} />
      </div>
    </div>
  );
}

export default CanvasWithEditor
