import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Mic, SkipForward } from 'lucide-react';
import confetti from 'canvas-confetti';
import { getWordImage, CVC_DATA } from '../utils/cvcAssets';

const cvcData = CVC_DATA;
const families = Object.keys(cvcData);
const rainbowPalette = ['#FF3B3B', '#FF9F1C', '#FFD700', '#2EC4B6', '#3A86FF', '#8338EC', '#FF006E'];

const GLASS_W = 320;
const GLASS_H = 300;
const PLANET_R = 27.5;

function randomPlanet() {
  const family = families[Math.floor(Math.random() * families.length)];
  const wordList = cvcData[family];
  const word = wordList[Math.floor(Math.random() * wordList.length)];
  const color = rainbowPalette[Math.floor(Math.random() * rainbowPalette.length)];
  const styleType = Math.floor(Math.random() * 4);
  return {
    id: Math.random().toString(36).slice(2),
    family,
    word,
    color,
    styleType,
    x: 35 + Math.random() * 47, // percent
    y: 20 + Math.random() * 60, // px from bottom
    vx: (Math.random() - 0.5) * 0.4,
    vy: 0,
    isGrabbed: false,
  };
}

const PlanetShape = ({ styleType, color, size = 55 }) => {
  const s = size;
  return (
    <div style={{
      width: s, height: s, borderRadius: '50%',
      backgroundColor: color,
      boxShadow: 'inset -8px -8px 15px rgba(0,0,0,0.4), 0 4px 10px rgba(0,0,0,0.3)',
      border: '1px solid rgba(255,255,255,0.1)',
      position: 'relative',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      overflow: 'visible',
      flexShrink: 0,
    }}>
      {styleType === 0 && <>
        <div style={{ width: 14, height: 14, background: 'rgba(0,0,0,0.15)', borderRadius: '50%', position: 'absolute', top: 8, left: 10 }} />
        <div style={{ width: 10, height: 10, background: 'rgba(0,0,0,0.15)', borderRadius: '50%', position: 'absolute', bottom: 12, right: 10 }} />
      </>}
      {styleType === 1 && (
        <div style={{ position: 'absolute', width: 85, height: 25, border: '6px solid rgba(255,255,255,0.3)', borderRadius: '50%', transform: 'rotate(-25deg)', zIndex: -1 }} />
      )}
      {styleType === 2 && <>
        <div style={{ width: 8, height: 8, background: 'rgba(255,255,255,0.2)', borderRadius: '50%', position: 'absolute', top: 12, right: 12 }} />
        <div style={{ width: 12, height: 12, background: 'rgba(255,255,255,0.2)', borderRadius: '50%', position: 'absolute', bottom: 15, left: 8 }} />
      </>}
      {styleType === 3 && (
        <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: 'linear-gradient(45deg, transparent 40%, rgba(255,255,255,0.1) 50%, transparent 60%)' }} />
      )}
    </div>
  );
};

