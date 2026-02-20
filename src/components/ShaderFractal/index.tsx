
import BackNavigation from '../BackNavigation'
import CanvasWithEditor from '../CanvasWithEditor'

const SHADER_FRACTAL_CACHE_KEY = "shader-fractal-cache-key"

function ShaderFractal () {
  return (
    <>
      <BackNavigation />
      <CanvasWithEditor cacheKey={SHADER_FRACTAL_CACHE_KEY} codePath="shaderFractal.sample.ts" canvasId="shaderFractal" />
    </>
  )
}

export default ShaderFractal
