import { useNavigate } from "react-router-dom";
import RouteMap from "../../constants/routes";

type Props = { title: string, description: string, image: string | null, video: string | null, onClick: () => void }

function SampleCard ({ title, description, image, video, onClick }: Props) {
  return (
    <div
      onClick={onClick}
      className="group cursor-pointer overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900 transition-all hover:border-zinc-700"
    >
      <div className="relative aspect-video w-[350px] overflow-hidden bg-zinc-950">
        {image ? (
          <>
            <img
              src={image}
              alt={title}
              className="h-full w-full object-fit group-hover:hidden"
            />
            <div className="relative h-full w-full overflow-hidden">
              <video
                src={video ?? undefined}
                autoPlay
                loop
                muted
                playsInline
                className="hidden w-full object-cover group-hover:block"
              />
            </div>
          </>
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-zinc-800 text-xs text-zinc-500">
            No Preview
          </div>
        )}
      </div>
      <div className="p-3">
        <h3 className="text-sm font-medium text-zinc-100">{title}</h3>
        <p className="mt-1 text-xs text-zinc-500 line-clamp-2">{description}</p>
      </div>
    </div>
  );
}

function Dashboard () {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 p-[24px]">
      <SampleCard title="Matrix Transformation & Perspective" description="Matrix Transformation" image={"OneFileGraphics/samplePreview/f.jpg"} video={"OneFileGraphics/samplePreview/f.mp4"} onClick={() => navigate(RouteMap.F_MATRIX_PERSPECTIVE)} />
      <SampleCard title="Directional Light" description="Directional Light" image={'OneFileGraphics/samplePreview/cube-directional-light.jpg'} video={'OneFileGraphics/samplePreview/cube-directional-light.mp4'} onClick={() => navigate(RouteMap.CUBE_DIRECTIONAL_LIGHT)} />
    </div>
  )
}

export default Dashboard;


