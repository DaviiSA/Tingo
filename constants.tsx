
import { EnvironmentType } from './types';

export const INITIAL_STATS = {
  hunger: 50,
  happiness: 50,
  hygiene: 100,
  energy: 100,
  health: 100,
  age: 0,
  level: 1,
  careScore: 0,
};

export const MENU_ACTIONS = [
  { id: 'FOOD', icon: '🍚', label: 'COMER' },
  { id: 'LIGHT', icon: '💡', label: 'LUZ' },
  { id: 'BALL', icon: '⚽', label: 'BOLA' },
  { id: 'CAR', icon: '🏎️', label: 'CARRINHO' },
  { id: 'PLUSH', icon: '🧸', label: 'PELÚCIA' },
  { id: 'CLEAN', icon: '🧼', label: 'LIMPAR' },
  { id: 'TRAVEL', icon: '🗺️', label: 'MAPA' },
  { id: 'HEAL', icon: '💉', label: 'CURAR' },
  { id: 'STATS', icon: '📋', label: 'STATUS' }
];

export const STAGE_THRESHOLDS = {
  BABY: 0.01,
  CHILD: 0.5,
  ADULT: 2.0,
  SENIOR: 5.0,
  MAX_AGE: 10.0
};

export const ENVIRONMENTS: Record<EnvironmentType, { name: string, color: string, secondary: string, bonus: string }> = {
  HOME: { 
    name: 'CASA', 
    color: 'bg-orange-50', 
    secondary: 'bg-orange-100',
    bonus: 'Recupera energia 20% mais rápido ao dormir.'
  },
  LIBRARY: { 
    name: 'BIBLIOTECA', 
    color: 'bg-blue-50', 
    secondary: 'bg-indigo-100',
    bonus: 'Higiene cai 50% mais devagar.'
  },
  SCHOOL: { 
    name: 'ESCOLA', 
    color: 'bg-yellow-50', 
    secondary: 'bg-amber-100',
    bonus: 'Envelhece (evolui) 30% mais rápido.'
  },
  PARK: { 
    name: 'PARQUE', 
    color: 'bg-emerald-50', 
    secondary: 'bg-green-100',
    bonus: 'Felicidade aumenta 2x mais ao brincar.'
  }
};
