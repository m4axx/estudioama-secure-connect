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
  showChat,
}) => {
  return (
    <TooltipProvider>
      <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-[28px] md:rounded-[40px] px-4 md:px-10 py-3 md:py-5 flex items-center justify-between gap-2 shadow-2xl w-full">

        {/* Track toggles — mic + cam */}
        <div className="flex gap-3 md:gap-6">
          <ControlButton Icon={Mic} ActiveIcon={MicOff} label="Mic" source={Track.Source.Microphone} />
          <ControlButton Icon={Video} ActiveIcon={VideoOff} label="Video" source={Track.Source.Camera} />
        </div>

        {/* Centre actions */}
        <div className="flex gap-2 md:gap-3 items-center bg-black/30 px-3 md:px-6 py-2 rounded-3xl border border-white/5">
          {/* Chat toggle */}
          <Tooltip>
            <TooltipTrigger
              className={cn(
                buttonVariants({ variant: 'ghost', size: 'icon' }),
                'rounded-2xl w-10 h-10 md:w-12 md:h-12 transition-all',
                showChat ? 'bg-red-500/20 text-red-500' : 'text-slate-400 hover:text-white'
              )}
              onClick={onToggleChat}
            >
              <MessageSquare className="w-5 h-5 md:w-6 md:h-6" />
            </TooltipTrigger>
            <TooltipContent>Room Chat</TooltipContent>
          </Tooltip>

          {/* Screen share — desktop only */}
          <Tooltip>
            <TooltipTrigger
              render={
                <TrackToggle
                  source={Track.Source.ScreenShare}
                  showIcon={false}
                  className={cn(
                    buttonVariants({ variant: 'ghost', size: 'icon' }),
                    'hidden md:flex rounded-2xl w-12 h-12 text-slate-400 hover:bg-slate-700/50 border-none bg-transparent'
                  )}
                />
              }
            >
              <Monitor className="w-6 h-6" />
            </TooltipTrigger>
            <TooltipContent>Broadcast Screen</TooltipContent>
          </Tooltip>

          <Button
            variant="ghost"
            size="icon"
            className="hidden md:flex rounded-2xl w-12 h-12 text-slate-400"
          >
            <Settings className="w-6 h-6" />
          </Button>
        </div>

        {/* Disconnect */}
        <div className="flex items-center gap-3 md:gap-6">
          <div className="text-right hidden md:block">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Call Status</p>
            <p className="text-sm font-mono text-emerald-500 uppercase font-black">Secure</p>
          </div>
          <DisconnectButton
            className={cn(
              buttonVariants({ variant: 'default' }),
              'px-4 md:px-8 py-2 md:py-4 bg-red-500 hover:bg-red-600 text-white rounded-2xl font-bold text-xs uppercase tracking-widest transition-all shadow-lg shadow-red-500/20 active:scale-95 border-none h-auto'
            )}
          >
            <span className="hidden md:inline">Leave Call</span>
            <span className="md:hidden">End</span>
          </DisconnectButton>
        </div>
      </div>
    </TooltipProvider>
  );
};

// ControlButton — children go to TooltipTrigger so Base UI merges them into TrackToggle
function ControlButton({
  Icon,
  ActiveIcon,
  label,
  source,
}: {
  Icon: React.ElementType;
  ActiveIcon: React.ElementType;
  label: string;
  source: Track.Source;
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <Tooltip>
        <TooltipTrigger
          render={
            <TrackToggle
              source={source}
              showIcon={false}
              className="w-12 h-12 md:w-14 md:h-14 rounded-2xl transition-all shadow-sm border border-slate-800 bg-slate-800 text-slate-200 hover:bg-slate-700 flex items-center justify-center aria-[pressed=true]:bg-red-500/10 aria-[pressed=true]:text-red-500 aria-[pressed=true]:border-red-500/20"
            />
          }
        >
          <TrackStatusIcon Icon={Icon} ActiveIcon={ActiveIcon} source={source} />
        </TooltipTrigger>
        <TooltipContent>{label}</TooltipContent>
      </Tooltip>
      <span className="hidden md:block text-[9px] font-bold text-slate-500 uppercase tracking-tighter">
        {label}
      </span>
    </div>
  );
}

function TrackStatusIcon({
  Icon,
  ActiveIcon,
  source,
}: {
  Icon: React.ElementType;
  ActiveIcon: React.ElementType;
  source: Track.Source;
}) {
  const { isMicrophoneEnabled, isCameraEnabled } = useLocalParticipant();
  const enabled =
    source === Track.Source.Microphone ? isMicrophoneEnabled : isCameraEnabled;
  const CurrentIcon = enabled ? Icon : ActiveIcon;
  return <CurrentIcon className="w-5 h-5 md:w-6 md:h-6" />;
}
