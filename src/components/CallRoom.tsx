import React, { useState, useEffect, useRef } from 'react';
import {
  LiveKitRoom,
  RoomAudioRenderer,
  AudioTrack,
  useTracks,
  TrackRefContext,
  ParticipantContext
} from '@livekit/components-react';
import { Track } from 'livekit-client';
import { ParticipantTile } from './ParticipantTile';
import { Controls } from './Controls';
import { Chat } from './Chat';
import { ShieldCheck, Users, Lock, AlertTriangle } from 'lucide-react';
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
  token, wsUrl, roomName, username, isOrganizer, onDisconnect, onKicked,
}) => {
  const [showChat, setShowChat] = useState(false);
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
      if (count <= 0) { clearInterval(countdownRef.current!); onKicked('screenshot'); }
      else setCountdown(count);
    }, 1000);
  };

  useEffect(() => {
    const isShot = (e: KeyboardEvent) =>
      e.key === 'PrintScreen' ||
      (e.ctrlKey && e.key === 'PrintScreen') ||
      (e.altKey && e.key === 'PrintScreen') ||
      (e.metaKey && e.shiftKey && ['3', '4', '5'].includes(e.key));

    const onDown = (e: KeyboardEvent) => { if (isShot(e)) { e.preventDefault(); triggerKick(); } };
    const onUp   = (e: KeyboardEvent) => { if (isShot(e)) triggerKick(); };
    const noCtx  = (e: MouseEvent)    => e.preventDefault();

    document.addEventListener('keydown', onDown);
    document.addEventListener('keyup', onUp);
    document.addEventListener('contextmenu', noCtx);
    return () => {
      document.removeEventListener('keydown', onDown);
      document.removeEventListener('keyup', onUp);
      document.removeEventListener('contextmenu', noCtx);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

  return (
    <LiveKitRoom
      video audio token={token} serverUrl={wsUrl} onDisconnected={onDisconnect}
      className="flex flex-col h-[100dvh] bg-[#f8f5f0] overflow-hidden font-sans"
    >
      <style>{`
        .vp { position:relative; isolation:isolate; }
        .vp::after { content:''; position:absolute; inset:0; pointer-events:none;
          -webkit-backdrop-filter:blur(0.001px); backdrop-filter:blur(0.001px); z-index:1; }
      `}</style>

      {/* Kick overlay */}
      <AnimatePresence>
        {showBlackout && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="fixed inset-0 z-[200] bg-[#1c1c1c] flex flex-col items-center justify-center gap-6">
            <div className="w-20 h-20 bg-[#8d3030]/10 border border-[#8d3030]/30 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-10 h-10 text-[#8d3030]" />
            </div>
            <div className="text-center px-8">
              <p className="text-white font-black text-2xl mb-2 tracking-tight">Captura detectada</p>
              <p className="text-white/50 text-sm">Violación de políticas de privacidad</p>
              <p className="text-white/30 text-xs mt-1">Serás expulsado en</p>
            </div>
            <div className="w-20 h-20 rounded-full bg-[#8d3030]/10 border-2 border-[#8d3030]/60 flex items-center justify-center">
              <span className="text-[#8d3030] font-black text-4xl">{countdown}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="flex-shrink-0 flex items-center justify-between px-4 md:px-6 py-3 bg-[#fffefe] border-b border-[#1c1c1c]/8 shadow-sm">
        <div className="flex items-center gap-3">
          <img src="/logo/AMA.png" alt="AMA" className="h-7"
            style={{ mixBlendMode: 'multiply' }}
            onError={(e) => { e.currentTarget.style.display='none'; (e.currentTarget.nextElementSibling as HTMLElement|null)?.removeAttribute('hidden'); }} />
          <span hidden className="font-black tracking-tighter text-lg leading-none">
            <span className="text-[#1c1c1c]">ESTUDIO</span><span className="text-[#8d3030]">AMA</span>
          </span>
          <div className="h-4 w-px bg-[#1c1c1c]/12" />
          <div className="flex items-center gap-1.5">
            <Lock className="w-3 h-3 text-[#1c1c1c]/30" />
            <span className="text-[9px] text-[#1c1c1c]/40 uppercase tracking-widest font-mono font-semibold">{roomName}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 px-2.5 py-1 rounded-full">
            <ShieldCheck className="w-3 h-3" />
            <span className="text-[9px] font-bold uppercase tracking-wider">Cifrado</span>
          </div>
        </div>
      </header>

      {/* Video area */}
      <div className="flex-1 min-h-0 relative overflow-hidden">
        <VideoArea roomName={roomName} />

        {/* Chat desktop sidebar */}
        <AnimatePresence>
          {showChat && (
            <motion.div
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className="hidden md:block absolute top-0 right-0 bottom-0 w-72 z-40 p-3"
            >
              <Chat onClose={() => setShowChat(false)} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Chat mobile bottom sheet */}
        <AnimatePresence>
          {showChat && (
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="md:hidden absolute inset-x-0 bottom-0 h-[65%] z-40 p-2"
            >
              <Chat onClose={() => setShowChat(false)} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Controls */}
      <div className="flex-shrink-0 bg-[#fffefe] border-t border-[#1c1c1c]/8 px-3 py-2 md:px-5 md:py-3">
        <Controls
          onToggleChat={() => setShowChat(v => !v)}
          showChat={showChat}
          isOrganizer={isOrganizer}
          roomName={roomName}
        />
      </div>

      <RoomAudioRenderer />
      <ScreenShareAudioRenderer />
    </LiveKitRoom>
  );
};

// ── Video area: detecta screen share y cambia layout ─────────────────────────
function VideoArea({ roomName }: { roomName: string }) {
  const all = useTracks([
    { source: Track.Source.Camera, withPlaceholder: false },
    { source: Track.Source.ScreenShare, withPlaceholder: false },
  ]);

  const ssTracks  = all.filter(t => t.source === Track.Source.ScreenShare);
  const camTracks = all.filter(t => t.source === Track.Source.Camera);
  const hasScreen = ssTracks.length > 0;

  return (
    <AnimatePresence mode="wait">
      {hasScreen ? (
        <motion.div key="screen" className="absolute inset-0"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}>
          <ScreenShareLayout ss={ssTracks[0]} cams={camTracks} roomName={roomName} />
        </motion.div>
      ) : (
        <motion.div key="cams" className="absolute inset-0"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}>
          <CameraLayout cams={camTracks} roomName={roomName} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── Layout con screen share activo ────────────────────────────────────────────
function ScreenShareLayout({ ss, cams, roomName }: { ss: any; cams: any[]; roomName: string }) {
  return (
    // Mobile: columna — SS arriba, tira de cámaras abajo
    // Desktop: fila — SS a la izquierda, tira vertical de cámaras a la derecha
    <div className="h-full flex flex-col md:flex-row gap-2 p-2 md:p-3">
      {/* Pantalla compartida principal */}
      <div className="flex-1 min-h-0 min-w-0 vp rounded-[20px] md:rounded-[24px] overflow-hidden bg-black">
        <TrackRefContext.Provider value={ss}>
          <ParticipantContext.Provider value={ss.participant}>
            <ParticipantTile roomName={roomName} variant="main" />
          </ParticipantContext.Provider>
        </TrackRefContext.Provider>
      </div>

      {/* Tira de cámaras */}
      {cams.length > 0 && (
        // Mobile: barra horizontal scrollable, altura fija
        // Desktop: franja vertical scrollable, ancho fijo
        <div className={[
          'flex-shrink-0 flex gap-2',
          // Mobile: horizontal scroll
          'flex-row overflow-x-auto overflow-y-hidden h-24',
          // Desktop: vertical scroll
          'md:flex-col md:overflow-y-auto md:overflow-x-hidden md:h-full md:w-36 md:h-auto',
        ].join(' ')}
          style={{ scrollbarWidth: 'none' }}
        >
          {cams.map(track => (
            <div
              key={`${track.participant.identity}-cam`}
              className="flex-shrink-0 h-full aspect-video md:aspect-video md:w-full md:h-auto rounded-[14px] overflow-hidden bg-black"
            >
              <TrackRefContext.Provider value={track}>
                <ParticipantContext.Provider value={track.participant}>
                  <ParticipantTile roomName={roomName} variant="mini" />
                </ParticipantContext.Provider>
              </TrackRefContext.Provider>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Layout solo cámaras ───────────────────────────────────────────────────────
function CameraLayout({ cams, roomName }: { cams: any[]; roomName: string }) {
  if (cams.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center px-6">
        <div className="w-16 h-16 md:w-20 md:h-20 bg-[#1c1c1c]/5 rounded-[20px] flex items-center justify-center mb-5 ring-1 ring-[#1c1c1c]/8">
          <Users className="w-8 h-8 text-[#8d3030]/50" />
        </div>
        <p className="text-base md:text-xl font-bold text-[#1c1c1c]/50 mb-2 tracking-tight">Conexión establecida</p>
        <p className="text-xs text-[#1c1c1c]/25 font-mono tracking-widest uppercase">Esperando participantes...</p>
      </div>
    );
  }

  return (
    <div className={[
      'h-full p-2 md:p-3',
      // Mobile: columna vertical scrollable
      'overflow-y-auto flex flex-col gap-2',
      // Desktop: grid 2 columnas (o 1 si solo hay uno)
      cams.length === 1
        ? 'md:flex md:items-center md:justify-center'
        : 'md:grid md:grid-cols-2 md:content-start',
    ].join(' ')}
      style={{ scrollbarWidth: 'none' }}
    >
      {cams.map(track => (
        <div
          key={`${track.participant.identity}-cam`}
          className={[
            'vp flex-shrink-0 rounded-[20px] md:rounded-[24px] overflow-hidden bg-black',
            'w-full aspect-video',
            cams.length === 1 ? 'md:max-w-3xl md:mx-auto' : '',
          ].join(' ')}
        >
          <TrackRefContext.Provider value={track}>
            <ParticipantContext.Provider value={track.participant}>
              <ParticipantTile roomName={roomName} variant="main" />
            </ParticipantContext.Provider>
          </TrackRefContext.Provider>
        </div>
      ))}
    </div>
  );
}

function ScreenShareAudioRenderer() {
  const tracks = useTracks([{ source: Track.Source.ScreenShareAudio, withPlaceholder: false }]);
  return (
    <>
      {tracks.map(t => (
        <AudioTrack key={`${t.participant.identity}-ss-audio`} trackRef={t} />
      ))}
    </>
  );
}
