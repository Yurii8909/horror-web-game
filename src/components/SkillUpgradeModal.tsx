import React from 'react';
import { 
  X, 
  Award, 
  Footprints, 
  EyeOff, 
  Compass, 
  Hammer, 
  Brain, 
  Plus, 
  Sparkles,
  Zap
} from 'lucide-react';
import { SURVIVOR_SKILLS_INFO } from '../data/recipesAndSkills';
import { CharacterProgress, SurvivorSkills } from '../types/game';
import { horrorAudio } from '../audio/horrorAudio';

interface SkillUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  progress: CharacterProgress;
  onUpgradeSkill: (skillKey: keyof SurvivorSkills) => void;
}

export const SkillUpgradeModal: React.FC<SkillUpgradeModalProps> = ({
  isOpen,
  onClose,
  progress,
  onUpgradeSkill,
}) => {
  if (!isOpen) return null;

  const getSkillIcon = (iconName: string) => {
    switch (iconName) {
      case 'Footprints': return <Footprints className="w-5 h-5 text-amber-400" />;
      case 'EyeOff': return <EyeOff className="w-5 h-5 text-emerald-400" />;
      case 'Compass': return <Compass className="w-5 h-5 text-cyan-400" />;
      case 'Hammer': return <Hammer className="w-5 h-5 text-orange-400" />;
      case 'Brain': return <Brain className="w-5 h-5 text-purple-400" />;
      default: return <Award className="w-5 h-5 text-yellow-400" />;
    }
  };

  const getSkillCurrentLevel = (skillId: string): number => {
    switch (skillId) {
      case 'sprintStamina': return progress.skills.sprintStaminaLevel;
      case 'stealth': return progress.skills.stealthLevel;
      case 'perception': return progress.skills.perceptionLevel;
      case 'craftingSpeed': return progress.skills.craftingSpeedLevel;
      case 'sanityResistance': return progress.skills.sanityResistanceLevel;
      default: return 0;
    }
  };

  const getSkillKey = (skillId: string): keyof SurvivorSkills => {
    switch (skillId) {
      case 'sprintStamina': return 'sprintStaminaLevel';
      case 'stealth': return 'stealthLevel';
      case 'perception': return 'perceptionLevel';
      case 'craftingSpeed': return 'craftingSpeedLevel';
      case 'sanityResistance': return 'sanityResistanceLevel';
      default: return 'sprintStaminaLevel';
    }
  };

  const handleUpgrade = (skillId: string) => {
    if (progress.skillPoints <= 0) return;
    const skillKey = getSkillKey(skillId);
    onUpgradeSkill(skillKey);
    horrorAudio.playCraftSuccess();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-zinc-950 border border-zinc-800 rounded-3xl p-5 md:p-7 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-zinc-200">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-500/10 border border-purple-500/30 rounded-2xl text-purple-400">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-bold tracking-wide text-zinc-100 font-mono">
                Дерево Прокачки Выжившего
              </h2>
              <p className="text-xs text-zinc-400">
                Зарабатывайте опыт выживая ночью, ремонтируя генераторы и собирая ресурсы
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white bg-zinc-900 hover:bg-zinc-800 rounded-xl border border-zinc-800 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Level & Skill Points Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 my-4 bg-gradient-to-r from-purple-950/40 via-zinc-900/60 to-zinc-900/60 border border-purple-900/50 rounded-2xl">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-purple-900/50 border border-purple-500/60 flex items-center justify-center font-bold text-xl text-purple-200 font-mono">
              {progress.level}
            </div>
            <div>
              <div className="text-sm font-bold text-zinc-200">Уровень Выжившего</div>
              <div className="text-xs text-zinc-400">
                Опыт: {progress.xp} / {progress.xpToNextLevel} XP
              </div>
              {/* XP Progress bar */}
              <div className="w-44 h-1.5 bg-zinc-800 rounded-full mt-1.5 overflow-hidden">
                <div 
                  className="h-full bg-purple-500 transition-all duration-300"
                  style={{ width: `${Math.min(100, (progress.xp / progress.xpToNextLevel) * 100)}%` }}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-purple-950/60 border border-purple-700/50 px-4 py-2 rounded-xl">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span className="text-xs font-semibold text-zinc-300">Доступно очков навыков:</span>
            <span className="text-base font-bold text-purple-300 font-mono">
              {progress.skillPoints}
            </span>
          </div>
        </div>

        {/* Skill Perks List */}
        <div className="flex flex-col gap-3.5 overflow-y-auto pr-1">
          {SURVIVOR_SKILLS_INFO.map((skill) => {
            const currentLevel = getSkillCurrentLevel(skill.id);
            const isMaxed = currentLevel >= skill.maxLevel;
            const canUpgrade = progress.skillPoints > 0 && !isMaxed;

            return (
              <div
                key={skill.id}
                className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-2xl flex items-center justify-between gap-4 transition-all hover:border-zinc-700"
              >
                <div className="flex items-start gap-3.5">
                  <div className="p-2.5 bg-zinc-800/80 rounded-xl mt-0.5">
                    {getSkillIcon(skill.icon)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-zinc-100">{skill.titleRu}</h3>
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-400 border border-zinc-700">
                        Ур. {currentLevel} / {skill.maxLevel}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                      {skill.descRu}
                    </p>
                    <div className="text-[11px] text-purple-400 font-medium mt-1">
                      Бонус: {skill.bonusPerLevel}
                    </div>

                    {/* Level Nodes Indicator */}
                    <div className="flex items-center gap-1.5 mt-2.5">
                      {Array.from({ length: skill.maxLevel }).map((_, idx) => (
                        <div
                          key={idx}
                          className={`w-6 h-1.5 rounded-full transition-all ${
                            idx < currentLevel
                              ? 'bg-purple-500 shadow-[0_0_6px_rgba(168,85,247,0.7)]'
                              : 'bg-zinc-800'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleUpgrade(skill.id)}
                  disabled={!canUpgrade}
                  className={`shrink-0 px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-md active:scale-95 cursor-pointer ${
                    isMaxed
                      ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700'
                      : canUpgrade
                      ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-600/30'
                      : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                  }`}
                >
                  {isMaxed ? (
                    'Максимум'
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" /> Улучшить
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
};
