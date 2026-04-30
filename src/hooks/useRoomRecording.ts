import { useCallback, useRef, useState } from 'react';
import { useLocalParticipant, useRemoteParticipants } from '@livekit/components-react';
import { Track } from 'livekit-client';

export function useRoomRecording(roomName: string) {
  const [recording, setRecording] = useState(false);
  const [duration, setDuration] = useState(0);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { localParticipant } = useLocalParticipant();
  const remoteParticipants = useRemoteParticipants();

  const startRecording = useCallback(async () => {
    if (recording) return;

    const ctx = new AudioContext();
    const dest = ctx.createMediaStreamDestination();

    // Mezclar audio local
    const localMicPub = localParticipant.getTrackPublication(Track.Source.Microphone);
    const localTrack = localMicPub?.track?.mediaStreamTrack;
    if (localTrack) {
      const src = ctx.createMediaStreamSource(new MediaStream([localTrack]));
      src.connect(dest);
    }

    // Mezclar audio de cada participante remoto
    for (const participant of remoteParticipants) {
      const pub = participant.getTrackPublication(Track.Source.Microphone);
      const track = pub?.track?.mediaStreamTrack;
      if (track) {
        const src = ctx.createMediaStreamSource(new MediaStream([track]));
        src.connect(dest);
      }
    }

    audioCtxRef.current = ctx;

    const mimeType = MediaRecorder.isTypeSupported('audio/mp4')
      ? 'audio/mp4'
      : MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm';

    const ext = mimeType.includes('mp4') ? 'mp4' : 'webm';

    const recorder = new MediaRecorder(dest.stream, { mimeType });
    chunksRef.current = [];

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const date = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      a.href = url;
      a.download = `AMA-sesion-${roomName}-${date}.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    };

    recorder.start(1000); // chunk cada segundo
    recorderRef.current = recorder;

    setRecording(true);
    setDuration(0);
    timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
  }, [recording, localParticipant, remoteParticipants, roomName]);

  const stopRecording = useCallback(() => {
    recorderRef.current?.stop();
    audioCtxRef.current?.close();
    if (timerRef.current) clearInterval(timerRef.current);
    setRecording(false);
    setDuration(0);
  }, []);

  const formatDuration = (s: number) => {
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  };

  return { recording, duration: formatDuration(duration), startRecording, stopRecording };
}
