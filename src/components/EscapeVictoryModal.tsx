import React from 'react';
import { Trophy, ArrowRight, Radio, Award, Sparkles, RefreshCw } from 'lucide-react';

interface EscapeVictoryModalProps {
  isVisible: boolean;
  nightTimeSeconds: number;
  xpEarned: number;
  onPlayAgain: () => void;
  onOpenRobloxDevKit: () => void;
}

export const EscapeVictoryModal: React.FC<EscapeVictoryModalProps> = ({
  isVisible,
  nightTimeSeconds,
  xpEarned,
  onPlayAgain,
  onOpenRobloxDevKit,
}) => {
  if (!isVisible) return null;

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins} мин ${s} сек`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-lg animate-in fade-in duration-300">
      <div className="relative w-full max-w-lg bg-zinc-950 border border-cyan-500/60 rounded-3xl p-6 md:p-8 text-center text-zinc-200 shadow-[0_0_50px_rgba(6,182,212,0.35)] flex flex-col items-center">
        
        {/* Glowing Trophy Icon */}
        <div className="w-16 h-16 rounded-2xl bg-cyan-950/80 border border-cyan-400 flex items-center justify-center text-cyan-400 mb-4 shadow-[0_0_25px_rgba(6,182,212,0.6)] animate-bounce">
          <Trophy className="w-8 h-8" />
        </div>

        <h1 className="text-2xl md:text-3xl font-black text-cyan-300 font-mono tracking-wide uppercase mb-1">
          Вы Сбежали Из Леса!
        </h1>
        <p className="text-xs text-zinc-400 font-mono mb-6 leading-relaxed max-w-sm">
          Все 4 аварийные вышки активированы. Спасательный вертолет эвакуировал выживших до рассвета.
        </p>

        {/* Victory Rewards Stats */}
        <div className="grid grid-cols-2 gap-3 w-full mb-6 font-mono">
          <div className="p-3.5 bg-zinc-900/80 border border-zinc-800 rounded-2xl flex flex-col items-center">
            <span className="text-[10px] text-zinc-400 uppercase">Время Эвакуации</span>
            <span className="text-sm font-bold text-zinc-100 mt-1">{formatTime(nightTimeSeconds)}</span>
          </div>

          <div className="p-3.5 bg-zinc-900/80 border border-zinc-800 rounded-2xl flex flex-col items-center">
            <span className="text-[10px] text-zinc-400 uppercase">Получено Опыта</span>
            <span className="text-sm font-bold text-purple-400 mt-1">+{xpEarned} XP</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2.5 w-full">
          <button
            onClick={onPlayAgain}
            className="w-full py-3.5 px-6 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-black font-mono font-black text-sm tracking-wider shadow-[0_0_20px_rgba(6,182,212,0.5)] transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Играть в новом лесу (Новый Seed)</span>
          </button>

          <button
            onClick={onOpenRobloxDevKit}
            className="w-full py-3 px-6 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700 font-mono font-bold text-xs tracking-wider transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
          >
            <Radio className="w-4 h-4 text-cyan-400" />
            <span>Экспорт скриптов для Roblox Studio</span>
          </button>
        </div>

      </div>
    </div>
  );
};
