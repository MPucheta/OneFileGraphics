import CanvasWithEditor from '../CanvasWithEditor'
import BackNavigation from '../BackNavigation';

const CACHE_KEY = 'code-editor-cube-directional-light-sample';

function CubeDirectionalLight () {
  return (
    <>
      <BackNavigation />
      <CanvasWithEditor cacheKey={CACHE_KEY} codePath="cubeDirectionalLight.sample.ts" canvasId="cubeDirectionalLight" />
    </>
  )
}

export default CubeDirectionalLight 