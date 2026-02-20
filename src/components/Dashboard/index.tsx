import { useNavigate } from 'react-router-dom';
import RouteMap from '../../constants/routes';
import assetPath from '../../utils/assetPath';
import SampleCard from '../SampleCard';
import CanvasCard from '../CanvasCard';

function Dashboard () {
  const navigate = useNavigate();

  return (
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
      {/* <SampleCard title="Shader Fractal" description="Shader Fractal" image={assetPath('samplePreview/shader-fractal.jpg')} video={assetPath('samplePreview/shader-fractal.mp4')} onClick={() => navigate(RouteMap.SHADER_FRACTAL)} /> */}
      <CanvasCard
        title="Shader Fractal"
        description="Shader Fractal"
        image={assetPath('samplePreview/shader-fractal.jpg')}
        onClick={() => navigate(RouteMap.SHADER_FRACTAL)}
        cacheKey='shader-fractal-cache-key'
        codePath={assetPath('shaderFractal.sample.ts')}
        canvasId='shaderFractal'
      />
    </div>
  );
}

export default Dashboard;
