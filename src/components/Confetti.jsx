import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const COLORS = [
  '#f43f5e', '#ec4899', '#d946ef', '#a855f7', 
  '#8b5cf6', '#6366f1', '#3b82f6', '#0ea5e9', 
  '#06b6d4', '#14b8a6', '#10b981', '#22c55e', 
  '#84cc16', '#eab308', '#f97316', '#ef4444'
];

const SHAPES = ['square', 'circle', 'triangle'];

function generateConfettiPiece() {
  return {
    id: Math.random(),
    x: Math.random() * 100, // random start horizontal %
    y: -20, // start above screen
    size: Math.random() * 12 + 6,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    shape: SHAPES[Math.floor(Math.random() * SHAPES.length)],
    rotation: Math.random() * 360,
    spinSpeed: Math.random() * 720 - 360,
    delay: Math.random() * 0.5,
    duration: Math.random() * 2.5 + 1.5,
    sway: Math.random() * 60 - 30, // side sway amount
  };
}

export default function Confetti({ active }) {
  const [pieces, setPieces] = useState([]);

  useEffect(() => {
    if (active) {
      // Generate 120 pieces of confetti
      const newPieces = Array.from({ length: 120 }).map(generateConfettiPiece);
      setPieces(newPieces);

      // Auto-clear after 4 seconds
      const timer = setTimeout(() => {
        setPieces([]);
      }, 4500);

      return () => clearTimeout(timer);
    } else {
      setPieces([]);
    }
  }, [active]);

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      <AnimatePresence>
        {pieces.map((p) => (
          <motion.div
            key={p.id}
            initial={{ 
              opacity: 1, 
              x: `${p.x}vw`, 
              y: '-10vh', 
              rotate: p.rotation 
            }}
            animate={{
              y: '110vh',
              x: `${p.x + p.sway / 10}vw`,
              rotate: p.rotation + p.spinSpeed,
            }}
            exit={{ opacity: 0 }}
            transition={{
              duration: p.duration,
              delay: p.delay,
              ease: 'easeOut',
            }}
            style={{
              position: 'absolute',
              width: p.size,
              height: p.shape === 'triangle' ? 0 : p.size,
              backgroundColor: p.shape !== 'triangle' ? p.color : 'transparent',
              borderRadius: p.shape === 'circle' ? '50%' : '0%',
              // Triangle shape using borders
              borderLeft: p.shape === 'triangle' ? `${p.size / 2}px solid transparent` : 'none',
              borderRight: p.shape === 'triangle' ? `${p.size / 2}px solid transparent` : 'none',
              borderBottom: p.shape === 'triangle' ? `${p.size}px solid ${p.color}` : 'none',
            }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
