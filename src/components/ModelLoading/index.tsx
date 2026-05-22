import { useState } from 'react';
import BackNavigation from '../BackNavigation'
import CanvasWithEditor from '../CanvasWithEditor'

const CACHE_KEY = "model-loading-cache-key"

function ModelLoading () {
  const [loadKey, setLoadKey] = useState(0);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (file && file.name.endsWith('.glb')) {
      const reader = new FileReader();

      reader.onload = () => {
        (window as any).uploadedGLB = new Uint8Array(reader.result as ArrayBuffer);
        setLoadKey((prev: number) => prev + 1);
      };

      reader.readAsArrayBuffer(file);
    }
  };

  return (
    <>
      <BackNavigation />
      <div className="flex px-4 py-2 border-b border-gray-800 items-center justify-between">
        <label className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md cursor-pointer transition-colors duration-200">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          <span className="font-medium text-sm">Load .glb</span>
          <input type="file" accept=".glb" onChange={handleFileChange} className="hidden" />
        </label>
      </div>
      <CanvasWithEditor
        key={loadKey}
        cacheKey={CACHE_KEY}
        codePath="modelLoading.sample.ts"
        canvasId="modelLoading"
      />
    </>
  )
}

export default ModelLoading
