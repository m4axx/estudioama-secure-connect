import React, { useState, useCallback } from 'react';
import { DisconnectButton, TrackToggle, useLocalParticipant } from '@livekit/components-react';
import { Track } from 'livekit-client';
import { Mic, MicOff, Video, VideoOff, Monitor, MessageSquare, Maximize, Minimize, Circle, StopCircle } from 'lucide-react';
import { Button, buttonVariants } from './ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { cn } from '@/lib/utils';
import { useRoomRecording } from '@/hooks/useRoomRecording';

interface ControlsProps {
  onToggleChat: () => void;
  showChat: boolean;
  isOrganizer: boolean;
  roomName: string;
  // legacy prop — not used but kept for compatibility
  onToggleParticipants?: () => void;
  showParticipants?: boolean;
}

const BTN = 'rounded-2xl flex items-center justify-center transition-all active:scale-95 border';
// Mobile: 52×52px touch target. Desktop: 44×44px.
const SIZE = 'w-13 h-13 md:w-11 md:h-11';
const IDLE = 'bg-[#f8f5f0] border-[#1c1c1c]/10 text-[#1c1c1c]/60 hover:bg-[#1c1c1c]/6 hover:text-[#1c1c1c]';
const ACTIVE = 'bg-[#8d3030]/8 text-[#8d3030] border-[#8d3030]/20';
const ICON = 'w-5 h-5 md:w-5 md:h-5';

export const Controls: React.FC<ControlsProps> = ({ onToggleChat, showChat, isOrganizer, roomName }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const { recording, duration, startRecording, stopRecording } = useRoomRecording(roomName);

  const toggleFullscreen = useCallback(() => {
    const el = document.documentElement as any;
    if (!document.fullscreenElement) {
      // Android Chrome: requestFullscreen. iOS Safari: webkitRequestFullscreen.
      const req = el.requestFullscreen || el.webkitRequestFullscreen || el.mozRequestFullScreen;
      if (req) req.call(el).then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      const exit = (document as any).exitFullscreen || (document as any).webkitExitFullscreen;
      if (exit) exit.call(document).then(() => setIsFullscreen(false)).catch(() => {});
    }
  }, []);

  React.useEffect(() => {
    const h = () => setIsFullscreen(
      !!(document.fullscreenElement || (document as any).webkitFullscreenElement)
    );
    document.addEventListener('fullscreenchange', h);
    document.addEventListener('webkitfullscreenchange', h);
    return () => {
      document.removeEventListener('fullscreenchange', h);
      document.removeEventListener('webkitfullscreenchange', h);
    };
  }, []);

  return (
    <TooltipProvider>
      <div className="flex items-center justify-between gap-2">

        {/* Izquierda: mic + cam */}
        <div className="flex items-center gap-2 md:gap-3">
          <TrackBtn Icon={Mic} OffIcon={MicOff} source={Track.Source.Microphone} label="Micrófono" />
          <TrackBtn Icon={Video} OffIcon={VideoOff} source={Track.Source.Camera} label="Cámara" />
        </div>

        {/* Centro: controles secundarios */}
        <div className="flex items-center gap-1.5 md:gap-2 bg-[#f8f5f0] px-2.5 py-1.5 rounded-2xl border border-[#1c1c1c]/8">
          {/* Chat */}
          <Tooltip>
            <TooltipTrigger
              onClick={onToggleChat}
              className={cn(BTN, SIZE, showChat ? ACTIVE : IDLE)}
            >
              <MessageSquare className={ICON} />
            </TooltipTrigger>
            <TooltipContent>Chat</TooltipContent>
          </Tooltip>

          {/* Compartir pantalla (desktop) */}
          <Tooltip>
            <TooltipTrigger
              render={
                <TrackToggle
                  source={Track.Source.ScreenShare}
                  showIcon={false}
                  captureOptions={{ audio: true }}
                  className={cn(BTN, SIZE, IDLE, 'hidden md:flex border-none bg-transparent')}
                />
              }
            >
              <Monitor className={ICON} />
            </TooltipTrigger>
            <TooltipContent>Compartir pantalla</TooltipContent>
          </Tooltip>

          {/* Pantalla completa */}
          <Tooltip>
            <TooltipTrigger
              onClick={toggleFullscreen}
              className={cn(BTN, SIZE, IDLE)}
            >
              {isFullscreen ? <Minimize className={ICON} /> : <Maximize className={ICON} />}
            </TooltipTrigger>
            <TooltipContent>{isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}</TooltipContent>
          </Tooltip>

          {/* Grabación (solo organizador) */}
          {isOrganizer && (
            <Tooltip>
              <TooltipTrigger
                onClick={recording ? stopRecording : startRecording}
                className={cn(BTN, SIZE, recording ? ACTIVE : IDLE)}
              >
                {recording ? <StopCircle className={ICON} /> : <Circle className={ICON} />}
              </TooltipTrigger>
              <TooltipContent>{recording ? `Detener (${duration})` : 'Grabar sesión'}</TooltipContent>
            </Tooltip>
          )}
        </div>

        {/* Derecha: estado + salir */}
        <div className="flex items-center gap-2 md:gap-4">
          {recording ? (
            <div className="hidden sm:flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#8d3030] animate-pulse" />
              <span className="text-xs font-mono font-bold text-[#8d3030] tabular-nums">{duration}</span>
            </div>
          ) : (
            <div className="text-right hidden lg:block">
              <p className="text-[9px] text-[#1c1c1c]/35 font-bold uppercase tracking-widest">Estado</p>
              <p className="text-xs font-mono text-emerald-600 font-black uppercase">Seguro</p>
            </div>
          )}

          <DisconnectButton className={cn(
            buttonVariants({ variant: 'default' }),
            'h-13 md:h-11 px-4 md:px-6 bg-[#8d3030] hover:bg-[#7a2828] text-white rounded-2xl',
            'font-bold text-xs uppercase tracking-widest border-none shadow-md shadow-[#8d3030]/15 active:scale-95'
          )}>
            <span className="hidden sm:inline">Salir</span>
            <span className="sm:hidden text-sm">✕</span>
          </DisconnectButton>
        </div>
      </div>
    </TooltipProvider>
  );
};

