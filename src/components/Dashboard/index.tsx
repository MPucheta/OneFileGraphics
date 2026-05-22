import { useNavigate } from 'react-router-dom';
import RouteMap from '../../constants/routes';
import assetPath from '../../utils/assetPath';
import SampleCard from '../SampleCard';
import CanvasCard from '../CanvasCard';

function Dashboard () {
  const navigate = useNavigate();

  return (
    <>
      <div className="px-6 py-12 mb-4 border-b border-gray-800 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-extrabold text-white tracking-tight sm:text-5xl mb-4">
            OneFile <span className="text-indigo-500">Graphics</span>
          </h1>
          <p className="text-lg text-gray-400 leading-relaxed max-w-2xl mx-auto mb-4">
            A collection of 3D samples where each file contains entire rendering pipelines.
          </p>
          <p className="text-gray-500 text-sm max-w-3xl mx-auto italic">
            Each file contains all math, buffers and shaders to showcase specific 3D techniques, to understand from scratch how something ends up in the screen.
          </p>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 p-[24px]">
        <SampleCard
          title="Matrix Transformation & Perspective"
          description="Matrix Transformation"
          image={assetPath('samplePreview/f.jpg')}
          video={assetPath('samplePreview/f.mp4')}
          onClick={() => navigate(RouteMap.F_MATRIX_PERSPECTIVE)}
        />
        <SampleCard
          title="Directional Light"
          description="Directional Light"
          image={assetPath('samplePreview/cube-directional-light.jpg')}
          video={assetPath('samplePreview/cube-directional-light.mp4')}
          onClick={() => navigate(RouteMap.CUBE_DIRECTIONAL_LIGHT)}
        />
        <SampleCard
          title="Camera Input Control"
          description="Camera Input Control"
          image={assetPath('samplePreview/camera-input-control.jpg')}
          video={assetPath('samplePreview/camera-input-control.mp4')}
          onClick={() => navigate(RouteMap.CAMERA_INPUT_CONTROL)}
        />
        <CanvasCard
          title="Shader Fractal"
          description="Shader Fractal"
          image={assetPath('samplePreview/shader-fractal.jpg')}
          onClick={() => navigate(RouteMap.SHADER_FRACTAL)}
          cacheKey='shader-fractal-cache-key'
          codePath={assetPath('shaderFractal.sample.ts')}
          canvasId='shaderFractal'
        />
        <SampleCard
          title="Model Loading"
          description="Model Loading"
          image={assetPath('samplePreview/model-loading.jpg')}
          video={assetPath('samplePreview/model-loading.mp4')}
          onClick={() => navigate(RouteMap.MODEL_LOADING)}
        />
      </div>
    </>
  );
}

export default Dashboard;
