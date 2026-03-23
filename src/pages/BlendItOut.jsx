// @ts-nocheck

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CVCConnect from '../components/CVCConnect';
import VowelGalaxy from '../components/VowelGalaxy';
import GrabRead from '../components/GrabRead';
import WhackAlien from '../components/WhackAlien';
import CVCSpaceAdventure from '../components/CVCSpaceAdventure';
import { LETTER_AUDIO, WORD_FAMILIES, CVC_WORDS, getFamilyConsonants, getWordImage } from '../utils/cvcAssets';

/**
 * Constants and Data
 */
const POKEMON_SIZE = 140;
const STAR_COUNT = 100;

const VOWEL_DATA = [
  { vowel: "A", color: "#A855F7", emoji: "🍎", name: "Apple", img: "https://img.icons8.com/color/200/apple.png", example: "Apple" },
  { vowel: "E", color: "#3B82F6", emoji: "https://w7.pngwing.com/pngs/381/227/png-transparent-animals-elephants-animal-elephant-cartoon.png", name: "Elephant", img: "https://w7.pngwing.com/pngs/381/227/png-transparent-animals-elephants-animal-elephant-cartoon.png", example: "Elephant" },
  { vowel: "I", color: "#EC4899", emoji: "https://w7.pngwing.com/pngs/843/654/png-transparent-igloo-cartoon-illustration-illustration-arctic-igloo-blue-houses-igloo-cooler.png", name: "Igloo", img: "https://w7.pngwing.com/pngs/843/654/png-transparent-igloo-cartoon-illustration-illustration-arctic-igloo-blue-houses-igloo-cooler.png", example: "Igloo" },
  { vowel: "O", color: "#F59E0B", emoji: "https://w7.pngwing.com/pngs/962/40/png-transparent-octopus-free-content-cuteness-free-octopus-cartoon-website-cuteness.png", name: "Octopus", img: "https://w7.pngwing.com/pngs/962/40/png-transparent-octopus-free-content-cuteness-free-octopus-cartoon-website-cuteness.png", example: "Octopus" },
  { vowel: "U", color: "#10B981", emoji: "https://w7.pngwing.com/pngs/220/533/png-transparent-upward-arrow-arrow-up-up-arrow.png", name: "Up", img: "https://w7.pngwing.com/pngs/220/533/png-transparent-upward-arrow-arrow-up-up-arrow.png", example: "Up" }
];

const CHALLENGE_MODES = [
  { id: 'connect', label: 'CVC CONNECT', color: '#3B82F6', icon: '🔗', planetPath: "M50,5 L90,25 L95,70 L50,95 L5,70 L10,25 Z" },
  { id: 'match', label: 'WHACK THE ALIEN', color: '#EC4899', icon: '👂', planetPath: "M50,2 L98,50 L50,98 L2,50 Z" },
  { id: 'rapid', label: 'CVC SPACE ADVENTURE', color: '#F59E0B', icon: '🔥', planetPath: "M20,10 L80,5 L95,50 L75,90 L25,95 L5,55 Z" },
  { id: 'grab', label: 'GRAB & READ', color: '#10B981', icon: '🖐️', planetPath: "M30,5 L70,5 L95,40 L80,95 L20,95 L5,40 Z" },
];

const WHEEL_COLORS = ['#EF4444','#F97316','#EAB308','#22C55E','#3B82F6','#6366F1','#A855F7'];

const SETTINGS_ICON_URL = "https://img.icons8.com/ios-filled/50/ffffff/settings.png";

/**
 * Sub-Components
 */

const SpaceRock = ({ label, color, delay, onClick }) => (
  <motion.button 
    whileHover={{ scale: 1.1, filter: "brightness(1.2)" }}
    whileTap={{ scale: 0.95 }}
    onClick={onClick}
    className="flex flex-col items-center gap-4 group relative cursor-pointer"
  >
    <motion.div 
      animate={{ rotate: [0, 360], y: [0, -10, 0] }}
      transition={{ 
        rotate: { duration: 15 + Math.random() * 5, repeat: Infinity, ease: "linear", delay },
        y: { duration: 3, repeat: Infinity, ease: "easeInOut", delay }
      }}
      className="relative w-28 h-28 md:w-40 md:h-40 lg:w-44 lg:h-44 flex items-center justify-center"
    >
      <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_15px_30px_rgba(0,0,0,0.5)]">
        <path d="M 50 10 L 85 25 L 90 60 L 70 85 L 30 90 L 10 65 L 15 25 Z" fill={color} stroke="rgba(255,255,255,0.2)" strokeWidth="2" />
        <circle cx="35" cy="35" r="8" fill="rgba(0,0,0,0.2)" />
        <circle cx="65" cy="45" r="12" fill="rgba(0,0,0,0.15)" />
        <circle cx="45" cy="70" r="10" fill="rgba(0,0,0,0.25)" />
        <circle cx="70" cy="20" r="5" fill="rgba(0,0,0,0.1)" />
      </svg>
      <div className={`absolute inset-0 rounded-full blur-2xl opacity-20 group-hover:opacity-40 transition-opacity`} style={{ backgroundColor: color }} />
    </motion.div>
    <div className="bg-white/10 backdrop-blur-md border border-white/20 px-5 py-2 rounded-2xl shadow-xl transform transition-all group-hover:-translate-y-2">
      <span className="text-white font-black uppercase tracking-widest text-xs md:text-sm lg:text-base whitespace-nowrap">{label}</span>
    </div>
  </motion.button>
);

