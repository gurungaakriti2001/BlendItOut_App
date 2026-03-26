// @ts-nocheck

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { CVC_WORDS as _CVC_WORDS_LC } from '../utils/cvcAssets';

const CVC_WORDS = _CVC_WORDS_LC.map(w => w.toUpperCase());

const MAX_TIME = 30;

const AstronautSVG = () => (
  <svg width="80" height="80" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="6" y="2" width="12" height="10" rx="2" fill="white"/>
    <rect x="8" y="4" width="8" height="4" rx="1" fill="#63B3ED"/>
    <rect x="6" y="12" width="12" height="8" rx="1" fill="white"/>
    <circle cx="11" cy="15" r="1" fill="#F56565"/>
    <rect x="4" y="12" width="2" height="6" rx="1" fill="white"/>
    <rect x="18" y="12" width="2" height="6" rx="1" fill="white"/>
    <rect x="6" y="20" width="4" height="4" fill="white"/>
    <rect x="14" y="20" width="4" height="4" fill="white"/>
  </svg>
);

const StarSVG = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="#F6E05E">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
  </svg>
);

export default function CVCSpaceAdventure({ onBack, speak, playClick = () => {}, onSettings, onStarEarned, totalStars = 0 }) {
  const [gameState, setGameState] = useState('start'); // 'start' | 'playing' | 'paused' | 'gameover'
  const [options, setOptions] = useState([]);
  const [currentTarget, setCurrentTarget] = useState('');
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(MAX_TIME);
  const [charOffset, setCharOffset] = useState(0); // px offset from center
  const [isMoving, setIsMoving] = useState(false);
  const [jumping, setJumping] = useState(false);
  const [bumpedIndex, setBumpedIndex] = useState(null);
  const [solvedIndex, setSolvedIndex] = useState(null);
  const [starIndex, setStarIndex] = useState(null);
  const [feedback, setFeedback] = useState(null); // { text, correct }
  const [statusVisible, setStatusVisible] = useState(false);
  const [finalScore, setFinalScore] = useState(0);

  const lastWordsRef = useRef([]);
  const timerRef = useRef(null);
  const blockRefs = useRef([]);
  const containerRef = useRef(null);
  const audioCtxRef = useRef(null);
  const countdownOscRef = useRef(null);

  const initAudio = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
  };

  const playTing = () => {
    initAudio();
    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') ctx.resume();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.05);
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  };

  const playCountdownBeep = (timeRemaining) => {
    initAudio();
    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') ctx.resume();
    // Get faster as time runs out
    const speed = timeRemaining <= 2 ? 0.05 : timeRemaining <= 3 ? 0.08 : 0.1;
    const frequencies = [700, 650, 600]; // tuk, tuk, tut pattern
    frequencies.forEach((freq, i) => {
      const time = ctx.currentTime + (i * speed);
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, time);
      gain.gain.setValueAtTime(0.2, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + speed);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(time);
      osc.stop(time + speed);
    });
  };

  const speakWord = useCallback((word) => {
    setStatusVisible(true);
    setTimeout(() => setStatusVisible(false), 1200);
    if (speak) {
      speak(word.toLowerCase());
    } else {
      const msg = new SpeechSynthesisUtterance(word);
      msg.rate = 0.9;
      msg.pitch = 1.1;
      window.speechSynthesis.speak(msg);
    }
  }, [speak]);

  const getRandomWords = useCallback((isInitial = false) => {
    let newOptions = [];
    let available = [...CVC_WORDS];
    for (let i = 0; i < 3; i++) {
      let filtered = available.filter(w => w !== lastWordsRef.current[i]);
      if (filtered.length === 0) filtered = available;
      const word = filtered[Math.floor(Math.random() * filtered.length)];
      newOptions.push(word);
      available = available.filter(w => w !== word);
    }
    lastWordsRef.current = [...newOptions];
    const target = newOptions[Math.floor(Math.random() * 3)];
    setOptions(newOptions);
    setCurrentTarget(target);
    setSolvedIndex(null);
    setStarIndex(null);
    setBumpedIndex(null);
    setTimeout(() => speakWord(target), isInitial ? 300 : 50);
  }, [speakWord]);

  const startGame = () => {
    initAudio();
    setScore(0);
    setTimeLeft(MAX_TIME);
    setCharOffset(0);
    setGameState('playing');
    getRandomWords(true);
  };

  const endGame = useCallback((currentScore) => {
    clearInterval(timerRef.current);
    setFinalScore(currentScore);
    setGameState('gameover');
  }, []);

  // Timer
  useEffect(() => {
    if (gameState !== 'playing') {
      clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        // Play countdown beep when time is low
        if (prev <= 5 && prev > 4.9) playCountdownBeep(prev);
        if (prev <= 0.1) {
          clearInterval(timerRef.current);
          setGameState(gs => {
            if (gs === 'playing') {
              setScore(s => { setFinalScore(s); return s; });
              return 'gameover';
            }
            return gs;
          });
          return 0;
        }
        return prev - 0.1;
      });
    }, 100);
    return () => clearInterval(timerRef.current);
  }, [gameState]);

  const handleGuess = (word, index) => {
    if (isMoving || gameState !== 'playing') return;
    setIsMoving(true);

    // Move character toward block
    if (blockRefs.current[index] && containerRef.current) {
      const blockRect = blockRefs.current[index].getBoundingClientRect();
      const containerRect = containerRef.current.getBoundingClientRect();
      const offset = (blockRect.left + blockRect.width / 2) - (containerRect.left + containerRect.width / 2);
      setCharOffset(offset);
    }

    setTimeout(() => {
      setJumping(true);
      setTimeout(() => {
        setBumpedIndex(index);
        if (word === currentTarget) {
          playTing();
          setScore(s => s + 1);
          if (onStarEarned) onStarEarned(1);
          setTimeLeft(t => Math.min(MAX_TIME, t + 4));
          showFeedback('YES! ⭐', true);
          setStarIndex(index);
          setSolvedIndex(index);
          setTimeout(() => getRandomWords(), 900);
        } else {
          showFeedback('NO! ❌', false);
          setTimeout(() => setBumpedIndex(null), 200);
        }
        setTimeout(() => {
          setJumping(false);
          setIsMoving(false);
        }, 700);
      }, 350);
    }, 300);
  };

  const showFeedback = (text, correct) => {
    setFeedback({ text, correct });
    setTimeout(() => setFeedback(null), 800);
  };

  const oxygenPct = (timeLeft / MAX_TIME) * 100;
  const oxygenColor = oxygenPct < 30 ? '#ef4444' : 'linear-gradient(to top, #0ea5e9, #38bdf8)';

  return (
    <div className="relative z-20 w-full h-full flex flex-col select-none overflow-hidden"
      style={{ fontFamily: "'Andika', sans-serif" }}>

      {/* Start Screen */}
      {gameState === 'start' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 z-[100] text-center p-6">
          <button onClick={() => { playClick(); onBack(); }} className="absolute top-6 left-6 w-10 h-10 bg-[#F48D8A] rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-white text-xl font-black">←</span>
          </button>
          <h1 className="text-4xl md:text-5xl mb-8 font-bold text-yellow-400">CVC SPACE MISSION</h1>
          <button
            onClick={() => { playClick(); startGame(); }}
            className="bg-blue-600 px-10 py-6 rounded-2xl border-b-8 border-blue-800 hover:bg-blue-500 active:translate-y-2 transition-all text-2xl font-bold text-white"
          >
            START MISSION
          </button>
        </div>
      )}

      {/* Pause Screen */}
      {gameState === 'paused' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 z-[100]">
          <button onClick={() => { playClick(); onBack(); }} className="absolute top-6 left-6 w-10 h-10 bg-[#F48D8A] rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-white text-xl font-black">←</span>
          </button>
          <h1 className="text-5xl mb-8 font-bold text-yellow-400">MISSION PAUSED</h1>
          <div className="flex flex-col gap-4">
            <button
              onClick={() => { playClick(); setGameState('playing'); }}
              className="bg-blue-600 px-10 py-6 rounded-2xl border-b-8 border-blue-800 hover:bg-blue-500 text-2xl font-bold text-white"
            >RESUME</button>
            <button onClick={() => { playClick(); onBack(); }} className="bg-[#F48D8A] px-10 py-4 rounded-2xl border-b-4 border-[#d97773] text-white text-xl font-black hover:bg-[#d97773] transition-colors">← Back to Challenge</button>
          </div>
        </div>
      )}

      {/* Game Over Screen */}
      {gameState === 'gameover' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 z-[100]">
          <button onClick={() => { playClick(); onBack(); }} className="absolute top-6 left-6 w-10 h-10 bg-[#F48D8A] rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-white text-xl font-black">←</span>
          </button>
          <h1 className="text-5xl md:text-6xl mb-4 font-bold text-red-500">OUT OF OXYGEN!</h1>
          <p className="text-2xl md:text-3xl mb-8 text-white">Stars collected: <span className="text-yellow-400 font-bold">{finalScore}</span></p>
          <button onClick={() => { playClick(); startGame(); }} className="bg-green-600 px-10 py-6 rounded-2xl border-b-8 border-green-800 text-2xl font-bold text-white mb-4">TRY AGAIN</button>
          <button onClick={() => { playClick(); onBack(); }} className="text-white/60 underline text-lg">Back</button>
        </div>
      )}

      {/* Top Bar */}
      <div className="w-full px-4 py-3 grid grid-cols-3 items-center z-50 flex-shrink-0"
        style={{ background: 'rgba(15,23,42,0.85)', backdropFilter: 'blur(10px)', borderBottom: '4px solid #334155' }}>
        {/* Left: Back + Pause + Settings */}
        <div className="flex items-center gap-2">
          <button onClick={() => { playClick(); onBack(); }} className="w-9 h-9 bg-[#F48D8A] rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-white font-black text-lg">←</span>
          </button>
          <button
            onClick={() => { playClick(); setGameState(g => g === 'playing' ? 'paused' : 'playing'); }}
            className="w-9 h-9 bg-[#5C6EE6] hover:bg-[#4b5cd1] border border-white/20 shadow-lg rounded-xl flex items-center justify-center transition-colors"
          >
            <span className="text-white font-black text-sm">⏸</span>
          </button>
        </div>

        {/* Middle: Speaker */}
        <div className="flex flex-col items-center">
          <button
            onClick={() => { playClick(); currentTarget && speakWord(currentTarget); }}
            className="bg-yellow-400 p-3 rounded-full border-b-4 border-yellow-600 shadow-lg active:translate-y-0.5 hover:scale-105 transition-transform"
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2D3748" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 5L6 9H2v6h4l5 4V5z"/>
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>
            </svg>
          </button>
          <div className={`text-[10px] font-bold text-cyan-300 uppercase tracking-widest mt-1 transition-opacity ${statusVisible ? 'opacity-100' : 'opacity-0'}`}>
            Listening
          </div>
        </div>

        {/* Right: Oxygen + Stars */}
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-bold text-cyan-400 uppercase">Oxygen</span>
            {/* Oxygen tank */}
            <div style={{ width: 24, height: 48, background: '#cbd5e1', border: '2px solid #475569', borderRadius: '8px 8px 4px 4px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', bottom: 0, width: '100%', height: `${oxygenPct}%`, background: oxygenColor, transition: timeLeft <= 5 ? 'height 0.05s linear, background 0.1s' : 'height 0.3s linear, background 0.3s' }} />
            </div>
          </div>
          <div className="flex items-center gap-1">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="#F6E05E"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
            <span className="text-lg font-bold text-yellow-400">{totalStars}</span>
          </div>
        </div>
      </div>

      {/* Game Area */}
      <div ref={containerRef} className="relative flex-1 flex flex-col items-center justify-end overflow-hidden pb-2">
        {/* Blocks */}
        <div className="flex justify-around w-full max-w-xl px-4 mb-28">
          {options.map((word, index) => (
            <div key={`${word}-${index}`} className="relative flex flex-col items-center cursor-pointer"
              ref={el => blockRefs.current[index] = el}
              onClick={() => handleGuess(word, index)}>
              {/* Star popup */}
              {starIndex === index && (
                <div className="absolute -top-12 left-1/2 -translate-x-1/2 z-40"
                  style={{ animation: 'saStarPop 0.6s ease-out forwards' }}>
                  <StarSVG />
                </div>
              )}
              {/* Pixel Block */}
              <div style={{
                width: 90, height: 90,
                background: solvedIndex === index ? '#94a3b8' : '#facc15',
                boxShadow: solvedIndex === index
                  ? 'inset -5px -5px 0 0 #475569, inset 5px 5px 0 0 #cbd5e1, 0 0 0 3px #000'
                  : 'inset -5px -5px 0 0 #a16207, inset 5px 5px 0 0 #fef08a, 0 0 0 3px #000',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transform: bumpedIndex === index ? 'translateY(-16px)' : 'translateY(0)',
                transition: 'transform 0.15s cubic-bezier(0.175, 0.885, 0.32, 1.275), background 0.2s',
                imageRendering: 'pixelated',
              }}>
                <span style={{ fontSize: 22, fontWeight: 700, color: '#1e293b', textTransform: 'uppercase', pointerEvents: 'none' }}>{word}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Character */}
        <div
          className="absolute bottom-16"
          style={{
            left: '50%',
            transform: `translateX(calc(-50% + ${charOffset}px))`,
            transition: 'transform 0.6s cubic-bezier(0.45, 0, 0.55, 1)',
            zIndex: 40,
          }}
        >
          {/* Feedback bubble */}
          {feedback && (
            <div style={{
              position: 'absolute',
              bottom: 90,
              left: '50%',
              transform: 'translateX(-50%)',
              padding: '8px 20px',
              borderRadius: 16,
              fontWeight: 900,
              fontSize: '1.6rem',
              whiteSpace: 'nowrap',
              background: feedback.correct ? '#22c55e' : '#ef4444',
              color: 'white',
              boxShadow: '0 8px 0 rgba(0,0,0,0.3)',
              animation: 'saFeedbackPop 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
              pointerEvents: 'none',
              zIndex: 60,
            }}>{feedback.text}</div>
          )}
          <div style={{ animation: jumping ? 'saJump 0.7s cubic-bezier(0.45, 0, 0.55, 1) forwards' : 'none' }}>
            <AstronautSVG />
          </div>
        </div>

        {/* Ground */}
        <div className="w-full h-16 flex-shrink-0 border-t-8 border-gray-600"
          style={{ background: 'linear-gradient(to bottom, #4A5568 0%, #4A5568 50%, #2D3748 50%, #2D3748 100%)', backgroundSize: '40px 40px' }} />
      </div>

      <style>{`
        @keyframes saJump {
          0% { transform: translateY(0); }
          50% { transform: translateY(-140px); }
          100% { transform: translateY(0); }
        }
        @keyframes saFeedbackPop {
          0% { opacity:0; transform: translateX(-50%) scale(0.5) translateY(20px); }
          40% { opacity:1; transform: translateX(-50%) scale(1.1) translateY(-10px); }
          100% { opacity:0; transform: translateX(-50%) scale(1) translateY(-40px); }
        }
        @keyframes saStarPop {
          0% { transform: translateY(0) scale(1); opacity:1; }
          100% { transform: translateY(-120px) scale(2) rotate(90deg); opacity:0; }
        }
      `}</style>
    </div>
  );
}