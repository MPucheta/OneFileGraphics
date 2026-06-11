import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import RouteMap from '../../constants/routes';
import assetPath from '../../utils/assetPath';
import SampleCard from '../SampleCard';
import CanvasCard from '../CanvasCard';

function Dashboard() {
  const navigate = useNavigate();

  useEffect(() => {
    //cleanup the controls that appear from canvas cards
    document.querySelectorAll('muigui-element').forEach((el) => el.remove());
    return () => {
      document.querySelectorAll('muigui-element').forEach((el) => el.remove());
    };
  }, []);

  return (
    <>
      <div className="relative px-6 py-12 mb-4 border-b border-gray-800 text-center">
        <a
          href="https://github.com/mpucheta/OneFileGraphics"
          target="_blank"
          rel="noopener noreferrer"
          className="absolute top-4 left-6 text-gray-500 hover:text-white transition-colors"
          aria-label="GitHub"
        >
          <svg height="24" width="24" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
          </svg>
        </a>
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-extrabold text-white tracking-tight sm:text-5xl mb-4">
            OneFile <span className="text-indigo-500">Graphics</span>
          </h1>
          <p className="text-lg text-gray-400 leading-relaxed max-w-2xl mx-auto mb-4">
            A collection of 3D samples where each file contains entire rendering
            pipelines.
          </p>
          <p className="text-gray-500 text-sm max-w-3xl mx-auto italic">
            Each file contains all math, buffers and shaders to showcase
            specific 3D techniques, to understand from scratch how something
            ends up in the screen.
          </p>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 p-[24px]">
        <SampleCard
          title="Matrix Transformation & Perspective"
          description="Vertices and math"
          image={assetPath('samplePreview/f.jpg')}
          video={assetPath('samplePreview/f.mp4')}
          onClick={() => navigate(RouteMap.F_MATRIX_PERSPECTIVE)}
        />
        <SampleCard
          title="Directional Light"
          description="Lightning calculations in shaders"
          image={assetPath('samplePreview/cube-directional-light.jpg')}
          video={assetPath('samplePreview/cube-directional-light.mp4')}
          onClick={() => navigate(RouteMap.CUBE_DIRECTIONAL_LIGHT)}
        />
        <SampleCard
          title="Camera Input Control"
          description="FPS projection, perspective, inputs"
          image={assetPath('samplePreview/camera-input-control.jpg')}
          video={assetPath('samplePreview/camera-input-control.mp4')}
          onClick={() => navigate(RouteMap.CAMERA_INPUT_CONTROL)}
        />
        <CanvasCard
          title="Shader Fractal"
          description="Shader math does not make sense"
          image={assetPath('samplePreview/shader-fractal.jpg')}
          onClick={() => navigate(RouteMap.SHADER_FRACTAL)}
          cacheKey="shader-fractal-cache-key"
          codePath={assetPath('shaderFractal.sample.ts')}
          canvasId="shaderFractal"
        />
        <SampleCard
          title="Model Loading"
          description="Loading bare geometry from GLB"
          image={assetPath('samplePreview/model-loading.jpg')}
          video={assetPath('samplePreview/model-loading.mp4')}
          onClick={() => navigate(RouteMap.MODEL_LOADING)}
        />
        <CanvasCard
          title="Textured Model"
          description="Load textures from inside GLB"
          onClick={() => navigate(RouteMap.TOY_CAR_LOADING)}
          image={assetPath('samplePreview/toy-car-loading.jpg')}
          cacheKey="toy-car-loading-preview-cache-key"
          codePath={assetPath('samplePreview/toyCarLoading.sample.preview.ts')}
          canvasId="toyCarLoading"
        />
      </div>
    </>
  );
}

export default Dashboard;
