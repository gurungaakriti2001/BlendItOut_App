// @ts-nocheck

import React, { useState, useCallback, useRef } from 'react';
import { Volume2, RotateCcw, Play } from 'lucide-react';
import { CVC_WORDS } from '../utils/cvcAssets';

const shuffleArray = (array) => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

const ConfettiBurst = () => {
  const colors = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];
  return (
    <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
      {Array.from({ length: 60 }).map((_, i) => {
        const left = Math.random() * 100;
        const width = Math.random() * 8 + 6;
        const height = Math.random() * 12 + 8;
        const dur = Math.random() * 0.8 + 0.7;
        const delay = Math.random() * 0.2;
        const color = colors[Math.floor(Math.random() * colors.length)];
        return (
          <div key={i} className="absolute top-[-10%]" style={{
            left: `${left}%`, width: `${width}px`, height: `${height}px`,
            backgroundColor: color, borderRadius: Math.random() > 0.5 ? '50%' : '2px',
            animation: `waCfall ${dur}s linear ${delay}s forwards`,
          }} />
        );
      })}
      <style>{`@keyframes waCfall { 0% { transform: translateY(0) rotate(0deg) scale(1); opacity:1; } 80% { opacity:1; } 100% { transform: translateY(110vh) rotate(720deg) scale(0.5); opacity:0; } }`}</style>
    </div>
  );
};

const calculateStars = (streak) => {
  return Math.floor(streak / 5) * 3;
};

const playChildrenYay = (audioCtxRef) => {
  if (!audioCtxRef.current) {
    audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
  }
  const ctx = audioCtxRef.current;
  if (ctx.state === 'suspended') ctx.resume();
  // Simulate multiple children voices cheering with overlapping excited tones
  const voices = [
    { freq: 480, detune: 0, delay: 0, dur: 0.6 },
    { freq: 520, detune: 30, delay: 0.05, dur: 0.7 },
    { freq: 450, detune: -20, delay: 0.1, dur: 0.65 },
    { freq: 560, detune: 15, delay: 0.02, dur: 0.75 },
    { freq: 430, detune: -10, delay: 0.08, dur: 0.6 },
  ];
  voices.forEach(({ freq, detune, delay, dur }) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    // Vibrato LFO to give a "yay" vocal quality
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(6, ctx.currentTime + delay);
    lfoGain.gain.setValueAtTime(25, ctx.currentTime + delay);
    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);
    osc.type = 'sine';
    // Rising pitch = excitement "YAYYY"
    osc.frequency.setValueAtTime(freq * 0.8, ctx.currentTime + delay);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.4, ctx.currentTime + delay + dur * 0.3);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.1, ctx.currentTime + delay + dur);
    gain.gain.setValueAtTime(0, ctx.currentTime + delay);
    gain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + delay + 0.04);
    gain.gain.setValueAtTime(0.08, ctx.currentTime + delay + dur * 0.7);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + dur);
    osc.connect(gain); gain.connect(ctx.destination);
    lfo.start(ctx.currentTime + delay); osc.start(ctx.currentTime + delay);
    lfo.stop(ctx.currentTime + delay + dur); osc.stop(ctx.currentTime + delay + dur);
  });
  // Add a short "hooray" high-pitched group shout
  const shout = ctx.createOscillator();
  const sGain = ctx.createGain();
  shout.type = 'sawtooth';
  shout.frequency.setValueAtTime(300, ctx.currentTime + 0.1);
  shout.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.35);
  shout.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.7);
  sGain.gain.setValueAtTime(0, ctx.currentTime + 0.1);
  sGain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.15);
  sGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.7);
  shout.connect(sGain); sGain.connect(ctx.destination);
  shout.start(ctx.currentTime + 0.1); shout.stop(ctx.currentTime + 0.7);
};

