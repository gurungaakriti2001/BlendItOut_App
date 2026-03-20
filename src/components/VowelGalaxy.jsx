// @ts-nocheck

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const createUFOSound = () => {
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const mainOsc = audioCtx.createOscillator();
  const subOsc = audioCtx.createOscillator();
  const rhythmicLFO = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();
  const lfoGain = audioCtx.createGain();
  const filter = audioCtx.createBiquadFilter();

  mainOsc.type = 'sine';
  subOsc.type = 'sine';
  rhythmicLFO.type = 'sine';

  const baseFreq = 220.00;
  mainOsc.frequency.setValueAtTime(baseFreq, audioCtx.currentTime);
  subOsc.frequency.setValueAtTime(baseFreq * 0.5, audioCtx.currentTime);
  rhythmicLFO.frequency.setValueAtTime(2, audioCtx.currentTime);

  filter.type = 'lowpass';
  filter.Q.setValueAtTime(10, audioCtx.currentTime);
  filter.frequency.setValueAtTime(400, audioCtx.currentTime);

  rhythmicLFO.connect(lfoGain);
  lfoGain.connect(filter.frequency);
  lfoGain.gain.setValueAtTime(300, audioCtx.currentTime);

  mainOsc.connect(filter);
  subOsc.connect(filter);
  filter.connect(gainNode);
  gainNode.connect(audioCtx.destination);
  gainNode.gain.setValueAtTime(0, audioCtx.currentTime);

  mainOsc.start();
  subOsc.start();
  rhythmicLFO.start();

  return {
    start: () => {
      if (audioCtx.state === 'suspended') audioCtx.resume();
      gainNode.gain.setTargetAtTime(0.12, audioCtx.currentTime, 0.2);
    },
    stop: () => {
      gainNode.gain.setTargetAtTime(0, audioCtx.currentTime, 0.3);
    },
    dispose: () => {
      try { mainOsc.stop(); subOsc.stop(); rhythmicLFO.stop(); audioCtx.close(); } catch(e) {}
    }
  };
};

