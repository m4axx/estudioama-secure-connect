import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface WatermarkProps {
  username: string;
  roomName: string;
}

export const Watermark: React.FC<WatermarkProps> = ({ username, roomName }) => {
  const [sessionId] = useState(() => Math.random().toString(36).substring(2, 10).toUpperCase());
  const [timestamp, setTimestamp] = useState(new Date().toLocaleTimeString('es-ES'));

  useEffect(() => {
    const timer = setInterval(() => {
      setTimestamp(new Date().toLocaleTimeString('es-ES'));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const instances = [
    { id: 1, initialX: 15, initialY: 15, duration: 30 },
    { id: 2, initialX: 60, initialY: 45, duration: 40 },
    { id: 3, initialX: 20, initialY: 75, duration: 50 },
  ];

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-50 select-none mix-blend-overlay opacity-25">
      <AnimatePresence>
        {instances.map((inst) => (
          <motion.div
            key={inst.id}
            initial={{ opacity: 0 }}
            animate={{
              opacity: [0.3, 0.5, 0.3],
              x: [`${inst.initialX}%`, `${(inst.initialX + 12) % 88}%`, `${inst.initialX}%`],
              y: [`${inst.initialY}%`, `${(inst.initialY + 12) % 88}%`, `${inst.initialY}%`],
            }}
            transition={{ duration: inst.duration, repeat: Infinity, ease: "linear" }}
            className="absolute whitespace-nowrap text-[8px] md:text-[9px] font-mono text-white flex flex-col gap-0.5 tracking-widest font-bold"
          >
            <p>USUARIO: {username} | SALA: {roomName}</p>
            <p>SESIÓN: {sessionId} | {timestamp}</p>
            <div className="text-[28px] opacity-8 uppercase tracking-[0.8em] font-black mt-1">AMA</div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
