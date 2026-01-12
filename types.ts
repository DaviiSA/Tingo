
export type GrowthStage = 'EGG' | 'BABY' | 'CHILD' | 'ADULT' | 'SENIOR' | 'DEAD';

export type EnvironmentType = 'HOME' | 'LIBRARY' | 'SCHOOL' | 'PARK';

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

export type ActionType = 'FOOD' | 'LIGHT' | 'PLAY' | 'CLEAN' | 'HEAL' | 'STATS' | 'TRAVEL';

export interface GameState {
  stats: PetStats;
  name: string;
  stage: GrowthStage;
  environment: EnvironmentType;
  isSleeping: boolean;
  isSick: boolean;
  poopCount: number;
  lastUpdate: number;
  selectedActionIndex: number;
}
