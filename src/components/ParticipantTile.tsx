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
      "relative group aspect-video bg-[#111] rounded-[24px] overflow-hidden border border-white/5 transition-all hover:border-[#8d3030]/40 flex items-center justify-center",
      isScreenShare && "col-span-full h-full"
    )}>
      <VideoTrack
        trackRef={trackRef}
        className="w-full h-full object-cover"
      />

      {(trackRef.source === Track.Source.Camera || isScreenShare) && (
        <Watermark username={p.identity} roomName={roomName} />
      )}

      {/* Etiqueta del participante */}
      <div className="absolute bottom-3 left-3 md:bottom-4 md:left-4 bg-black/50 backdrop-blur-md px-2.5 py-1.5 rounded-xl border border-white/8 flex items-center gap-2 shadow-lg">
        <div className={cn("w-1.5 h-1.5 rounded-full", p.isMicrophoneEnabled ? "bg-emerald-400" : "bg-[#8d3030]")} />
        <span className="text-[10px] font-bold text-white truncate max-w-[100px] md:max-w-[130px]">
          {p.identity}{p.isLocal && " (Tú)"}
        </span>
        {isScreenShare && (
          <span className="text-[8px] font-black uppercase tracking-widest text-[#8d3030]/80 border-l border-white/10 pl-2">
            Pantalla
          </span>
        )}
      </div>

      {isScreenShare && (
        <div className="absolute top-3 left-3 right-3 md:top-4 md:left-4 md:right-4 p-2.5 bg-[#8d3030]/10 backdrop-blur-md rounded-xl border border-[#8d3030]/20 text-[9px] text-white/70 uppercase tracking-widest font-bold">
          Transmisión restringida — Marca forense activa
        </div>
      )}
    </div>
  );
};
