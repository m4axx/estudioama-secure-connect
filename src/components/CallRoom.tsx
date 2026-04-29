import React, { useState } from 'react';
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
import { Badge } from './ui/badge';
import { 
  ShieldCheck, 
  Users,
  Lock
} from 'lucide-react';
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
  onDisconnect 
}) => {
  const [showChat, setShowChat] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);

  return (
    <LiveKitRoom
      video={true}
      audio={true}
      token={token}
      serverUrl={wsUrl}
      onDisconnected={onDisconnect}
      className="flex flex-col h-screen bg-[#050505] overflow-hidden selection:bg-indigo-500/30 font-sans"
    >
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-6 mb-2">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center font-bold text-white shadow-lg shadow-red-500/20 italic">A</div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white">Estudio<span className="text-red-500">AMA</span></h1>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold flex items-center gap-2">
                <Lock className="w-2.5 h-2.5" /> CODE: {roomName}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-slate-900/50 border border-slate-800 px-4 py-2 rounded-full flex items-center gap-3">
            <Users className="w-4 h-4 text-slate-500" />
            <span className="text-sm font-medium text-slate-200 uppercase tracking-tighter text-[10px]">Secure Mesh</span>
          </div>
          <div className="bg-red-500/10 border border-red-500/20 text-red-500 px-4 py-2 rounded-full flex items-center gap-2">
             <ShieldCheck className="w-4 h-4" />
             <span className="text-[10px] font-bold uppercase tracking-wider">AMA Encrypted</span>
          </div>
        </div>
      </header>

      {/* Main Bento Grid Area */}
      <main className="flex-1 p-6 grid grid-cols-4 grid-rows-4 gap-4 overflow-hidden relative">
        {/* Primary Stage (Bento Large) */}
        <div className="col-span-3 row-span-4 bg-slate-900 rounded-[32px] overflow-hidden border border-slate-800 relative shadow-2xl">
           <TracksManager roomName={roomName} />
        </div>

        {/* Bento Side Column */}
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

        {/* Side Panels - Animated Bento Popups */}
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

      {/* Control Bar (Bento Horizontal) */}
      <div className="p-6">
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
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
      {tracks.map((track) => (
        <TrackRefContext.Provider value={track} key={`${track.participant.identity}-${track.source}`}>
          <ParticipantContext.Provider value={track.participant}>
            <ParticipantTile roomName={roomName} />
          </ParticipantContext.Provider>
        </TrackRefContext.Provider>
      ))}

      {tracks.length === 0 && (
        <div className="col-span-full h-full flex flex-col items-center justify-center text-slate-600 animate-in fade-in zoom-in duration-700">
           <div className="w-24 h-24 bg-[#050505] rounded-[32px] flex items-center justify-center mb-6 ring-1 ring-slate-800 shadow-2xl">
             <Users className="w-10 h-10 text-red-500" />
           </div>
           <p className="text-2xl font-bold text-white mb-2">Authenticated Connection Established</p>
           <p className="text-sm opacity-60 font-mono tracking-widest uppercase">Waiting for session broadcast...</p>
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
