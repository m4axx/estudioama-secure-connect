import { useCallback, useRef, useState } from 'react';
import { useLocalParticipant, useRemoteParticipants } from '@livekit/components-react';
import { Track } from 'livekit-client';
import { Muxer, ArrayBufferTarget } from 'mp4-muxer';

const SAMPLE_RATE = 48000;
const NUM_CHANNELS = 2;
const AUDIO_BITRATE = 128_000;
const WIDTH = 1280;
const HEIGHT = 720;
const FPS = 25;
const VIDEO_BITRATE = 2_500_000;

export function useRoomRecording(roomName: string) {
  const [recording, setRecording] = useState(false);
  const [duration, setDuration] = useState(0);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const videoIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioEncoderRef = useRef<AudioEncoder | null>(null);
  const videoEncoderRef = useRef<VideoEncoder | null>(null);
  const muxerRef = useRef<Muxer<ArrayBufferTarget> | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const audioTimestampRef = useRef(0);
  const videoFrameCountRef = useRef(0);
  const videoElementsRef = useRef<HTMLVideoElement[]>([]);

  const { localParticipant } = useLocalParticipant();
  const remoteParticipants = useRemoteParticipants();

  const startRecording = useCallback(async () => {
    if (recording) return;

    // ── Muxer ───────────────────────────────────────────────────────────────
    const muxer = new Muxer({
      target: new ArrayBufferTarget(),
      video: { codec: 'avc', width: WIDTH, height: HEIGHT },
      audio: { codec: 'aac', numberOfChannels: NUM_CHANNELS, sampleRate: SAMPLE_RATE },
      fastStart: 'in-memory',
    });
    muxerRef.current = muxer;

    // ── Encoder de vídeo H.264 ───────────────────────────────────────────────
    const videoEncoder = new VideoEncoder({
      output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
      error: (e) => console.error('[AMA Rec video]', e),
    });
    videoEncoder.configure({
      codec: 'avc1.42001f',       // H.264 Baseline Level 3.1
      width: WIDTH,
      height: HEIGHT,
      bitrate: VIDEO_BITRATE,
      framerate: FPS,
      latencyMode: 'quality',
    });
    videoEncoderRef.current = videoEncoder;
    videoFrameCountRef.current = 0;

    // ── Encoder de audio AAC ─────────────────────────────────────────────────
    const audioEncoder = new AudioEncoder({
      output: (chunk, meta) => muxer.addAudioChunk(chunk, meta),
      error: (e) => console.error('[AMA Rec audio]', e),
    });
    audioEncoder.configure({
      codec: 'mp4a.40.2',
      numberOfChannels: NUM_CHANNELS,
      sampleRate: SAMPLE_RATE,
      bitrate: AUDIO_BITRATE,
    });
    audioEncoderRef.current = audioEncoder;
    audioTimestampRef.current = 0;

    // ── Audio: mezclar todas las pistas ──────────────────────────────────────
    const ctx = new AudioContext({ sampleRate: SAMPLE_RATE });
    audioCtxRef.current = ctx;
    const merger = ctx.createChannelMerger(NUM_CHANNELS);

    const connectAudio = (track: MediaStreamTrack) => {
      ctx.createMediaStreamSource(new MediaStream([track])).connect(merger);
    };

    const localMic = localParticipant
      .getTrackPublication(Track.Source.Microphone)?.track?.mediaStreamTrack;
    if (localMic) connectAudio(localMic);

    for (const p of remoteParticipants) {
      const t = p.getTrackPublication(Track.Source.Microphone)?.track?.mediaStreamTrack;
      if (t) connectAudio(t);
    }

    const processor = ctx.createScriptProcessor(4096, NUM_CHANNELS, NUM_CHANNELS);
    processorRef.current = processor;
    processor.onaudioprocess = (e) => {
      if (audioEncoder.state === 'closed') return;
      const left = e.inputBuffer.getChannelData(0);
      const right = e.inputBuffer.getChannelData(1);
      const planar = new Float32Array(left.length * 2);
      planar.set(left, 0);
      planar.set(right, left.length);
      const audioData = new AudioData({
        format: 'f32-planar',
        sampleRate: SAMPLE_RATE,
        numberOfFrames: left.length,
        numberOfChannels: NUM_CHANNELS,
        timestamp: audioTimestampRef.current,
        data: planar,
      });
      audioEncoder.encode(audioData);
      audioData.close();
      audioTimestampRef.current += Math.round((left.length / SAMPLE_RATE) * 1_000_000);
    };
    merger.connect(processor);
    processor.connect(ctx.destination);

    // ── Vídeo: crear elementos <video> para cada participante ────────────────
    const videoElements: HTMLVideoElement[] = [];

    const makeVideoEl = async (track: MediaStreamTrack) => {
      const el = document.createElement('video');
      el.autoplay = true;
      el.muted = true;
      el.playsInline = true;
      el.width = WIDTH;
      el.height = HEIGHT;
      el.srcObject = new MediaStream([track]);
      await el.play().catch(() => {});
      videoElements.push(el);
    };

    const localCam = localParticipant
      .getTrackPublication(Track.Source.Camera)?.track?.mediaStreamTrack;
    if (localCam) await makeVideoEl(localCam);

    for (const p of remoteParticipants) {
      const t = p.getTrackPublication(Track.Source.Camera)?.track?.mediaStreamTrack;
      if (t) await makeVideoEl(t);
    }
    videoElementsRef.current = videoElements;

    // ── Canvas compositor ────────────────────────────────────────────────────
    const canvas = document.createElement('canvas');
    canvas.width = WIDTH;
    canvas.height = HEIGHT;
    const gfx = canvas.getContext('2d')!;

    const drawFrame = () => {
      gfx.fillStyle = '#1c1c1c';
      gfx.fillRect(0, 0, WIDTH, HEIGHT);
      const els = videoElementsRef.current;
      if (els.length === 0) return;
      const cols = els.length === 1 ? 1 : 2;
      const rows = Math.ceil(els.length / cols);
      const w = WIDTH / cols;
      const h = HEIGHT / rows;
      els.forEach((v, i) => {
        gfx.drawImage(v, (i % cols) * w, Math.floor(i / cols) * h, w, h);
      });
    };

    // Loop de captura de frames
    const intervalMs = 1000 / FPS;
    videoIntervalRef.current = setInterval(() => {
      if (videoEncoder.state === 'closed') return;
      drawFrame();
      const frame = new VideoFrame(canvas, {
        timestamp: Math.round(videoFrameCountRef.current * (1_000_000 / FPS)),
      });
      const keyFrame = videoFrameCountRef.current % (FPS * 2) === 0;
      videoEncoder.encode(frame, { keyFrame });
      frame.close();
      videoFrameCountRef.current++;
    }, intervalMs);

    setRecording(true);
    setDuration(0);
    timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
  }, [recording, localParticipant, remoteParticipants, roomName]);

  const stopRecording = useCallback(async () => {
    if (!videoEncoderRef.current || !audioEncoderRef.current || !muxerRef.current) return;

    // Parar bucles
    if (videoIntervalRef.current) clearInterval(videoIntervalRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
    processorRef.current?.disconnect();

    // Flush y cerrar encoders
    await videoEncoderRef.current.flush();
    videoEncoderRef.current.close();
    await audioEncoderRef.current.flush();
    audioEncoderRef.current.close();

    // Finalizar muxer y descargar
    muxerRef.current.finalize();
    const { buffer } = muxerRef.current.target;
    audioCtxRef.current?.close();

    // Limpiar elementos de vídeo
    videoElementsRef.current.forEach((v) => { v.srcObject = null; });
    videoElementsRef.current = [];

    const blob = new Blob([buffer], { type: 'video/mp4' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const date = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    a.href = url;
    a.download = `AMA-sesion-${roomName}-${date}.mp4`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setRecording(false);
    setDuration(0);
    videoEncoderRef.current = null;
    audioEncoderRef.current = null;
    muxerRef.current = null;
  }, [roomName]);

  const fmt = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  return { recording, duration: fmt(duration), startRecording, stopRecording };
}
