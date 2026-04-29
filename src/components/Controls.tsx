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
      <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-[40px] px-10 py-5 flex items-center justify-between shadow-2xl">
        <div className="flex gap-6">
          <ControlButton Icon={Mic} ActiveIcon={MicOff} label="Mute" source={Track.Source.Microphone} />
          <ControlButton Icon={Video} ActiveIcon={VideoOff} label="Video" source={Track.Source.Camera} />
        </div>

        <div className="flex gap-3 items-center bg-black/30 px-6 py-2 rounded-3xl border border-white/5">
           <Tooltip>
            <TooltipTrigger 
              className={cn(
                buttonVariants({ variant: "ghost", size: "icon" }),
                "rounded-2xl w-12 h-12 transition-all", 
                showChat ? "bg-red-500/20 text-red-500" : "text-slate-400 hover:text-white"
              )}
              onClick={onToggleChat}
            >
              <MessageSquare className="w-6 h-6" />
            </TooltipTrigger>
            <TooltipContent>Room Chat</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger
              render={
                <TrackToggle
                  source={Track.Source.ScreenShare}
                  showIcon={false}
                  className={cn(
                    buttonVariants({ variant: "ghost", size: "icon" }),
                    "rounded-2xl w-12 h-12 text-red-500 hover:bg-red-500/10 border-none bg-transparent"
                  )}
                >
                  <Monitor className="w-6 h-6" />
                </TrackToggle>
              }
            />
            <TooltipContent>Broadcast Screen</TooltipContent>
          </Tooltip>

          <Button variant="ghost" size="icon" className="rounded-2xl w-12 h-12 text-slate-400">
             <Settings className="w-6 h-6" />
          </Button>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-right hidden sm:block">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Call Status</p>
            <p className="text-sm font-mono text-emerald-500 uppercase font-black">Secure</p>
          </div>
          <DisconnectButton 
            className={cn(
              buttonVariants({ variant: "default" }),
              "px-8 py-4 bg-red-500 hover:bg-red-600 text-white rounded-2xl font-bold text-xs uppercase tracking-widest transition-all shadow-lg shadow-red-500/20 active:scale-95 border-none h-auto"
            )}
          >
            Leave Call
          </DisconnectButton>
        </div>
      </div>
    </TooltipProvider>
  );
};

function ControlButton({ Icon, ActiveIcon, label, source }: { Icon: React.ElementType, ActiveIcon: React.ElementType, label: string, source: any }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <Tooltip>
        <TooltipTrigger
          render={
            <TrackToggle
              source={source}
              showIcon={false}
              className={cn(
                "w-14 h-14 rounded-2xl transition-all shadow-sm border border-slate-800 bg-slate-800 text-slate-200 hover:bg-slate-700 flex items-center justify-center aria-[pressed=true]:bg-red-500/10 aria-[pressed=true]:text-red-500 aria-[pressed=true]:border-red-500/20"
              )}
            >
              <TrackStatusIcon Icon={Icon} ActiveIcon={ActiveIcon} source={source} />
            </TrackToggle>
          }
        />
        <TooltipContent>{label}</TooltipContent>
      </Tooltip>
      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">{label}</span>
    </div>
  );
}

function TrackStatusIcon({ Icon, ActiveIcon, source }: { Icon: React.ElementType, ActiveIcon: React.ElementType, source: any }) {
  const { isMicrophoneEnabled, isCameraEnabled } = useLocalParticipant();
  const enabled = source === Track.Source.Microphone ? isMicrophoneEnabled : isCameraEnabled;
  const CurrentIcon = enabled ? Icon : ActiveIcon;
  return <CurrentIcon className="w-6 h-6" />;
}