const VowelUFO = ({ data, isSelected, hasSelection, isBlurred, onClick, index }) => {
  const { vowel, color, image, word } = data;
  const [isHovered, setIsHovered] = useState(false);
  const soundRef = useRef(null);

  useEffect(() => {
    soundRef.current = createUFOSound();
    return () => soundRef.current?.dispose();
  }, []);

  const handleMouseEnter = () => {
    if (!hasSelection) { setIsHovered(true); soundRef.current?.start(); }
  };
  const handleMouseLeave = () => {
    setIsHovered(false); soundRef.current?.stop();
  };

  return (
    <motion.div
      onClick={!hasSelection ? onClick : undefined}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      initial={{ opacity: 0, scale: 0.8 }}
      whileHover={!hasSelection ? { scale: 1.18, transition: { type: "spring", stiffness: 400, damping: 15 } } : {}}
      animate={{
        opacity: isBlurred ? 0.3 : 1,
        scale: isSelected ? 1.25 : (isBlurred ? 0.75 : 1),
        filter: isBlurred ? 'blur(10px) grayscale(80%)' : 'blur(0px)',
        y: isSelected ? 0 : [0, -15, 0],
      }}
      transition={{
        type: "spring", stiffness: 150, damping: 15,
        y: isSelected ? { type: "spring" } : { duration: 4 + index * 0.5, repeat: Infinity, ease: "easeInOut" }
      }}
      className={`flex flex-col items-center relative ${!hasSelection ? 'cursor-pointer' : ''} z-10 w-[18vw] max-w-[150px]`}
    >
      <div className="relative w-full flex flex-col items-center">
        <AnimatePresence>
          {isHovered && !hasSelection && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 0.4, scale: 1.6 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 rounded-full blur-[80px] z-0 pointer-events-none"
              style={{ backgroundColor: color }}
            />
          )}
        </AnimatePresence>

        {/* UFO Cockpit */}
        <div className="relative w-[72%] h-16 md:h-24 bg-white/10 rounded-t-[100px] border-t-2 border-x-2 border-white/30 backdrop-blur-2xl z-20 flex items-center justify-center -mb-1 overflow-hidden shadow-[inset_0_4px_20px_rgba(255,255,255,0.2)]">
          <div className="absolute top-2 left-3 w-[45%] h-[25%] bg-white/20 rounded-full blur-[3px] -rotate-12" />
          <motion.span
            animate={{
              textShadow: isHovered ? `0 0 30px ${color}, 0 0 10px white` : `0 0 10px ${color}44`,
              scale: isHovered ? 1.1 : 1,
              y: 2
            }}
            className="text-4xl md:text-6xl font-black select-none z-10"
            style={{ color }}
          >
            {vowel}
          </motion.span>
        </div>

        {/* UFO Base */}
        <div className="relative w-full h-8 md:h-12 bg-gradient-to-b from-slate-600 to-slate-900 rounded-full border border-white/20 shadow-2xl z-30 flex items-center justify-around px-3">
          <div className={`w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_red] ${isHovered ? 'animate-pulse' : ''}`} />
          <div className={`w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_cyan] ${isHovered ? 'animate-pulse delay-75' : ''}`} />
          <div className={`w-2 h-2 rounded-full bg-yellow-400 shadow-[0_0_8px_yellow] ${isHovered ? 'animate-pulse delay-150' : ''}`} />
        </div>

        {/* Beam and Asset */}
        <div className="relative w-full flex flex-col items-center pointer-events-none">
          <motion.div
            animate={{
              opacity: isSelected ? 0 : (isHovered ? 0.9 : 0.25),
              scaleX: isHovered ? 1.4 : 1,
              filter: isHovered ? 'blur(1px) brightness(1.6)' : 'blur(5px) brightness(1)'
            }}
            className="w-[90%] h-24 md:h-44 -mt-3 origin-top"
            style={{
              background: `linear-gradient(to bottom, ${color}, transparent)`,
              clipPath: 'polygon(15% 0%, 85% 0%, 100% 100%, 0% 100%)'
            }}
          />
          <AnimatePresence>
            {!isSelected && (
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute top-10 flex items-center justify-center w-full h-24 md:h-32"
              >
                <motion.img
                  animate={{
                    y: isHovered ? [0, -15, 0] : [0, -5, 0],
                    rotate: isHovered ? [0, 10, -10, 0] : 0,
                    scale: isHovered ? 1.1 : 1
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                  src={image}
                  alt={word}
                  className="w-20 h-20 md:w-28 md:h-28 object-contain drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)]"
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};

const VOWELS = [
  { vowel: 'A', color: '#ff3b30', word: 'APPLE',    image: '/images/cvc/at/cat.jpeg' },
  { vowel: 'E', color: '#34c759', word: 'ELEPHANT', image: '/images/cvc/en/hen.jpeg' },
  { vowel: 'I', color: '#58ccfb', word: 'INSECT',   image: '/images/cvc/ig/pig.jpeg' },
  { vowel: 'O', color: '#ff9500', word: 'OCTOPUS',  image: '/images/cvc/og/dog.jpeg' },
  { vowel: 'U', color: '#af52de', word: 'UP',       image: '/images/cvc/ug/bug.jpeg' },
];

export default function VowelGalaxy({ onBack, playClick = () => {} }) {
  const [selectedIdx, setSelectedIdx] = useState(null);

  return (
    <div className="w-full h-full flex flex-col relative overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 z-50 flex-shrink-0">
        <button onClick={() => { playClick(); onBack(); }} className="w-10 h-10 bg-[#F48D8A] rounded-xl flex items-center justify-center shadow-lg">
          <span className="text-white text-xl font-black">←</span>
        </button>
        <motion.h1
          initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
          className="text-4xl md:text-6xl font-black tracking-tighter italic text-white drop-shadow-[0_0_40px_rgba(255,255,255,0.15)]"
        >
          VOWEL GALAXY
        </motion.h1>
        <div className="w-10" />
      </div>

      {/* UFOs */}
      <div className="flex-1 flex items-center justify-center px-4 relative">
        <div className="flex flex-nowrap items-end justify-center w-full gap-2 md:gap-10 pb-16">
          {VOWELS.map((data, idx) => (
            <VowelUFO
              key={data.vowel}
              index={idx}
              data={data}
              isSelected={selectedIdx === idx}
              hasSelection={selectedIdx !== null}
              isBlurred={selectedIdx !== null && selectedIdx !== idx}
              onClick={() => setSelectedIdx(idx)}
            />
          ))}
        </div>
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedIdx !== null && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/95 backdrop-blur-3xl flex items-center justify-center p-6"
            onClick={() => setSelectedIdx(null)}
          >
            <motion.div
              initial={{ scale: 0.8, y: 30 }} animate={{ scale: 1, y: 0 }}
              className="bg-slate-900/40 border border-white/5 p-12 rounded-[5rem] flex flex-col items-center max-w-sm w-full shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="relative mb-8">
                <div className="absolute inset-0 bg-white/5 blur-3xl rounded-full" />
                <motion.img
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  src={VOWELS[selectedIdx].image}
                  className="relative w-64 h-64 object-contain drop-shadow-[0_20px_50px_rgba(255,255,255,0.2)]"
                  alt=""
                />
              </div>
              <h2 className="text-6xl font-black uppercase tracking-tighter" style={{ color: VOWELS[selectedIdx].color }}>
                {VOWELS[selectedIdx].vowel}
              </h2>
              <p className="text-2xl text-slate-400 font-bold tracking-widest uppercase mt-4 text-center">
                {VOWELS[selectedIdx].word}
              </p>
              <button
                onClick={() => { playClick(); setSelectedIdx(null); }}
                className="mt-14 w-full py-6 bg-white text-black font-black rounded-[2rem] text-lg hover:bg-blue-400 hover:scale-[1.02] transition-all active:scale-95 shadow-xl px-8"
              >
                RETURN TO THE VOWEL GALAXY
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}