import {
  type ReactElement,
} from 'react';
import CanvasWithEditor from '../CanvasWithEditor';
import BackNavigation from '../BackNavigation';

const F_SAMPLE_CACHE_KEY = 'code-editor-f-orthographic-sample';

function FSample (): ReactElement {
  return (
    <div className="flex flex-col p-[16px]">
      <BackNavigation />
      <CanvasWithEditor cacheKey={F_SAMPLE_CACHE_KEY} codePath="F.sample.ts" canvasId="fSample" />
    </div>
  )
}

export default FSample;
