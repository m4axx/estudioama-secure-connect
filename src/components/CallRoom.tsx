import React, { useState, useEffect, useRef } from 'react';
import {
  LiveKitRoom,
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
  onDisconnect: () => void;
  onKicked: (reason: KickReason) => void;
}

export const CallRoom: React.FC<CallRoomProps> = ({
  token,
  wsUrl,
  roomName,
  username,
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
    const handleKeyDown = (e: KeyboardEvent) => {
      const isPrintScreen = e.key === 'PrintScreen';
      const isCtrlShiftS = e.ctrlKey && e.shiftKey && e.key === 'S';
      const isMacShot =
        e.metaKey && e.shiftKey && (e.key === '3' || e.key === '4' || e.key === '5');
      const isCtrlPrintScreen = e.ctrlKey && e.key === 'PrintScreen';
      const isAltPrintScreen = e.altKey && e.key === 'PrintScreen';
      const isWindowsSnip = e.metaKey && e.shiftKey && e.key === 'S';

      if (isPrintScreen || isCtrlShiftS || isMacShot || isCtrlPrintScreen || isAltPrintScreen || isWindowsSnip) {
        e.preventDefault();
        triggerKick();
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        // briefly hidden could indicate screen recording app switching
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
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
      className="flex flex-col h-[100dvh] bg-[#050505] overflow-hidden selection:bg-indigo-500/30 font-sans"
    >
      {/* Anti-recording CSS */}
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

      {/* Blackout / Kick Countdown Overlay */}
      <AnimatePresence>
        {showBlackout && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-[200] bg-black flex flex-col items-center justify-center gap-6"
          >
            <div className="w-20 h-20 bg-red-600/10 border border-red-600/40 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-10 h-10 text-red-500" />
            </div>
            <div className="text-center px-8">
              <p className="text-white font-black text-2xl mb-2">Captura detectada</p>
              <p className="text-slate-400 text-sm mb-1">Violación de políticas de privacidad</p>
              <p className="text-slate-600 text-xs">Serás expulsado en</p>
            </div>
            <div className="w-20 h-20 rounded-full bg-red-600/10 border-2 border-red-500 flex items-center justify-center">
              <span className="text-red-400 font-black text-4xl">{countdown}</span>
            </div>
            <p className="text-slate-700 text-[10px] uppercase tracking-widest">EstudioAMA Security</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="flex items-center justify-between px-4 md:px-8 py-4 md:py-6 mb-0 md:mb-2 flex-shrink-0">
        <div className="flex items-center gap-3 md:gap-4">
          <div className="w-8 h-8 md:w-10 md:h-10 bg-red-600 rounded-xl flex items-center justify-center font-bold text-white shadow-lg shadow-red-500/20 italic text-sm md:text-base">A</div>
          <div>
            <h1 className="text-base md:text-lg font-bold tracking-tight text-white">Estudio<span className="text-red-500">AMA</span></h1>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
              <p className="text-[9px] md:text-[10px] text-slate-500 uppercase tracking-widest font-semibold flex items-center gap-1 md:gap-2">
                <Lock className="w-2 h-2 md:w-2.5 md:h-2.5" /> <span className="hidden sm:inline">CODE: </span>{roomName}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          <div className="hidden md:flex bg-slate-900/50 border border-slate-800 px-4 py-2 rounded-full items-center gap-3">
            <Users className="w-4 h-4 text-slate-500" />
            <span className="text-sm font-medium text-slate-200 uppercase tracking-tighter text-[10px]">Secure Mesh</span>
          </div>
          <div className="bg-red-500/10 border border-red-500/20 text-red-500 px-3 md:px-4 py-1.5 md:py-2 rounded-full flex items-center gap-1.5 md:gap-2">
             <ShieldCheck className="w-3.5 h-3.5 md:w-4 md:h-4" />
             <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-wider">AMA Encrypted</span>
          </div>
        </div>
      </header>

      {/* Desktop: Bento Grid */}
      <main className="hidden md:grid flex-1 p-6 grid-cols-4 grid-rows-4 gap-4 overflow-hidden relative">
        {/* Primary Stage */}
        <div className="col-span-3 row-span-4 bg-slate-900 rounded-[32px] overflow-hidden border border-slate-800 relative shadow-2xl video-protected">
           <TracksManager roomName={roomName} />
        </div>

        {/* Security Insights */}
        <div className="col-span-1 row-span-2 bg-[#1a1c20]/40 rounded-[32px] border border-slate-800 p-5 flex flex-col overflow-hidden">
           <h3 className="text-[10px] font-bold uppercase text-slate-500 tracking-wider mb-4">Security Insights</h3>
           <div className="flex-1 space-y-4">
             <InsightCard
               icon={<ShieldCheck className="w-4 h-4 text-emerald-500" />}
               label="Forensics Data"
               value="99.8%"
               sub="Mesh Integrity"
             />
             <InsightCard
               icon={<Lock className="w-4 h-4 text-red-500" />}
               label="Encryption"
               value="AES-256"
               sub="Session Key Pair"
             />
           </div>
        </div>

        {/* Chat / Stats panel */}
        <div className="col-span-1 row-span-2 overflow-hidden h-full">
           <AnimatePresence mode="wait">
             {showChat ? (
                <motion.div
                  key="chat"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="h-full"
                >
                  <Chat onClose={() => setShowChat(false)} />
                </motion.div>
             ) : (
                <motion.div
                  key="stats"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="h-full bg-slate-900 font-mono text-[10px] p-5 rounded-[32px] border border-slate-800 flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    <p className="text-red-500 font-bold uppercase tracking-widest text-[8px]">Network Diagnostics</p>
                    <div className="flex justify-between border-b border-slate-800 pb-2">
                       <span className="text-slate-500">LATENCY</span>
                       <span className="text-emerald-500">14ms</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-800 pb-2">
                       <span className="text-slate-500">PACKET LOSS</span>
                       <span className="text-slate-200">0.00%</span>
                    </div>
                    <div className="flex justify-between">
                       <span className="text-slate-500">BITRATE</span>
                       <span className="text-slate-200">2.4 Mbps</span>
                    </div>
                  </div>
                  <div className="p-3 bg-black/40 rounded-xl border border-red-500/10 text-red-400">
                    EstudioAMA Secure Mesh Active
                  </div>
                </motion.div>
             )}
           </AnimatePresence>
        </div>
      </main>

      {/* Mobile: Full-screen video */}
      <main className="md:hidden flex-1 px-3 pb-2 overflow-hidden relative">
        <div className="bg-slate-900 rounded-[20px] overflow-hidden border border-slate-800 h-full relative video-protected">
          <TracksManager roomName={roomName} />
        </div>

        {/* Mobile Chat Bottom Sheet */}
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

      {/* Control Bar */}
      <div className="p-3 md:p-6 flex-shrink-0">
        <Controls
          onToggleChat={() => setShowChat(!showChat)}
          onToggleParticipants={() => setShowParticipants(!showParticipants)}
          showChat={showChat}
          showParticipants={showParticipants}
        />
      </div>
    </LiveKitRoom>
  );
};

const TracksManager = ({ roomName }: { roomName: string }) => {
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: false },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ]
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full p-2 md:p-0">
      {tracks.map((track) => (
        <TrackRefContext.Provider value={track} key={`${track.participant.identity}-${track.source}`}>
          <ParticipantContext.Provider value={track.participant}>
            <ParticipantTile roomName={roomName} />
          </ParticipantContext.Provider>
        </TrackRefContext.Provider>
      ))}

      {tracks.length === 0 && (
        <div className="col-span-full h-full flex flex-col items-center justify-center text-slate-600 animate-in fade-in zoom-in duration-700 px-4 text-center">
           <div className="w-16 h-16 md:w-24 md:h-24 bg-[#050505] rounded-[24px] md:rounded-[32px] flex items-center justify-center mb-4 md:mb-6 ring-1 ring-slate-800 shadow-2xl">
             <Users className="w-8 h-8 md:w-10 md:h-10 text-red-500" />
           </div>
           <p className="text-lg md:text-2xl font-bold text-white mb-2">Authenticated Connection Established</p>
           <p className="text-xs md:text-sm opacity-60 font-mono tracking-widest uppercase">Waiting for session broadcast...</p>
        </div>
      )}
    </div>
  );
};

function InsightCard({ icon, label, value, sub }: { icon: React.ReactNode, label: string, value: string, sub: string }) {
  return (
    <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col gap-2">
       <div className="flex items-center justify-between">
         {icon}
         <span className="text-xs font-mono font-bold text-white">{value}</span>
       </div>
       <div>
         <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{label}</p>
         <p className="text-[9px] text-slate-600 italic">{sub}</p>
       </div>
    </div>
  );
}