const AlienHole = ({ word, isUp, onClick, isLocked, hitTimeoutRef, audioCtxRef, isPaused }) => {
  const [isHit, setIsHit] = useState(false);

  const playWhack = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') ctx.resume();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.12);
    gain.gain.setValueAtTime(0.5, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.12);
  };

  const handleClick = () => {
    if (!isUp || isLocked) return;
    setIsHit(true);
    playWhack();
    hitTimeoutRef.current = setTimeout(() => {
      if (isPaused) return;
      setIsHit(false);
    }, 400);
    onClick(word);
  };

  return (
    <div className="relative w-32 sm:w-40 h-64 flex flex-col justify-end items-center mt-8 group">
      {/* Hammer - Cartoonish */}
      <div className={`absolute w-28 h-28 z-40 origin-[75%_85%] transition-all duration-150 pointer-events-none
        ${isHit ? 'top-2 right-0 -rotate-45 opacity-100 scale-110' : '-top-12 -right-12 rotate-[75deg] opacity-0 scale-80'}`}
        style={{ transitionTimingFunction: isHit ? 'cubic-bezier(0.175, 0.885, 0.32, 1.275)' : 'ease-out' }}>
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-2xl filter brightness-110">
          {/* Handle */}
          <rect x="42" y="25" width="16" height="75" rx="8" fill="#8B4513" stroke="#654321" strokeWidth="2" />
          {/* Handle grip lines */}
          <line x1="45" y1="35" x2="55" y2="35" stroke="#654321" strokeWidth="1.5" />
          <line x1="45" y1="50" x2="55" y2="50" stroke="#654321" strokeWidth="1.5" />
          <line x1="45" y1="65" x2="55" y2="65" stroke="#654321" strokeWidth="1.5" />
          {/* Head - rounded rectangle */}
          <rect x="15" y="8" width="70" height="35" rx="12" fill="#C0C0C0" stroke="#808080" strokeWidth="2" />
          {/* Head shine/reflection */}
          <ellipse cx="35" cy="15" rx="15" ry="8" fill="#FFFFFF" opacity="0.5" />
          {/* Head shadow */}
          <ellipse cx="70" cy="35" rx="12" ry="8" fill="#666666" opacity="0.3" />
          {/* Highlight on top */}
          <path d="M 20 12 Q 50 5 80 15" stroke="#FFFFFF" strokeWidth="2" fill="none" opacity="0.6" />
        </svg>
      </div>

      {/* Hole back */}
      <div className="absolute bottom-[22px] sm:bottom-[28px] w-10/12 h-8 sm:h-10 bg-slate-950 rounded-[100%] z-0 shadow-inner"></div>

      {/* Alien container */}
      <div className="absolute bottom-6 sm:bottom-8 w-full h-56 overflow-hidden z-10 rounded-b-[40%]">
        <div
          onClick={handleClick}
          className={`absolute bottom-0 w-full flex flex-col items-center cursor-pointer transition-transform ${
            isUp ? 'translate-y-0 duration-500' : 'translate-y-[120%] duration-300'
          }`}
          style={{ transitionTimingFunction: isUp ? 'cubic-bezier(0.34, 1.56, 0.64, 1)' : 'cubic-bezier(0.4, 0, 1, 1)' }}
        >
          <div className="flex flex-col items-center transition-transform hover:scale-105 active:scale-95 origin-bottom">
            {/* Sign */}
            <div className="relative bg-amber-100 border-4 border-amber-800 rounded-xl px-4 py-2 mb-[-12px] z-20 shadow-lg">
              <div className="text-3xl font-black text-amber-900 tracking-widest uppercase">{word}</div>
              <div className="absolute -bottom-6 left-1/2 w-3 h-8 bg-amber-800 -translate-x-1/2 -z-10"></div>
            </div>
            {/* Alien */}
            <svg viewBox="0 0 100 100" className="w-24 sm:w-28 h-24 sm:h-28 drop-shadow-xl mt-4">
              <path d="M 30 30 Q 20 10 15 5" stroke="#84cc16" strokeWidth="4" fill="none" strokeLinecap="round" />
              <circle cx="15" cy="5" r="4" fill="#bef264" />
              <path d="M 70 30 Q 80 10 85 5" stroke="#84cc16" strokeWidth="4" fill="none" strokeLinecap="round" />
              <circle cx="85" cy="5" r="4" fill="#bef264" />
              <path d="M 20 100 L 20 50 Q 20 20 50 20 Q 80 20 80 50 L 80 100 Z" fill="#a3e635" />
              <circle cx="35" cy="45" r="8" fill="white" />
              <circle cx="35" cy="45" r="3" fill="#1e1b4b" />
              <circle cx="65" cy="45" r="8" fill="white" />
              <circle cx="65" cy="45" r="3" fill="#1e1b4b" />
              {isHit ? (
                <ellipse cx="50" cy="65" rx="6" ry="10" fill="#1e1b4b" />
              ) : (
                <path d="M 40 65 Q 50 75 60 65" stroke="#1e1b4b" strokeWidth="4" fill="none" strokeLinecap="round" />
              )}
            </svg>
          </div>
        </div>
      </div>

      {/* Crater front */}
      <div className="w-full h-12 sm:h-16 bg-slate-800 rounded-[100%] border-b-8 border-slate-900 shadow-xl relative z-20 overflow-hidden">
        <div className="absolute inset-1 bg-slate-900 rounded-[100%] shadow-inner blur-[1px]"></div>
        <div className="absolute inset-0 rounded-[100%] border-t-[5px] border-slate-700 opacity-70"></div>
      </div>
    </div>
  );
};

