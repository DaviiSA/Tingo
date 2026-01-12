
import React, { useState, useEffect, useRef } from 'react';
import { GrowthStage } from '../types';

interface PenguinCharacterProps {
  stage: GrowthStage;
  isSleeping: boolean;
  isBathing: boolean;
  isEating: boolean;
  isPlaying: boolean;
  isPetting: boolean;
  age: number;
  accessories: {
    hat: string | null;
    glasses: string | null;
    clothing: string | null;
  };
  onPet?: () => void;
  isHoveredByItem?: boolean;
}

const PenguinCharacter: React.FC<PenguinCharacterProps> = ({ 
  stage, isSleeping, isBathing, isEating, isPlaying, isPetting, age, accessories, onPet, isHoveredByItem 
}) => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        setMousePos({ 
          x: Math.max(-6, Math.min(6, (e.clientX - centerX) / 60)), 
          y: Math.max(-4, Math.min(4, (e.clientY - centerY) / 60)) 
        });
      }
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  if (stage === 'DEAD') {
    return (
      <div className="relative flex flex-col items-center animate-pulse py-10">
        <span className="text-9xl filter grayscale opacity-40">🐧</span>
        <div className="mt-4 text-5xl">🌟</div>
        <div className="absolute -bottom-2 w-32 h-6 bg-black/5 rounded-full blur-xl"></div>
      </div>
    );
  }

  const getStageStyles = () => {
    switch(stage) {
      case 'EGG': return 'scale-[0.8]';
      case 'BABY': return 'scale-[0.85]';
      case 'CHILD': return 'scale-[1.1]';
      case 'ADULT': return 'scale-[1.3]';
      default: return '';
    }
  };

  if (stage === 'EGG') {
    return (
      <div className={`relative transition-all duration-700 mb-10 ${getStageStyles()} animate-bounce-slow`}>
        <div className="w-40 h-52 bg-gradient-to-b from-white via-slate-50 to-slate-200 rounded-[50%_50%_50%_50%/65%_65%_35%_35%] shadow-2xl border-4 border-white/80 relative overflow-hidden">
           <div className="absolute top-8 left-10 w-12 h-16 bg-white opacity-50 rounded-full blur-lg"></div>
        </div>
        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-32 h-8 bg-black/15 rounded-full blur-xl"></div>
      </div>
    );
  }

  const isExcited = isEating || isPlaying || isHoveredByItem;
  const getWiggle = isPetting ? 'animate-wobble' : '';
  const getBounce = (isExcited || isBathing) ? 'animate-bounce' : 'animate-bounce-slow';

  // Cores baseadas na imagem
  const hoodColor = 'bg-slate-300'; // Azul acinzentado claro do capuz
  const penguinFaceColor = 'bg-slate-500'; // Cinza da parte de cima da cabeça do pinguim
  const bellyColor = 'bg-white'; // Branco do rosto e barriga

  return (
    <div ref={containerRef} className={`relative transition-all duration-500 mb-12 ${getStageStyles()} ${getWiggle} ${getBounce}`}>
      {/* Sombra */}
      <div className={`absolute -bottom-6 left-1/2 -translate-x-1/2 w-32 h-6 bg-black/15 rounded-full blur-2xl transition-all duration-500 ${isPetting ? 'scale-125' : 'scale-100'}`}></div>

      {/* Orelhas do Capuz (Bear ears like the photo) */}
      <div className={`absolute -top-2 left-4 w-12 h-12 ${hoodColor} rounded-full border-2 border-slate-400/20 shadow-sm z-0`}></div>
      <div className={`absolute -top-2 right-4 w-12 h-12 ${hoodColor} rounded-full border-2 border-slate-400/20 shadow-sm z-0`}></div>

      {/* Corpo/Capuz Principal */}
      <div className={`relative w-44 h-52 ${hoodColor} rounded-[50%_50%_45%_45%/60%_60%_40%_40%] shadow-xl overflow-hidden border-2 border-slate-400/30 z-10`}>
        
        {/* Abertura do Capuz (Parte Branca do Rosto) */}
        <div className={`absolute top-10 left-1/2 -translate-x-1/2 w-36 h-42 ${bellyColor} rounded-[50%_50%_40%_40%/70%_70%_30%_30%] shadow-inner flex flex-col items-center`}>
          
          {/* Mancha Cinza da Testa (Pico de viúva) */}
          <div className={`absolute top-0 w-28 h-20 ${penguinFaceColor} rounded-[50%_50%_100%_100%/30%_30%_100%_100%] opacity-90`}></div>

          {/* Olhos (Pequenos e pretos como botões) */}
          <div className="absolute top-14 left-1/2 -translate-x-1/2 flex gap-10 z-20">
            <div className={`w-3.5 h-3.5 bg-slate-900 rounded-full shadow-sm transition-all duration-150 ${isSleeping ? 'h-1 scale-y-50 mt-1.5' : ''}`}
                 style={{ transform: isSleeping ? '' : `translate(${mousePos.x}px, ${mousePos.y}px)` }}>
              {!isSleeping && <div className="absolute top-0.5 left-0.5 w-1 h-1 bg-white opacity-40 rounded-full"></div>}
            </div>
            <div className={`w-3.5 h-3.5 bg-slate-900 rounded-full shadow-sm transition-all duration-150 ${isSleeping ? 'h-1 scale-y-50 mt-1.5' : ''}`}
                 style={{ transform: isSleeping ? '' : `translate(${mousePos.x}px, ${mousePos.y}px)` }}>
              {!isSleeping && <div className="absolute top-0.5 left-0.5 w-1 h-1 bg-white opacity-40 rounded-full"></div>}
            </div>
          </div>

          {/* Bico (Amarelo horizontal) */}
          <div className={`absolute top-16 left-1/2 -translate-x-1/2 w-7 h-3 bg-yellow-400 rounded-full shadow-sm z-20 transition-all duration-300 ${isEating ? 'scale-150 bg-yellow-500' : ''}`}>
             <div className="absolute top-1/2 left-0 w-full h-[0.5px] bg-black/5"></div>
          </div>

          {/* Blush (Bochechas rosadas) */}
          {(isPetting || isExcited) && (
            <>
              <div className="absolute top-18 left-4 w-6 h-3 bg-pink-300/40 rounded-full blur-sm animate-pulse"></div>
              <div className="absolute top-18 right-4 w-6 h-3 bg-pink-300/40 rounded-full blur-sm animate-pulse"></div>
            </>
          )}
        </div>

        {/* Textura de fofura (Reflexo sutil) */}
        <div className="absolute top-4 left-6 w-12 h-6 bg-white/20 rounded-full blur-md"></div>
      </div>

      {/* Nadadeiras (Integradas ao capuz) */}
      <div className={`absolute top-24 -left-6 w-12 h-20 ${hoodColor} rounded-full -rotate-15 origin-top transition-transform duration-500 shadow-md border-r border-slate-400/20 ${isExcited || isPetting || isBathing ? 'rotate-[60deg] -translate-y-2' : ''}`}></div>
      <div className={`absolute top-24 -right-6 w-12 h-20 ${hoodColor} rounded-full rotate-15 origin-top transition-transform duration-500 shadow-md border-l border-slate-400/20 ${isExcited || isPetting || isBathing ? '-rotate-[60deg] -translate-y-2' : ''}`}></div>

      {/* Pés (Pequenos e azulados como na base da pelúcia) */}
      <div className="absolute -bottom-2 left-8 w-10 h-6 bg-blue-200 rounded-full rotate-12 shadow-sm border-t border-blue-300/30"></div>
      <div className="absolute -bottom-2 right-8 w-10 h-6 bg-blue-200 rounded-full -rotate-12 shadow-sm border-t border-blue-300/30"></div>
    </div>
  );
};

export default PenguinCharacter;
