import { useCallback, useRef, useState } from 'react';
import { useLocalParticipant, useRemoteParticipants } from '@livekit/components-react';
import { Track } from 'livekit-client';
import { Muxer, ArrayBufferTarget } from 'mp4-muxer';

const SAMPLE_RATE = 48000;
const NUM_CHANNELS = 2;
const BITRATE = 128_000;

export function useRoomRecording(roomName: string) {
  const [recording, setRecording] = useState(false);
  const [duration, setDuration] = useState(0);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const encoderRef = useRef<AudioEncoder | null>(null);
  const muxerRef = useRef<Muxer<ArrayBufferTarget> | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const timestampRef = useRef(0);

  const { localParticipant } = useLocalParticipant();
  const remoteParticipants = useRemoteParticipants();

  const startRecording = useCallback(async () => {
    if (recording) return;

    // Muxer en memoria → MP4 estándar, seekable, compatible con WMP y todo lo demás
    const muxer = new Muxer({
      target: new ArrayBufferTarget(),
      audio: { codec: 'aac', numberOfChannels: NUM_CHANNELS, sampleRate: SAMPLE_RATE },
      fastStart: 'in-memory',
    });
    muxerRef.current = muxer;

    // Encoder AAC (mp4a.40.2 = AAC-LC), disponible en Edge/Chrome 94+
    const encoder = new AudioEncoder({
      output: (chunk, meta) => muxer.addAudioChunk(chunk, meta),
      error: (e) => console.error('[AMA Rec]', e),
    });
    encoder.configure({
      codec: 'mp4a.40.2',
      numberOfChannels: NUM_CHANNELS,
      sampleRate: SAMPLE_RATE,
      bitrate: BITRATE,
    });
    encoderRef.current = encoder;
    timestampRef.current = 0;

    // AudioContext para mezclar todas las pistas
    const ctx = new AudioContext({ sampleRate: SAMPLE_RATE });
    audioCtxRef.current = ctx;
    const merger = ctx.createChannelMerger(NUM_CHANNELS);

    const connectTrack = (mediaTrack: MediaStreamTrack) => {
      const src = ctx.createMediaStreamSource(new MediaStream([mediaTrack]));
      src.connect(merger);
    };

    // Audio local
    const localTrack = localParticipant
      .getTrackPublication(Track.Source.Microphone)?.track?.mediaStreamTrack;
    if (localTrack) connectTrack(localTrack);

    // Audio remoto
    for (const p of remoteParticipants) {
      const track = p.getTrackPublication(Track.Source.Microphone)?.track?.mediaStreamTrack;
      if (track) connectTrack(track);
    }

    // ScriptProcessor para capturar PCM y enviarlo al encoder
    const bufferSize = 4096;
    const processor = ctx.createScriptProcessor(bufferSize, NUM_CHANNELS, NUM_CHANNELS);
    processorRef.current = processor;

    processor.onaudioprocess = (e) => {
      if (encoder.state === 'closed') return;

      const left = e.inputBuffer.getChannelData(0);
      const right = e.inputBuffer.getChannelData(1);

      // Intercalar L/R en un buffer f32-planar
      const planar = new Float32Array(left.length * NUM_CHANNELS);
      planar.set(left, 0);
      planar.set(right, left.length);

      const audioData = new AudioData({
        format: 'f32-planar',
        sampleRate: SAMPLE_RATE,
        numberOfFrames: left.length,
        numberOfChannels: NUM_CHANNELS,
        timestamp: timestampRef.current,
        data: planar,
      });

      encoder.encode(audioData);
      audioData.close();
      // Avanzar timestamp en microsegundos
      timestampRef.current += Math.round((left.length / SAMPLE_RATE) * 1_000_000);
    };

    merger.connect(processor);
    processor.connect(ctx.destination);

    setRecording(true);
    setDuration(0);
    timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
  }, [recording, localParticipant, remoteParticipants, roomName]);

  const stopRecording = useCallback(async () => {
    if (!encoderRef.current || !muxerRef.current) return;

    // Detener captura
    processorRef.current?.disconnect();
    processorRef.current = null;
    if (timerRef.current) clearInterval(timerRef.current);

    // Flush encoder y cerrar muxer
    await encoderRef.current.flush();
    encoderRef.current.close();
    muxerRef.current.finalize();

    const { buffer } = muxerRef.current.target;
    audioCtxRef.current?.close();

    // Descargar como MP4 estándar
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
    encoderRef.current = null;
    muxerRef.current = null;
  }, [roomName]);

  const formatDuration = (s: number) => {
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  };

  return { recording, duration: formatDuration(duration), startRecording, stopRecording };
}
