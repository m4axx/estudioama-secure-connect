import React from 'react';
import {
  VideoTrack,
  useParticipantContext,
  useTrackRefContext
} from '@livekit/components-react';
import { Track } from 'livekit-client';
import { Watermark } from './Watermark';
import { cn } from '@/lib/utils';

interface ParticipantTileProps {
  roomName: string;
  /** main = full overlay; mini = compact badge only */
  variant?: 'main' | 'mini';
}

export const ParticipantTile: React.FC<ParticipantTileProps> = ({ roomName, variant = 'main' }) => {
  const p = useParticipantContext();
  const trackRef = useTrackRefContext();
  const isScreenShare = trackRef.source === Track.Source.ScreenShare;
  const isMini = variant === 'mini';

  return (
    <div className="relative w-full h-full flex items-center justify-center bg-black">
      <VideoTrack trackRef={trackRef} className="w-full h-full object-cover" />

      {/* Watermark solo en main */}
      {!isMini && (trackRef.source === Track.Source.Camera || isScreenShare) && (
        <Watermark username={p.identity} roomName={roomName} />
      )}

      {/* Badge de participante */}
      <div className={cn(
        'absolute left-2 bottom-2 bg-black/50 backdrop-blur-md rounded-xl border border-white/8 flex items-center gap-1.5 shadow',
        isMini ? 'px-1.5 py-1' : 'px-2.5 py-1.5 md:left-4 md:bottom-4'
      )}>
        <div className={cn(
          'rounded-full flex-shrink-0',
          isMini ? 'w-1.5 h-1.5' : 'w-2 h-2',
          p.isMicrophoneEnabled ? 'bg-emerald-400' : 'bg-[#8d3030]'
        )} />
        <span className={cn(
          'font-bold text-white truncate',
          isMini ? 'text-[9px] max-w-[60px]' : 'text-[10px] max-w-[110px] md:max-w-[140px]'
        )}>
          {p.identity}{p.isLocal && !isMini ? ' (Tú)' : ''}
        </span>
        {isScreenShare && !isMini && (
          <span className="text-[8px] font-black uppercase tracking-widest text-[#8d3030]/80 border-l border-white/10 pl-2">
            Pantalla
          </span>
        )}
      </div>

      {/* Aviso screen share — solo en main */}
      {isScreenShare && !isMini && (
        <div className="absolute top-3 left-3 right-3 p-2 bg-[#8d3030]/10 backdrop-blur-md rounded-xl border border-[#8d3030]/20 text-[9px] text-white/70 uppercase tracking-widest font-bold">
          Transmisión restringida — Marca forense activa
        </div>
      )}
    </div>
  );
};
