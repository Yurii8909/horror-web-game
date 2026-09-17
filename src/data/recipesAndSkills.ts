import { CraftingRecipe, ResourceInfo, ResourceKey } from '../types/game';

export const RESOURCES_LIST: ResourceInfo[] = [
  {
    id: 'wood',
    name: 'Dry Branches',
    nameRu: 'Сухие ветви',
    description: 'Легковоспламеняющееся дерево, собранное под вековыми соснами.',
    color: '#8B5A2B',
    rarity: 'common',
  },
  {
    id: 'scrap',
    name: 'Scrap Metal',
    nameRu: 'Металлолом',
    description: 'Острые ржавые обрезки из брошенных охотничьих домиков.',
    color: '#94A3B8',
    rarity: 'common',
  },
  {
    id: 'battery',
    name: 'Lithium Battery',
    nameRu: 'Литиевая батарейка',
    description: 'Ценный источник питания для фонаря и электроники.',
    color: '#EAB308',
    rarity: 'uncommon',
  },
  {
    id: 'herbs',
    name: 'Hemlock Herbs',
    nameRu: 'Целебные травы',
    description: 'Горькие ночные травы с обезболивающим эффектом.',
    color: '#22C55E',
    rarity: 'common',
  },
  {
    id: 'sulfur',
    name: 'Sulfur Powder',
    nameRu: 'Серный порох',
    description: 'Компонент для создания ослепляющих сигнальных ракет.',
    color: '#F97316',
    rarity: 'uncommon',
  },
  {
    id: 'circuit',
    name: 'Radio Circuit',
    nameRu: 'Электронная плата',
    description: 'Редкая микросхема для починки спасательной радиовышки.',
    color: '#06B6D4',
    rarity: 'rare',
  },
];

export const CRAFTING_RECIPES: CraftingRecipe[] = [
  {
    id: 'torch',
    name: 'Improvised Torch',
    nameRu: 'Самодельный факел',
    description: 'Горит 45 сек. Отпугивает мелких ползунов и не расходует батарею.',
    craftTime: 2,
    ingredients: {
      wood: 2,
      herbs: 1,
    },
    category: 'survival',
    icon: 'Flame',
  },
  {
    id: 'signal_flare',
    name: 'Anti-Demon Flare',
    nameRu: 'Сигнальный фаер',
    description: 'Ослепляет главного монстра на 8 секунд и освещает всю поляну.',
    craftTime: 3,
    ingredients: {
      sulfur: 2,
      scrap: 1,
      wood: 1,
    },
    category: 'defense',
    icon: 'Sparkles',
  },
  {
    id: 'bear_trap',
    name: 'Spiked Bear Trap',
    nameRu: 'Охотничий капкан',
    description: 'Устанавливается на землю. Задерживает монстра на 6 секунд при наступлении.',
    craftTime: 3,
    ingredients: {
      scrap: 3,
      wood: 1,
    },
    category: 'defense',
    icon: 'ShieldAlert',
  },
  {
    id: 'medkit',
    name: 'Bandage & Salve',
    nameRu: 'Аптечка первой помощи',
    description: 'Восстанавливает 50 HP и временно стабилизирует рассудок.',
    craftTime: 2,
    ingredients: {
      herbs: 2,
      scrap: 1,
    },
    category: 'survival',
    icon: 'HeartPulse',
  },
  {
    id: 'super_battery',
    name: 'Overcharged Cell',
    nameRu: 'Усиленный аккумулятор',
    description: 'Мгновенно восстанавливает 100% заряда фонарика и усиливает луч.',
    craftTime: 2,
    ingredients: {
      battery: 2,
      scrap: 1,
    },
    category: 'survival',
    icon: 'Zap',
  },
  {
    id: 'adrenaline_shot',
    name: 'Adrenaline Syringe',
    nameRu: 'Шприц адреналина',
    description: 'Дает бесконечную выносливость и супер-скорость на 12 секунд.',
    craftTime: 3,
    ingredients: {
      herbs: 3,
      sulfur: 1,
    },
    category: 'defense',
    icon: 'Activity',
  },
  {
    id: 'generator_part',
    name: 'Generator Transistor',
    nameRu: 'Деталь радиовышки',
    description: 'Ключевой модуль для починки 1 из 4 генераторов эвакуации.',
    craftTime: 4,
    ingredients: {
      circuit: 1,
      scrap: 2,
      battery: 1,
    },
    category: 'escape',
    icon: 'Radio',
  },
];

export interface SkillNodeInfo {
  id: 'sprintStamina' | 'stealth' | 'perception' | 'craftingSpeed' | 'sanityResistance';
  titleRu: string;
  descRu: string;
  icon: string;
  maxLevel: number;
  bonusPerLevel: string;
}

export const SURVIVOR_SKILLS_INFO: SkillNodeInfo[] = [
  {
    id: 'sprintStamina',
    titleRu: 'Атлетизм и Дыхание',
    descRu: 'Увеличивает запас выносливости для бега и ускоряет ее восстановление.',
    icon: 'Footprints',
    maxLevel: 5,
    bonusPerLevel: '+20% макс. выносливости и +15% регенерации',
  },
  {
    id: 'stealth',
    titleRu: 'Бесшумный Шаг',
    descRu: 'Уменьшает радиус, на котором вас слышит монстр, в приседе и на бегу.',
    icon: 'EyeOff',
    maxLevel: 5,
    bonusPerLevel: '-15% радиуса обнаружения звуком и шагами',
  },
  {
    id: 'perception',
    titleRu: 'Шестое Чувство',
    descRu: 'Подсвечивает близкие ресурсы сквозь туман и усиливает пульс опасности.',
    icon: 'Compass',
    maxLevel: 5,
    bonusPerLevel: '+4 метра дистанции подсветки и обнаружения',
  },
  {
    id: 'craftingSpeed',
    titleRu: 'Мастер Выживания',
    descRu: 'Ускоряет создание предметов и дает шанс сохранить один ресурс при крафте.',
    icon: 'Hammer',
    maxLevel: 5,
    bonusPerLevel: '+25% скорости крафта и +10% шанс сэкономить ресурс',
  },
  {
    id: 'sanityResistance',
    titleRu: 'Стальные Нервы',
    descRu: 'Защищает рассудок в темноте и снижает тряску камеры при появлении монстра.',
    icon: 'Brain',
    maxLevel: 5,
    bonusPerLevel: '-20% скорости потери рассудка в темноте',
  },
];
