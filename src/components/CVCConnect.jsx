import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WORD_FAMILIES, getFamilyConsonants, getWordImage } from '../utils/cvcAssets';

const VOWEL_FAMILIES = Object.fromEntries(
  Object.entries(WORD_FAMILIES).map(([k, v]) => [k.toLowerCase(), v])
);

const VOWEL_COLORS = { a: '#A855F7', e: '#3B82F6', i: '#EC4899', o: '#F59E0B', u: '#10B981' };
const LEFT_COLORS  = ['#FDE68A', '#FDBA74', '#FCA5A5'];
const RIGHT_COLORS = ['#F87171', '#FDBA74', '#FDE68A'];

// Re-use the speak function from parent scope via prop
function Confetti({ onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2800);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {Array.from({ length: 30 }).map((_, i) => (
        <div key={i} style={{
          position: 'absolute', top: '-20px',
          left: `${Math.random() * 100}%`,
          width: '10px', height: '10px',
          borderRadius: Math.random() > 0.5 ? '50%' : '2px',
          background: ['#F87171','#34D399','#60A5FA','#FBBF24','#A78BFA','#F472B6'][Math.floor(Math.random() * 6)],
          animation: `confettiFall ${2 + Math.random()}s ${Math.random() * 0.5}s linear forwards`,
        }} />
      ))}
      <style>{`
        @keyframes confettiFall {
          to { transform: translateY(110vh) rotate(720deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

export default function CVCConnect({ onBack, speak, playClick = () => {}, onSettings, onStarEarned, totalStars = 0 }) {
  const [isPaused, setIsPaused] = useState(false);
  const [activeVowel, setActiveVowel] = useState(null);
  const [leftItems, setLeftItems]     = useState([]);
  const [rightItems, setRightItems]   = useState([]);
  const [selectedLeft, setSelectedLeft]   = useState(null);
  const [selectedRight, setSelectedRight] = useState(null);
  const [selectedLeftIdx, setSelectedLeftIdx]   = useState(null);
  const [selectedRightIdx, setSelectedRightIdx] = useState(null);
  const [builtWord, setBuiltWord]     = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [dragging, setDragging] = useState(null);
  const [livePoint, setLivePoint] = useState(null);
  const [lineLeft, setLineLeft]   = useState(null);
  const [lineRight, setLineRight] = useState(null);
  const [starsCollected, setStarsCollected] = useState(0);
  const [sessionStars, setSessionStars] = useState(0);

  const containerRef = useRef(null);
  const audioCtxRef = useRef(null);

  const playPlink = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') ctx.resume();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.25);
  };
  const leftRefs     = useRef([]);
  const rightRefs    = useRef([]);
  const vowelRef     = useRef(null);

  const getCenter = useCallback((el) => {
    if (!el || !containerRef.current) return null;
    const cr = containerRef.current.getBoundingClientRect();
    const r  = el.getBoundingClientRect();
    return { x: r.left - cr.left + r.width / 2, y: r.top - cr.top + r.height / 2 };
  }, []);

  useEffect(() => {
    if (selectedLeftIdx !== null) {
      const fromCenter = getCenter(leftRefs.current[selectedLeftIdx]);
      const vowelCenter = getCenter(vowelRef.current);
      if (fromCenter && vowelCenter) setLineLeft({ from: fromCenter, to: vowelCenter });
    } else {
      setLineLeft(null);
    }
  }, [selectedLeftIdx, builtWord, getCenter]);

  useEffect(() => {
    if (selectedRightIdx !== null) {
      const vowelCenter = getCenter(vowelRef.current);
      const toCenter = getCenter(rightRefs.current[selectedRightIdx]);
      if (vowelCenter && toCenter) setLineRight({ from: vowelCenter, to: toCenter });
    } else {
      setLineRight(null);
    }
  }, [selectedRightIdx, builtWord, getCenter]);

  const loadVowel = (v) => {
    setActiveVowel(v);
    setSelectedLeft(null); setSelectedRight(null);
    setSelectedLeftIdx(null); setSelectedRightIdx(null);
    setBuiltWord(null); setShowConfetti(false);
    setLineLeft(null); setLineRight(null);
    setDragging(null); setLivePoint(null);
    leftRefs.current = []; rightRefs.current = [];

    const fams = VOWEL_FAMILIES[v] || [];
    let words = [];
    fams.forEach(f => {
      getFamilyConsonants(f).forEach(c => words.push({ consonant: c, ending: f.substring(1), emoji: getWordImage(c + f) }));
    });
    words.sort(() => 0.5 - Math.random());
    const seenC = new Set(); const seenE = new Set();
    const left = []; const right = [];
    for (const w of words) {
      if (!seenC.has(w.consonant)) { seenC.add(w.consonant); left.push(w); }
      if (!seenE.has(w.ending))    { seenE.add(w.ending);    right.push(w); }
      if (left.length >= 3 && right.length >= 3) break;
    }
    setLeftItems(left.slice(0, 3));
    setRightItems(right.slice(0, 3));
  };

  const buildWord = (left, right) => {
    const word = left.consonant + activeVowel + right.ending;
    setBuiltWord(word);
    setStarsCollected(prev => prev + 1);
    if (onStarEarned) onStarEarned(1);
    setTimeout(() => { speak(word); setShowConfetti(true); }, 300);
  };

  const onLeftPointerDown = (e, i) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    const center = getCenter(leftRefs.current[i]);
    setDragging({ fromType: 'left', fromIndex: i, sx: center.x, sy: center.y });
    const cr = containerRef.current.getBoundingClientRect();
    setLivePoint({ x: e.clientX - cr.left, y: e.clientY - cr.top });
  };

  const onVowelPointerDown = (e) => {
    if (!activeVowel) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const center = getCenter(vowelRef.current);
    setDragging({ fromType: 'vowel', sx: center.x, sy: center.y });
    const cr = containerRef.current.getBoundingClientRect();
    setLivePoint({ x: e.clientX - cr.left, y: e.clientY - cr.top });
  };

  const onPointerMove = (e) => {
    if (!dragging || !containerRef.current) return;
    const cr = containerRef.current.getBoundingClientRect();
    setLivePoint({ x: e.clientX - cr.left, y: e.clientY - cr.top });
  };

  const onPointerUp = (e) => {
    if (!dragging) return;
    const target = document.elementFromPoint(e.clientX, e.clientY)?.closest('[data-droptarget]');
    if (target) {
      const role = target.dataset.droptarget;
      const idx  = parseInt(target.dataset.idx);
      if (dragging.fromType === 'left' && role === 'vowel') {
        const item = leftItems[dragging.fromIndex];
        setSelectedLeft(item); setSelectedLeftIdx(dragging.fromIndex);
        playPlink();
        speak(item.consonant);
        if (selectedRight) buildWord(item, selectedRight);
      } else if (dragging.fromType === 'vowel' && role === 'right') {
        const item = rightItems[idx];
        setSelectedRight(item); setSelectedRightIdx(idx);
        playPlink();
        speak(item.ending);
        if (selectedLeft) buildWord(selectedLeft, item);
      }
    }
    setDragging(null); setLivePoint(null);
  };

  const resetGame = () => {
    setSelectedLeft(null); setSelectedRight(null);
    setSelectedLeftIdx(null); setSelectedRightIdx(null);
    setBuiltWord(null); setShowConfetti(false);
    setLineLeft(null); setLineRight(null);
    if (activeVowel) loadVowel(activeVowel);
  };

  const shuffleLetters = () => {
    playClick();
    setLeftItems(prev => [...prev].sort(() => 0.5 - Math.random()));
    setRightItems(prev => [...prev].sort(() => 0.5 - Math.random()));
  };

  const TILE_SIZE = 'clamp(68px, 14vw, 88px)';
  const TILE_FONT = 'clamp(1.8rem, 4.5vw, 2.6rem)';
  const liveLineFrom = dragging ? { x: dragging.sx, y: dragging.sy } : null;

  return (
    <div className="relative z-20 w-full h-full flex flex-col select-none">


      {/* Pause Overlay */}
      {isPaused && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/85 z-[100] backdrop-blur-sm">
          <h1 className="text-5xl mb-8 font-black text-yellow-400 uppercase italic">Paused</h1>
          <button onClick={() => { playClick(); setIsPaused(false); }} className="bg-[#5C6EE6] px-10 py-4 rounded-2xl border-b-4 border-[#4b5cd1] text-white text-xl font-black hover:bg-[#4b5cd1] transition-colors">▶ Resume</button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-white/5 backdrop-blur-md border-b border-white/10">
        <div className="flex items-center gap-2">
          <button onClick={() => { playClick(); onBack(); }} className="w-10 h-10 bg-[#F48D8A] rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-white text-xl font-black">←</span>
          </button>
          <button onClick={() => { playClick(); setIsPaused(p => !p); }} className="w-10 h-10 bg-[#5C6EE6] hover:bg-[#4b5cd1] border border-white/20 shadow-lg rounded-xl flex items-center justify-center transition-colors">
            <span className="text-white font-black text-sm">⏸</span>
          </button>
        </div>
        <h2 className="text-white text-2xl md:text-4xl font-black uppercase italic tracking-tighter">CVC Connect</h2>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-indigo-950/60 px-3 py-1.5 rounded-full border border-orange-400/50">
            <span className="text-yellow-400 text-lg">⭐</span>
            <span className="text-white font-bold text-lg">{totalStars}</span>
          </div>
          <button onClick={shuffleLetters} className="w-10 h-10 bg-[#5C6EE6] hover:bg-[#4b5cd1] border border-white/20 shadow-lg rounded-xl flex items-center justify-center transition-colors" title="Shuffle">
            <span className="text-white text-lg">🔁</span>
          </button>
          {onSettings && (
            <button onClick={() => { playClick(); onSettings(); }} className="w-10 h-10 bg-[#5C6EE6] hover:bg-[#4b5cd1] border border-white/20 shadow-lg rounded-xl flex items-center justify-center transition-colors">
              <img src="https://img.icons8.com/ios-filled/50/ffffff/settings.png" className="w-5 h-5" alt="Settings" />
            </button>
          )}
        </div>
      </div>

      {/* Vowel row */}
      <div className="flex justify-center gap-2 sm:gap-4 px-3 py-3 bg-white/5">
        {['a','e','i','o','u'].map(v => (
          <button
            key={v}
            onClick={() => { playClick(); loadVowel(v); }}
            style={{
              background: VOWEL_COLORS[v],
              border: activeVowel === v ? '4px solid white' : '4px solid transparent',
              transform: activeVowel === v ? 'translateY(-3px)' : 'none',
            }}
            className="w-12 h-12 md:w-14 md:h-14 rounded-2xl text-2xl md:text-3xl font-black text-white shadow-lg transition-all hover:scale-110 active:scale-95"
          >
            {v}
          </button>
        ))}
      </div>

      {/* Game area */}
      <div
        ref={containerRef}
        className="relative flex items-center justify-center flex-1"
        style={{ touchAction: 'none' }}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        {/* SVG lines */}
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 5 }}>
          {lineLeft && <line x1={lineLeft.from.x} y1={lineLeft.from.y} x2={lineLeft.to.x} y2={lineLeft.to.y} stroke="white" strokeWidth="2.5" strokeLinecap="round" opacity="0.6" />}
          {lineRight && <line x1={lineRight.from.x} y1={lineRight.from.y} x2={lineRight.to.x} y2={lineRight.to.y} stroke="white" strokeWidth="2.5" strokeLinecap="round" opacity="0.6" />}
          {dragging && livePoint && liveLineFrom && (
            <line x1={liveLineFrom.x} y1={liveLineFrom.y} x2={livePoint.x} y2={livePoint.y}
              stroke="#FACC15" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="6 4" opacity="0.9" />
          )}
        </svg>

        {activeVowel ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: `${TILE_SIZE} ${TILE_SIZE} ${TILE_SIZE}`,
            gridTemplateRows: `${TILE_SIZE} ${TILE_SIZE} ${TILE_SIZE}`,
            gap: 'clamp(12px, 2.5vw, 20px) clamp(40px, 9vw, 80px)',
          }}>
            {/* Left consonants */}
            {leftItems.map((item, i) => (
              <div
                key={`l-${i}`}
                ref={el => leftRefs.current[i] = el}
                data-droptarget="left"
                data-idx={i}
                onPointerDown={(e) => onLeftPointerDown(e, i)}
                style={{
                  gridColumn: 1, gridRow: i + 1,
                  width: TILE_SIZE, height: TILE_SIZE,
                  background: selectedLeftIdx === i ? '#FACC15' : 'rgba(255,255,255,0.15)',
                  borderRadius: '20px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: TILE_FONT, fontWeight: 700, color: selectedLeftIdx === i ? '#1e293b' : 'white',
                  cursor: 'grab',
                  border: selectedLeftIdx === i ? '3px solid #F59E0B' : '3px solid rgba(255,255,255,0.3)',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                  zIndex: 10, touchAction: 'none', userSelect: 'none',
                  backdropFilter: 'blur(8px)',
                }}
              >
                {item.consonant}
              </div>
            ))}

            {/* Vowel center */}
            <div
              ref={vowelRef}
              data-droptarget="vowel"
              onPointerDown={onVowelPointerDown}
              style={{
                gridColumn: 2, gridRow: 2,
                width: TILE_SIZE, height: TILE_SIZE,
                background: VOWEL_COLORS[activeVowel],
                borderRadius: '20px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: TILE_FONT, fontWeight: 700, color: 'white',
                boxShadow: `0 4px 24px ${VOWEL_COLORS[activeVowel]}80`,
                border: '3px solid rgba(255,255,255,0.4)',
                zIndex: 10, cursor: 'grab', touchAction: 'none', userSelect: 'none',
              }}
            >
              {activeVowel}
            </div>

            {/* Right endings */}
            {rightItems.map((item, i) => (
              <div
                key={`r-${i}`}
                ref={el => rightRefs.current[i] = el}
                data-droptarget="right"
                data-idx={i}
                style={{
                  gridColumn: 3, gridRow: i + 1,
                  width: TILE_SIZE, height: TILE_SIZE,
                  background: selectedRightIdx === i ? '#34D399' : 'rgba(255,255,255,0.15)',
                  borderRadius: '20px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: TILE_FONT, fontWeight: 700, color: selectedRightIdx === i ? '#1e293b' : 'white',
                  border: selectedRightIdx === i ? '3px solid #10B981' : '3px solid rgba(255,255,255,0.3)',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                  zIndex: 10, userSelect: 'none',
                  backdropFilter: 'blur(8px)',
                }}
              >
                {item.ending}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center">
            <div className="text-6xl mb-4">👆</div>
            <p className="text-yellow-300 font-bold text-xl">Tap a vowel to start!</p>
          </div>
        )}
      </div>

      {/* Built word */}
      <AnimatePresence>
        {builtWord && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-3 py-5"
          >
            {(() => {
              const family = builtWord.slice(1);
              const consonant = builtWord[0];
              const imgPath = getWordImage(consonant + family);
              return imgPath ? <img src={imgPath} alt={builtWord} className="w-24 h-24 md:w-28 md:h-28 object-contain rounded-2xl bg-white/10 p-2" /> : null;
            })()}
            <div className="text-5xl md:text-6xl font-black tracking-widest">
              <span style={{ color: '#F87171' }}>{builtWord[0]}</span>
              <span style={{ color: VOWEL_COLORS[activeVowel] }}>{builtWord[1]}</span>
              <span style={{ color: '#60A5FA' }}>{builtWord.slice(2)}</span>
            </div>
            <button
              onClick={() => { playClick(); resetGame(); }}
              className="px-8 py-3 rounded-2xl text-white font-bold text-lg shadow-lg"
              style={{ background: 'linear-gradient(135deg, #10B981, #059669)' }}
            >
              Next Word ➡️
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}