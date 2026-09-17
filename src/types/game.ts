export type ResourceKey = 'wood' | 'scrap' | 'battery' | 'herbs' | 'sulfur' | 'circuit';

export interface ResourceInfo {
  id: ResourceKey;
  name: string;
  nameRu: string;
  description: string;
  color: string;
  rarity: 'common' | 'uncommon' | 'rare';
}

export type ItemKey = 
  | 'torch' 
  | 'signal_flare' 
  | 'medkit' 
  | 'bear_trap' 
  | 'super_battery' 
  | 'generator_part' 
  | 'adrenaline_shot';

export interface CraftingRecipe {
  id: ItemKey;
  name: string;
  nameRu: string;
  description: string;
  craftTime: number; // in seconds
  ingredients: { [key in ResourceKey]?: number };
  category: 'survival' | 'defense' | 'escape';
  icon: string;
}

export interface InventoryItem {
  id: ItemKey;
  count: number;
}

export interface PlayerStats {
  hp: number;
  maxHp: number;
  stamina: number;
  maxStamina: number;
  sanity: number; // 0 to 100
  battery: number; // 0 to 100%
  flashlightOn: boolean;
  isCrouching: boolean;
  isSprinting: boolean;
  repairedGenerators: number; // 4 needed to win
  totalGenerators: number;
}

export interface SurvivorSkills {
  sprintStaminaLevel: number; // max 5
  stealthLevel: number; // max 5
  perceptionLevel: number; // max 5
  craftingSpeedLevel: number; // max 5
  sanityResistanceLevel: number; // max 5
}

export interface CharacterProgress {
  level: number;
  xp: number;
  xpToNextLevel: number;
  skillPoints: number;
  skills: SurvivorSkills;
}

export interface CoopPlayer {
  id: string;
  name: string;
  avatarColor: string;
  status: 'alive' | 'downed' | 'escaping';
  healthPercent: number;
  distance: number; // meters from local player
  isTalking: boolean;
  role: 'Scout' | 'Engineer' | 'Medic' | 'Runner';
}

export type MonsterState = 'stalking' | 'hunting' | 'searching' | 'teleporting' | 'stunned' | 'patrolling';

export type ForestEvent = 
  | 'none'
  | 'blood_fog' 
  | 'whispers' 
  | 'blackout_pulse' 
  | 'crows_swarm' 
  | 'supply_drop';

export interface GameSettings {
  soundVolume: number;
  micDetectionEnabled: boolean;
  graphicsQuality: 'performance' | 'balanced' | 'ultra';
  fogDensity: number;
  invertY: boolean;
  sensitivity: number;
}

export interface WorldResourceNode {
  id: string;
  type: ResourceKey;
  position: [number, number, number];
  collected: boolean;
}

export interface GeneratorNode {
  id: string;
  position: [number, number, number];
  isRepaired: boolean;
  repairProgress: number; // 0 to 100
}

export interface PlacedItem {
  id: string;
  type: 'flare' | 'bear_trap';
  position: [number, number, number];
  durationRemaining: number;
  active: boolean;
}