export default function GrabRead({ onBack, speak, playClick = () => {}, onSettings, onStarEarned, totalStars = 0 }) {
  const [isPaused, setIsPaused] = useState(false);
  const [planets, setPlanets] = useState(() => Array.from({ length: 12 }, randomPlanet));
  const [clawPos, setClawPos] = useState(50); // percent
  const [cableHeight, setCableHeight] = useState(0);
  const [clawTilt, setClawTilt] = useState(0);
  const [isGrabbing, setIsGrabbing] = useState(false);
  const [isGrabClosed, setIsGrabClosed] = useState(false);
  const [stickX, setStickX] = useState(0);
  const [grabbedId, setGrabbedId] = useState(null);
  const [dispensedPlanet, setDispensedPlanet] = useState(null);
  const [dispensedY, setDispensedY] = useState(null);
  const [modal, setModal] = useState(null); // { word, family }
  const [starsCollected, setStarsCollected] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [speechFeedback, setSpeechFeedback] = useState(null); // null, 'listening', 'correct', 'incorrect'
  const recognitionRef = useRef(null);

  const clawPosRef = useRef(50);
  const clawVelRef = useRef(0);
  const clawTiltRef = useRef(0);
  const stickXRef = useRef(0);
  const isGrabbingRef = useRef(false);
  const planetsRef = useRef(planets);
  const cableHeightRef = useRef(0);
  const grabbedIdRef = useRef(null);
  const rafRef = useRef(null);
  const audioCtxRef = useRef(null);
  const whirrRef = useRef(null);
  const lfoRef = useRef(null);
  const whirrGainRef = useRef(null);

  const glassRef = useRef(null);

  useEffect(() => { planetsRef.current = planets; }, [planets]);

  // Audio
  const initAudio = () => {
    if (!audioCtxRef.current) audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
  };
  const startWhirr = () => {
    initAudio();
    if (whirrRef.current) return;
    const ctx = audioCtxRef.current;
    const gain = ctx.createGain();
    const osc = ctx.createOscillator();
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(110, ctx.currentTime);
    lfo.type = 'square';
    lfo.frequency.setValueAtTime(12, ctx.currentTime);
    lfoGain.gain.setValueAtTime(5, ctx.currentTime);
    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.06, ctx.currentTime + 0.1);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(); lfo.start();
    whirrRef.current = osc; lfoRef.current = lfo; whirrGainRef.current = gain;
  };
  const stopWhirr = () => {
    if (!whirrRef.current) return;
    const ctx = audioCtxRef.current;
    const g = whirrGainRef.current;
    g.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.15);
    const osc = whirrRef.current, lfo = lfoRef.current;
    setTimeout(() => { try { osc.stop(); lfo.stop(); } catch(e){} }, 150);
    whirrRef.current = null; lfoRef.current = null;
  };
  const playCling = () => {
    initAudio();
    const ctx = audioCtxRef.current;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(200, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.05);
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(); osc.stop(ctx.currentTime + 0.05);
  };

  const playFireworkSound = () => {
    initAudio();
    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') ctx.resume();
    // Launch whistle
    const whistle = ctx.createOscillator();
    const wGain = ctx.createGain();
    whistle.type = 'sine';
    whistle.frequency.setValueAtTime(400, ctx.currentTime);
    whistle.frequency.exponentialRampToValueAtTime(1800, ctx.currentTime + 0.4);
    wGain.gain.setValueAtTime(0.15, ctx.currentTime);
    wGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    whistle.connect(wGain); wGain.connect(ctx.destination);
    whistle.start(); whistle.stop(ctx.currentTime + 0.4);
    // Burst explosion
    const burst = ctx.createOscillator();
    const bGain = ctx.createGain();
    burst.type = 'sawtooth';
    burst.frequency.setValueAtTime(800, ctx.currentTime + 0.4);
    burst.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.9);
    bGain.gain.setValueAtTime(0, ctx.currentTime + 0.38);
    bGain.gain.linearRampToValueAtTime(0.4, ctx.currentTime + 0.42);
    bGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.9);
    burst.connect(bGain); bGain.connect(ctx.destination);
    burst.start(ctx.currentTime + 0.38); burst.stop(ctx.currentTime + 0.9);
    // Sparkle tones
    [880, 1100, 1320, 1760].forEach((freq, i) => {
      const sp = ctx.createOscillator();
      const sg = ctx.createGain();
      sp.type = 'sine';
      sp.frequency.setValueAtTime(freq, ctx.currentTime + 0.45 + i * 0.07);
      sg.gain.setValueAtTime(0.12, ctx.currentTime + 0.45 + i * 0.07);
      sg.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.75 + i * 0.07);
      sp.connect(sg); sg.connect(ctx.destination);
      sp.start(ctx.currentTime + 0.45 + i * 0.07);
      sp.stop(ctx.currentTime + 0.75 + i * 0.07);
    });
  };

  const launchFireworks = () => {
    // Multiple bursts from different positions
    confetti({ particleCount: 80, spread: 100, origin: { x: 0.3, y: 0.5 }, colors: ['#ff0', '#f0f', '#0ff', '#f60', '#0f0'] });
    setTimeout(() => confetti({ particleCount: 80, spread: 100, origin: { x: 0.7, y: 0.4 }, colors: ['#ff0', '#f0f', '#0ff', '#f60', '#0f0'] }), 200);
    setTimeout(() => confetti({ particleCount: 60, spread: 120, origin: { x: 0.5, y: 0.3 }, colors: ['#fff', '#ff0', '#f0f'] }), 400);
  };
  const playPloop = () => {
    initAudio();
    const ctx = audioCtxRef.current;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.2);
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.25);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(); osc.stop(ctx.currentTime + 0.25);
  };

  // Physics loop
  useEffect(() => {
    const loop = () => {
      if (!isGrabbingRef.current) {
        const targetVel = stickXRef.current * 3.5;
        clawVelRef.current += (targetVel - clawVelRef.current) * 0.2;
        clawPosRef.current = Math.max(15, Math.min(85, clawPosRef.current + clawVelRef.current));
        const targetTilt = clawVelRef.current * 2.5;
        clawTiltRef.current += (targetTilt - clawTiltRef.current) * 0.1;
        setClawPos(clawPosRef.current);
        setClawTilt(clawTiltRef.current);
      } else {
        clawTiltRef.current *= 0.95;
        setClawTilt(clawTiltRef.current);
      }

      setPlanets(prev => prev.map(p => {
        if (p.isGrabbed) return p;
        let { x, y, vx, vy } = p;
        vy -= 0.1;
        x += vx;
        y += vy;
        if (y < 15) { y = 15; vy *= -0.15; vx *= 0.9; }
        if (x < 30 || x > 82) { vx *= -0.6; x = Math.max(30, Math.min(82, x)); }
        return { ...p, x, y, vx, vy };
      }));

      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  // Joystick
  const isDraggingRef = useRef(false);
  const stickContainerRef = useRef(null);
  const [stickVisualX, setStickVisualX] = useState(0);

  const handleJoyDown = (e) => {
    initAudio();
    if (!isGrabbingRef.current) isDraggingRef.current = true;
  };
  const handleJoyMove = useCallback((e) => {
    if (!isDraggingRef.current || isGrabbingRef.current) return;
    const rect = stickContainerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    let dx = clientX - (rect.left + rect.width / 2);
    dx = Math.max(-30, Math.min(30, dx));
    setStickVisualX(dx);
    stickXRef.current = dx / 30;
  }, []);
  const handleJoyUp = useCallback(() => {
    isDraggingRef.current = false;
    setStickVisualX(0);
    stickXRef.current = 0;
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', handleJoyMove);
    window.addEventListener('touchmove', handleJoyMove, { passive: false });
    window.addEventListener('mouseup', handleJoyUp);
    window.addEventListener('touchend', handleJoyUp);
    return () => {
      window.removeEventListener('mousemove', handleJoyMove);
      window.removeEventListener('touchmove', handleJoyMove);
      window.removeEventListener('mouseup', handleJoyUp);
      window.removeEventListener('touchend', handleJoyUp);
    };
  }, [handleJoyMove, handleJoyUp]);

  // Grab logic
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  const animateCable = (target, speed) => new Promise(resolve => {
    const step = () => {
      const done = speed > 0 ? cableHeightRef.current >= target : cableHeightRef.current <= target;
      if (done) {
        cableHeightRef.current = target;
        setCableHeight(target);
        resolve();
      } else {
        cableHeightRef.current += speed;
        setCableHeight(cableHeightRef.current);
        // Update grabbed planet pos
        if (grabbedIdRef.current) {
          const tilt = clawTiltRef.current;
          const rad = (tilt * Math.PI) / 180;
          const totalH = cableHeightRef.current + 65;
          const offsetX = Math.sin(rad) * totalH;
          const targetX = (clawPosRef.current - 8.2) + (offsetX / 3.4);
          const targetY = (300 - cableHeightRef.current - 110);
          setPlanets(prev => prev.map(p =>
            p.id === grabbedIdRef.current ? { ...p, x: p.x + (targetX - p.x) * 0.5, y: p.y + (targetY - p.y) * 0.5 } : p
          ));
        }
        requestAnimationFrame(step);
      }
    };
    step();
  });

  const checkCollision = () => {
    if (!glassRef.current) return null;
    const glassRect = glassRef.current.getBoundingClientRect();
    const clawHeadX = glassRect.left + (clawPosRef.current / 100) * glassRect.width;
    const clawHeadY = glassRect.top + cableHeightRef.current + 65;

    let closest = null, minDist = 75;
    planetsRef.current.forEach(p => {
      const pxPx = glassRect.left + (p.x / 100) * glassRect.width;
      const pyPx = glassRect.bottom - p.y - PLANET_R;
      const dist = Math.hypot(clawHeadX - pxPx, clawHeadY - pyPx);
      if (dist < minDist) { minDist = dist; closest = p; }
    });
    return closest;
  };

  const handleGrab = async () => {
    if (isGrabbingRef.current) return;
    isGrabbingRef.current = true;
    setIsGrabbing(true);

    // Descend with claw OPEN
    setIsGrabClosed(false);
    startWhirr();
    await animateCable(245, 9.5);
    stopWhirr();

    // Check if we caught something
    const caught = checkCollision();

    // Close claw fingers around the planet (or empty squeeze)
    await sleep(80);
    playCling();
    setIsGrabClosed(true);

    if (caught) {
      // Lock planet to claw immediately as fingers close
      grabbedIdRef.current = caught.id;
      setGrabbedId(caught.id);
      setPlanets(prev => prev.map(p => p.id === caught.id ? { ...p, isGrabbed: true } : p));
    }

    // Pause so player can see the claw close
    await sleep(500);

    // Rise back up — claw stays CLOSED the whole way
    startWhirr();
    await animateCable(0, -6.5);
    stopWhirr();

    if (caught) {
      // Move to drop zone
      await new Promise(resolve => {
        const speed = 1.5;
        const step = () => {
          clawTiltRef.current = -speed * 2.5;
          setClawTilt(clawTiltRef.current);
          if (clawPosRef.current <= 18) {
            clawPosRef.current = 18;
            setClawPos(18);
            setPlanets(prev => prev.map(p => {
              if (p.id !== grabbedIdRef.current) return p;
              const tilt = clawTiltRef.current;
              const rad = (tilt * Math.PI) / 180;
              const totalH = cableHeightRef.current + 65;
              const offsetX = Math.sin(rad) * totalH;
              return { ...p, x: (clawPosRef.current - 8.2) + (offsetX / 3.4), y: 300 - cableHeightRef.current - 110 };
            }));
            setTimeout(resolve, 300);
          } else {
            clawPosRef.current -= speed;
            setClawPos(clawPosRef.current);
            setPlanets(prev => prev.map(p => {
              if (p.id !== grabbedIdRef.current) return p;
              const tilt = clawTiltRef.current;
              const rad = (tilt * Math.PI) / 180;
              const totalH = cableHeightRef.current + 65;
              const offsetX = Math.sin(rad) * totalH;
              return { ...p, x: (clawPosRef.current - 8.2) + (offsetX / 3.4), y: 300 - cableHeightRef.current - 110 };
            }));
            requestAnimationFrame(step);
          }
        };
        step();
      });

      playCling();
      setIsGrabClosed(false);

      // Drop planet animation
      const droppedPlanet = planetsRef.current.find(p => p.id === caught.id);
      setPlanets(prev => prev.filter(p => p.id !== caught.id));
      grabbedIdRef.current = null;
      setGrabbedId(null);

      // Dispense
      setDispensedPlanet(droppedPlanet);
      setDispensedY(80);
      await new Promise(resolve => {
        let pos = 80, v = 0;
        const fall = setInterval(() => {
          v += 1; pos -= v;
          setDispensedY(pos);
          if (pos <= 10) {
            clearInterval(fall);
            playPloop();
            setTimeout(() => {
              setDispensedPlanet(null);
              if (droppedPlanet) {
              setModal({ word: droppedPlanet.word, family: droppedPlanet.family });
              }
              resolve();
            }, 400);
          }
        }, 20);
      });

      // Respawn a new planet
      setPlanets(prev => [...prev, randomPlanet()]);
    } else {
      playCling();
      setIsGrabClosed(false);
    }

    isGrabbingRef.current = false;
    setIsGrabbing(false);
  };

  const closeModal = () => {
    setModal(null);
  };

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    
    if (recognitionRef.current) return;
    
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      setSpeechFeedback('listening');
    };

    recognition.onresult = (event) => {
      const result = event.results[0][0].transcript.toLowerCase().trim();
      if (modal && result.includes(modal.word.toLowerCase())) {
        setSpeechFeedback('correct');
        setStarsCollected(prev => prev + 1);
        if (onStarEarned) onStarEarned(1);
        playFireworkSound();
        launchFireworks();
        setTimeout(() => {
          setPlanets(prev => [...prev, randomPlanet()]);
          closeModal();
          setSpeechFeedback(null);
        }, 1500);
      } else {
        setSpeechFeedback('incorrect');
        playPloop();
        setTimeout(() => setSpeechFeedback(null), 1500);
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onerror = () => {
      setSpeechFeedback('incorrect');
      setIsListening(false);
      setTimeout(() => setSpeechFeedback(null), 1500);
    };

    recognitionRef.current = recognition;
  }, [modal]);

  const handleMicClick = () => {
    if (!modal || isListening || !recognitionRef.current) return;
    try {
      recognitionRef.current.start();
    } catch (e) {
      console.warn(e);
    }
  };

  const handleSkip = () => {
    setPlanets(prev => [...prev, randomPlanet()]);
    closeModal();
  };

  return (
    <div className="relative z-20 w-full h-full flex flex-col select-none overflow-hidden"
      style={{ background: 'radial-gradient(circle at 50% 50%, rgba(76,29,149,0.4) 0%, transparent 70%), linear-gradient(to bottom, #0d0221 0%, #1e1b4b 100%)' }}>

      {/* Pause Overlay */}
      {isPaused && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/85 z-[300] backdrop-blur-sm">
          <h1 className="text-5xl mb-8 font-black text-yellow-400 uppercase italic">Paused</h1>
          <button onClick={() => { playClick(); setIsPaused(false); }} className="bg-[#5C6EE6] px-10 py-4 rounded-2xl border-b-4 border-[#4b5cd1] text-white text-xl font-black hover:bg-[#4b5cd1] transition-colors">▶ Resume</button>
        </div>
      )}

      {/* Top button bar */}
      <div className="absolute top-3 left-3 right-3 z-[200] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={() => { playClick(); onBack(); }} className="w-10 h-10 bg-[#F48D8A] rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-white text-xl font-black">←</span>
          </button>
          <button onClick={() => { playClick(); setIsPaused(p => !p); }} className="w-10 h-10 bg-[#5C6EE6] hover:bg-[#4b5cd1] border border-white/20 shadow-lg rounded-xl flex items-center justify-center transition-colors">
            <span className="text-white font-black text-sm">⏸</span>
          </button>
        </div>
        <div className="flex items-center gap-2">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 px-3 py-1.5 rounded-full flex items-center gap-2">
            <span className="text-yellow-400 text-lg">⭐</span>
            <span className="text-white font-bold text-lg">{totalStars}</span>
          </div>
          {onSettings && (
            <button onClick={() => { playClick(); onSettings(); }} className="w-10 h-10 bg-[#5C6EE6] hover:bg-[#4b5cd1] border border-white/20 shadow-lg rounded-xl flex items-center justify-center transition-colors">
              <img src="https://img.icons8.com/ios-filled/50/ffffff/settings.png" className="w-5 h-5" alt="Settings" />
            </button>
          )}
        </div>
      </div>

      {/* Perspective grid */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none',
        backgroundImage: 'linear-gradient(rgba(244,114,182,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(244,114,182,0.2) 1px, transparent 1px)',
        backgroundSize: '50px 50px',
        maskImage: 'linear-gradient(to bottom, transparent 20%, black 100%)',
        transform: 'perspective(500px) rotateX(60deg) translateY(100px)',
        transformOrigin: 'center bottom',
      }} />

      {/* Main game layout */}
      <div className="relative z-10 flex flex-col items-center justify-center w-full h-full gap-4 px-4">
        <h1 className="text-2xl md:text-3xl font-black text-pink-400 italic drop-shadow-[0_0_10px_rgba(244,114,182,1)]">CVC SPACE CLAW</h1>

        {/* Machine */}
        <div style={{
          position: 'relative', width: 340, height: 440,
          background: '#f472b6', border: '8px solid #3b82f6', borderRadius: 20,
          overflow: 'visible', flexShrink: 0,
          boxShadow: '0 0 50px rgba(244,114,182,0.4), 0 0 20px rgba(59,130,246,0.3)',
        }}>
          {/* Glass area */}
          <div ref={glassRef} style={{
            position: 'absolute', top: 10, left: 10, right: 10, height: 300,
            background: '#1e1b4b', borderRadius: 15, overflow: 'hidden',
            border: '4px solid #312e81', boxShadow: 'inset 0 0 50px rgba(0,0,0,0.9)',
          }}>
            {/* Scanlines */}
            <div style={{
              position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 10,
              background: 'linear-gradient(rgba(18,16,16,0) 50%, rgba(0,0,0,0.15) 50%)',
              backgroundSize: '100% 3px',
            }} />

            {/* Stars - static positions memoized, slow twinkle */}
            {useMemo(() => Array.from({ length: 18 }).map((_, i) => {
              const size = (((i * 7 + 3) % 3) * 0.5) + 1;
              const left = ((i * 17 + 5) % 95);
              const top = ((i * 13 + 7) % 90);
              const dur = 6 + (i % 5) * 1.5;
              const delay = (i % 7) * 0.8;
              return (
                <div key={i} style={{
                  position: 'absolute',
                  width: size, height: size,
                  background: '#fff', borderRadius: '50%',
                  left: `${left}%`, top: `${top}%`,
                  opacity: 0.4,
                  animation: `twinkle ${dur}s ${delay}s infinite alternate`,
                }} />
              );
            }), [])}

            {/* Drop hole */}
            <div style={{
              position: 'absolute', bottom: 0, left: 15, width: 90, height: 40,
              background: '#000', borderRadius: '50%', border: '4px solid #475569',
              boxShadow: 'inset 0 10px 20px rgba(0,0,0,0.8)', zIndex: 5,
            }} />

            {/* Claw assembly */}
            <div style={{
              position: 'absolute', top: 0,
              left: `${clawPos}%`,
              transform: `translateX(-50%) rotate(${clawTilt}deg)`,
              zIndex: 50,
              transformOrigin: 'top center',
            }}>
              {/* Cable */}
              <div style={{
                width: 6, height: cableHeight, margin: '0 auto',
                background: 'linear-gradient(90deg, #94a3b8, #cbd5e1, #94a3b8)',
                borderLeft: '1px solid #475569', borderRight: '1px solid #475569',
              }} />
              {/* Claw head */}
              <div style={{ width: 80, height: 40, position: 'relative', display: 'flex', justifyContent: 'center', transform: 'translateY(-2px)' }}>
                {/* Base */}
                <div style={{
                  width: 44, height: 24, background: '#ef4444', border: '3px solid #1e293b',
                  borderRadius: '12px 12px 4px 4px', position: 'absolute', top: 0, zIndex: 80,
                  boxShadow: 'inset 0 4px 0 rgba(255,255,255,0.3)',
                }} />
                {/* Arm 1 */}
                <div style={{
                  position: 'absolute', width: 14, height: 55, background: '#ef4444',
                  border: '2px solid #1e293b', borderRadius: 4, top: 12, left: 8,
                  transformOrigin: 'top center', zIndex: 70,
                  transform: isGrabClosed ? 'rotate(105deg) translate(22px, -18px)' : 'rotate(45deg)',
                  transition: 'transform 0.3s cubic-bezier(0.4,0,0.2,1)',
                }}>
                  <div style={{ position: 'absolute', bottom: -5, width: 18, height: 10, background: '#ef4444', border: '2px solid #1e293b', borderTop: 0, borderRadius: '0 0 8px 8px' }} />
                </div>
                {/* Arm 2 */}
                <div style={{
                  position: 'absolute', width: 14, height: 55, background: '#ef4444',
                  border: '2px solid #1e293b', borderRadius: 4, top: 12, right: 8,
                  transformOrigin: 'top center', zIndex: 70,
                  transform: isGrabClosed ? 'rotate(-105deg) translate(-22px, -18px)' : 'rotate(-45deg)',
                  transition: 'transform 0.3s cubic-bezier(0.4,0,0.2,1)',
                }}>
                  <div style={{ position: 'absolute', bottom: -5, width: 18, height: 10, background: '#ef4444', border: '2px solid #1e293b', borderTop: 0, borderRadius: '0 0 8px 8px' }} />
                </div>
                {/* Arm 3 (center) */}
                <div style={{
                  position: 'absolute', width: 14, height: 55, background: '#ef4444',
                  border: '2px solid #1e293b', borderRadius: 4, top: 15, left: 33,
                  transformOrigin: 'top center', zIndex: 45,
                  filter: isGrabClosed ? 'brightness(1)' : 'brightness(0.7)',
                  transform: isGrabClosed ? 'scaleY(1.4) translateY(24px)' : 'rotate(0deg) scaleY(0.7)',
                  transition: 'transform 0.3s cubic-bezier(0.4,0,0.2,1)',
                }}>
                  <div style={{ position: 'absolute', bottom: -5, width: 18, height: 10, background: '#ef4444', border: '2px solid #1e293b', borderTop: 0, borderRadius: '0 0 8px 8px' }} />
                </div>
              </div>
            </div>

            {/* Planets */}
            {planets.map(p => (
              <div key={p.id} style={{
                position: 'absolute',
                left: `${p.x}%`,
                bottom: p.y,
                transform: 'translateX(-50%)',
                zIndex: p.isGrabbed ? 100 : Math.floor(p.y + 10),
                pointerEvents: 'none',
              }}>
                <PlanetShape styleType={p.styleType} color={p.color} size={55} />
              </div>
            ))}
          </div>

          {/* Prize tray */}
          <div style={{
            position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)',
            width: 140, height: 80, background: '#334155', border: '4px solid #1e293b',
            borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
            overflow: 'hidden', boxShadow: 'inset 0 5px 15px rgba(0,0,0,0.5)',
          }}>
            {dispensedPlanet && (
              <div style={{ position: 'absolute', bottom: dispensedY, left: '50%', transform: 'translateX(-50%)' }}>
                <PlanetShape styleType={dispensedPlanet.styleType} color={dispensedPlanet.color} size={55} />
              </div>
            )}
          </div>
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: 240, marginTop: 8 }}>
          {/* Joystick */}
          <div className="flex flex-col items-center gap-2">
            <div
              ref={stickContainerRef}
              onMouseDown={handleJoyDown}
              onTouchStart={(e) => { e.preventDefault(); handleJoyDown(e); }}
              style={{
                position: 'relative', width: 90, height: 90,
                background: 'rgba(30,41,59,0.8)', borderRadius: '50%',
                border: '4px solid #3b82f6', display: 'flex',
                alignItems: 'center', justifyContent: 'center', touchAction: 'none',
              }}
            >
              <div style={{
                width: 40, height: 40, background: '#f472b6', border: '3px solid #fff',
                borderRadius: '50%', position: 'absolute',
                boxShadow: '0 4px 10px rgba(0,0,0,0.5)', zIndex: 50,
                transform: `translateX(${stickVisualX}px)`,
                transition: isDraggingRef.current ? 'none' : 'transform 0.2s',
              }} />
            </div>
            <div className="flex gap-4 text-blue-400 font-bold opacity-80 text-sm">{'< >'}</div>
          </div>

          {/* Grab button */}
          <div className="flex flex-col items-center">
            <button
              onClick={() => { playClick(); initAudio(); handleGrab(); }}
              disabled={isGrabbing}
              style={{
                width: 90, height: 90, background: '#facc15', color: '#000',
                borderRadius: '50%', fontWeight: 900, border: '4px solid #000',
                boxShadow: isGrabbing ? '0 2px #854d0e' : '0 6px #854d0e',
                cursor: isGrabbing ? 'not-allowed' : 'pointer',
                fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
                transform: isGrabbing ? 'translateY(4px)' : 'none',
                transition: 'all 0.1s',
                opacity: isGrabbing ? 0.7 : 1,
              }}
            >GRAB!</button>
          </div>
        </div>
      </div>



      {/* Reveal Modal */}
      {modal && (
        <div className="fixed inset-0 flex flex-col items-center justify-center bg-black/90 z-[1000]">
          <div style={{
            background: 'white', padding: 40, borderRadius: 30, color: '#1e293b',
            textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
            animation: 'grScalePop 0.4s cubic-bezier(0.175,0.885,0.32,1.275) forwards',
            width: 360, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20
          }}>
            <p className="text-pink-500 font-bold text-lg">{modal.family} family</p>
            {(() => { const img = getWordImage(modal.word); return img ? <img src={img} alt={modal.word} className="w-28 h-28 object-contain rounded-xl" /> : null; })()}
            <h2 className="text-7xl font-black text-blue-600 uppercase leading-none">{modal.word}</h2>
            
            {/* Status Text */}
            {speechFeedback ? (
              <div className={`py-3 px-6 rounded-full font-bold text-base ${
                speechFeedback === 'listening' ? 'bg-blue-100 text-blue-700' :
                speechFeedback === 'correct' ? 'bg-green-100 text-green-700' :
                'bg-red-100 text-red-700'
              }`}>
                {speechFeedback === 'listening' && '🎤 Listening...'}
                {speechFeedback === 'correct' && '✓ Correct!'}
                {speechFeedback === 'incorrect' && '✗ Try Again!'}
              </div>
            ) : (
              <p className="text-slate-500 font-medium text-base">Oops! Try tapping the mic.</p>
            )}
            
            {/* Mic Button */}
            <button
              onClick={() => { playClick(); handleMicClick(); }}
              disabled={isListening || speechFeedback === 'correct'}
              className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center shadow-inner hover:bg-slate-200 disabled:opacity-50 transition-all"
            >
              <Mic size={32} className="text-slate-700" />
            </button>
            
            {/* Skip and Next Buttons */}
            <div className="flex gap-4 w-full">
              <button
                onClick={() => { playClick(); handleSkip(); }}
                disabled={speechFeedback === 'correct'}
                className="flex-1 bg-slate-300 text-slate-700 py-4 rounded-2xl font-bold text-lg shadow-lg hover:bg-slate-400 disabled:opacity-50 active:scale-95 transition-all"
              >
                SKIP
              </button>
              <button
                onClick={() => { playClick(); handleSkip(); }}
                disabled={speechFeedback !== 'correct'}
                className="flex-1 bg-blue-500 text-white py-4 rounded-2xl font-bold text-lg shadow-lg hover:bg-blue-600 disabled:opacity-50 active:scale-95 transition-all"
              >
                NEXT!
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes twinkle { from { opacity:0.2; transform:scale(0.9); } to { opacity:0.7; transform:scale(1.05); } }
        @keyframes grScalePop { from { transform:scale(0); } to { transform:scale(1); } }
      `}</style>
    </div>
  );
}