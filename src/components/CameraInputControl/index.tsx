
import BackNavigation from '../BackNavigation'
import CanvasWithEditor from '../CanvasWithEditor'

const CAMERA_INPUT_CONTROL_CACHE_KEY = "camera-input-control-cache-key"

function CameraControlInput () {
  return (
    <div className="flex flex-col p-[16px]" >
      <BackNavigation />
      <div className="my-4">
        <p className="text-sm text-gray-200">
          <strong>Click</strong> on the canvas/cube render to use the First Person controls.
          <br />
          Use <strong>WASD</strong> to move, <strong>Shift</strong> and <strong>Space</strong> for vertical movement.
          <br />
          Press <strong>Esc</strong> to exit the First Person controls.
        </p>
      </div>

      <CanvasWithEditor cacheKey={CAMERA_INPUT_CONTROL_CACHE_KEY} codePath="cameraInputControl.sample.ts" canvasId="cameraInputControl" />
    </div>
  )
}

export default CameraControlInput
