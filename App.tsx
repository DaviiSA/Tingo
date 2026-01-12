
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import { GameState, GrowthStage } from './types';
import { INITIAL_STATS, MENU_ACTIONS, STAGE_THRESHOLDS } from './constants';
import PenguinCharacter from './components/PenguinCharacter';
import StatsBar from './components/StatsBar';

interface Particle {
  id: number;
  x: number;
  y: number;
  content: string;
}

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(() => {
    const saved = localStorage.getItem('tingo_modern_save');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const now = Date.now();
        const diffSecs = (now - parsed.lastUpdate) / 1000;
        const hours = diffSecs / 3600;
        if (parsed.stage === 'DEAD') return parsed;

        return {
          ...parsed,
          stats: {
            ...parsed.stats,
            hunger: Math.max(0, parsed.stats.hunger - (hours * 12)),
            happiness: Math.max(0, parsed.stats.happiness - (hours * 8)),
            hygiene: Math.max(0, parsed.stats.hygiene - (hours * 4)),
            energy: parsed.isSleeping ? Math.min(100, parsed.stats.energy + (hours * 20)) : Math.max(0, parsed.stats.energy - (hours * 6)),
          },
          lastUpdate: now
        };
      } catch (e) {
        console.error("Save load error:", e);
      }
    }
    return {
      stats: INITIAL_STATS,
      name: "TINGO",
      stage: 'EGG',
      isSleeping: false,
      isSick: false,
      poopCount: 0,
      lastUpdate: Date.now(),
      selectedActionIndex: 0
    };
  });

  const [message, setMessage] = useState("OLÁ, SOU O TINGO!");
  const [isInteracting, setIsInteracting] = useState({
    petting: false,
    feeding: false,
    bathing: false,
    playing: false
  });
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [particles, setParticles] = useState<Particle[]>([]);
  
  const audioCtxRef = useRef<AudioContext | null>(null);
  const lastInteractionTime = useRef(0);
  const particleIdRef = useRef(0);

  const addParticles = (x: number, y: number, content: string, count: number = 5) => {
    const newParticles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      newParticles.push({
        id: particleIdRef.current++,
        x: x + (Math.random() - 0.5) * 60,
        y: y + (Math.random() - 0.5) * 60,
        content
      });
    }
    setParticles(prev => [...prev, ...newParticles]);
    setTimeout(() => {
      setParticles(prev => prev.filter(p => !newParticles.find(np => np.id === p.id)));
    }, 1000);
  };

  const playSound = (type: 'POP' | 'YUM' | 'JOY' | 'ZZZ' | 'SCRUB') => {
    try {
      if (!audioCtxRef.current) audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      const ctx = audioCtxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      const now = ctx.currentTime;
      
      switch(type) {
        case 'POP':
          osc.frequency.setValueAtTime(400, now);
          osc.frequency.exponentialRampToValueAtTime(800, now + 0.1);
          gain.gain.setValueAtTime(0.1, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
          osc.start(); osc.stop(now + 0.1);
          break;
        case 'YUM':
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(200, now);
          osc.frequency.linearRampToValueAtTime(400, now + 0.2);
          gain.gain.setValueAtTime(0.1, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
          osc.start(); osc.stop(now + 0.2);
          break;
        case 'JOY':
          osc.frequency.setValueAtTime(523.25, now);
          osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.15);
          gain.gain.setValueAtTime(0.05, now);
          osc.start(); osc.stop(now + 0.15);
          break;
        case 'SCRUB':
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(100, now);
          osc.frequency.linearRampToValueAtTime(200, now + 0.1);
          gain.gain.setValueAtTime(0.05, now);
          osc.start(); osc.stop(now + 0.1);
          break;
        case 'ZZZ':
          osc.type = 'sine';
          osc.frequency.setValueAtTime(150, now);
          gain.gain.setValueAtTime(0.05, now);
          gain.gain.linearRampToValueAtTime(0, now + 1);
          osc.start(); osc.stop(now + 1);
          break;
      }
    } catch (e) { console.warn("Audio Context error", e); }
  };

  const updateThoughts = useCallback(async (state: GameState) => {
    if (state.stage === 'DEAD' || state.isSleeping) return;
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `Você é um pinguim fofo chamado Tingo. Fome: ${Math.floor(state.stats.hunger)}%, Felicidade: ${Math.floor(state.stats.happiness)}%. Escreva uma frase curta (máx 6 palavras) expressando como você se sente agora.`;
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt
      });
      setMessage(response.text?.trim() || "PIU! ❤️");
    } catch {
      setMessage("ESTOU MUITO FELIZ! ❤️");
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setGameState(prev => {
        if (prev.stage === 'DEAD') return prev;
        const newStats = { ...prev.stats };
        if (!prev.isSleeping) {
          newStats.hunger = Math.max(0, newStats.hunger - 0.4);
          newStats.happiness = Math.max(0, newStats.happiness - 0.2);
          newStats.energy = Math.max(0, newStats.energy - 0.1);
        } else {
          newStats.energy = Math.min(100, newStats.energy + 1.5);
        }
        newStats.age += 0.001;
        let newStage: GrowthStage = prev.stage;
        if (newStats.age >= STAGE_THRESHOLDS.ADULT) newStage = 'ADULT';
        else if (newStats.age >= STAGE_THRESHOLDS.CHILD) newStage = 'CHILD';
        else if (newStats.age >= STAGE_THRESHOLDS.BABY && prev.stage === 'EGG') newStage = 'BABY';
        if (newStats.hunger <= 5 || newStats.health <= 5) {
           if (Math.random() > 0.995) newStage = 'DEAD';
        }
        const newState = { ...prev, stats: newStats, stage: newStage, lastUpdate: Date.now() };
        localStorage.setItem('tingo_modern_save', JSON.stringify(newState));
        return newState;
      });
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleAction = (id: string, x?: number, y?: number) => {
    if (gameState.stage === 'DEAD') {
      if (id === 'STATS' && window.confirm("Reiniciar o jogo?")) {
        setGameState({ stats: INITIAL_STATS, name: "TINGO", stage: 'EGG', isSleeping: false, isSick: false, poopCount: 0, lastUpdate: Date.now(), selectedActionIndex: 0 });
        setMessage("BEM-VINDO DE VOLTA!");
        setParticles([]);
      }
      return;
    }

    playSound('POP');
    const px = x || window.innerWidth / 2;
    const py = y || window.innerHeight / 2;

    switch (id) {
      case 'FOOD':
        if (!gameState.isSleeping) {
          setIsInteracting(p => ({ ...p, feeding: true }));
          playSound('YUM');
          addParticles(px, py, '🐟', 3);
          setGameState(prev => {
            const next = { ...prev, stats: { ...prev.stats, hunger: Math.min(100, prev.stats.hunger + 25) } };
            setTimeout(() => {
               setIsInteracting(p => ({ ...p, feeding: false }));
               updateThoughts(next);
            }, 2000);
            return next;
          });
        }
        break;
      case 'LIGHT':
        setGameState(prev => {
          const next = { ...prev, isSleeping: !prev.isSleeping };
          setMessage(next.isSleeping ? "BONS SONHOS... Zzz" : "BOM DIA, AMIGO!");
          if (next.isSleeping) playSound('ZZZ');
          return next;
        });
        break;
      case 'PLAY':
        if (!gameState.isSleeping) {
          setIsInteracting(p => ({ ...p, playing: true }));
          playSound('JOY');
          addParticles(px, py, '⭐', 5);
          setGameState(prev => {
            const next = { ...prev, stats: { ...prev.stats, happiness: Math.min(100, prev.stats.happiness + 20), energy: Math.max(0, prev.stats.energy - 10) } };
            setTimeout(() => {
               setIsInteracting(p => ({ ...p, playing: false }));
               updateThoughts(next);
            }, 2500);
            return next;
          });
        }
        break;
      case 'CLEAN':
        setIsInteracting(p => ({ ...p, bathing: true }));
        playSound('SCRUB');
        addParticles(px, py, '🫧', 8);
        setGameState(prev => {
          const next = { ...prev, poopCount: 0, stats: { ...prev.stats, hygiene: 100 } };
          setTimeout(() => setIsInteracting(p => ({ ...p, bathing: false })), 2000);
          return next;
        });
        break;
      case 'HEAL':
        setGameState(prev => {
          const next = { ...prev, isSick: false, stats: { ...prev.stats, health: 100 } };
          addParticles(px, py, '💊', 4);
          setMessage("ESTOU ME SENTINDO ÓTIMO!");
          return next;
        });
        break;
    }
  };

  const handlePetting = (e: React.MouseEvent | React.TouchEvent) => {
    if (gameState.stage === 'DEAD' || gameState.isSleeping) return;
    const now = Date.now();
    if (now - lastInteractionTime.current > 600) {
      const x = 'clientX' in e ? e.clientX : e.touches[0].clientX;
      const y = 'clientY' in e ? e.clientY : e.touches[0].clientY;
      setIsInteracting(p => ({ ...p, petting: true }));
      addParticles(x, y, '❤️', 3);
      playSound('JOY');
      setGameState(prev => ({ ...prev, stats: { ...prev.stats, happiness: Math.min(100, prev.stats.happiness + 3) } }));
      lastInteractionTime.current = now;
      setTimeout(() => setIsInteracting(p => ({ ...p, petting: false })), 600);
    }
  };

  const onDragStart = (e: React.MouseEvent, id: string) => {
    if (gameState.stage === 'DEAD' || gameState.isSleeping) return;
    setDraggedItem(id);
    setMousePos({ x: e.clientX, y: e.clientY });
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (draggedItem) setMousePos({ x: e.clientX, y: e.clientY });
  };

  const onMouseUp = (e: React.MouseEvent) => {
    if (draggedItem) {
      const petEl = document.getElementById('pet-area');
      if (petEl) {
        const rect = petEl.getBoundingClientRect();
        if (e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom) {
          handleAction(draggedItem, e.clientX, e.clientY);
        }
      }
      setDraggedItem(null);
    }
  };

  return (
    <div className="modern-device select-none" onMouseMove={onMouseMove} onMouseUp={onMouseUp}>
      {/* Particles Layer */}
      {particles.map(p => (
        <div key={p.id} className="particle text-2xl" style={{ left: p.x - 12, top: p.y - 12 }}>
          {p.content}
        </div>
      ))}

      {/* Dragging Preview */}
      {draggedItem && (
        <div className="fixed z-[100] text-5xl pointer-events-none drop-shadow-2xl animate-wobble" 
             style={{ left: mousePos.x - 24, top: mousePos.y - 24 }}>
          {MENU_ACTIONS.find(a => a.id === draggedItem)?.icon}
        </div>
      )}

      <div className="app-screen">
        <div className="status-grid">
           <StatsBar label="Fome" value={gameState.stats.hunger} icon="🍚" color="bg-orange-400" />
           <StatsBar label="Feliz" value={gameState.stats.happiness} icon="❤️" color="bg-pink-400" />
           <StatsBar label="Saúde" value={gameState.stats.health} icon="💉" color="bg-green-400" />
        </div>

        {/* Message Bubble */}
        <div className="z-20 bg-white/95 backdrop-blur shadow-lg rounded-2xl p-4 text-center mx-4 mb-4 font-bold text-slate-800 relative transition-all duration-300">
          {gameState.stage === 'DEAD' ? "TINGO VIROU UMA ESTRELA 🌟" : message}
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white/95 rotate-45 shadow-sm"></div>
        </div>

        {/* Interaction Area */}
        <div id="pet-area" className="flex-1 flex flex-col items-center justify-center relative cursor-pointer" onMouseDown={handlePetting}>
          <div className="habitat z-0"></div>
          
          <div className="z-10 w-full flex justify-center">
            <PenguinCharacter 
              stage={gameState.stage}
              isSleeping={gameState.isSleeping}
              isEating={isInteracting.feeding}
              isPlaying={isInteracting.playing}
              isBathing={isInteracting.bathing}
              isPetting={isInteracting.petting}
              age={gameState.stats.age}
              accessories={{hat: null, glasses: null, clothing: null}}
              isHoveredByItem={!!draggedItem}
            />
          </div>

          {/* Visual Extras */}
          {gameState.poopCount > 0 && (
            <div className="absolute bottom-36 right-12 text-4xl animate-bounce z-20 filter drop-shadow-md">💩</div>
          )}
          {gameState.isSick && (
            <div className="absolute top-1/2 left-12 text-4xl animate-pulse z-20 filter drop-shadow-md">🤒</div>
          )}
          {isInteracting.playing && (
            <div className="absolute top-1/2 right-10 text-5xl animate-bounce z-30">⚽</div>
          )}
          {isInteracting.feeding && (
            <div className="absolute top-1/2 left-10 text-5xl animate-bounce z-30">🐟</div>
          )}
        </div>
      </div>

      {/* Navigation / Actions Dock */}
      <div className="action-dock">
         {MENU_ACTIONS.map(action => (
           <div 
             key={action.id}
             onMouseDown={(e) => onDragStart(e, action.id)}
             onClick={() => handleAction(action.id)}
             className={`action-btn ${gameState.stage === 'DEAD' && action.id !== 'STATS' ? 'opacity-20 cursor-not-allowed grayscale' : ''} ${draggedItem === action.id ? 'grabbing-item scale-110 border-blue-400' : ''}`}
           >
             <span className="action-icon">{action.icon}</span>
             <span className="action-label">{action.label}</span>
           </div>
         ))}
      </div>

      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1.5 bg-black/10 rounded-full"></div>
    </div>
  );
};

export default App;
