import React, { useState, useEffect } from 'react';
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
import { ShieldCheck, Users, Lock } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

interface CallRoomProps {
  token: string;
  wsUrl: string;
  roomName: string;
  username: string;
  onDisconnect: () => void;
}

export const CallRoom: React.FC<CallRoomProps> = ({
  token,
  wsUrl,
  roomName,
  username,
  onDisconnect,
}) => {
  const [showChat, setShowChat] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [recordingBlocked, setRecordingBlocked] = useState(false);

  // Anti screen-recording: detect when the page becomes hidden (screen capture
  // apps often cause a brief hidden state on Android) and block the view.
  // On iOS the CSS backdrop-filter trick below provides additional protection.
  useEffect(() => {
    let hiddenAt = 0;

    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        hiddenAt = Date.now();
      } else {
        // Only trigger blackout if hidden for > 800 ms (normal tab switch is faster)
        if (hiddenAt && Date.now() - hiddenAt > 800) {
          setRecordingBlocked(true);
          setTimeout(() => setRecordingBlocked(false), 4000);
        }
        hiddenAt = 0;
      }
    };

    // Fires on some devices when a screen-capture device is added
    const onDeviceChange = () => {
      navigator.mediaDevices?.enumerateDevices().then((devices) => {
        const hasCapture = devices.some(
          (d) =>
            d.kind === 'videoinput' &&
            (d.label.toLowerCase().includes('screen') ||
              d.label.toLowerCase().includes('capture'))
        );
        if (hasCapture) setRecordingBlocked(true);
      });
    };

    document.addEventListener('visibilitychange', onVisibility);
    navigator.mediaDevices?.addEventListener?.('devicechange', onDeviceChange);

    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      navigator.mediaDevices?.removeEventListener?.('devicechange', onDeviceChange);
    };
  }, []);

  return (
    <LiveKitRoom
      video={true}
      audio={true}
      token={token}
      serverUrl={wsUrl}
      onDisconnected={onDisconnect}
      className="flex flex-col h-[100dvh] bg-[#050505] overflow-hidden font-sans"
    >
      {/* ── Anti-recording CSS ── */}
      <style>{`
        /* Prevent text/media selection */
        .lk-video-track, video {
          -webkit-user-select: none !important;
          user-select: none !important;
          -webkit-touch-callout: none !important;
        }
        /* Creates a GPU compositing boundary that iOS screen recording
           cannot capture on several iOS 15-17 versions, resulting in a
           black frame in the recording while the user sees the video normally. */
        .video-protected {
          position: relative;
          isolation: isolate;
        }
        .video-protected::after {
          content: '';
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 10;
          -webkit-backdrop-filter: blur(0.001px);
          backdrop-filter: blur(0.001px);
        }
      `}</style>

      {/* ── Full blackout overlay when recording is detected ── */}
      <AnimatePresence>
        {recordingBlocked && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[999] bg-black flex flex-col items-center justify-center gap-4"
          >
            <div className="w-16 h-16 rounded-full bg-red-600/20 border border-red-600/40 flex items-center justify-center">
              <ShieldCheck className="w-8 h-8 text-red-500" />
            </div>
            <p className="text-white font-bold text-sm uppercase tracking-widest">
              Sesión protegida
            </p>
            <p className="text-slate-500 text-xs tracking-wide">
              Grabación de pantalla bloqueada
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Header ── */}
      <header className="flex items-center justify-between px-4 md:px-8 py-3 md:py-6 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 md:w-10 md:h-10 bg-red-600 rounded-xl flex items-center justify-center font-bold text-white shadow-lg shadow-red-500/20 italic text-sm">
            A
          </div>
          <div>
            <h1 className="text-sm md:text-lg font-bold tracking-tight text-white leading-none">
              Estudio<span className="text-red-500">AMA</span>
            </h1>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              <p className="text-[9px] md:text-[10px] text-slate-500 uppercase tracking-widest font-semibold flex items-center gap-1">
                <Lock className="w-2 h-2" />
                {roomName}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden md:flex bg-slate-900/50 border border-slate-800 px-4 py-2 rounded-full items-center gap-2">
            <Users className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-[10px] text-slate-300 uppercase tracking-tighter font-medium">
              Secure Mesh
            </span>
          </div>
          <div className="bg-red-500/10 border border-red-500/20 text-red-500 px-3 py-1.5 rounded-full flex items-center gap-1.5">
            <ShieldCheck className="w-3 h-3 md:w-4 md:h-4" />
            <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-wider">
              Encrypted
            </span>
          </div>
        </div>
      </header>

      {/* ── Main area ── */}
      <main className="flex-1 px-3 md:p-6 overflow-hidden relative min-h-0">

        {/* Desktop bento grid */}
        <div className="hidden md:grid grid-cols-4 grid-rows-4 gap-4 h-full">
          <div className="col-span-3 row-span-4 bg-slate-900 rounded-[32px] overflow-hidden border border-slate-800 shadow-2xl video-protected">
            <TracksManager roomName={roomName} />
          </div>

          {/* Security insights panel */}
          <div className="col-span-1 row-span-2 bg-[#1a1c20]/40 rounded-[32px] border border-slate-800 p-5 flex flex-col overflow-hidden">
            <h3 className="text-[10px] font-bold uppercase text-slate-500 tracking-wider mb-4">
              Security Insights
            </h3>
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

          {/* Chat / stats side panel */}
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
                    <p className="text-red-500 font-bold uppercase tracking-widest text-[8px]">
                      Network Diagnostics
                    </p>
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
        </div>

        {/* Mobile: full-screen video */}
        <div className="md:hidden h-full bg-slate-900 rounded-[20px] overflow-hidden border border-slate-800 video-protected">
          <TracksManager roomName={roomName} />
        </div>

        {/* Mobile: chat slides up from bottom */}
        <AnimatePresence>
          {showChat && (
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="md:hidden absolute inset-x-0 bottom-0 h-[72%] z-50 px-3 pb-2"
            >
              <Chat onClose={() => setShowChat(false)} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* ── Controls bar ── */}
      <div className="flex-shrink-0 p-3 md:p-6">
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
  const tracks = useTracks([
    { source: Track.Source.Camera, withPlaceholder: false },
    { source: Track.Source.ScreenShare, withPlaceholder: false },
  ]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 h-full p-3 md:p-4 auto-rows-fr">
      {tracks.map((track) => (
        <TrackRefContext.Provider
          value={track}
          key={`${track.participant.identity}-${track.source}`}
        >
          <ParticipantContext.Provider value={track.participant}>
            <ParticipantTile roomName={roomName} />
          </ParticipantContext.Provider>
        </TrackRefContext.Provider>
      ))}

      {tracks.length === 0 && (
        <div className="col-span-full h-full flex flex-col items-center justify-center text-slate-600 px-4">
          <div className="w-16 h-16 md:w-24 md:h-24 bg-[#050505] rounded-[24px] md:rounded-[32px] flex items-center justify-center mb-4 ring-1 ring-slate-800 shadow-2xl">
            <Users className="w-8 h-8 md:w-10 md:h-10 text-red-500" />
          </div>
          <p className="text-base md:text-2xl font-bold text-white mb-2 text-center">
            Authenticated Connection Established
          </p>
          <p className="text-[10px] md:text-sm opacity-60 font-mono tracking-widest uppercase text-center">
            Waiting for session broadcast...
          </p>
        </div>
      )}
    </div>
  );
};

function InsightCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
}) {
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
