import { useEffect, useRef, useState } from "react";
import { Eraser } from "lucide-react";

/** Einfaches Unterschriftenfeld per Maus/Touch, liefert das Ergebnis als Base64-PNG. */
export function SignaturePad({
  value,
  onChange,
  label,
}: {
  value?: string;
  onChange: (dataUrl: string | undefined) => void;
  label: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const zeichnetRef = useRef(false);
  const [leer, setLeer] = useState(!value);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !value) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const img = new Image();
    img.onload = () => ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    img.src = value;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const position = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const start = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    zeichnetRef.current = true;
    const { x, y } = position(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const zeichnen = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!zeichnetRef.current) return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const { x, y } = position(e);
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.strokeStyle = "currentColor";
    ctx.lineTo(x, y);
    ctx.stroke();
    setLeer(false);
  };

  const beenden = () => {
    if (!zeichnetRef.current) return;
    zeichnetRef.current = false;
    const canvas = canvasRef.current;
    if (canvas) onChange(canvas.toDataURL("image/png"));
  };

  const loeschen = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    setLeer(true);
    onChange(undefined);
  };

  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <label className="text-xs text-muted-foreground">{label}</label>
        {!leer && (
          <button
            type="button"
            onClick={loeschen}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <Eraser className="h-3 w-3" /> Löschen
          </button>
        )}
      </div>
      <canvas
        ref={canvasRef}
        width={320}
        height={120}
        className="w-full touch-none rounded-lg border bg-background text-foreground"
        onPointerDown={start}
        onPointerMove={zeichnen}
        onPointerUp={beenden}
        onPointerLeave={beenden}
      />
    </div>
  );
}
