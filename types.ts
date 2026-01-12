
export type GrowthStage = 'EGG' | 'BABY' | 'CHILD' | 'ADULT' | 'DEAD';

export interface PetStats {
  hunger: number;
  happiness: number;
  hygiene: number;
  energy: number;
  health: number;
  age: number;
  level: number;
  careScore: number;
}

export type ActionType = 'FOOD' | 'LIGHT' | 'PLAY' | 'CLEAN' | 'HEAL' | 'STATS';

export interface GameState {
  stats: PetStats;
  name: string;
  stage: GrowthStage;
  isSleeping: boolean;
  isSick: boolean;
  poopCount: number;
  lastUpdate: number;
  selectedActionIndex: number;
}