// ── Botón de pista con toggle ─────────────────────────────────────────────────
function TrackBtn({ Icon, OffIcon, source, label }: {
  Icon: React.ElementType; OffIcon: React.ElementType;
  source: Track.Source; label: string;
}) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <Tooltip>
        <TooltipTrigger
          render={
            <TrackToggle
              source={source}
              showIcon={false}
              className={cn(
                BTN, SIZE,
                'bg-[#f8f5f0] border-[#1c1c1c]/10 text-[#1c1c1c]/60',
                'hover:bg-[#1c1c1c]/6 hover:text-[#1c1c1c]',
                'aria-[pressed=true]:bg-[#8d3030]/8 aria-[pressed=true]:text-[#8d3030] aria-[pressed=true]:border-[#8d3030]/20'
              )}
            />
          }
        >
          <TrackIcon Icon={Icon} OffIcon={OffIcon} source={source} />
        </TooltipTrigger>
        <TooltipContent>{label}</TooltipContent>
      </Tooltip>
      <span className="text-[8px] font-bold text-[#1c1c1c]/30 uppercase tracking-tighter hidden md:block">{label}</span>
    </div>
  );
}

function TrackIcon({ Icon, OffIcon, source }: { Icon: React.ElementType; OffIcon: React.ElementType; source: Track.Source }) {
  const { isMicrophoneEnabled, isCameraEnabled } = useLocalParticipant();
  const on = source === Track.Source.Microphone ? isMicrophoneEnabled : isCameraEnabled;
  const I = on ? Icon : OffIcon;
  return <I className={ICON} />;
}
