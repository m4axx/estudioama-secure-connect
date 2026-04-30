import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, Camera, Monitor, AlertTriangle, Eye } from 'lucide-react';
import { Button } from './ui/button';

interface PrivacyModalProps {
  roomName: string;
  onAccept: () => void;
  onDecline: () => void;
}

export const PrivacyModal: React.FC<PrivacyModalProps> = ({ roomName, onAccept, onDecline }) => {
  const [checked, setChecked] = useState(false);

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
          <div className="flex items-center">
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
          </div>
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

          {/* Lista de políticas */}
          <div className="space-y-2.5 bg-[#f8f5f0] rounded-2xl p-4 border border-[#1c1c1c]/8">
            <PolicyItem
              icon={<Camera className="w-4 h-4 text-[#8d3030]" />}
              text="Queda estrictamente prohibido realizar capturas de pantalla."
            />
            <PolicyItem
              icon={<Monitor className="w-4 h-4 text-[#8d3030]" />}
              text="Queda estrictamente prohibido grabar la pantalla o el audio."
            />
            <PolicyItem
              icon={<Eye className="w-4 h-4 text-[#8d3030]" />}
              text="Queda prohibido compartir o retransmitir el contenido de la sesión."
            />
            <PolicyItem
              icon={<ShieldCheck className="w-4 h-4 text-emerald-600" />}
              text="Toda sesión incluye marcas forenses con tu identidad, código de sala y hora exacta."
            />
            <PolicyItem
              icon={<AlertTriangle className="w-4 h-4 text-amber-600" />}
              text="Cualquier intento de captura resultará en expulsión inmediata y podrá tener consecuencias legales."
            />
          </div>

          {/* Checkbox */}
          <label className="flex items-start gap-3 cursor-pointer group">
            <div
              onClick={() => setChecked(!checked)}
              className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${
                checked
                  ? 'bg-[#8d3030] border-[#8d3030]'
                  : 'border-[#1c1c1c]/25 group-hover:border-[#1c1c1c]/50'
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
        </div>

        {/* Acciones */}
        <div className="px-6 pb-6 flex flex-col gap-2">
          <Button
            onClick={onAccept}
            disabled={!checked}
            className="w-full h-12 bg-[#8d3030] hover:bg-[#7a2828] disabled:opacity-30 disabled:cursor-not-allowed text-white font-bold rounded-2xl border-none transition-all shadow-md shadow-[#8d3030]/15"
          >
            Acepto — Entrar a la sesión
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

function PolicyItem({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex-shrink-0 mt-0.5">{icon}</div>
      <p className="text-[#1c1c1c]/60 text-xs leading-relaxed">{text}</p>
    </div>
  );
}
