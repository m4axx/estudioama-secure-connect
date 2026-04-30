import { useCallback, useRef, useState } from 'react';
import { useLocalParticipant, useRemoteParticipants } from '@livekit/components-react';
import { Track } from 'livekit-client';

function pickMimeType(): { mimeType: string; ext: string } {
  // Edge/Chrome soportan video/mp4 pero NO audio/mp4 — añadimos canvas 1x1
  // Safari soporta audio/mp4 directamente
  const candidates = [
    'audio/mp4;codecs=mp4a.40.2',
    'audio/mp4',
    'video/mp4;codecs=avc1,mp4a.40.2',
    'video/mp4',
    'audio/webm;codecs=opus',
    'audio/webm',
  ];
  const supported = candidates.find(t => MediaRecorder.isTypeSupported(t)) ?? 'audio/webm';
  const ext = supported.startsWith('audio/mp4') || supported.startsWith('video/mp4') ? 'mp4' : 'webm';
  return { mimeType: supported, ext };
}

export function useRoomRecording(roomName: string) {
  const [recording, setRecording] = useState(false);
  const [duration, setDuration] = useState(0);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

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
      ctx.createMediaStreamSource(new MediaStream([localTrack])).connect(dest);
    }

    // Mezclar audio de participantes remotos
    for (const participant of remoteParticipants) {
      const track = participant.getTrackPublication(Track.Source.Microphone)?.track?.mediaStreamTrack;
      if (track) {
        ctx.createMediaStreamSource(new MediaStream([track])).connect(dest);
      }
    }

    audioCtxRef.current = ctx;

    const { mimeType, ext } = pickMimeType();

    // Para video/mp4 (Edge/Chrome) necesitamos una pista de vídeo — canvas 1×1
    let stream = dest.stream;
    if (mimeType.startsWith('video/mp4')) {
      const canvas = document.createElement('canvas');
      canvas.width = 2;
      canvas.height = 2;
      // Pintar un pixel para que el encoder no se queje de stream vacío
      canvas.getContext('2d')?.fillRect(0, 0, 2, 2);
      canvasRef.current = canvas;
      const videoTrack = canvas.captureStream(1).getVideoTracks()[0];
      stream = new MediaStream([videoTrack, ...dest.stream.getAudioTracks()]);
    }

    const recorder = new MediaRecorder(stream, { mimeType });
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

    recorder.start(1000);
    recorderRef.current = recorder;
    setRecording(true);
    setDuration(0);
    timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
  }, [recording, localParticipant, remoteParticipants, roomName]);

  const stopRecording = useCallback(() => {
    recorderRef.current?.stop();
    audioCtxRef.current?.close();
    if (timerRef.current) clearInterval(timerRef.current);
    canvasRef.current = null;
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
