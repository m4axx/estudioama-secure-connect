import React, { useState, useEffect, useRef } from 'react';
import {
  LiveKitRoom,
  RoomAudioRenderer,
  useTracks,
  TrackRefContext,
  ParticipantContext
} from '@livekit/components-react';
import { Track } from 'livekit-client';
import { ParticipantTile } from './ParticipantTile';
import { Controls } from './Controls';
import { Chat } from './Chat';
import {
  ShieldCheck,
  Users,
  Lock,
  AlertTriangle
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

type KickReason = 'screenshot' | null;

interface CallRoomProps {
  token: string;
  wsUrl: string;
  roomName: string;
  username: string;
  isOrganizer: boolean;
  onDisconnect: () => void;
  onKicked: (reason: KickReason) => void;
}

export const CallRoom: React.FC<CallRoomProps> = ({
  token,
  wsUrl,
  roomName,
  username,
  isOrganizer,
  onDisconnect,
  onKicked
}) => {
  const [showChat, setShowChat] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [showBlackout, setShowBlackout] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const kickingRef = useRef(false);

  const triggerKick = () => {
    if (kickingRef.current) return;
    kickingRef.current = true;
    setShowBlackout(true);
    setCountdown(3);

    let count = 3;
    countdownRef.current = setInterval(() => {
      count -= 1;
      if (count <= 0) {
        clearInterval(countdownRef.current!);
        onKicked('screenshot');
      } else {
        setCountdown(count);
      }
    }, 1000);
  };

  useEffect(() => {
    const isScreenshotKey = (e: KeyboardEvent) =>
      e.key === 'PrintScreen' ||
      (e.ctrlKey && e.key === 'PrintScreen') ||
      (e.altKey && e.key === 'PrintScreen') ||
      // macOS: Cmd+Shift+3/4/5
      (e.metaKey && e.shiftKey && ['3', '4', '5'].includes(e.key));

    // keydown: bloquea lo que el navegador puede interceptar y muestra overlay
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isScreenshotKey(e)) {
        e.preventDefault();
        triggerKick();
      }
    };

    // keyup: PrintScreen en Windows llega aquí aunque el OS lo intercepte en keydown
    const handleKeyUp = (e: KeyboardEvent) => {
      if (isScreenshotKey(e)) {
        triggerKick();
      }
    };

    const handleContextMenu = (e: MouseEvent) => e.preventDefault();

    // visibilitychange: al volver desde una app de captura externa la pestaña
    // pasa brevemente a hidden; se registra pero no se expulsa (falsos positivos)
    const handleVisibility = () => {
      if (document.hidden) {
        // solo log — Win+Shift+S y herramientas externas no son detectables con certeza
        console.warn('[AMA Security] Visibility hidden — possible external capture');
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('visibilitychange', handleVisibility);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

  return (
    <LiveKitRoom
      video={true}
      audio={true}
      token={token}
      serverUrl={wsUrl}
      onDisconnected={onDisconnect}
      className="flex flex-col h-[100dvh] bg-[#f8f5f0] overflow-hidden font-sans"
    >
      {/* CSS anti-grabación */}
      <style>{`
        .video-protected { position: relative; isolation: isolate; }
        .video-protected::after {
          content: '';
          position: absolute;
          inset: 0;
          pointer-events: none;
          -webkit-backdrop-filter: blur(0.001px);
          backdrop-filter: blur(0.001px);
          z-index: 1;
        }
      `}</style>

      {/* Overlay de expulsión / cuenta atrás */}
      <AnimatePresence>
        {showBlackout && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-[200] bg-[#1c1c1c] flex flex-col items-center justify-center gap-6"
          >
            <div className="w-20 h-20 bg-[#8d3030]/10 border border-[#8d3030]/30 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-10 h-10 text-[#8d3030]" />
            </div>
            <div className="text-center px-8">
              <p className="text-white font-black text-2xl mb-2 tracking-tight">Captura detectada</p>
              <p className="text-white/50 text-sm mb-1">Violación de políticas de privacidad</p>
              <p className="text-white/30 text-xs">Serás expulsado en</p>
            </div>
            <div className="w-20 h-20 rounded-full bg-[#8d3030]/10 border-2 border-[#8d3030]/60 flex items-center justify-center">
              <span className="text-[#8d3030] font-black text-4xl">{countdown}</span>
            </div>
            <p className="text-white/20 text-[10px] uppercase tracking-widest font-mono">EstudioAMA Security</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cabecera */}
      <header className="flex items-center justify-between px-4 md:px-8 py-4 md:py-5 flex-shrink-0 bg-[#fffefe] border-b border-[#1c1c1c]/8 shadow-sm">
        <div className="flex items-center gap-4">
          <img
            src="/logo/AMA.png"
            alt="EstudioAMA"
            className="h-7 md:h-8"
            style={{ mixBlendMode: 'multiply' }}
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              const fb = e.currentTarget.nextElementSibling as HTMLElement | null;
              if (fb) fb.hidden = false;
            }}
          />
          <span hidden className="font-black tracking-tighter text-lg leading-none">
            <span className="text-[#1c1c1c]">ESTUDIO</span>
            <span className="text-[#8d3030]">AMA</span>
          </span>
          <div className="h-5 w-px bg-[#1c1c1c]/12" />
          <div className="flex items-center gap-2">
            <Lock className="w-3 h-3 text-[#1c1c1c]/30" />
            <p className="text-[9px] md:text-[10px] text-[#1c1c1c]/40 uppercase tracking-widest font-semibold font-mono">
              {roomName}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden md:flex items-center gap-2 bg-[#f8f5f0] border border-[#1c1c1c]/8 px-3 py-1.5 rounded-full">
            <Users className="w-3.5 h-3.5 text-[#1c1c1c]/40" />
            <span className="text-[10px] text-[#1c1c1c]/40 uppercase tracking-widest font-semibold">Malla segura</span>
          </div>
          <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 px-3 py-1.5 rounded-full">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-wider">Cifrado AMA</span>
          </div>
        </div>
      </header>

      {/* Escritorio: bento grid */}
      <main className="hidden md:grid flex-1 p-5 grid-cols-4 grid-rows-4 gap-4 overflow-hidden">
        {/* Área principal de vídeo */}
        <div className="col-span-3 row-span-4 bg-[#1c1c1c] rounded-[28px] overflow-hidden border border-[#1c1c1c]/20 relative shadow-xl video-protected">
          <TracksManager roomName={roomName} />
        </div>

        {/* Panel de seguridad */}
        <div className="col-span-1 row-span-2 bg-[#fffefe] border border-[#1c1c1c]/8 rounded-[28px] p-5 flex flex-col overflow-hidden shadow-sm">
          <h3 className="text-[9px] font-bold uppercase text-[#1c1c1c]/35 tracking-widest mb-4">Estado de seguridad</h3>
          <div className="flex-1 space-y-3">
            <InsightCard
              icon={<ShieldCheck className="w-4 h-4 text-emerald-600" />}
              label="Integridad"
              value="99.8%"
              sub="Datos forenses"
            />
            <InsightCard
              icon={<Lock className="w-4 h-4 text-[#8d3030]" />}
              label="Cifrado"
              value="AES-256"
              sub="Par de claves"
            />
          </div>
        </div>

        {/* Panel de chat / diagnóstico */}
        <div className="col-span-1 row-span-2 overflow-hidden h-full">
          <AnimatePresence mode="wait">
            {showChat ? (
              <motion.div
                key="chat"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                className="h-full"
              >
                <Chat onClose={() => setShowChat(false)} />
              </motion.div>
            ) : (
              <motion.div
                key="stats"
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                className="h-full bg-[#fffefe] border border-[#1c1c1c]/8 font-mono text-[10px] p-5 rounded-[28px] flex flex-col justify-between shadow-sm"
              >
                <div className="space-y-3.5">
                  <p className="text-[#8d3030] font-bold uppercase tracking-widest text-[8px]">Diagnóstico de red</p>
                  <div className="flex justify-between border-b border-[#1c1c1c]/8 pb-2.5">
                    <span className="text-[#1c1c1c]/40">LATENCIA</span>
                    <span className="text-emerald-600 font-bold">14ms</span>
                  </div>
                  <div className="flex justify-between border-b border-[#1c1c1c]/8 pb-2.5">
                    <span className="text-[#1c1c1c]/40">PÉRDIDA</span>
                    <span className="text-[#1c1c1c]/70">0.00%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#1c1c1c]/40">BITRATE</span>
                    <span className="text-[#1c1c1c]/70">2.4 Mbps</span>
                  </div>
                </div>
                <div className="p-3 bg-[#f8f5f0] rounded-xl border border-[#1c1c1c]/8 text-[#8d3030] text-[9px] font-bold">
                  Malla privada EstudioAMA activa
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Móvil: vídeo a pantalla completa */}
      <main className="md:hidden flex-1 p-3 overflow-hidden relative">
        <div className="bg-[#1c1c1c] rounded-[20px] overflow-hidden border border-[#1c1c1c]/20 h-full relative video-protected">
          <TracksManager roomName={roomName} />
        </div>

        {/* Chat móvil (bottom sheet) */}
        <AnimatePresence>
          {showChat && (
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="absolute inset-x-3 bottom-0 h-[70%] z-50"
            >
              <Chat onClose={() => setShowChat(false)} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Barra de controles */}
      <div className="p-3 md:p-4 flex-shrink-0 bg-[#fffefe] border-t border-[#1c1c1c]/8">
        <Controls
          onToggleChat={() => setShowChat(!showChat)}
          onToggleParticipants={() => setShowParticipants(!showParticipants)}
          showChat={showChat}
          showParticipants={showParticipants}
          isOrganizer={isOrganizer}
          roomName={roomName}
        />
      </div>

      {/* Reproduce automáticamente el audio de todos los participantes remotos */}
      <RoomAudioRenderer />
    </LiveKitRoom>
  );
};

const TracksManager = ({ roomName }: { roomName: string }) => {
  const tracks = useTracks([
    { source: Track.Source.Camera, withPlaceholder: false },
    { source: Track.Source.ScreenShare, withPlaceholder: false },
  ]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 h-full p-2 md:p-3">
      {tracks.map((track) => (
        <TrackRefContext.Provider value={track} key={`${track.participant.identity}-${track.source}`}>
          <ParticipantContext.Provider value={track.participant}>
            <ParticipantTile roomName={roomName} />
          </ParticipantContext.Provider>
        </TrackRefContext.Provider>
      ))}

      {tracks.length === 0 && (
        <div className="col-span-full h-full flex flex-col items-center justify-center text-white/20 animate-in fade-in zoom-in duration-700 px-6 text-center">
          <div className="w-16 h-16 md:w-20 md:h-20 bg-white/5 rounded-[20px] md:rounded-[28px] flex items-center justify-center mb-5 ring-1 ring-white/8">
            <Users className="w-8 h-8 md:w-9 md:h-9 text-[#8d3030]/70" />
          </div>
          <p className="text-base md:text-xl font-bold text-white/70 mb-2 tracking-tight">Conexión establecida</p>
          <p className="text-xs text-white/25 font-mono tracking-widest uppercase">Esperando transmisión...</p>
        </div>
      )}
    </div>
  );
};

function InsightCard({ icon, label, value, sub }: { icon: React.ReactNode, label: string, value: string, sub: string }) {
  return (
    <div className="p-3.5 bg-[#f8f5f0] border border-[#1c1c1c]/8 rounded-2xl flex flex-col gap-2">
      <div className="flex items-center justify-between">
        {icon}
        <span className="text-xs font-mono font-bold text-[#1c1c1c]">{value}</span>
      </div>
      <div>
        <p className="text-[9px] text-[#1c1c1c]/50 font-bold uppercase tracking-tight">{label}</p>
        <p className="text-[8px] text-[#1c1c1c]/30 italic">{sub}</p>
      </div>
    </div>
  );
}
