import React from 'react';
import {
  DisconnectButton,
  TrackToggle,
  useLocalParticipant
} from '@livekit/components-react';
import { Track } from 'livekit-client';
import {
  Mic, MicOff,
  Video, VideoOff,
  Monitor,
  MessageSquare,
  Settings
} from 'lucide-react';
import { Button, buttonVariants } from './ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from './ui/tooltip';
import { cn } from '@/lib/utils';

interface ControlsProps {
  onToggleChat: () => void;
  onToggleParticipants: () => void;
  showChat: boolean;
  showParticipants: boolean;
}

export const Controls: React.FC<ControlsProps> = ({
  onToggleChat,
  onToggleParticipants,
  showChat,
  showParticipants
}) => {
  return (
    <TooltipProvider>
      <div className="bg-[#fffefe] border border-[#1c1c1c]/10 rounded-[32px] px-5 md:px-8 py-3 md:py-4 flex items-center justify-between shadow-sm">
        {/* Controles principales */}
        <div className="flex gap-4 md:gap-5">
          <ControlButton Icon={Mic} ActiveIcon={MicOff} label="Micrófono" source={Track.Source.Microphone} />
          <ControlButton Icon={Video} ActiveIcon={VideoOff} label="Cámara" source={Track.Source.Camera} />
        </div>

        {/* Controles secundarios */}
        <div className="flex gap-1.5 md:gap-2 items-center bg-[#f8f5f0] px-3 md:px-4 py-2 rounded-2xl border border-[#1c1c1c]/8">
          <Tooltip>
            <TooltipTrigger
              className={cn(
                buttonVariants({ variant: "ghost", size: "icon" }),
                "rounded-xl w-9 h-9 md:w-10 md:h-10 transition-all",
                showChat
                  ? "bg-[#8d3030]/10 text-[#8d3030]"
                  : "text-[#1c1c1c]/40 hover:text-[#1c1c1c] hover:bg-[#1c1c1c]/6"
              )}
              onClick={onToggleChat}
            >
              <MessageSquare className="w-4 h-4 md:w-5 md:h-5" />
            </TooltipTrigger>
            <TooltipContent>Chat de sesión</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger
              render={
                <TrackToggle
                  source={Track.Source.ScreenShare}
                  showIcon={false}
                  className={cn(
                    buttonVariants({ variant: "ghost", size: "icon" }),
                    "rounded-xl w-9 h-9 md:w-10 md:h-10 text-[#1c1c1c]/40 hover:text-[#1c1c1c] hover:bg-[#1c1c1c]/6 border-none bg-transparent hidden md:flex"
                  )}
                >
                  <Monitor className="w-5 h-5" />
                </TrackToggle>
              }
            />
            <TooltipContent>Compartir pantalla</TooltipContent>
          </Tooltip>

          <Button
            variant="ghost"
            size="icon"
            className="rounded-xl w-9 h-9 md:w-10 md:h-10 text-[#1c1c1c]/40 hover:text-[#1c1c1c] hover:bg-[#1c1c1c]/6 hidden md:flex"
          >
            <Settings className="w-5 h-5" />
          </Button>
        </div>

        {/* Estado + salir */}
        <div className="flex items-center gap-3 md:gap-5">
          <div className="text-right hidden sm:block">
            <p className="text-[9px] text-[#1c1c1c]/35 font-bold uppercase tracking-widest">Estado</p>
            <p className="text-xs font-mono text-emerald-600 uppercase font-black">Seguro</p>
          </div>
          <DisconnectButton
            className={cn(
              buttonVariants({ variant: "default" }),
              "px-5 md:px-7 py-2.5 bg-[#8d3030] hover:bg-[#7a2828] text-white rounded-xl font-bold text-xs uppercase tracking-widest transition-all shadow-md shadow-[#8d3030]/15 active:scale-95 border-none h-auto"
            )}
          >
            <span className="hidden sm:inline">Salir de la sesión</span>
            <span className="sm:hidden">Salir</span>
          </DisconnectButton>
        </div>
      </div>
    </TooltipProvider>
  );
};

function ControlButton({ Icon, ActiveIcon, label, source }: {
  Icon: React.ElementType;
  ActiveIcon: React.ElementType;
  label: string;
  source: any;
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <Tooltip>
        <TooltipTrigger
          render={
            <TrackToggle
              source={source}
              showIcon={false}
              className={cn(
                "w-11 h-11 md:w-13 md:h-13 rounded-2xl transition-all border flex items-center justify-center",
                "bg-[#f8f5f0] border-[#1c1c1c]/10 text-[#1c1c1c]/60 hover:bg-[#1c1c1c]/6 hover:text-[#1c1c1c]",
                "aria-[pressed=true]:bg-[#8d3030]/8 aria-[pressed=true]:text-[#8d3030] aria-[pressed=true]:border-[#8d3030]/20"
              )}
            >
              <TrackStatusIcon Icon={Icon} ActiveIcon={ActiveIcon} source={source} />
            </TrackToggle>
          }
        />
        <TooltipContent>{label}</TooltipContent>
      </Tooltip>
      <span className="text-[8px] font-bold text-[#1c1c1c]/30 uppercase tracking-tighter hidden md:block">{label}</span>
    </div>
  );
}

function TrackStatusIcon({ Icon, ActiveIcon, source }: {
  Icon: React.ElementType;
  ActiveIcon: React.ElementType;
  source: any;
}) {
  const { isMicrophoneEnabled, isCameraEnabled } = useLocalParticipant();
  const enabled = source === Track.Source.Microphone ? isMicrophoneEnabled : isCameraEnabled;
  const CurrentIcon = enabled ? Icon : ActiveIcon;
  return <CurrentIcon className="w-5 h-5" />;
}
