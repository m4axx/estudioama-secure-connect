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
    <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="w-full max-w-md bg-[#0c0d0f] border border-slate-800 rounded-[32px] overflow-hidden shadow-2xl"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-red-950/60 to-transparent border-b border-red-900/30 px-6 py-5 flex items-center gap-4">
          <div className="w-11 h-11 bg-red-600 rounded-xl flex items-center justify-center font-black text-white italic text-lg shadow-lg shadow-red-500/30 flex-shrink-0">
            A
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-none">EstudioAMA</p>
            <p className="text-red-400 text-[10px] uppercase tracking-widest font-bold mt-1">
              Aviso de privacidad y confidencialidad
            </p>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          <p className="text-slate-300 text-sm leading-relaxed">
            Estás a punto de unirte a la sesión{' '}
            <span className="text-white font-bold font-mono bg-slate-800 px-1.5 py-0.5 rounded-lg text-xs">
              {roomName}
            </span>
            . Esta sesión es <strong className="text-white">privada y confidencial</strong>.
          </p>

          {/* Policy list */}
          <div className="space-y-2.5 bg-slate-900/60 rounded-2xl p-4 border border-slate-800/80">
            <PolicyItem
              icon={<Camera className="w-4 h-4 text-red-500" />}
              text="Queda estrictamente prohibido realizar capturas de pantalla."
            />
            <PolicyItem
              icon={<Monitor className="w-4 h-4 text-red-500" />}
              text="Queda estrictamente prohibido grabar la pantalla o el audio."
            />
            <PolicyItem
              icon={<Eye className="w-4 h-4 text-red-500" />}
              text="Queda prohibido compartir o retransmitir el contenido de la sesión."
            />
            <PolicyItem
              icon={<ShieldCheck className="w-4 h-4 text-emerald-500" />}
              text="Toda sesión incluye marcas forenses con tu identidad, código de sala y hora exacta."
            />
            <PolicyItem
              icon={<AlertTriangle className="w-4 h-4 text-amber-500" />}
              text="Cualquier intento de captura resultará en expulsión inmediata y podrá tener consecuencias legales."
            />
          </div>

          {/* Checkbox */}
          <label className="flex items-start gap-3 cursor-pointer group">
            <div
              onClick={() => setChecked(!checked)}
              className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${
                checked
                  ? 'bg-red-600 border-red-600'
                  : 'border-slate-600 group-hover:border-slate-400'
              }`}
            >
              {checked && (
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            <span className="text-slate-400 text-xs leading-relaxed">
              He leído y acepto las{' '}
              <span className="text-red-400 font-semibold">
                políticas de privacidad y confidencialidad de EstudioAMA
              </span>
              . Entiendo que el incumplimiento puede derivar en acciones legales.
            </span>
          </label>
        </div>

        {/* Actions */}
        <div className="px-6 pb-6 flex flex-col gap-2">
          <Button
            onClick={onAccept}
            disabled={!checked}
            className="w-full h-12 bg-red-600 hover:bg-red-700 disabled:opacity-30 disabled:cursor-not-allowed text-white font-bold rounded-2xl border-none transition-all"
          >
            Acepto — Entrar a la sesión
          </Button>
          <Button
            onClick={onDecline}
            variant="ghost"
            className="w-full h-10 text-slate-600 hover:text-slate-400 text-[11px] uppercase tracking-widest"
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
      <p className="text-slate-400 text-xs leading-relaxed">{text}</p>
    </div>
  );
}