export default function WhackAlien({ onBack, speak, playClick = () => {}, onSettings, onStarEarned, totalStars = 0 }) {
  const [isPaused, setIsPaused] = useState(false);
  const [gameState, setGameState] = useState('start');
  const [streak, setStreak] = useState(0);
  const [targetWord, setTargetWord] = useState('');
  const [alienWords, setAlienWords] = useState(['', '', '']);
  const [aliensUp, setAliensUp] = useState([false, false, false]);
  const [feedback, setFeedback] = useState('');
  const [roundLock, setRoundLock] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [finalScore, setFinalScore] = useState(0);

  const roundTimeoutRef = useRef(null);
  const confettiTimeoutRef = useRef(null);
  const aliensTimeoutRef = useRef(null);
  const nextRoundTimeoutRef = useRef(null);
  const hitTimeoutRef = useRef(null);
  const audioCtxRef = useRef(null);

  const speakWord = useCallback((word) => {
    speak(word);
  }, [speak]);

  const generateRound = useCallback((numHoles = 3) => {
    const newTarget = CVC_WORDS[Math.floor(Math.random() * CVC_WORDS.length)];
    let distractors = [];
    while (distractors.length < numHoles - 1) {
      const randomWord = CVC_WORDS[Math.floor(Math.random() * CVC_WORDS.length)];
      if (randomWord !== newTarget && !distractors.includes(randomWord)) {
        distractors.push(randomWord);
      }
    }
    const roundWords = shuffleArray([newTarget, ...distractors]);
    setTargetWord(newTarget);
    setAlienWords(roundWords);
    setFeedback('Listen carefully!');
    setRoundLock(false);
    roundTimeoutRef.current = setTimeout(() => {
      if (isPaused) return;
      setAliensUp(Array(numHoles).fill(true));
      speakWord(newTarget);
    }, 500);
  }, [speakWord]);

  const startGame = () => {
    setGameState('playing');
    setStreak(0);
    generateRound(3);
  };

  const handleWhack = (word) => {
    if (roundLock) return;
    setRoundLock(true);
    if (word === targetWord) {
      const newStreak = streak + 1;
      setStreak(newStreak);
      if (onStarEarned) onStarEarned(1);
      const nextHoles = newStreak >= 10 ? 9 : (newStreak >= 5 ? 6 : 3);
      setFeedback('Great Job! 🌟');
      playChildrenYay(audioCtxRef);
      setShowConfetti(true);
      confettiTimeoutRef.current = setTimeout(() => {
        if (isPaused) return;
        setShowConfetti(false);
      }, 2000);
      aliensTimeoutRef.current = setTimeout(() => {
        if (isPaused) return;
        setAliensUp(prev => prev.map(() => false));
      }, 500);
      nextRoundTimeoutRef.current = setTimeout(() => {
        if (isPaused) return;
        generateRound(nextHoles);
      }, 1500);
    } else {
      setFinalScore(streak);
      setGameState('gameover');
    }
  };

  return (
    <div className="relative z-20 w-full h-full flex flex-col select-none overflow-y-auto">
      {showConfetti && <ConfettiBurst />}

      {/* Pause Overlay */}
      {isPaused && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/85 z-[100] backdrop-blur-sm">
          <h1 className="text-5xl mb-8 font-black text-yellow-400 uppercase italic">Paused</h1>
          <div className="flex flex-col gap-4">
            <button onClick={() => { playClick(); setIsPaused(false); }} className="bg-[#5C6EE6] px-10 py-4 rounded-2xl border-b-4 border-[#4b5cd1] text-white text-xl font-black hover:bg-[#4b5cd1] transition-colors">▶ Resume</button>
            <button onClick={() => { 
              // Stop all audio and timers
              window.speechSynthesis.cancel();
              if (audioCtxRef.current) audioCtxRef.current.suspend();
              if (roundTimeoutRef.current) clearTimeout(roundTimeoutRef.current);
              if (confettiTimeoutRef.current) clearTimeout(confettiTimeoutRef.current);
              if (aliensTimeoutRef.current) clearTimeout(aliensTimeoutRef.current);
              if (nextRoundTimeoutRef.current) clearTimeout(nextRoundTimeoutRef.current);
              if (hitTimeoutRef.current) clearTimeout(hitTimeoutRef.current);
              setShowConfetti(false);
              playClick(); 
              onBack(); 
            }} className="bg-[#F48D8A] px-10 py-4 rounded-2xl border-b-4 border-[#d97773] text-white text-xl font-black hover:bg-[#d97773] transition-colors">← Back to Challenge</button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-white/5 backdrop-blur-md border-b border-white/10 flex-shrink-0">
        <div className="flex items-center gap-2">
          <button onClick={() => { 
            // Stop all audio and timers
            window.speechSynthesis.cancel();
            if (audioCtxRef.current) audioCtxRef.current.suspend();
            if (roundTimeoutRef.current) clearTimeout(roundTimeoutRef.current);
            if (confettiTimeoutRef.current) clearTimeout(confettiTimeoutRef.current);
            if (aliensTimeoutRef.current) clearTimeout(aliensTimeoutRef.current);
            if (nextRoundTimeoutRef.current) clearTimeout(nextRoundTimeoutRef.current);
            if (hitTimeoutRef.current) clearTimeout(hitTimeoutRef.current);
            setShowConfetti(false);
            playClick(); 
            onBack(); 
          }} className="w-10 h-10 bg-[#F48D8A] rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-white text-xl font-black">←</span>
          </button>
          <button onClick={() => { 
            const willPause = !isPaused;
            if (willPause) {
              // Suspend audio when pausing
              window.speechSynthesis.cancel();
              if (audioCtxRef.current) audioCtxRef.current.suspend();
            } else {
              // Resume audio when resuming
              if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
                audioCtxRef.current.resume();
              }
            }
            playClick(); 
            setIsPaused(willPause); 
          }} className="w-10 h-10 bg-[#5C6EE6] hover:bg-[#4b5cd1] border border-white/20 shadow-lg rounded-xl flex items-center justify-center transition-colors">
            <span className="text-white font-black text-sm">⏸</span>
          </button>
        </div>
        <h2 className="text-white text-2xl md:text-4xl font-black uppercase italic tracking-tighter">Whack the Alien</h2>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-indigo-950/60 px-3 py-1.5 rounded-full border border-orange-400/50">
            <span className="text-yellow-400 text-lg">⭐</span>
            <span className="text-white font-bold text-lg">{totalStars}</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-2xl bg-indigo-900/70 backdrop-blur-md border-2 border-indigo-500/50 rounded-3xl p-6 shadow-2xl text-center">

          <div className="flex flex-col items-center">
              {/* Start Screen */}
              {gameState === 'start' && (
                <div className="flex flex-col items-center py-8 gap-6">
                  <AlienHole word="CVC" isUp={true} onClick={() => {}} isLocked={true} hitTimeoutRef={hitTimeoutRef} audioCtxRef={audioCtxRef} isPaused={isPaused} />
                  <p className="text-lg text-indigo-200 max-w-sm">
                    Listen to the word, then whack the alien holding the correct sign!
                  </p>
                  <button
                    onClick={() => { playClick(); startGame(); }}
                    className="flex items-center gap-3 bg-gradient-to-r from-green-400 to-emerald-500 text-indigo-950 text-xl font-black px-10 py-4 rounded-full hover:scale-105 active:scale-95 transition-all shadow-lg"
                  >
                    <Play fill="currentColor" size={24} />
                    START GAME
                  </button>
                </div>
              )}

              {/* Audio & Feedback */}
              {gameState === 'playing' && <>
              <div className="bg-indigo-950/50 border border-indigo-400/30 rounded-2xl p-4 mb-6 w-full flex flex-col items-center gap-3">
                <button
                  onClick={() => { playClick(); speakWord(targetWord); }}
                  className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-400 text-white px-6 py-2.5 rounded-full text-lg font-bold transition-colors active:scale-95"
                >
                  <Volume2 size={20} />
                  Hear Word Again
                </button>
                <p className={`text-xl font-bold ${feedback.includes('Great') ? 'text-green-400' : 'text-yellow-300'}`}>
                  {feedback}
                </p>
              </div>

              {/* Aliens grid */}
              <div className={`grid gap-x-4 sm:gap-x-8 gap-y-4 w-full justify-items-center ${alienWords.length <= 3 ? 'grid-cols-3' : alienWords.length <= 6 ? 'grid-cols-3' : 'grid-cols-3'}`}>
                {alienWords.map((word, index) => (
                  <AlienHole
                    key={index}
                    word={word}
                    isUp={aliensUp[index]}
                    onClick={handleWhack}
                    isLocked={roundLock}
                    hitTimeoutRef={hitTimeoutRef}
                    audioCtxRef={audioCtxRef}
                    isPaused={isPaused}
                  />
                ))}
              </div>

              <button
                onClick={() => { 
                  // Stop all audio and timers
                  window.speechSynthesis.cancel();
                  if (audioCtxRef.current) audioCtxRef.current.suspend();
                  if (roundTimeoutRef.current) clearTimeout(roundTimeoutRef.current);
                  if (confettiTimeoutRef.current) clearTimeout(confettiTimeoutRef.current);
                  if (aliensTimeoutRef.current) clearTimeout(aliensTimeoutRef.current);
                  if (nextRoundTimeoutRef.current) clearTimeout(nextRoundTimeoutRef.current);
                  if (hitTimeoutRef.current) clearTimeout(hitTimeoutRef.current);
                  setShowConfetti(false);
                  playClick(); 
                  onBack(); 
                }}
                className="mt-10 text-indigo-300 hover:text-white flex items-center gap-2 transition-colors"
              >
                <RotateCcw size={18} />
                <span className="font-semibold uppercase tracking-wider text-sm">End Game</span>
              </button>
              </>}

              {/* Game Over Screen */}
              {gameState === 'gameover' && (
                <div className="flex flex-col items-center py-8 gap-6">
                  <h1 className="text-5xl md:text-6xl mb-4 font-bold text-red-500">GAME OVER!</h1>
                  <p className="text-2xl md:text-3xl text-white">Streak: <span className="text-orange-400 font-bold">{finalScore}</span></p>
                  <p className="text-3xl md:text-4xl text-white">Stars Earned: <span className="text-yellow-400 font-black">⭐ {calculateStars(finalScore)}</span></p>
                  <button onClick={() => { playClick(); startGame(); }} className="flex items-center gap-3 bg-gradient-to-r from-green-400 to-emerald-500 text-indigo-950 text-xl font-black px-10 py-4 rounded-full hover:scale-105 active:scale-95 transition-all shadow-lg">
                    <Play fill="currentColor" size={24} />
                    TRY AGAIN
                  </button>
                  <button onClick={() => { 
                    // Stop all audio and timers
                    window.speechSynthesis.cancel();
                    if (audioCtxRef.current) audioCtxRef.current.suspend();
                    if (roundTimeoutRef.current) clearTimeout(roundTimeoutRef.current);
                    if (confettiTimeoutRef.current) clearTimeout(confettiTimeoutRef.current);
                    if (aliensTimeoutRef.current) clearTimeout(aliensTimeoutRef.current);
                    if (nextRoundTimeoutRef.current) clearTimeout(nextRoundTimeoutRef.current);
                    if (hitTimeoutRef.current) clearTimeout(hitTimeoutRef.current);
                    setShowConfetti(false);
                    playClick(); 
                    onBack(); 
                  }} className="text-white/60 underline text-lg">Back</button>
                </div>
              )}
              </div>
              </div>
              </div>
              </div>
              );
              }