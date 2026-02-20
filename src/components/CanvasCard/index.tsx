import { useEffect, useRef } from 'react';
import useCode from '../../hooks/useCode';
import executeCode from '../../utils/executeCode';

type Props = {
  title: string;
  description: string;
  image: string | null;
  onClick: () => void;
  canvasId: string;
  cacheKey: string;
  codePath: string;
};

export default function CanvasCard ({
  title,
  description,
  image,
  onClick,
  canvasId,
  cacheKey,
  codePath,
}: Props) {
  const { code } = useCode(cacheKey, codePath);

  const initialized = useRef(false);

  useEffect(() => {
    if (code.trim()) {
      requestAnimationFrame(() => {
        if (!initialized.current) {
          initialized.current = true;
          executeCode(code, false, canvasId)
            .then(() => { })
            .catch((err) => console.error(err));
        }
      });
    }
  }, [code, canvasId]);

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
            <div className="relative group-hover:block">
              <canvas
                id={'3dCanvas'}
                width="350px"
                height="200px"
                className="hidden object-cover group-hover:block"
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