const CrystalPlanet = ({ data, onClick, index }) => (
  <motion.button
    initial={{ opacity: 0, y: 30 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ type: "spring", delay: index * 0.1, damping: 12 }}
    whileHover={{ scale: 1.1, filter: "brightness(1.2)" }}
    whileTap={{ scale: 0.95 }}
    onClick={() => onClick(data.id)}
    className="flex flex-col items-center gap-4 group relative cursor-pointer"
  >
    <motion.div
      animate={{ rotate: [0, 360], y: [0, -10, 0] }}
      transition={{
        rotate: { duration: 15 + index * 2, repeat: Infinity, ease: "linear" },
        y: { duration: 3, repeat: Infinity, ease: "easeInOut", delay: index * 0.4 }
      }}
      className="relative w-28 h-28 md:w-40 md:h-40 lg:w-44 lg:h-44 flex items-center justify-center"
    >
      <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_15px_30px_rgba(0,0,0,0.5)]">
        <path d="M 50 10 L 85 25 L 90 60 L 70 85 L 30 90 L 10 65 L 15 25 Z" fill={data.color} stroke="rgba(255,255,255,0.2)" strokeWidth="2" />
        <circle cx="35" cy="35" r="8" fill="rgba(0,0,0,0.2)" />
        <circle cx="65" cy="45" r="12" fill="rgba(0,0,0,0.15)" />
        <circle cx="45" cy="70" r="10" fill="rgba(0,0,0,0.25)" />
        <circle cx="70" cy="20" r="5" fill="rgba(0,0,0,0.1)" />
      </svg>
      <div className="absolute inset-0 rounded-full blur-2xl opacity-20 group-hover:opacity-40 transition-opacity" style={{ backgroundColor: data.color }} />
    </motion.div>
    <div className="bg-white/10 backdrop-blur-md border border-white/20 px-5 py-2 rounded-2xl shadow-xl transform transition-all group-hover:-translate-y-2">
      <span className="text-white font-black uppercase tracking-widest text-xs md:text-sm lg:text-base whitespace-nowrap">{data.label}</span>
    </div>
  </motion.button>
);

const SettingSlider = ({ label, value, icon, onChange }) => (
  <div className="flex flex-col gap-2 w-full">
    <div className="flex justify-between items-center px-1">
      <span className="flex items-center gap-2 text-[#6A06B4] font-black uppercase text-sm tracking-tighter">{icon} {label}</span>
      <span className="text-[#6A06B4] font-black text-sm">{value}%</span>
    </div>
    <input type="range" min="0" max="100" value={value} onChange={(e) => onChange(parseInt(e.target.value))} className="w-full h-4 bg-[#FFE5A3] rounded-full appearance-none cursor-pointer accent-[#D164C0] border-2 border-white/50" />
  </div>
);

