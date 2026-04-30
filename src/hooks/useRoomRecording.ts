import { useCallback, useRef, useState } from 'react';
import { useLocalParticipant, useRemoteParticipants } from '@livekit/components-react';
import { Track } from 'livekit-client';

const W = 1280;
const H = 720;
const FPS = 25;

function chooseMime() {
  const candidates = [
    'video/mp4;codecs=avc1,mp4a.40.2',
    'video/mp4',
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm',
  ];
  return candidates.find((t) => MediaRecorder.isTypeSupported(t)) ?? 'video/webm';
}

export function useRoomRecording(roomName: string) {
  const [recording, setRecording] = useState(false);
  const [duration, setDuration] = useState(0);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const drawIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const videoEls = useRef<HTMLVideoElement[]>([]);

  const { localParticipant } = useLocalParticipant();
  const remoteParticipants = useRemoteParticipants();

  const startRecording = useCallback(async () => {
    if (recording) return;

    // ── Canvas compositor ─────────────────────────────────────────────────
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const gfx = canvas.getContext('2d')!;

    // Crear un <video> por cada pista de cámara
    const makeVid = async (track: MediaStreamTrack) => {
      const v = document.createElement('video');
      v.autoplay = true;
      v.muted = true;
      v.playsInline = true;
      v.srcObject = new MediaStream([track]);
      await v.play().catch(() => {});
      return v;
    };

    const els: HTMLVideoElement[] = [];

    const localTrack = localParticipant
      .getTrackPublication(Track.Source.Camera)?.track?.mediaStreamTrack;
    if (localTrack) els.push(await makeVid(localTrack));

    for (const p of remoteParticipants) {
      const t = p.getTrackPublication(Track.Source.Camera)?.track?.mediaStreamTrack;
      if (t) els.push(await makeVid(t));
    }
    videoEls.current = els;

    const drawFrame = () => {
      gfx.fillStyle = '#1c1c1c';
      gfx.fillRect(0, 0, W, H);
      const n = videoEls.current.length;
      if (n === 0) return;
      const cols = n === 1 ? 1 : 2;
      const rows = Math.ceil(n / cols);
      const w = W / cols;
      const h = H / rows;
      videoEls.current.forEach((v, i) => {
        try { gfx.drawImage(v, (i % cols) * w, Math.floor(i / cols) * h, w, h); }
        catch { /* frame no disponible aún */ }
      });
    };

    // Pintar primer frame y arrancar loop
    drawFrame();
    drawIntervalRef.current = setInterval(drawFrame, 1000 / FPS);

    // ── Audio: mezclar todas las pistas ───────────────────────────────────
    const audioCtx = new AudioContext();
    audioCtxRef.current = audioCtx;
    const dest = audioCtx.createMediaStreamDestination();

    const connectMic = (track: MediaStreamTrack) =>
      audioCtx.createMediaStreamSource(new MediaStream([track])).connect(dest);

    const localMic = localParticipant
      .getTrackPublication(Track.Source.Microphone)?.track?.mediaStreamTrack;
    if (localMic) connectMic(localMic);
    for (const p of remoteParticipants) {
      const t = p.getTrackPublication(Track.Source.Microphone)?.track?.mediaStreamTrack;
      if (t) connectMic(t);
    }

    // ── Stream combinado: canvas vídeo + audio mezclado ───────────────────
    const combined = new MediaStream([
      ...canvas.captureStream(FPS).getVideoTracks(),
      ...dest.stream.getAudioTracks(),
    ]);

    // ── MediaRecorder ─────────────────────────────────────────────────────
    const mimeType = chooseMime();
    const ext = mimeType.startsWith('video/mp4') ? 'mp4' : 'webm';
    const recorder = new MediaRecorder(combined, { mimeType });
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
    if (drawIntervalRef.current) clearInterval(drawIntervalRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
    audioCtxRef.current?.close();
    videoEls.current.forEach((v) => { v.srcObject = null; });
    videoEls.current = [];
    recorderRef.current = null;
    setRecording(false);
    setDuration(0);
  }, []);

  const fmt = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  return { recording, duration: fmt(duration), startRecording, stopRecording };
}
