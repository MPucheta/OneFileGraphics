
import BackNavigation from '../BackNavigation'
import CanvasWithEditor from '../CanvasWithEditor'

const CACHE_KEY = "model-loading-cache-key"

function ModelLoading () {
  return (
    <>
      <BackNavigation />
      <CanvasWithEditor cacheKey={CACHE_KEY} codePath="modelLoading.sample.ts" canvasId="modelLoading" />
    </>
  )
}

export default ModelLoading
