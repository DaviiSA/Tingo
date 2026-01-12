
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
  { id: 'PLAY', icon: '⚽', label: 'BRINCAR' },
  { id: 'CLEAN', icon: '🧼', label: 'LIMPAR' },
  { id: 'HEAL', icon: '💉', label: 'CURAR' },
  { id: 'STATS', icon: '📋', label: 'STATUS' }
];

export const STAGE_THRESHOLDS = {
  BABY: 0.01, // Nascimento em ~50 segundos
  CHILD: 0.5,
  ADULT: 2.0
};
