import React, { useEffect, useState } from 'react';
import { Skull, RotateCcw, AlertTriangle, Clock, Radio, Layers } from 'lucide-react';

interface JumpscareOverlayProps {
  isVisible: boolean;
  nightTimeSeconds: number;
  repairedGens: number;
  resourcesGathered: number;
  onRespawn: () => void;
}

export const JumpscareOverlay: React.FC<JumpscareOverlayProps> = ({
  isVisible,
  nightTimeSeconds,
  repairedGens,
  resourcesGathered,
  onRespawn,
}) => {
  const [shake, setShake] = useState(true);

  useEffect(() => {
    if (isVisible) {
      setShake(true);
      const t = setTimeout(() => setShake(false), 900);
      return () => clearTimeout(t);
    }
  }, [isVisible]);

  if (!isVisible) return null;

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins} мин ${s} сек`;
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black/95 select-none overflow-hidden ${
      shake ? 'animate-bounce' : ''
    }`}>
      {/* Bloody Red Screamer Face Visual (Horrifying Demonic Entity) */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-90 overflow-hidden">
        {/* Red Vignette and Blood Pulse */}
        <div className="absolute inset-0 bg-radial from-red-900/60 via-black to-black animate-pulse" />
        
        {/* Horrific Demonic Silhouette with Piercing Crimson Eyes */}
        <div className="relative flex flex-col items-center justify-center scale-125 md:scale-150 animate-in zoom-in-50 duration-300">
          {/* Glowing Eyes */}
          <div className="flex items-center gap-16 mb-4">
            <div className="w-10 h-6 bg-red-600 rounded-full blur-[2px] shadow-[0_0_35px_rgba(255,0,0,1)] animate-ping" />
            <div className="w-10 h-6 bg-red-600 rounded-full blur-[2px] shadow-[0_0_35px_rgba(255,0,0,1)] animate-ping" />
          </div>

          {/* Screaming gaping demonic jaw silhouette */}
          <div className="w-28 h-40 bg-zinc-950 border-4 border-red-900/80 rounded-b-3xl shadow-[0_0_60px_rgba(220,38,38,0.7)] flex flex-col items-center justify-around py-3">
            <div className="flex gap-1">
              <div className="w-2 h-6 bg-zinc-200 rotate-12" />
              <div className="w-2.5 h-8 bg-zinc-100" />
              <div className="w-2 h-7 bg-zinc-200 -rotate-12" />
              <div className="w-3 h-8 bg-zinc-100" />
            </div>
            <div className="w-16 h-8 bg-red-950/70 rounded-full border border-red-600" />
            <div className="flex gap-1 rotate-180">
              <div className="w-2 h-6 bg-zinc-200 rotate-12" />
              <div className="w-2.5 h-8 bg-zinc-100" />
              <div className="w-2 h-7 bg-zinc-200 -rotate-12" />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Card (Fades in slightly after jump) */}
      <div className="relative z-10 w-full max-w-lg mx-4 bg-black/90 border border-red-900/80 rounded-3xl p-6 md:p-8 text-center text-zinc-200 shadow-2xl backdrop-blur-md animate-in fade-in duration-500">
        <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-red-950/80 border border-red-600 flex items-center justify-center text-red-500 shadow-[0_0_20px_rgba(220,38,38,0.6)]">
          <Skull className="w-8 h-8" />
        </div>

        <h1 className="text-2xl md:text-3xl font-black tracking-wider text-red-500 font-mono mb-1 uppercase">
          Вы Были Поглощены
        </h1>
        <p className="text-xs text-zinc-400 mb-6 font-mono">
          Теневой Жнец настиг вас в темной чаще леса...
        </p>

        {/* Survival Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6 font-mono">
          <div className="p-3 bg-zinc-950/80 border border-zinc-800 rounded-2xl flex flex-col items-center">
            <Clock className="w-4 h-4 text-amber-400 mb-1" />
            <span className="text-[10px] text-zinc-400">Выжито</span>
            <span className="text-xs font-bold text-zinc-200 mt-0.5">{formatTime(nightTimeSeconds)}</span>
          </div>

          <div className="p-3 bg-zinc-950/80 border border-zinc-800 rounded-2xl flex flex-col items-center">
            <Radio className="w-4 h-4 text-cyan-400 mb-1" />
            <span className="text-[10px] text-zinc-400">Починено вышек</span>
            <span className="text-xs font-bold text-cyan-300 mt-0.5">{repairedGens} / 4</span>
          </div>

          <div className="p-3 bg-zinc-950/80 border border-zinc-800 rounded-2xl flex flex-col items-center">
            <Layers className="w-4 h-4 text-emerald-400 mb-1" />
            <span className="text-[10px] text-zinc-400">Собрано ресурсов</span>
            <span className="text-xs font-bold text-emerald-300 mt-0.5">{resourcesGathered}</span>
          </div>
        </div>

        {/* Respawn Button */}
        <button
          onClick={onRespawn}
          className="w-full py-3.5 px-6 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-mono font-bold text-sm tracking-wider shadow-[0_0_20px_rgba(220,38,38,0.5)] transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Возродиться в лагере</span>
        </button>
      </div>
    </div>
  );
};
