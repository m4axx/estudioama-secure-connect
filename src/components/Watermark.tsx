import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface WatermarkProps {
  username: string;
  roomName: string;
}

export const Watermark: React.FC<WatermarkProps> = ({ username, roomName }) => {
  const [sessionId] = useState(() => Math.random().toString(36).substring(2, 10).toUpperCase());
  const [timestamp, setTimestamp] = useState(new Date().toLocaleTimeString());

  useEffect(() => {
    const timer = setInterval(() => {
      setTimestamp(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const instances = [
    { id: 1, initialX: 15, initialY: 15, duration: 30 },
    { id: 2, initialX: 65, initialY: 45, duration: 40 },
    { id: 3, initialX: 25, initialY: 80, duration: 50 },
  ];

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-50 select-none mix-blend-overlay opacity-30">
      <AnimatePresence>
        {instances.map((inst) => (
          <motion.div
            key={inst.id}
            initial={{ opacity: 0 }}
            animate={{
              opacity: [0.2, 0.4, 0.2],
              x: [`${inst.initialX}%`, `${(inst.initialX + 15) % 90}%`, `${inst.initialX}%`],
              y: [`${inst.initialY}%`, `${(inst.initialY + 15) % 90}%`, `${inst.initialY}%`],
            }}
            transition={{
              duration: inst.duration,
              repeat: Infinity,
              ease: "linear",
            }}
            className="absolute whitespace-nowrap text-[8px] md:text-[10px] font-mono text-white flex flex-col gap-0.5 tracking-widest font-bold"
          >
            <div>
              <p>USER: {username} | CODE: {roomName}</p>
              <p>SECURE: {sessionId} | TS: {timestamp}</p>
              <div className="text-[32px] opacity-10 uppercase tracking-[1em] font-black mt-2">ESTUDIO AMA</div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