const VowelUFO = ({ data, isSelected, hasSelection, isBlurred, onClick, index }) => {
  const { vowel, color, emoji } = data;

  return (
    <motion.div
      onClick={!hasSelection ? onClick : undefined}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{
        opacity: isBlurred ? 0.3 : 1,
        scale: isSelected ? 1.4 : (isBlurred ? 0.8 : 1),
        filter: isBlurred ? 'blur(8px)' : 'blur(0px)',
        y: isSelected ? 20 : 0
      }}
      transition={{ type: "spring", stiffness: 200, damping: 20, delay: hasSelection ? 0 : index * 0.1 }}
      className={`flex flex-col items-center group relative transition-all duration-300 ${!hasSelection ? 'cursor-pointer hover:-translate-y-4' : ''} z-10 flex-1 min-w-[60px] md:min-w-[120px]`}
    >
      <div className="relative w-full max-w-[200px] h-auto flex flex-col items-center">
         <div className="relative w-[65%] h-14 md:h-24 lg:h-28 bg-gradient-to-t from-white/40 to-white/10 rounded-t-[100px] border-t-2 border-x-2 border-white/60 backdrop-blur-[2px] z-10 overflow-hidden flex items-center justify-center -mb-[5px]">
           <div className="absolute top-2 left-4 w-4 h-8 bg-white/30 rounded-full blur-[2px] rotate-12" />
           <span className="text-3xl md:text-5xl lg:text-7xl font-black drop-shadow-[0_4px_8px_rgba(0,0,0,0.3)] select-none leading-none pt-2" style={{ color, filter: 'drop-shadow(0 0 10px rgba(255,255,255,0.5))' }}>{vowel}</span>
         </div>
         <div className="relative w-full h-8 md:h-12 lg:h-16 bg-gradient-to-b from-[#94a3b8] to-[#475569] rounded-[100%] border-2 border-white/30 shadow-2xl z-20 flex items-center justify-around px-2">
            <div className="w-1.5 md:w-2.5 h-1.5 md:h-2.5 rounded-full bg-red-400 animate-pulse shadow-[0_0_8px_red]" />
            <div className="w-1.5 md:w-2.5 h-1.5 md:h-2.5 rounded-full bg-yellow-400 animate-pulse delay-75 shadow-[0_0_8px_yellow]" />
            <div className="w-1.5 md:w-2.5 h-1.5 md:h-2.5 rounded-full bg-blue-400 animate-pulse delay-150 shadow-[0_0_8px_blue]" />
            <div className="w-1.5 md:w-2.5 h-1.5 md:h-2.5 rounded-full bg-green-400 animate-pulse delay-200 shadow-[0_0_8px_green]" />
         </div>
         
         <motion.div animate={{ scaleY: isSelected ? 0 : 1, opacity: isSelected ? 0 : 0.4 }} className="w-[80%] h-24 md:h-52 lg:h-64 mt-[-10px] group-hover:opacity-70 transition-opacity duration-500 origin-top" style={{ background: `linear-gradient(to bottom, ${color}, transparent)`, clipPath: 'polygon(25% 0%, 75% 0%, 100% 100%, 0% 100%)' }} />
         
         <AnimatePresence>
           {!isSelected && (
             <>
               <motion.div exit={{opacity: 0, scale: 0}} animate={{ y: [0, -15, 0], rotate: [0, 5, -5, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} className="absolute bottom-[30%] text-2xl md:text-5xl lg:text-7xl drop-shadow-[0_0_15px_rgba(255,255,255,0.8)] z-30 pointer-events-none"><img src={emoji} alt="" className="w-10 h-10 md:w-16 md:h-16 lg:w-20 lg:h-20 object-contain rounded-lg" /></motion.div>
               <motion.div exit={{opacity: 0, scale: 0}} className="absolute bottom-1 md:bottom-6 lg:bottom-10 w-[85%] h-8 md:h-16 lg:h-20 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl md:rounded-2xl flex flex-col items-center justify-center z-40 transition-all shadow-xl">
                 <span className="text-[5px] md:text-[8px] lg:text-xs font-bold uppercase tracking-[0.1em] text-white opacity-80">Mission</span>
                 <span className="text-[10px] md:text-lg lg:text-2xl font-black uppercase text-white leading-none">Vowel {vowel}</span>
               </motion.div>
             </>
           )}
         </AnimatePresence>
      </div>
    </motion.div>
  );
};

// Audio map for individual letter sounds — uses real audio files
const AUDIO_MAP = LETTER_AUDIO;

const speak = (text, rate = 1) => {
  const key = text.toLowerCase().trim();
  const url = AUDIO_MAP[key];
  if (url) {
    const audio = new Audio(url);
    audio.play();
    return;
  }
  // Fallback to browser TTS
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utt = new SpeechSynthesisUtterance(text);
  utt.rate = rate;
  utt.pitch = 1.2;
  window.speechSynthesis.speak(utt);
};

const playClick = () => {
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(400, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.05);
  gain.gain.setValueAtTime(0.3, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 0.12);
};

const VowelNav = ({ current, onSelect }) => (
  <div className="flex items-center gap-2 md:gap-4 bg-white/10 backdrop-blur-md p-2 rounded-full border border-white/20 shadow-lg">
    {['A', 'E', 'I', 'O', 'U'].map((v) => (
      <button 
        key={v} 
        onClick={() => onSelect(v)} 
        className={`w-10 h-10 md:w-14 md:h-14 rounded-full flex items-center justify-center text-lg md:text-2xl font-black transition-all ${current === v ? 'bg-[#5C6EE6] text-white scale-110 shadow-lg' : 'bg-white/10 text-white/50 hover:bg-white/20'}`}
      >
        {v}
      </button>
    ))}
  </div>
);

const VOWEL_COLORS = { A: '#A855F7', E: '#3B82F6', I: '#EC4899', O: '#F59E0B', U: '#10B981' };
const LAST_DOT_COLOR = '#FFB6C1';
const SegmentBlendGame = ({ onBack }) => {
  const [selectedVowel, setSelectedVowel] = useState(null);
  const [showFamilyModal, setShowFamilyModal] = useState(false);
  const [currentVC, setCurrentVC] = useState(null);
  const [wheelSegments, setWheelSegments] = useState([]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [wheelRotation, setWheelRotation] = useState(0);
  const [currentConsonant, setCurrentConsonant] = useState(null);
  const [currentImage, setCurrentImage] = useState(null);
  const [showInteractive, setShowInteractive] = useState(false);
  const [traceProgress, setTraceProgress] = useState(0);
  const [fingerPos, setFingerPos] = useState({ x: 30, y: 40 }); // SVG coords
  const [blendProgress, setBlendProgress] = useState(0);
  const [isDraggingFinger, setIsDraggingFinger] = useState(false);
  const [isDraggingRocket, setIsDraggingRocket] = useState(false);
  const [lastFingerZone, setLastFingerZone] = useState(-1);
  const [lastRocketZone, setLastRocketZone] = useState(0);
  const traceRef = useRef(null);
  const svgPathRef = useRef(null);
  const rocketRef = useRef(null);
  const audioCtxRef = useRef(null);

  const playWheelSpin = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') ctx.resume();

    const spinDuration = 3.0; // matches CSS transition
    const now = ctx.currentTime;

    // Spinning ratchet / tick sound — bursts of noise that slow down
    const tickCount = 28;
    for (let i = 0; i < tickCount; i++) {
      // Exponential spacing: ticks are fast at start, slow at end
      const t = now + spinDuration * (1 - Math.pow(1 - i / tickCount, 2.5));
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      // Pitch descends slightly as wheel slows
      osc.frequency.setValueAtTime(300 - i * 5, t);
      gain.gain.setValueAtTime(0.08, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.04);
    }

    // Final landing "ding"
    const dingOsc = ctx.createOscillator();
    const dingGain = ctx.createGain();
    dingOsc.type = 'sine';
    dingOsc.frequency.setValueAtTime(880, now + spinDuration);
    dingOsc.frequency.exponentialRampToValueAtTime(1320, now + spinDuration + 0.06);
    dingGain.gain.setValueAtTime(0.25, now + spinDuration);
    dingGain.gain.exponentialRampToValueAtTime(0.001, now + spinDuration + 0.5);
    dingOsc.connect(dingGain);
    dingGain.connect(ctx.destination);
    dingOsc.start(now + spinDuration);
    dingOsc.stop(now + spinDuration + 0.5);
  };

  const handleVowelClick = (v) => {
    setSelectedVowel(v);
    setShowFamilyModal(true);
  };

  const startGame = (vc) => {
    setCurrentVC(vc);
    setShowFamilyModal(false);
    const consonants = getFamilyConsonants(vc);
    const segs = consonants.map(c => ({ c, i: getWordImage(c + vc) || '⭐' }));
    setWheelSegments(segs);
    setCurrentConsonant(null);
    setCurrentImage(null);
    setShowInteractive(false);
    setTraceProgress(0);
    setBlendProgress(0);
  };

  const spinWheel = () => {
    if (isSpinning || wheelSegments.length === 0) return;
    setIsSpinning(true);
    playWheelSpin();
    const count = wheelSegments.length;
    const segAngle = 360 / count;
    const idx = Math.floor(Math.random() * count);
    const newRot = (Math.ceil(wheelRotation / 360) * 360) + 1800 + (360 - ((idx * segAngle) + segAngle / 2));
    setWheelRotation(newRot);
    setTimeout(() => {
      const seg = wheelSegments[idx];
      setCurrentConsonant(seg.c);
      setCurrentImage(seg.i);
      setShowInteractive(true);
      setIsSpinning(false);
      setTraceProgress(0);
      setBlendProgress(0);
      setLastFingerZone(-1);
      setLastRocketZone(0);
      setTraceProgress(0);
      setFingerPos({ x: 30, y: 40 }); // reset to first letter in SVG coords
      speak(seg.c);
    }, 3100);
  };

  const getWheelColor = (index) => {
    const banned = [];
    if (selectedVowel) banned.push(VOWEL_COLORS[selectedVowel]);
    banned.push(LAST_DOT_COLOR);
    const len = WHEEL_COLORS.length;
    let color = WHEEL_COLORS[index % len];
    if (banned.includes(color)) {
      for (let off = 1; off < len; off++) {
        const c = WHEEL_COLORS[(index + off) % len];
        if (!banned.includes(c)) { color = c; break; }
      }
    }
    return color;
  };

  const handleFingerPointerDown = (e) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDraggingFinger(true);
  };

  const handleFingerPointerMove = useCallback((e) => {
    if (!isDraggingFinger || !traceRef.current || !svgPathRef.current) return;
    const rect = traceRef.current.getBoundingClientRect();
    // Convert mouse/touch position to SVG viewBox coordinates (viewBox is 0 0 300 80)
    const svgX = ((e.clientX - rect.left) / rect.width) * 300;
    // Find closest point on path by sampling
    const pathEl = svgPathRef.current;
    const totalLen = pathEl.getTotalLength();
    let closest = 0, minDist = Infinity;
    const steps = 100;
    for (let i = 0; i <= steps; i++) {
      const len = (i / steps) * totalLen;
      const pt = pathEl.getPointAtLength(len);
      const dist = Math.abs(pt.x - svgX);
      if (dist < minDist) { minDist = dist; closest = len; }
    }
    const progress = closest / totalLen;
    const pt = pathEl.getPointAtLength(closest);
    setTraceProgress(progress);
    setFingerPos({ x: pt.x, y: pt.y });
    const zone = progress < 0.25 ? 0 : progress < 0.6 ? 1 : 2;
    if (zone !== lastFingerZone) {
      setLastFingerZone(zone);
      // const sounds = { a:'ah', e:'eh', i:'ih', o:'aw', u:'uh' };
      if (zone === 0 && currentConsonant) speak(currentConsonant);
      if (zone === 1 && currentVC) speak(currentVC[0]);
      if (zone === 2 && currentVC) speak(currentVC[1]);
    }
  }, [isDraggingFinger, lastFingerZone, currentConsonant, currentVC]);

  const handleRocketPointerDown = (e) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDraggingRocket(true);
  };

  const handleRocketPointerMove = useCallback((e) => {
    if (!isDraggingRocket || !rocketRef.current) return;
    const rect = rocketRef.current.getBoundingClientRect();
    let x = e.clientX - rect.left;
    x = Math.max(0, Math.min(rect.width, x));
    const pct = x / rect.width;
    setBlendProgress(pct);
    if (pct > 0.9 && lastRocketZone !== 1) {
      setLastRocketZone(1);
      if (currentConsonant && currentVC) speak(currentConsonant + currentVC, 1.1);
    } else if (pct < 0.1) {
      setLastRocketZone(0);
    }
  }, [isDraggingRocket, lastRocketZone, currentConsonant, currentVC]);

  const stopDragging = () => { setIsDraggingFinger(false); setIsDraggingRocket(false); };

  const vowelColor = selectedVowel ? VOWEL_COLORS[selectedVowel] : '#5C6EE6';

  return (
    <div
      className="relative z-20 w-full h-full flex flex-col select-none"
      onPointerMove={(e) => { handleFingerPointerMove(e); handleRocketPointerMove(e); }}
      onPointerUp={stopDragging}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-white/5 backdrop-blur-md border-b border-white/10">
        <button onClick={() => { playClick(); onBack(); }} className="w-10 h-10 bg-[#F48D8A] rounded-xl flex items-center justify-center shadow-lg">
          <span className="text-white text-xl font-black">←</span>
        </button>
        <h2 className="text-white text-2xl md:text-4xl font-black uppercase italic tracking-tighter">Segment &amp; Blend</h2>
        <div className="w-10" />
      </div>

      {/* Vowel Selector */}
      <div className="flex items-center justify-center gap-3 py-3 px-4 bg-white/5">
        {['A','E','I','O','U'].map(v => (
          <button
            key={v}
            onClick={() => { playClick(); handleVowelClick(v); }}
            style={{ background: VOWEL_COLORS[v], border: selectedVowel === v ? '4px solid white' : '4px solid transparent' }}
            className="w-12 h-12 md:w-14 md:h-14 rounded-2xl text-2xl md:text-3xl font-black text-white shadow-lg transition-transform hover:scale-110 active:scale-95"
          >
            {v}
          </button>
        ))}
      </div>

      {/* Main Area */}
      <div className="flex-1 flex flex-col md:flex-row items-center justify-center gap-6 p-4 overflow-auto">

        {/* Image popout */}
        {currentImage && showInteractive && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl p-4 shadow-2xl border-4 border-yellow-400 flex items-center justify-center"
          >
            <img src={currentImage} alt="" className="w-24 h-24 md:w-32 md:h-32 object-contain rounded-xl" />
          </motion.div>
        )}

        {/* Work Area */}
        <div className="flex flex-col items-center gap-5 w-full max-w-sm">

          {/* Word display tiles */}
          <div className="flex items-end gap-3">
            {[
              { val: currentConsonant ? currentConsonant.toUpperCase() : null },
              { val: currentVC ? currentVC[0].toUpperCase() : null },
              { val: currentVC ? currentVC[1].toUpperCase() : null },
            ].map((item, i) => {
              // determine dot color
              let dotColor = '#999';
              if (i === 0) {
                // first letter: color based on wheel segment for the consonant
                const segIndex = wheelSegments.findIndex(s => s.c === (currentConsonant || '').toLowerCase());
                dotColor = segIndex >= 0 ? getWheelColor(segIndex) : '#F87171';
              } else if (i === 1) {
                // first vowel tile: color based on chosen vowel
                dotColor = selectedVowel ? VOWEL_COLORS[selectedVowel] : '#34D399';
              } else if (i === 2) {
                // last letter dot is light pink
                dotColor = LAST_DOT_COLOR;
              }

              return (
                <div key={i} className="flex flex-col items-center gap-2">
                  <div
                    className="w-16 h-20 md:w-20 md:h-24 rounded-2xl flex items-center justify-center text-5xl md:text-6xl font-black text-white shadow-xl border-b-4"
                    style={{
                      background: item.val ? 'rgba(255,255,255,0.15)' : 'transparent',
                      borderColor: item.val ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.15)',
                      minHeight: '80px',
                    }}
                  >
                    {item.val || <span className="w-8 h-1 bg-white/30 rounded-full block" />}
                  </div>
                  <button
                    onClick={() => item.val && speak(item.val.toLowerCase())}
                    className="w-5 h-5 rounded-full transition-all hover:scale-125"
                    style={{ background: dotColor, opacity: item.val ? 1 : 0, boxShadow: `0 0 10px ${dotColor}` }}
                  />
                </div>
              );
            })}
          </div>



          {/* Interactive blend tools */}
          {showInteractive && (
            <div className="flex flex-col items-center gap-4 w-full">
              {/* Trace path */}
              <div className="relative w-full" style={{ height: '80px' }} ref={traceRef}>
                 <svg width="100%" height="100%" viewBox="0 0 300 80" style={{ overflow: 'visible' }}>
                   <path d="M 30,40 Q 100,10 150,40 Q 200,70 270,40" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="8" strokeLinecap="round" />
                   <path ref={svgPathRef} d="M 30,40 Q 100,10 150,40 Q 200,70 270,40" fill="none" stroke="#FACC15" strokeWidth="8" strokeLinecap="round" strokeDasharray="300" strokeDashoffset={300 * (1 - traceProgress)} />
                   {[
                     { x: 30, label: currentConsonant ? currentConsonant.toUpperCase() : '?' },
                     { x: 150, label: currentVC ? currentVC[0].toUpperCase() : '?' },
                     { x: 270, label: currentVC ? currentVC[1].toUpperCase() : '?' },
                   ].map((stop, i) => (
                     <g key={i}>
                       <circle cx={stop.x} cy={40} r="18" fill={i === 0 ? '#F87171' : '#34D399'} />
                       <text x={stop.x} y={46} textAnchor="middle" fill="white" fontWeight="900" fontSize="16">{stop.label}</text>
                     </g>
                   ))}
                 </svg>
                 {/* Finger follows the SVG path exactly using viewBox-to-CSS coordinate mapping */}
                 <div
                   onPointerDown={handleFingerPointerDown}
                   style={{
                     position: 'absolute',
                     top: `${(fingerPos.y / 80) * 100}%`,
                     left: `${(fingerPos.x / 300) * 100}%`,
                     transform: 'translate(-50%, -50%)',
                     fontSize: '2rem',
                     cursor: 'grab',
                     touchAction: 'none',
                     zIndex: 10,
                   }}
                 >
                   👆
                 </div>
               </div>
              <p className="text-yellow-300 text-xs md:text-sm font-bold">Drag your finger to hear each sound!</p>

              {/* Rocket slider */}
              <div className="relative w-full" style={{ height: '50px' }} ref={rocketRef}>
                <div className="absolute top-1/2 left-0 right-0 h-2.5 bg-white/20 rounded-full -translate-y-1/2" />
                <div className="absolute top-1/2 left-0 h-2.5 rounded-full -translate-y-1/2 transition-all duration-75" style={{ width: `${blendProgress * 100}%`, background: 'linear-gradient(90deg, #F87171, #FACC15)' }} />
                <div
                  onPointerDown={handleRocketPointerDown}
                  style={{ position: 'absolute', top: '50%', left: `${blendProgress * 100}%`, transform: 'translate(-50%, -50%) rotate(45deg)', fontSize: '2.2rem', cursor: 'grab', touchAction: 'none', zIndex: 10 }}
                >
                  🚀
                </div>
              </div>
              <p className="text-yellow-300 text-xs md:text-sm font-bold">Slide rocket to blend the whole word!</p>

              <button
                onClick={() => { playClick(); setShowInteractive(false); setCurrentConsonant(null); setCurrentImage(null); }}
                className="mt-1 px-6 py-3 rounded-2xl text-white font-bold text-base shadow-lg"
                style={{ background: 'linear-gradient(135deg, #8B5CF6, #6D28D9)' }}
              >
                🔄 Spin Again
              </button>
            </div>
          )}

          {/* Spin Wheel */}
          {currentVC && !showInteractive && (
            <div className="flex flex-col items-center gap-4">
              <div style={{ position: 'relative', width: '220px', height: '220px' }}>
                <div style={{ position: 'absolute', top: '-18px', left: '50%', transform: 'translateX(-50%)', width: 0, height: 0, borderLeft: '16px solid transparent', borderRight: '16px solid transparent', borderTop: '32px solid white', zIndex: 10 }} />
                <div
                  style={{
                    width: '100%', height: '100%', borderRadius: '50%',
                    border: '6px solid white',
                    background: `conic-gradient(${wheelSegments.map((_, i) => { const pct = 100 / wheelSegments.length; const col = getWheelColor(i); return `${col} ${i * pct}% ${(i+1) * pct}%`; }).join(',')})`,
                    transform: `rotate(${wheelRotation}deg)`,
                    transition: isSpinning ? 'transform 3s cubic-bezier(0.17, 0.67, 0.12, 0.99)' : 'none',
                    boxShadow: '0 8px 20px rgba(0,0,0,0.3)', position: 'relative',
                  }}
                >
                  {wheelSegments.map((seg, i) => {
                    const segAngle = 360 / wheelSegments.length;
                    const angle = (i * segAngle) + segAngle / 2;
                    return (
                      <div key={i} style={{ position: 'absolute', top: '50%', left: '50%', width: 0, height: 0, transform: `rotate(${angle}deg)` }}>
                        <div style={{ position: 'absolute', top: '-88px', left: '-16px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `rotate(${-angle}deg)`, fontSize: '1.6rem', fontWeight: 900, color: 'white', textShadow: '1px 1px 0 #000, -1px -1px 0 #000', lineHeight: 1 }}>
                          {seg.c.toUpperCase()}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <button
                  onClick={() => { playClick(); spinWheel(); }}
                  disabled={isSpinning}
                  style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '52px', height: '52px', background: 'white', borderRadius: '50%', border: '4px solid #DBEAFE', color: '#1E3A8A', fontWeight: 700, fontSize: '0.9rem', cursor: isSpinning ? 'wait' : 'pointer', boxShadow: '0 4px 8px rgba(0,0,0,0.2)', zIndex: 5 }}
                >
                  {isSpinning ? '...' : 'SPIN'}
                </button>
              </div>
              <p className="text-yellow-300 font-bold text-lg">Tap SPIN to pick a letter!</p>
            </div>
          )}

          {/* Initial state */}
          {!currentVC && (
            <div className="text-center mt-8">
              <div className="text-6xl mb-4">👆</div>
              <p className="text-yellow-300 font-bold text-xl">Tap a vowel above to start!</p>
            </div>
          )}
        </div>
      </div>

      {/* Family Modal */}
      <AnimatePresence>
        {showFamilyModal && (
          <div className="fixed inset-0 flex items-center justify-center z-50">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowFamilyModal(false)} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }} className="relative flex flex-col items-center gap-6 p-8">
              <h3 className="text-white text-3xl font-black uppercase">Choose a word family!</h3>
              <div className="flex gap-4 flex-wrap justify-center">
                {(WORD_FAMILIES[selectedVowel] || []).map(vc => (
                  <button
                    key={vc}
                    onClick={() => { playClick(); startGame(vc); }}
                    className="bg-white text-[#1E3A8A] text-3xl font-black px-8 py-4 rounded-2xl shadow-2xl hover:scale-110 transition-transform"
                  >
                    -{vc}
                  </button>
                ))}
              </div>
              <button onClick={() => { playClick(); setShowFamilyModal(false); }} className="text-white/60 underline text-lg">Cancel</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

/**
 * Main Application Component
 */
export default function BlendItOut() {
  const [robotKey, setRobotKey] = useState(0);
  const [alienKey, setAlienKey] = useState(0);
  const [ufoKey, setUfoKey] = useState(0);
  const [totalStars, setTotalStars] = useState(0);

  const addStars = (n) => setTotalStars(prev => prev + n);
  
  const [robotTrajectory, setRobotTrajectory] = useState(null);
  const [alienTrajectory, setAlienTrajectory] = useState(null);
  const [ufoTrajectory, setUfoTrajectory] = useState(null);

  const [view, setView] = useState('home');

  const [selectedFunVowel, setSelectedFunVowel] = useState(null);

  const [isLaunching, setIsLaunching] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const currentWord = useMemo(() => CVC_WORDS[currentWordIndex].toUpperCase(), [currentWordIndex]);

  const [settings, setSettings] = useState({ musicVolume: 80, sfxVolume: 100, timerEnabled: true });
  const activeCornersRef = useRef(new Set());

  const stars = useMemo(() => Array.from({ length: STAR_COUNT }).map((_, i) => ({ id: i, x: Math.random() * 100, y: Math.random() * 100, size: Math.random() * 2 + 1, duration: Math.random() * 3 + 2, delay: Math.random() * 5 })), []);

  const planets = useMemo(() => [
    { id: 'p1', className: "absolute bottom-[5%] left-[5%] w-48 h-48 bg-orange-500 opacity-40", decor: "bg-orange-600", rotation: "rotate-12" },
    { id: 'p2', className: "absolute top-[15%] right-[8%] w-32 h-32 bg-purple-500 opacity-30", decor: "bg-purple-700", rotation: "-rotate-45" },
    { id: 'p3', className: "absolute bottom-[10%] right-[10%] w-24 h-24 bg-teal-400 opacity-20", decor: "bg-teal-600", rotation: "rotate-90" }
  ], []);

  useEffect(() => {
    const timer = setInterval(() => { if (view === 'home') setCurrentWordIndex(Math.floor(Math.random() * CVC_WORDS.length)); }, 3000);
    return () => clearInterval(timer);
  }, [view]);

  const generateUniqueTrajectory = (yMin, yMax) => {
    const corners = [0, 1, 2, 3];
    const available = corners.filter(c => !activeCornersRef.current.has(c));
    const corner = available.length > 0 ? available[Math.floor(Math.random() * available.length)] : corners[Math.floor(Math.random() * 4)];
    activeCornersRef.current.add(corner);
    
    const startFromLeft = corner === 0 || corner === 2;
    const startFromTop = corner === 0 || corner === 1;
    return { corner, startPos: { x: startFromLeft ? -20 : 120, y: startFromTop ? yMin - 10 : yMax + 10 }, endPos: { x: startFromLeft ? 120 : -20, y: startFromTop ? yMax + 10 : yMin - 10 }, rotation: startFromLeft ? 15 : -15, duration: 25 + Math.random() * 15 };
  };

  const releaseCorner = (corner) => {
    activeCornersRef.current.delete(corner);
  };

  useEffect(() => { setRobotTrajectory(generateUniqueTrajectory(5, 30)); }, [robotKey]);
  useEffect(() => { setUfoTrajectory(generateUniqueTrajectory(35, 60)); }, [ufoKey]);
  useEffect(() => { setAlienTrajectory(generateUniqueTrajectory(65, 90)); }, [alienKey]);

  const handleLaunch = () => {
    if (isLaunching) return;
    setIsLaunching(true);
    setTimeout(() => { setView('learning'); setIsLaunching(false); }, 1500);
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#050510] flex flex-col items-center font-sans text-white">
      
      {/* Dynamic Background */}
      <motion.div animate={{ filter: view === 'home' ? 'blur(0px)' : 'blur(4px)' }} className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-purple-900/20 blur-[120px]" />
        {stars.map((star) => (
          <motion.div key={star.id} className="absolute bg-white rounded-full" style={{ left: `${star.x}%`, top: `${star.y}%`, width: star.size, height: star.size }} animate={{ opacity: [0.2, 1, 0.2], scale: [1, 1.2, 1] }} transition={{ duration: star.duration, repeat: Infinity, delay: star.delay, ease: "easeInOut" }} />
        ))}
        {planets.map((planet) => (
          <div key={planet.id} className={`${planet.className} rounded-full shadow-xl overflow-hidden`}>
            <div className={`absolute top-[20%] left-[10%] w-[80%] h-[10%] ${planet.decor} rounded-full opacity-30 ${planet.rotation}`} />
          </div>
        ))}
      </motion.div>

      {/* Floating Characters */}
      <AnimatePresence>
          {[
            { traj: robotTrajectory, key: robotKey, setKey: setRobotKey, size: POKEMON_SIZE, img: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/483.png" },
            { traj: ufoTrajectory, key: ufoKey, setKey: setUfoKey, size: POKEMON_SIZE, img: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/484.png" },
            { traj: alienTrajectory, key: alienKey, setKey: setAlienKey, size: POKEMON_SIZE, img: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/487.png" }
          ].map((char, idx) => char.traj && (
            <motion.div 
              key={`${idx}-${char.key}`} 
              initial={{ left: `${char.traj.startPos.x}%`, top: `${char.traj.startPos.y}%`, rotate: char.traj.rotation }} 
              animate={{ 
                left: `${char.traj.endPos.x}%`, 
                top: `${char.traj.endPos.y}%`, 
                rotate: char.traj.rotation + 10,
                filter: view === 'home' ? 'blur(0px)' : 'blur(5px)'
              }} 
              transition={{ duration: char.traj.duration, ease: "linear" }} 
              onAnimationComplete={() => { releaseCorner(char.traj.corner); char.setKey(prev => prev + 1); }} 
              className="absolute z-10" 
              style={{ width: char.size, height: char.size }}>
              <img src={char.img} alt="Character" className="w-full h-full drop-shadow-[0_15px_25px_rgba(0,0,0,0.6)] object-contain" />
            </motion.div>
          ))}
      </AnimatePresence>

      {/* View Screens */}
      <AnimatePresence mode="wait">
        {view === 'home' && (
          <motion.div key="home-view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center w-full h-full relative z-20 pt-16">
            <header className="z-30 text-center px-4 mb-8">
              <h1 className="text-white text-6xl md:text-8xl lg:text-9xl font-black tracking-tighter uppercase italic drop-shadow-[0_15px_30px_rgba(0,0,0,0.8)]">
                Blend<span className="text-blue-500">It</span>Out
              </h1>
              <div className="h-1.5 w-32 bg-gradient-to-r from-blue-500 to-pink-500 mx-auto rounded-full mt-4" />
            </header>
            <div className="flex items-center justify-center gap-3 md:gap-5 mb-14 min-h-[160px]">
              <AnimatePresence mode="wait">
                {currentWord.split('').map((letter, i) => (
                  <motion.div
                    key={`${currentWord}-${i}`}
                    initial={{ rotateY: -90, opacity: 0 }}
                    animate={{ rotateY: 0, opacity: 1, x: 0, y: 0 }}
                    exit={{ rotateY: 90, opacity: 0 }}
                    transition={{ delay: i * 0.12, type: 'spring', stiffness: 150, damping: 15 }}
                    className={`w-24 h-24 md:w-32 md:h-32 rounded-3xl flex items-center justify-center font-black text-4xl md:text-5xl lg:text-7xl shadow-2xl uppercase ${'AEIOU'.includes(letter) ? 'bg-[#5C6EE6] text-white' : 'bg-white text-[#1e293b]'}`}
                  >
                    {letter}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
            <motion.button onClick={() => { playClick(); handleLaunch(); }} className="px-10 py-5 rounded-full bg-gradient-to-r from-[#5C6EE6] to-[#F48D8A] shadow-xl hover:scale-110 active:scale-95 transition-all">
              <span className="text-white font-black tracking-widest uppercase text-xl md:text-2xl italic">{isLaunching ? 'Launching...' : 'Start Learning'}</span>
            </motion.button>
          </motion.div>
        )}

        {view === 'learning' && (
          <motion.div key="learning-view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="z-20 w-full h-full p-6 relative flex flex-col items-center">
            <div className="w-full flex justify-between max-w-6xl z-[60] pt-2">
              <button onClick={() => { playClick(); setView('home'); }} className="text-white/70 hover:text-white uppercase text-xs font-bold tracking-widest">← Back</button>
              <button onClick={() => { playClick(); setShowSettings(true); }} className="w-12 h-12 bg-[#5C6EE6] hover:bg-[#4b5cd1] border border-white/20 shadow-lg rounded-xl flex items-center justify-center transition-colors"><img src={SETTINGS_ICON_URL} className="w-6 h-6 invert" alt="Settings" /></button>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center w-full max-w-7xl">
              <div className="flex justify-center mb-8 py-4 overflow-visible whitespace-nowrap">
                {"MISSION CONTROL".split('').map((char, index) => (
                  <motion.span
                    key={index}
                    initial={{ y: 0, opacity: 0 }}
                    animate={{ y: [0, -10, 0], opacity: 1 }}
                    transition={{ opacity: { duration: 0.8 }, y: { duration: 2, repeat: Infinity, ease: "easeInOut", delay: index * 0.08 } }}
                    className={`inline-block text-white text-4xl md:text-5xl font-black uppercase italic drop-shadow-lg ${char === ' ' ? 'w-3 md:w-6' : ''}`}
                  >
                    {char === ' ' ? '\u00A0' : char}
                  </motion.span>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-4 w-full justify-items-center">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => { playClick(); setView('vowel-fun'); }}
                  className="flex flex-col items-center gap-2 cursor-pointer group w-full"
                >
                  <img
                    src="https://media.base44.com/images/public/69b3b4aa12b9c667ee192e41/c356a7985_vowelfun.png"
                    alt="Vowel Fun"
                    className="w-full max-w-[320px] aspect-square object-contain drop-shadow-[0_15px_30px_rgba(0,0,0,0.5)] group-hover:drop-shadow-[0_20px_40px_rgba(124,58,237,0.6)] transition-all"
                  />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => { playClick(); setView('segment-blend'); }}
                  className="flex flex-col items-center gap-2 cursor-pointer group w-full"
                >
                  <img
                    src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69b3b4aa12b9c667ee192e41/03c6b9264_segmentblend.png"
                    alt="Segment & Blend"
                    className="w-full max-w-[320px] aspect-square object-contain drop-shadow-[0_15px_30px_rgba(0,0,0,0.5)] group-hover:drop-shadow-[0_20px_40px_rgba(37,99,235,0.6)] transition-all"
                  />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => { playClick(); setView('cvc-challenge'); }}
                  className="flex flex-col items-center gap-2 cursor-pointer group w-full"
                >
                  <img
                    src="https://media.base44.com/images/public/69b3b4aa12b9c667ee192e41/5aa43806b_cvcchallenge.png"
                    alt="CVC Challenge"
                    className="w-full max-w-[320px] aspect-square object-contain drop-shadow-[0_15px_30px_rgba(0,0,0,0.5)] group-hover:drop-shadow-[0_20px_40px_rgba(219,39,119,0.6)] transition-all"
                  />
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}

        {view === 'cvc-challenge' && (
          <motion.div 
            key="cvc-challenge-view" 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -20 }} 
            className="z-20 w-full h-full flex flex-col items-center overflow-y-auto px-4 py-8"
          >
             <div className="w-full flex justify-between max-w-6xl items-center mb-10 sticky top-0 bg-[#050510]/80 backdrop-blur-md z-[100] py-4 rounded-3xl px-4 border border-white/5">
                <button onClick={() => { playClick(); setView('learning'); }} className="w-10 h-10 bg-white/10 hover:bg-white/20 transition-colors rounded-xl flex items-center justify-center border border-white/10"><span className="text-white text-xl font-black">←</span></button>
                <div className="text-center">
                  <h2 className="text-white text-2xl md:text-5xl font-black uppercase italic tracking-tighter drop-shadow-2xl">CVC CHALLENGE</h2>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 bg-indigo-950/60 px-3 py-1.5 rounded-full border border-orange-400/50">
                    <span className="text-yellow-400 text-lg">⭐</span>
                    <span className="text-white font-bold text-lg">{totalStars}</span>
                  </div>
                  <button onClick={() => { playClick(); setShowSettings(true); }} className="w-10 h-10 bg-[#5C6EE6] hover:bg-[#4b5cd1] border border-white/20 shadow-lg rounded-xl flex items-center justify-center transition-colors">
                    <img src="https://img.icons8.com/ios-filled/50/ffffff/settings.png" className="w-5 h-5" alt="Settings" />
                  </button>
                </div>
             </div>

             <div className="flex-1 w-full max-w-6xl flex items-center justify-center">
               <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 w-full place-items-center">
                  {CHALLENGE_MODES.map((mode, index) => mode.id === 'connect' ? (
                    <motion.button
                      key={mode.id}
                      whileHover={{ scale: 1.08 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => { playClick(); setView('cvc-connect'); }}
                      className="flex flex-col items-center gap-2 cursor-pointer group w-full"
                    >
                      <img
                       src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69b3b4aa12b9c667ee192e41/618db5e96_cvcconnect.png"
                       alt="CVC Connect"
                       className="w-full max-w-[280px] aspect-square object-contain drop-shadow-[0_15px_30px_rgba(0,0,0,0.5)] group-hover:drop-shadow-[0_20px_40px_rgba(59,130,246,0.6)] transition-all"
                      />
                    </motion.button>
                  ) : mode.id === 'match' ? (
                    <motion.button
                      key={mode.id}
                      whileHover={{ scale: 1.08 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => { playClick(); setView('whack-alien'); }}
                      className="flex flex-col items-center gap-2 cursor-pointer group w-full"
                    >
                      <img
                       src="https://media.base44.com/images/public/69b3b4aa12b9c667ee192e41/31e3b7319_whackthealien.png"
                       alt="Whack the Alien"
                       className="w-full max-w-[280px] aspect-square object-contain drop-shadow-[0_15px_30px_rgba(0,0,0,0.5)] group-hover:drop-shadow-[0_20px_40px_rgba(236,72,153,0.6)] transition-all"
                      />
                    </motion.button>
                  ) : mode.id === 'rapid' ? (
                    <motion.button
                      key={mode.id}
                      whileHover={{ scale: 1.08 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => { playClick(); setView('cvc-space-adventure'); }}
                      className="flex flex-col items-center gap-2 cursor-pointer group w-full"
                    >
                      <img
                        src="https://media.base44.com/images/public/69b3b4aa12b9c667ee192e41/6e7681e3a_cvcspaceadventure.png"
                        alt="CVC Space Adventure"
                        className="w-full max-w-[280px] aspect-square object-contain drop-shadow-[0_15px_30px_rgba(0,0,0,0.5)] group-hover:drop-shadow-[0_20px_40px_rgba(245,158,11,0.6)] transition-all"
                      />
                    </motion.button>
                  ) : mode.id === 'grab' ? (
                    <motion.button
                      key={mode.id}
                      whileHover={{ scale: 1.08 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => { playClick(); setView('grab-read'); }}
                      className="flex flex-col items-center gap-2 cursor-pointer group w-full"
                    >
                      <img
                        src="https://media.base44.com/images/public/69b3b4aa12b9c667ee192e41/e22b00604_grabread.png"
                        alt="Grab & Read"
                        className="w-full max-w-[280px] aspect-square object-contain drop-shadow-[0_15px_30px_rgba(0,0,0,0.5)] group-hover:drop-shadow-[0_20px_40px_rgba(139,92,246,0.6)] transition-all"
                      />
                    </motion.button>
                  ) : null)}
               </div>
             </div>
          </motion.div>
        )}

        {view === 'cvc-connect' && (
          <motion.div key="cvc-connect-view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="z-20 w-full h-full">
            <CVCConnect onBack={() => setView('cvc-challenge')} speak={speak} playClick={playClick} onSettings={() => setShowSettings(true)} onStarEarned={addStars} totalStars={totalStars} />
          </motion.div>
        )}

        {view === 'whack-alien' && (
          <motion.div key="whack-alien-view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="z-20 w-full h-full">
            <WhackAlien onBack={() => setView('cvc-challenge')} speak={speak} playClick={playClick} onSettings={() => setShowSettings(true)} onStarEarned={addStars} totalStars={totalStars} />
          </motion.div>
        )}

        {view === 'grab-read' && (
          <motion.div key="grab-read-view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="z-20 w-full h-full">
            <GrabRead onBack={() => setView('cvc-challenge')} speak={speak} playClick={playClick} onSettings={() => setShowSettings(true)} onStarEarned={addStars} totalStars={totalStars} />
          </motion.div>
        )}

        {view === 'cvc-space-adventure' && (
          <motion.div key="cvc-space-adventure-view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="z-20 w-full h-full">
            <CVCSpaceAdventure onBack={() => setView('cvc-challenge')} speak={speak} playClick={playClick} onSettings={() => setShowSettings(true)} onStarEarned={addStars} totalStars={totalStars} />
          </motion.div>
        )}

        {view === 'segment-blend' && (
          <motion.div key="segment-blend-view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="z-20 w-full h-full">
            <SegmentBlendGame onBack={() => setView('learning')} />
          </motion.div>
        )}

        {view === 'vowel-fun' && (
          <motion.div key="vowel-fun-view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="z-20 w-full h-full">
            <VowelGalaxy onBack={() => setView('learning')} playClick={playClick} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowSettings(false)} className="absolute inset-0 bg-black/60 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative w-full max-w-[400px] bg-white rounded-[40px] p-8 shadow-2xl flex flex-col gap-8">
              <div className="flex justify-between items-center">
                <h3 className="text-[#6A06B4] text-3xl font-black uppercase italic tracking-tighter">Settings</h3>
                <button onClick={() => { playClick(); setShowSettings(false); }} className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600">✕</button>
              </div>
              <div className="flex flex-col gap-6">
                <SettingSlider label="Music" value={settings.musicVolume} icon="🎵" onChange={(v) => setSettings({...settings, musicVolume: v})} />
                <SettingSlider label="SFX" value={settings.sfxVolume} icon="🔊" onChange={(v) => setSettings({...settings, sfxVolume: v})} />
                <div className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl">
                  <span className="text-[#6A06B4] font-black uppercase text-sm">Game Timer</span>
                  <button onClick={() => setSettings({...settings, timerEnabled: !settings.timerEnabled})} className={`w-14 h-8 rounded-full transition-colors relative ${settings.timerEnabled ? 'bg-[#D164C0]' : 'bg-slate-300'}`}>
                    <motion.div animate={{ x: settings.timerEnabled ? 24 : 4 }} className="absolute top-1 w-6 h-6 bg-white rounded-full shadow-sm" />
                  </button>
                </div>
              </div>
              <button onClick={() => { playClick(); setShowSettings(false); }} className="w-full py-5 bg-[#5C6EE6] rounded-2xl text-white font-black uppercase tracking-widest shadow-xl hover:brightness-110">Save Settings</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}