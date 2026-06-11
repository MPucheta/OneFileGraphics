import { useState } from 'react';
import BackNavigation from '../BackNavigation';
import CanvasWithEditor from '../CanvasWithEditor';

const CACHE_KEY = 'model-loading-cache-key';

function ModelLoading() {
  const [loadKey, setLoadKey] = useState(0);

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    if (file && file.name.endsWith('.glb')) {
      const reader = new FileReader();

      reader.onload = () => {
        (window as any).uploadedMonkeyGLB = new Uint8Array(
          reader.result as ArrayBuffer
        );
        setLoadKey((prev: number) => prev + 1);
      };

      reader.readAsArrayBuffer(file);
    }
  };

  return (
    <>
      <BackNavigation />
      <div className="flex pl-[0px] px-4 py-3 border-b border-gray-800 items-center shadow-lg">
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg cursor-pointer transition-all duration-200 shadow-md transform hover:scale-[1.02] active:scale-95 h-[38px]">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-8l-4-4m0 0L8 8m4-4v12"
              />
            </svg>
            <span className="font-semibold text-[11px] uppercase tracking-wide leading-none">
              Load GLB
            </span>
            <input
              type="file"
              accept=".glb"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
        </div>
        <div className="flex items-center bg-blue-900/40 border border-blue-500/30 ml-[12px] px-3 py-2 rounded-lg text-blue-200 text-xs h-[38px]">
          <svg
            className="w-4 h-4 mr-2 text-blue-400 shrink-0"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
          <div className="flex items-center gap-1.5 leading-none whitespace-nowrap">
            <span>Get more models from</span>
            <a
              href="https://github.com/KhronosGroup/glTF-Sample-Models/tree/main/2.0"
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-blue-100 hover:text-white hover:underline transition-colors decoration-blue-400 underline-offset-2"
            >
              KhronosGroup
            </a>
            <span>(may require scaling).</span>
          </div>
        </div>
      </div>

      <CanvasWithEditor
        key={loadKey}
        cacheKey={CACHE_KEY}
        codePath="modelLoading.sample.ts"
        canvasId="modelLoading"
      />
    </>
  );
}

export default ModelLoading;
