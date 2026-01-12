
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import { GameState, GrowthStage, EnvironmentType, ActionScenario } from './types';
import { INITIAL_STATS, MENU_ACTIONS, STAGE_THRESHOLDS, ENVIRONMENTS } from './constants';
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
          environment: parsed.environment || 'HOME',
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
      environment: 'HOME',
      isSleeping: false,
      isSick: false,
      poopCount: 0,
      lastUpdate: Date.now(),
      selectedActionIndex: 0
    };
  });

  const [message, setMessage] = useState("OLÁ, SOU O TINGO!");
  const [activeScenario, setActiveScenario] = useState<ActionScenario>(null);
  const [isInteracting, setIsInteracting] = useState({
    petting: false,
    feeding: false,
    bathing: false,
    playingBall: false,
    playingCar: false,
    playingPlush: false
  });
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [particles, setParticles] = useState<Particle[]>([]);
  const [showMap, setShowMap] = useState(false);
  
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

  const playSound = (type: 'POP' | 'YUM' | 'JOY' | 'ZZZ' | 'SCRUB' | 'WAVE' | 'VROOM') => {
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
        case 'VROOM':
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(100, now);
          osc.frequency.exponentialRampToValueAtTime(300, now + 0.5);
          gain.gain.setValueAtTime(0.05, now);
          osc.start(); osc.stop(now + 0.5);
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
        case 'WAVE':
          osc.frequency.setValueAtTime(300, now);
          osc.frequency.exponentialRampToValueAtTime(150, now + 0.5);
          gain.gain.setValueAtTime(0.05, now);
          osc.start(); osc.stop(now + 0.5);
          break;
      }
    } catch (e) { console.warn("Audio Context error", e); }
  };

  const resetGame = () => {
    playSound('JOY');
    const newState: GameState = { 
      stats: INITIAL_STATS, 
      name: "TINGO", 
      stage: 'EGG', 
      environment: 'HOME',
      isSleeping: false, 
      isSick: false, 
      poopCount: 0, 
      lastUpdate: Date.now(), 
      selectedActionIndex: 0 
    };
    setGameState(newState);
    localStorage.setItem('tingo_modern_save', JSON.stringify(newState));
    setMessage("UM NOVO COMEÇO! ❤️");
    setParticles([]);
    setShowMap(false);
  };

  const updateThoughts = useCallback(async (state: GameState, specialContext?: string) => {
    if (state.stage === 'DEAD' || state.isSleeping) return;
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      let contextPrompt = `Você é um pinguim fofo chamado Tingo. Você está no ambiente ${ENVIRONMENTS[state.environment].name}. Fome: ${Math.floor(state.stats.hunger)}%, Felicidade: ${Math.floor(state.stats.happiness)}%.`;
      
      if (specialContext === 'PETTING') {
        contextPrompt += " Alguém acabou de te fazer carinho e você está muito feliz e dengoso.";
      } else if (specialContext === 'CAR') {
        contextPrompt += " Você está brincando de corrida com um carrinho super rápido!";
      } else if (specialContext === 'PLUSH') {
        contextPrompt += " Você está abraçando uma pelúcia macia.";
      }

      contextPrompt += " Escreva uma frase curta (máx 6 palavras) expressando como você se sente agora.";

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: contextPrompt
      });
      setMessage(response.text?.trim() || "PIU! ❤️");
    } catch {
      setMessage(specialContext === 'PETTING' ? "AMO SEU CARINHO! ❤️" : "ESTOU MUITO FELIZ! ❤️");
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
          const hygieneDrain = prev.environment === 'LIBRARY' ? 0.1 : 0.2;
          newStats.hygiene = Math.max(0, newStats.hygiene - hygieneDrain);
          newStats.energy = Math.max(0, newStats.energy - 0.1);
        } else {
          const energyGain = prev.environment === 'HOME' ? 1.8 : 1.5;
          newStats.energy = Math.min(100, newStats.energy + energyGain);
        }
        
        const growthRate = prev.environment === 'SCHOOL' ? 0.0026 : 0.002;
        newStats.age += growthRate;
        
        let newStage: GrowthStage = prev.stage;
        if (newStats.age >= STAGE_THRESHOLDS.SENIOR) newStage = 'SENIOR';
        else if (newStats.age >= STAGE_THRESHOLDS.ADULT) newStage = 'ADULT';
        else if (newStats.age >= STAGE_THRESHOLDS.CHILD) newStage = 'CHILD';
        else if (newStats.age >= STAGE_THRESHOLDS.BABY && prev.stage === 'EGG') newStage = 'BABY';

        const criticalStat = newStats.hunger <= 10 || newStats.health <= 10 || newStats.happiness <= 5;
        const reachedEnd = newStats.age >= STAGE_THRESHOLDS.MAX_AGE;
        
        if (reachedEnd || (criticalStat && Math.random() > 0.99)) {
           newStage = 'DEAD';
        }

        const newState = { ...prev, stats: newStats, stage: newStage, lastUpdate: Date.now() };
        localStorage.setItem('tingo_modern_save', JSON.stringify(newState));
        return newState;
      });
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const changeEnvironment = (envType: EnvironmentType) => {
    playSound('WAVE');
    setGameState(prev => ({ ...prev, environment: envType }));
    setShowMap(false);
    setMessage(`ESTAMOS NO(A) ${ENVIRONMENTS[envType].name}!`);
  };

  const handleAction = (id: string, x?: number, y?: number) => {
    if (gameState.stage === 'DEAD') return;

    playSound('POP');
    const px = x || window.innerWidth / 2;
    const py = y || window.innerHeight / 2;

    switch (id) {
      case 'FOOD':
        if (!gameState.isSleeping) {
          setActiveScenario('KITCHEN');
          setIsInteracting(p => ({ ...p, feeding: true }));
          playSound('YUM');
          addParticles(px, py, '🐟', 3);
          setGameState(prev => {
            const next = { ...prev, stats: { ...prev.stats, hunger: Math.min(100, prev.stats.hunger + 25) } };
            setTimeout(() => {
               setIsInteracting(p => ({ ...p, feeding: false }));
               setActiveScenario(null);
               updateThoughts(next);
            }, 3000);
            return next;
          });
        }
        break;
      case 'LIGHT':
        setActiveScenario('BEDROOM');
        setGameState(prev => {
          const next = { ...prev, isSleeping: !prev.isSleeping };
          setMessage(next.isSleeping ? "BONS SONHOS... Zzz" : "BOM DIA, AMIGO!");
          if (next.isSleeping) playSound('ZZZ');
          if (!next.isSleeping) {
             setTimeout(() => setActiveScenario(null), 2000);
          }
          return next;
        });
        break;
      case 'BALL':
      case 'CAR':
      case 'PLUSH':
        if (!gameState.isSleeping) {
          setActiveScenario('PLAYROOM');
          const isBall = id === 'BALL';
          const isCar = id === 'CAR';
          const isPlush = id === 'PLUSH';
          
          setIsInteracting(p => ({ 
            ...p, 
            playingBall: isBall, 
            playingCar: isCar, 
            playingPlush: isPlush 
          }));

          if (isCar) playSound('VROOM');
          else playSound('JOY');

          const icon = isBall ? '⚽' : isCar ? '🏎️' : '🧸';
          addParticles(px, py, icon, 5);

          setGameState(prev => {
            const hapGain = prev.environment === 'PARK' ? 40 : 20;
            const energyLoss = isCar ? 15 : 10;
            const next = { 
              ...prev, 
              stats: { 
                ...prev.stats, 
                happiness: Math.min(100, prev.stats.happiness + hapGain), 
                energy: Math.max(0, prev.stats.energy - energyLoss) 
              } 
            };
            setTimeout(() => {
               setIsInteracting(p => ({ 
                 ...p, 
                 playingBall: false, 
                 playingCar: false, 
                 playingPlush: false 
               }));
               setActiveScenario(null);
               updateThoughts(next, id === 'CAR' ? 'CAR' : id === 'PLUSH' ? 'PLUSH' : undefined);
            }, 3000);
            return next;
          });
        }
        break;
      case 'CLEAN':
        setActiveScenario('BATHROOM');
        setIsInteracting(p => ({ ...p, bathing: true }));
        playSound('SCRUB');
        addParticles(px, py, '🫧', 8);
        setGameState(prev => {
          const next = { ...prev, poopCount: 0, stats: { ...prev.stats, hygiene: 100 } };
          setTimeout(() => {
            setIsInteracting(p => ({ ...p, bathing: false }));
            setActiveScenario(null);
          }, 2500);
          return next;
        });
        break;
      case 'HEAL':
        setActiveScenario('CLINIC');
        setGameState(prev => {
          const next = { ...prev, isSick: false, stats: { ...prev.stats, health: 100 } };
          addParticles(px, py, '💊', 4);
          setMessage("ESTOU ME SENTINDO ÓTIMO!");
          setTimeout(() => setActiveScenario(null), 3000);
          return next;
        });
        break;
      case 'TRAVEL':
        setShowMap(!showMap);
        break;
      case 'STATS':
        setActiveScenario('LIBRARY');
        const s = gameState.stats;
        const years = Math.floor(s.age);
        const months = Math.floor((s.age % 1) * 12);
        const ageStr = years > 0 ? `${years} ANOS E ${months} MESES` : `${months} MESES`;
        setMessage(`ATINGI ${ageStr}! NÍVEL ${Math.floor(s.age * 5) + 1}`);
        setTimeout(() => setActiveScenario(null), 3000);
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
      
      setGameState(prev => {
        const next = { ...prev, stats: { ...prev.stats, happiness: Math.min(100, prev.stats.happiness + 3) } };
        updateThoughts(next, 'PETTING');
        return next;
      });

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

  const renderScenarioDetails = (scenario: ActionScenario) => {
    switch(scenario) {
      case 'KITCHEN':
        return (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <div className="absolute inset-0 bg-orange-50/80 backdrop-blur-sm z-[-1]"></div>
            <div className="grid grid-cols-4 gap-2 opacity-10 absolute inset-0">
               {Array(16).fill(0).map((_, i) => <div key={i} className="w-full h-full border border-orange-200"></div>)}
            </div>
            <div className="absolute top-10 right-10 text-6xl opacity-40">🧊</div>
            <div className="absolute top-10 left-10 text-6xl opacity-40">🍳</div>
          </div>
        );
      case 'BATHROOM':
        return (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <div className="absolute inset-0 bg-sky-50/80 backdrop-blur-sm z-[-1]"></div>
            <div className="absolute top-8 left-8 text-5xl opacity-40 animate-pulse">🚿</div>
            <div className="absolute top-12 right-12 text-5xl opacity-40 animate-bounce">🧼</div>
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
               <div className="absolute top-1/4 left-1/3 text-2xl animate-bounce opacity-20">🫧</div>
               <div className="absolute top-2/3 right-1/4 text-3xl animate-bounce opacity-20" style={{animationDelay: '1s'}}>🫧</div>
            </div>
          </div>
        );
      case 'BEDROOM':
        return (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <div className={`absolute inset-0 ${gameState.isSleeping ? 'bg-indigo-950/80' : 'bg-indigo-50/80'} backdrop-blur-sm z-[-1] transition-colors duration-1000`}></div>
            <div className="absolute top-10 right-10 text-5xl animate-pulse">
               {gameState.isSleeping ? '🌙' : '⭐'}
            </div>
            <div className="absolute bottom-24 left-1/2 -translate-x-1/2 w-72 h-32 bg-slate-200/40 rounded-t-[40px] border-t-4 border-slate-300/50"></div>
          </div>
        );
      case 'PLAYROOM':
        return (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <div className="absolute inset-0 bg-yellow-50/80 backdrop-blur-sm z-[-1]"></div>
            <div className="absolute top-10 left-10 text-5xl opacity-40">🧩</div>
            <div className="absolute top-12 right-12 text-5xl opacity-40 rotate-12">🎨</div>
            <div className="absolute bottom-12 left-12 text-4xl opacity-40">🧱</div>
          </div>
        );
      case 'CLINIC':
        return (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <div className="absolute inset-0 bg-rose-50/80 backdrop-blur-sm z-[-1]"></div>
            <div className="absolute top-10 left-1/2 -translate-x-1/2 text-7xl opacity-20 font-black text-rose-500">✚</div>
            <div className="absolute top-12 left-10 text-5xl opacity-40">🌡️</div>
          </div>
        );
      case 'LIBRARY':
        return (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <div className="absolute inset-0 bg-indigo-50/80 backdrop-blur-sm z-[-1]"></div>
            <div className="absolute top-4 left-4 grid grid-cols-2 gap-2 opacity-30">
               <div className="w-12 h-16 bg-indigo-900/40 rounded shadow-sm flex items-end p-1"><div className="w-full h-1 bg-white/50"></div></div>
               <div className="w-12 h-16 bg-indigo-900/40 rounded shadow-sm flex items-end p-1"><div className="w-full h-1 bg-white/50"></div></div>
            </div>
            <div className="absolute top-10 right-10 text-6xl opacity-40">📚</div>
            <div className="absolute bottom-20 left-10 text-5xl opacity-20">📖</div>
          </div>
        );
      default:
        return null;
    }
  };

  const renderEnvironmentDetails = () => {
    if (activeScenario || (gameState.isSleeping && !activeScenario)) {
      return renderScenarioDetails(activeScenario || 'BEDROOM');
    }

    switch (gameState.environment) {
      case 'HOME':
        return (
          <>
            <div className="absolute top-10 left-1/2 -translate-x-1/2 w-28 h-20 bg-blue-100 rounded-lg border-4 border-orange-200 overflow-hidden shadow-inner flex items-center justify-center">
               <div className="text-2xl">☀️</div>
            </div>
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-48 h-4 bg-orange-200/50 rounded-full blur-sm"></div>
            <div className="absolute top-12 left-8 text-2xl opacity-40">🖼️</div>
            <div className="absolute bottom-12 right-10 text-2xl opacity-40">🪴</div>
          </>
        );
      case 'SCHOOL':
        return (
          <>
            <div className="absolute top-8 left-1/2 -translate-x-1/2 w-52 h-24 bg-emerald-900 border-x-8 border-y-4 border-amber-800 rounded shadow-lg flex items-center justify-center">
               <div className="text-white/40 font-mono text-xs text-center select-none">2 + 2 = 🐧<br/>A B C D E</div>
            </div>
            <div className="absolute bottom-10 left-10 text-2xl opacity-40">🎒</div>
            <div className="absolute top-12 left-6 text-xl opacity-40">📐</div>
          </>
        );
      case 'LIBRARY':
        return (
          <>
            <div className="absolute top-0 left-0 w-full h-full opacity-10 flex flex-col gap-2 p-4">
              <div className="h-4 bg-indigo-900 rounded"></div>
              <div className="h-4 bg-indigo-900 rounded"></div>
            </div>
            <div className="absolute top-12 right-12 w-8 h-8 flex flex-col items-center">
               <div className="w-2 h-4 bg-amber-100 rounded-t-full candle-flicker"></div>
               <div className="w-4 h-6 bg-slate-200 rounded"></div>
            </div>
            <div className="absolute bottom-12 left-10 text-2xl opacity-50">📚</div>
          </>
        );
      case 'PARK':
        return (
          <>
            <div className="absolute top-6 left-[-100px] text-4xl cloud-animate">☁️</div>
            <div className="absolute top-12 left-[-150px] text-3xl cloud-animate" style={{animationDelay: '5s'}}>☁️</div>
            <div className="absolute bottom-6 left-10 text-2xl grass-sway">🌱</div>
            <div className="absolute bottom-6 right-10 text-2xl grass-sway" style={{animationDelay: '1s'}}>🌱</div>
            <div className="absolute top-20 right-10 text-3xl opacity-40">⛲</div>
          </>
        );
      default:
        return null;
    }
  };

  const currentLevel = Math.floor(gameState.stats.age * 5) + 1;
  const levelProgress = (gameState.stats.age % 0.2) / 0.2 * 100;
  const ageYears = Math.floor(gameState.stats.age);
  const currentEnv = ENVIRONMENTS[gameState.environment];

  return (
    <div className={`modern-device select-none transition-colors duration-1000 ${currentEnv.color}`} onMouseMove={onMouseMove} onMouseUp={onMouseUp}>
      {/* Particles Layer */}
      {particles.map(p => (
        <div key={p.id} className="particle text-2xl" style={{ left: p.x - 12, top: p.y - 12 }}>
          {p.content}
        </div>
      ))}

      {/* Map Overlay */}
      {showMap && (
        <div className="absolute inset-0 z-[100] bg-white/80 backdrop-blur-md p-8 flex flex-col items-center justify-center animate-in fade-in zoom-in duration-300">
           <h2 className="text-2xl font-black mb-8 text-slate-800 uppercase tracking-widest">PARA ONDE VAMOS?</h2>
           <div className="grid grid-cols-2 gap-4 w-full">
             {Object.entries(ENVIRONMENTS).map(([key, env]) => (
               <button 
                key={key}
                onClick={() => changeEnvironment(key as EnvironmentType)}
                className={`p-4 rounded-2xl flex flex-col items-center gap-2 border-2 transition-all ${gameState.environment === key ? 'border-indigo-500 bg-indigo-50 shadow-md' : 'border-transparent bg-white shadow-sm hover:scale-105'}`}
               >
                 <span className="text-3xl">
                   {key === 'HOME' && '🏠'}
                   {key === 'LIBRARY' && '📚'}
                   {key === 'SCHOOL' && '🏫'}
                   {key === 'PARK' && '🌳'}
                 </span>
                 <span className="font-bold text-xs">{env.name}</span>
                 <span className="text-[10px] text-slate-400 text-center leading-tight">{env.bonus}</span>
               </button>
             ))}
           </div>
           <button onClick={() => setShowMap(false)} className="mt-10 font-bold text-slate-400 hover:text-indigo-600 transition-colors">VOLTAR</button>
        </div>
      )}

      {/* Dragging Preview */}
      {draggedItem && (
        <div className="fixed z-[120] text-5xl pointer-events-none drop-shadow-2xl animate-wobble" 
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

        {/* Interaction Area (Habitat) */}
        <div id="pet-area" className="flex-1 flex flex-col items-center justify-center relative cursor-pointer overflow-visible" onMouseDown={handlePetting}>
          <div className={`habitat z-0 transition-all duration-700 ${currentEnv.secondary}`}>
            {renderEnvironmentDetails()}
          </div>

          {/* Message Bubble - Right Aligned & Compact */}
          <div className="absolute top-4 right-4 z-40 bg-white/95 backdrop-blur shadow-lg rounded-2xl p-3 text-center max-w-[140px] font-bold text-slate-800 text-[10px] animate-in slide-in-from-right-4 duration-300">
            {gameState.stage === 'DEAD' ? "TINGO VIROU UMA ESTRELA 🌟" : message}
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-white/95 rotate-45 shadow-sm"></div>
          </div>
          
          <div className="z-10 w-full flex justify-center">
            <PenguinCharacter 
              stage={gameState.stage}
              isSleeping={gameState.isSleeping}
              isEating={isInteracting.feeding}
              isPlaying={isInteracting.playingBall || isInteracting.playingCar || isInteracting.playingPlush}
              isBathing={isInteracting.bathing}
              isPetting={isInteracting.petting}
              age={gameState.stats.age}
              accessories={{hat: null, glasses: null, clothing: null}}
              isHoveredByItem={!!draggedItem}
            />
          </div>

          {/* Reset Button Overlay */}
          {gameState.stage === 'DEAD' && (
            <button 
              onClick={resetGame}
              className="absolute top-2/3 left-1/2 -translate-x-1/2 z-[60] bg-indigo-500 hover:bg-indigo-600 active:scale-95 text-white font-bold px-8 py-3 rounded-2xl shadow-[0_8px_20px_rgba(99,102,241,0.4)] transition-all animate-pulse flex items-center gap-2"
            >
              <span>✨</span> RECOMEÇAR JORNADA
            </button>
          )}

          {/* Visual Toy Effects */}
          {isInteracting.playingBall && <div className="absolute top-1/2 right-10 text-5xl animate-bounce z-30">⚽</div>}
          {isInteracting.playingCar && (
            <div className="absolute bottom-40 w-full flex justify-center overflow-hidden z-30">
               <div className="text-5xl animate-[float-cloud_2s_linear_infinite] whitespace-nowrap">🏎️ 💨💨</div>
            </div>
          )}
          {isInteracting.playingPlush && <div className="absolute top-1/2 right-1/2 translate-x-16 -translate-y-8 text-5xl animate-bounce z-30">🧸</div>}
          {isInteracting.feeding && <div className="absolute top-1/2 left-10 text-5xl animate-bounce z-30">🐟</div>}
          {gameState.poopCount > 0 && <div className="absolute bottom-36 right-12 text-4xl animate-bounce z-20 filter drop-shadow-md">💩</div>}
          {gameState.isSick && <div className="absolute top-1/2 left-12 text-4xl animate-pulse z-20 filter drop-shadow-md">🤒</div>}
        </div>

        {/* Level & Age Bar - POSITIONED BELOW THE HABITAT */}
        <div className="mx-4 mt-4 mb-4 bg-white/80 backdrop-blur-xl rounded-2xl p-3 border border-white/50 shadow-sm flex flex-col gap-1 z-30">
          <div className="flex justify-between items-center px-1">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">NÍVEL {currentLevel}</span>
            <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{ageYears} ANOS</span>
          </div>
          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-indigo-500 transition-all duration-1000"
              style={{ width: `${levelProgress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Action Dock */}
      <div className="action-dock !grid-cols-3 !gap-3 !p-4 !pb-8 !overflow-y-auto !max-h-[300px]">
         {MENU_ACTIONS.map(action => (
           <div 
             key={action.id}
             onMouseDown={(e) => onDragStart(e, action.id)}
             onClick={() => handleAction(action.id)}
             className={`action-btn !rounded-xl ${gameState.stage === 'DEAD' && action.id !== 'STATS' ? 'opacity-20 cursor-not-allowed grayscale' : ''} ${draggedItem === action.id ? 'grabbing-item scale-110 border-indigo-400 shadow-lg' : ''}`}
           >
             <span className="action-icon !text-xl !mb-1">{action.icon}</span>
             <span className="action-label !text-[9px]">{action.label}</span>
           </div>
         ))}
      </div>

      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1.5 bg-black/10 rounded-full"></div>
    </div>
  );
};

export default App;
