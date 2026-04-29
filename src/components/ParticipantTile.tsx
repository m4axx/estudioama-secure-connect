import React from 'react';
import { 
  ParticipantContext, 
  TrackRefContext, 
  VideoTrack, 
  useParticipantContext,
  useTrackRefContext
} from '@livekit/components-react';
import { Track } from 'livekit-client';
import { Watermark } from './Watermark';
import { MicOff, Pin } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ParticipantTileProps {
  roomName: string;
}

export const ParticipantTile: React.FC<ParticipantTileProps> = ({ roomName }) => {
  const p = useParticipantContext();
  const trackRef = useTrackRefContext();
  
  const isScreenShare = trackRef.source === Track.Source.ScreenShare;

  return (
    <div className={cn(
      "relative group aspect-video bg-neutral-950 rounded-[32px] overflow-hidden border border-slate-800 transition-all hover:border-red-500/50 flex items-center justify-center",
      isScreenShare && "col-span-full h-full"
    )}>
      {/* Video Content */}
      <VideoTrack 
        trackRef={trackRef} 
        className="w-full h-full object-cover grayscale-[0.2] group-hover:grayscale-0 transition-all duration-700"
      />

      {/* Watermark */}
      {(trackRef.source === Track.Source.Camera || isScreenShare) && (
        <Watermark 
          username={p.identity} 
          roomName={roomName} 
        />
      )}

      {/* Info Overlay */}
      <div className="absolute bottom-3 left-3 md:bottom-6 md:left-6 bg-black/60 backdrop-blur-md px-2.5 py-1 md:px-3 md:py-1.5 rounded-xl border border-white/10 flex items-center gap-2 md:gap-3 shadow-lg">
        <div className={cn("w-2 h-2 rounded-full", p.isMicrophoneEnabled ? "bg-emerald-500" : "bg-red-500")} />
        <span className="text-xs font-bold text-white truncate max-w-[120px]">
          {p.identity} {p.isLocal && "(You)"}
        </span>
        {isScreenShare && (
           <span className="text-[9px] font-black uppercase tracking-widest text-red-500 border-l border-white/10 pl-3">Live Feed</span>
        )}
      </div>

      {/* Screen share warning */}
      {isScreenShare && (
        <div className="absolute top-6 left-6 right-6 p-3 bg-red-500/10 backdrop-blur-md rounded-2xl border border-red-500/20 text-[10px] text-red-200 uppercase tracking-widest font-bold">
           Restricted Stream: Forensic Watermarking Enabled
        </div>
      )}
    </div>
  );
};
