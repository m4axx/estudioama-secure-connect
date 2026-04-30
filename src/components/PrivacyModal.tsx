import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, Camera, Monitor, AlertTriangle, Eye, RotateCcw } from 'lucide-react';
import { Button } from './ui/button';

interface PrivacyModalProps {
  roomName: string;
  onAccept: () => void;
  onDecline: () => void;
}

export const PrivacyModal: React.FC<PrivacyModalProps> = ({ roomName, onAccept, onDecline }) => {
  const [checked, setChecked] = useState(false);
  const [hasSigned, setHasSigned] = useState(false);

  const canProceed = checked && hasSigned;

  const buttonLabel = !checked && !hasSigned
    ? 'Acepta las políticas y firma para continuar'
    : !checked
    ? 'Marca la casilla para continuar'
    : !hasSigned
    ? 'Firma para continuar'
    : 'Acepto — Entrar a la sesión';

  return (
    <div className="fixed inset-0 z-[100] bg-[#1c1c1c]/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="w-full max-w-md bg-[#fffefe] border border-[#1c1c1c]/10 rounded-[32px] overflow-hidden shadow-[0_24px_80px_rgba(28,28,28,0.18)]"
      >
        {/* Cabecera */}
        <div className="bg-[#f8f5f0] border-b border-[#1c1c1c]/8 px-6 py-5 flex items-center gap-4">
          <img
            src="/logo/AMA.png"
            alt="EstudioAMA"
            className="h-8"
            style={{ mixBlendMode: 'multiply' }}
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              const fb = e.currentTarget.nextElementSibling as HTMLElement | null;
              if (fb) fb.hidden = false;
            }}
          />
          <span hidden className="font-black tracking-tighter text-xl leading-none">
            <span className="text-[#1c1c1c]">ESTUDIO</span>
            <span className="text-[#8d3030]">AMA</span>
          </span>
          <div className="h-6 w-px bg-[#1c1c1c]/12" />
          <p className="text-[#8d3030] text-[10px] uppercase tracking-widest font-bold">
            Aviso de privacidad y confidencialidad
          </p>
        </div>

        {/* Cuerpo */}
        <div className="px-6 py-5 space-y-4">
          <p className="text-[#1c1c1c]/70 text-sm leading-relaxed">
            Estás a punto de unirte a la sesión{' '}
            <span className="text-[#1c1c1c] font-bold font-mono bg-[#f8f5f0] px-2 py-0.5 rounded-lg text-xs border border-[#1c1c1c]/10">
              {roomName}
            </span>
            . Esta sesión es <strong className="text-[#1c1c1c]">privada y confidencial</strong>.
          </p>

          {/* Políticas */}
          <div className="space-y-2.5 bg-[#f8f5f0] rounded-2xl p-4 border border-[#1c1c1c]/8">
            <PolicyItem icon={<Camera className="w-4 h-4 text-[#8d3030]" />}
              text="Queda estrictamente prohibido realizar capturas de pantalla." />
            <PolicyItem icon={<Monitor className="w-4 h-4 text-[#8d3030]" />}
              text="Queda estrictamente prohibido grabar la pantalla o el audio." />
            <PolicyItem icon={<Eye className="w-4 h-4 text-[#8d3030]" />}
              text="Queda prohibido compartir o retransmitir el contenido de la sesión." />
            <PolicyItem icon={<ShieldCheck className="w-4 h-4 text-emerald-600" />}
              text="Toda sesión incluye marcas forenses con tu identidad, código de sala y hora exacta." />
            <PolicyItem icon={<AlertTriangle className="w-4 h-4 text-amber-600" />}
              text="Cualquier intento de captura resultará en expulsión inmediata y podrá tener consecuencias legales." />
          </div>

          {/* Checkbox */}
          <label className="flex items-start gap-3 cursor-pointer group">
            <div
              onClick={() => setChecked((c) => !c)}
              className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${
                checked ? 'bg-[#8d3030] border-[#8d3030]' : 'border-[#1c1c1c]/25 group-hover:border-[#1c1c1c]/50'
              }`}
            >
              {checked && (
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            <span className="text-[#1c1c1c]/55 text-xs leading-relaxed">
              He leído y acepto las{' '}
              <span className="text-[#8d3030] font-semibold">
                políticas de privacidad y confidencialidad de EstudioAMA
              </span>
              . Entiendo que el incumplimiento puede derivar en acciones legales.
            </span>
          </label>

          {/* Pad de firma */}
          <SignaturePad
            onSign={() => setHasSigned(true)}
            onClear={() => setHasSigned(false)}
          />
        </div>

        {/* Acciones */}
        <div className="px-6 pb-6 flex flex-col gap-2">
          <Button
            onClick={onAccept}
            disabled={!canProceed}
            className="w-full h-12 bg-[#8d3030] hover:bg-[#7a2828] disabled:opacity-30 disabled:cursor-not-allowed text-white font-bold rounded-2xl border-none transition-all shadow-md shadow-[#8d3030]/15 text-sm"
          >
            {buttonLabel}
          </Button>
          <Button
            onClick={onDecline}
            variant="ghost"
            className="w-full h-10 text-[#1c1c1c]/35 hover:text-[#1c1c1c]/60 text-[11px] uppercase tracking-widest"
          >
            No acepto — cancelar
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

// ── Pad de firma ──────────────────────────────────────────────────────────────
function SignaturePad({ onSign, onClear }: { onSign: () => void; onClear: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);
  const hasMark = useRef(false);
  const last = useRef({ x: 0, y: 0 });
  const [empty, setEmpty] = useState(true);

  const getXY = (e: MouseEvent | TouchEvent, rect: DOMRect) => {
    if ('touches' in e) {
      return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
    }
    return { x: (e as MouseEvent).clientX - rect.left, y: (e as MouseEvent).clientY - rect.top };
  };

  const clear = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height);
    hasMark.current = false;
    setEmpty(true);
    onClear();
  }, [onClear]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    const down = (e: MouseEvent | TouchEvent) => {
      e.preventDefault();
      isDrawing.current = true;
      last.current = getXY(e, canvas.getBoundingClientRect());
    };

    const move = (e: MouseEvent | TouchEvent) => {
      e.preventDefault();
      if (!isDrawing.current) return;
      const pos = getXY(e, canvas.getBoundingClientRect());
      ctx.beginPath();
      ctx.moveTo(last.current.x, last.current.y);
      ctx.lineTo(pos.x, pos.y);
      ctx.strokeStyle = '#1c1c1c';
      ctx.lineWidth = 1.8;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();
      last.current = pos;
      if (!hasMark.current) {
        hasMark.current = true;
        setEmpty(false);
        onSign();
      }
    };

    const up = () => { isDrawing.current = false; };

    canvas.addEventListener('mousedown', down);
    canvas.addEventListener('mousemove', move);
    canvas.addEventListener('mouseup', up);
    canvas.addEventListener('mouseleave', up);
    canvas.addEventListener('touchstart', down, { passive: false });
    canvas.addEventListener('touchmove', move, { passive: false });
    canvas.addEventListener('touchend', up);

    return () => {
      canvas.removeEventListener('mousedown', down);
      canvas.removeEventListener('mousemove', move);
      canvas.removeEventListener('mouseup', up);
      canvas.removeEventListener('mouseleave', up);
      canvas.removeEventListener('touchstart', down);
      canvas.removeEventListener('touchmove', move);
      canvas.removeEventListener('touchend', up);
    };
  }, [onSign]);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold text-[#1c1c1c]/40 uppercase tracking-wider">
          Firma aquí para confirmar
        </p>
        {!empty && (
          <button
            type="button"
            onClick={clear}
            className="flex items-center gap-1 text-[10px] text-[#8d3030]/60 hover:text-[#8d3030] font-bold uppercase tracking-wider transition-colors"
          >
            <RotateCcw className="w-3 h-3" /> Borrar
          </button>
        )}
      </div>
      <div className="relative rounded-2xl border-2 border-dashed border-[#1c1c1c]/15 bg-[#f8f5f0] overflow-hidden">
        <canvas
          ref={canvasRef}
          width={400}
          height={96}
          className="w-full h-24 cursor-crosshair touch-none block"
        />
        {empty && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
            <p className="text-[#1c1c1c]/20 text-sm italic">Firma aquí...</p>
          </div>
        )}
      </div>
    </div>
  );
}

function PolicyItem({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex-shrink-0 mt-0.5">{icon}</div>
      <p className="text-[#1c1c1c]/60 text-xs leading-relaxed">{text}</p>
    </div>
  );
}
