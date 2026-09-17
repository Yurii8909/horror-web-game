import React, { useState, useRef, useEffect } from 'react';
import { 
  Heart, 
  Zap, 
  Battery, 
  BatteryCharging, 
  Eye, 
  Radio, 
  Volume2, 
  VolumeX, 
  Mic, 
  MicOff, 
  Backpack, 
  Award, 
  Code2, 
  Footprints, 
  ShieldAlert, 
  Flashlight,
  Compass,
  Users,
  Sun,
  Moon,
  Home,
  Gauge,
  FastForward
} from 'lucide-react';
import { CoopPlayer, ForestEvent } from '../types/game';

interface GameHUDProps {
  hp: number;
  stamina: number;
  battery: number;
  sanity: number;
  isFlashlightOn: boolean;
  monsterDist: number;
  nightTimeSeconds: number;
  repairedGens: number;
  totalGens?: number;
  interactPrompt: string | null;
  activeEvent: ForestEvent;
  teammates: CoopPlayer[];
  micLevel: number;
  isMicActive: boolean;
  isDaytime?: boolean;
  dayNightRemainingSeconds?: number;
  isInSafeHouse?: boolean;
  isDoorClosed?: boolean;
  fps?: number;
  performanceMode?: 'turbo' | 'balanced' | 'ultra';
  onTogglePerformance?: (mode: 'turbo' | 'balanced' | 'ultra') => void;
  onSkipDay?: () => void;
  onToggleFlashlight: () => void;
  onToggleCrouch: () => void;
  onToggleSprint: (sprinting: boolean) => void;
  onInteract: () => void;
  onOpenInventory: () => void;
  onOpenSkills: () => void;
  onOpenRobloxCode: () => void;
  onToggleMute: () => void;
  onToggleMic: () => void;
  onJoystickMove: (x: number, y: number) => void;
  onTouchLook: (dx: number, dy: number) => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  hp,
  stamina,
  battery,
  sanity,
  isFlashlightOn,
  monsterDist,
  nightTimeSeconds,
  repairedGens,
  totalGens = 4,
  interactPrompt,
  activeEvent,
  teammates,
  micLevel,
  isMicActive,
  isDaytime = true,
  dayNightRemainingSeconds = 300,
  isInSafeHouse = false,
  isDoorClosed = true,
  fps = 60,
  performanceMode = 'turbo',
  onTogglePerformance,
  onSkipDay,
  onToggleFlashlight,
  onToggleCrouch,
  onToggleSprint,
  onInteract,
  onOpenInventory,
  onOpenSkills,
  onOpenRobloxCode,
  onToggleMute,
  onToggleMic,
  onJoystickMove,
  onTouchLook,
}) => {
  const [isCrouched, setIsCrouched] = useState(false);
  const [isSprintingLocal, setIsSprintingLocal] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  // Virtual Joystick touch handlers for mobile
  const joystickRef = useRef<HTMLDivElement | null>(null);
  const joystickKnobRef = useRef<HTMLDivElement | null>(null);
  const touchLookRef = useRef<HTMLDivElement | null>(null);
  const lastTouchPos = useRef<{ x: number; y: number } | null>(null);

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const getDangerLevel = () => {
    if (isDaytime) return { text: 'ДЕНЬ: МОНСТРЫ СПЯТ', color: 'text-emerald-400' };
    if (isInSafeHouse && isDoorClosed) return { text: 'УБЕЖИЩЕ: 100% БЕЗОПАСНОСТЬ', color: 'text-cyan-400' };
    if (monsterDist < 12) return { text: 'КРИТИЧЕСКАЯ ОПАСНОСТЬ', color: 'text-red-500 animate-pulse' };
    if (monsterDist < 25) return { text: 'МОНСТР РЯДОМ', color: 'text-amber-500 animate-pulse' };
    if (monsterDist < 45) return { text: 'ПРИСУТСТВИЕ В ТЕНИ', color: 'text-yellow-400' };
    return { text: 'ТИШИНА НОЧИ', color: 'text-zinc-400' };
  };

  const danger = getDangerLevel();

  // Handle virtual joystick
  const handleJoystickTouch = (e: React.TouchEvent) => {
    const touch = e.targetTouches[0];
    if (!joystickRef.current || !touch) return;
    const rect = joystickRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const dx = touch.clientX - centerX;
    const dy = touch.clientY - centerY;
    const maxRadius = rect.width / 2;
    const distance = Math.min(maxRadius, Math.hypot(dx, dy));
    const angle = Math.atan2(dy, dx);

    const normX = (Math.cos(angle) * distance) / maxRadius;
    const normY = (Math.sin(angle) * distance) / maxRadius;

    if (joystickKnobRef.current) {
      joystickKnobRef.current.style.transform = `translate(${normX * 28}px, ${normY * 28}px)`;
    }
    onJoystickMove(normX, normY);
  };

  const handleJoystickEnd = () => {
    if (joystickKnobRef.current) {
      joystickKnobRef.current.style.transform = 'translate(0px, 0px)';
    }
    onJoystickMove(0, 0);
  };

  // Touch look on right half of screen
  const handleLookTouchStart = (e: React.TouchEvent) => {
    const touch = e.targetTouches[0];
    if (touch) {
      lastTouchPos.current = { x: touch.clientX, y: touch.clientY };
    }
  };

  const handleLookTouchMove = (e: React.TouchEvent) => {
    const touch = e.targetTouches[0];
    if (!touch || !lastTouchPos.current) return;
    const dx = touch.clientX - lastTouchPos.current.x;
    const dy = touch.clientY - lastTouchPos.current.y;
    lastTouchPos.current = { x: touch.clientX, y: touch.clientY };
    onTouchLook(dx, dy);
  };

  const handleLookTouchEnd = () => {
    lastTouchPos.current = null;
  };

  return (
    <div id="game-hud-overlay" className="absolute inset-0 pointer-events-none select-none overflow-hidden flex flex-col justify-between p-2 sm:p-4 md:p-6 z-10 font-mono text-zinc-200">
      
      {/* Top Status Header */}
      <div className="flex flex-wrap items-start justify-between gap-2 md:gap-4 w-full">
        {/* Left: Escape Generator Objective & Safe House Status */}
        <div className="flex flex-col gap-1.5">
          <div className="flex flex-col gap-1 bg-black/70 backdrop-blur-md border border-zinc-800/80 rounded-xl px-3 py-2 shadow-2xl">
            <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs tracking-wider">
              <Radio className="w-3.5 h-3.5 animate-pulse text-cyan-400" />
              <span>ВЫШКИ СВЯЗИ: {repairedGens}/{totalGens}</span>
            </div>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalGens }).map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 flex-1 w-6 rounded-full transition-all duration-500 ${
                    i < repairedGens 
                      ? 'bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)]' 
                      : 'bg-zinc-800 border border-zinc-700'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Safe Cabin Status Badge */}
          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11px] font-bold border backdrop-blur-md transition-all ${
            isInSafeHouse 
              ? (isDoorClosed 
                  ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.4)]' 
                  : 'bg-amber-950/80 border-amber-500 text-amber-300 animate-pulse')
              : 'bg-black/60 border-zinc-800 text-zinc-400'
          }`}>
            <Home className="w-3.5 h-3.5" />
            <span>
              {isInSafeHouse 
                ? (isDoorClosed ? 'УБЕЖИЩЕ [ЗАПЕРТО • БЕЗОПАСНО]' : 'В ДОМИКЕ [ЗАКРОЙТЕ ДВЕРЬ!]')
                : 'ДОМИК-УБЕЖИЩЕ (Спавн)'}
            </span>
          </div>
        </div>

        {/* Center: Day/Night Cycle, Countdown & Proximity Heartbeat */}
        <div className="flex flex-col items-center gap-1 bg-black/75 backdrop-blur-md border border-zinc-800 rounded-xl px-3 sm:px-5 py-2 text-center shadow-xl">
          <div className="flex items-center gap-2.5">
            {isDaytime ? (
              <div className="flex items-center gap-1.5 text-amber-300 font-bold text-xs tracking-wider">
                <Sun className="w-4 h-4 text-amber-400 animate-spin" style={{ animationDuration: '20s' }} />
                <span>ДЕНЬ (5 МИН): {formatTime(dayNightRemainingSeconds)}</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-red-400 font-bold text-xs tracking-wider">
                <Moon className="w-4 h-4 text-red-500 animate-pulse" />
                <span>НОЧЬ УЖАСА (15 МИН): {formatTime(dayNightRemainingSeconds)}</span>
              </div>
            )}

            {/* Skip Day Button if daytime */}
            {isDaytime && onSkipDay && (
              <button
                id="btn-skip-day"
                onClick={onSkipDay}
                className="pointer-events-auto flex items-center gap-1 px-2 py-0.5 bg-amber-900/60 hover:bg-amber-800 border border-amber-600 rounded text-[10px] text-amber-200 font-bold cursor-pointer transition-all active:scale-95"
                title="Начать ночь сразу"
              >
                <FastForward className="w-3 h-3" />
                <span>Ночь ⏩</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs">
            <Heart 
              className={`w-3.5 h-3.5 text-red-500 transition-all ${
                !isDaytime && monsterDist < 20 ? 'animate-ping' : ''
              }`} 
            />
            <span className={`font-semibold tracking-wider text-[11px] ${danger.color}`}>
              {danger.text} {!isDaytime && `(${monsterDist}м)`}
            </span>
          </div>
        </div>

        {/* Top Right: Motorola G54 5G FPS & Performance Switcher + Action Buttons */}
        <div className="flex flex-col items-end gap-1.5 pointer-events-auto">
          {/* Motorola G54 FPS Meter & Performance Selector */}
          <div className="flex items-center gap-1.5 bg-black/80 backdrop-blur-md border border-zinc-800 rounded-lg px-2.5 py-1 text-[11px]">
            <Gauge className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-emerald-300 font-bold">{fps} FPS</span>
            <span className="text-[10px] text-zinc-500 hidden sm:inline">| Moto G54 5G</span>

            {onTogglePerformance && (
              <div className="flex items-center gap-1 ml-1 pl-1.5 border-l border-zinc-700">
                <button 
                  onClick={() => onTogglePerformance('turbo')} 
                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-all ${
                    performanceMode === 'turbo' 
                      ? 'bg-emerald-600 text-white' 
                      : 'bg-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                  title="Турбо оптимизация (до 100 FPS на Motorola G54)"
                >
                  100 FPS
                </button>
                <button 
                  onClick={() => onTogglePerformance('balanced')} 
                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-all ${
                    performanceMode === 'balanced' 
                      ? 'bg-cyan-600 text-white' 
                      : 'bg-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                  title="Баланс (60 FPS)"
                >
                  60 FPS
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Roblox Lua & Python Exporter */}
            <button
              id="btn-roblox-devkit"
              onClick={onOpenRobloxCode}
              className="flex items-center gap-1.5 bg-red-950/80 hover:bg-red-900/90 text-red-200 border border-red-800/80 px-2.5 py-1.5 rounded-xl text-xs font-bold tracking-wide shadow-lg transition-all hover:scale-105 active:scale-95 cursor-pointer"
              title="Открыть готовые скрипты Lua и Python для Roblox Studio"
            >
              <Code2 className="w-3.5 h-3.5 text-red-400" />
              <span className="hidden sm:inline">Roblox Lua</span>
            </button>

            {/* Audio toggle */}
            <button
              id="btn-audio-toggle"
              onClick={() => {
                setIsMuted(!isMuted);
                onToggleMute();
              }}
              className="p-1.5 bg-black/60 hover:bg-zinc-800 border border-zinc-700/70 rounded-xl text-zinc-300 transition-all cursor-pointer"
              title="Звук"
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            </button>

            {/* Voice Chat / Mic Alert toggle */}
            <button
              id="btn-mic-toggle"
              onClick={onToggleMic}
              className={`p-1.5 border rounded-xl transition-all cursor-pointer ${
                isMicActive 
                  ? 'bg-amber-950/70 border-amber-600 text-amber-300 shadow-[0_0_8px_rgba(245,158,11,0.5)]' 
                  : 'bg-black/60 border-zinc-700 text-zinc-400'
              }`}
              title="Микрофон: Монстр слышит ваш голос в комнате!"
            >
              {isMicActive ? <Mic className="w-4 h-4 text-amber-400 animate-pulse" /> : <MicOff className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Middle: Active Event Banner & Interaction Prompt */}
      <div className="flex flex-col items-center justify-center gap-3">
        {activeEvent !== 'none' && (
          <div className="bg-red-950/90 border border-red-700/80 text-red-200 px-5 py-1.5 rounded-full text-xs font-bold tracking-wider animate-bounce shadow-2xl flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-red-400" />
            {activeEvent === 'blood_fog' && 'КРОВАВЫЙ ТУМАН: МОНСТР ЧУВСТВУЕТ ВАС'}
            {activeEvent === 'blackout_pulse' && 'ЭМИ-ИМПУЛЬС: ФОНАРИКИ ВЫХОДЯТ ИЗ СТРОЯ'}
            {activeEvent === 'whispers' && 'ШЕПОТ ЛЕСА: ДЕРЕВЬЯ ЗАКРЫВАЮТ ОБЗОР'}
            {activeEvent === 'crows_swarm' && 'СТАЯ ВОРОН: ВЫДАЕТ ПОЗИЦИЮ МОНСТРА'}
            {activeEvent === 'supply_drop' && 'СБРОС ПРИПАСОВ: СИГНАЛЬНЫЙ ДЫМ В ЧАЩЕ'}
          </div>
        )}

        {/* Interact prompt */}
        {interactPrompt && (
          <div className="bg-zinc-900/90 border-2 border-amber-400 text-amber-300 font-bold px-6 py-2.5 rounded-2xl text-sm shadow-[0_0_20px_rgba(245,158,11,0.4)] animate-pulse pointer-events-auto cursor-pointer"
            onClick={onInteract}
          >
            {interactPrompt}
          </div>
        )}
      </div>

      {/* Co-op Teammates Overlay (Top Left side) */}
      <div className="hidden md:flex flex-col gap-2 absolute top-24 left-6 bg-black/55 backdrop-blur-md border border-zinc-800 rounded-xl p-3 w-56 text-xs pointer-events-none">
        <div className="flex items-center gap-2 text-zinc-400 font-bold text-[11px] uppercase tracking-wider pb-1 border-b border-zinc-800">
          <Users className="w-3.5 h-3.5 text-zinc-400" />
          <span>Отряд Выживших ({teammates.length + 1})</span>
        </div>
        
        {/* Local player */}
        <div className="flex items-center justify-between">
          <span className="font-semibold text-emerald-400">Вы (Выживший)</span>
          <span className="text-[10px] text-zinc-400">{hp}% HP</span>
        </div>

        {/* Simulated teammates */}
        {teammates.map((mate) => (
          <div key={mate.id} className="flex items-center justify-between text-zinc-300">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: mate.avatarColor }} />
              <span className="truncate max-w-[100px]">{mate.name}</span>
            </div>
            <span className="text-[10px] text-zinc-400">{mate.distance}м</span>
          </div>
        ))}

        {isMicActive && (
          <div className="pt-1.5 border-t border-zinc-800 flex items-center justify-between text-[10px]">
            <span className="text-amber-400 flex items-center gap-1">
              <Mic className="w-3 h-3" /> Шум микрофона:
            </span>
            <div className="w-16 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-amber-400 transition-all duration-75"
                style={{ width: `${Math.min(100, micLevel * 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Touch Look Area (Right screen half for mobile drag) */}
      <div
        id="touch-look-area"
        ref={touchLookRef}
        onTouchStart={handleLookTouchStart}
        onTouchMove={handleLookTouchMove}
        onTouchEnd={handleLookTouchEnd}
        className="md:hidden absolute top-20 right-0 bottom-32 left-1/2 pointer-events-auto z-0"
      />

      {/* Bottom Area: Vitals & Action Bar */}
      <div className="flex items-end justify-between w-full gap-4 relative z-10">
        
        {/* Left: Mobile Virtual Joystick or Desktop Key hints */}
        <div className="flex items-end gap-3 pointer-events-auto">
          {/* Virtual Joystick for Mobile */}
          <div
            id="virtual-joystick-base"
            ref={joystickRef}
            onTouchMove={handleJoystickTouch}
            onTouchEnd={handleJoystickEnd}
            className="md:hidden w-28 h-28 rounded-full bg-zinc-900/60 border border-zinc-700/80 flex items-center justify-center relative touch-none shadow-xl"
          >
            <div
              id="virtual-joystick-knob"
              ref={joystickKnobRef}
              className="w-12 h-12 rounded-full bg-zinc-700/80 border border-zinc-400 shadow-md transition-transform duration-75 pointer-events-none"
            />
          </div>

          {/* Desktop Controls Legend */}
          <div className="hidden md:flex flex-col gap-1 text-[11px] text-zinc-400 bg-black/60 backdrop-blur-md border border-zinc-800 rounded-xl px-3 py-2">
            <span className="text-zinc-300 font-semibold mb-0.5">Управление (ПК):</span>
            <span><strong className="text-zinc-200">WASD</strong> — Движение</span>
            <span><strong className="text-zinc-200">Shift</strong> — Спринт (расход сил)</span>
            <span><strong className="text-zinc-200">C</strong> — Скрытность (присед)</span>
            <span><strong className="text-zinc-200">F</strong> — Вкл/Выкл фонарик</span>
            <span><strong className="text-zinc-200">E</strong> — Взаимодействие / Сбор</span>
          </div>
        </div>

        {/* Center: Health, Stamina, Battery, Sanity bars */}
        <div className="flex flex-col gap-2 max-w-sm w-full bg-black/75 backdrop-blur-md border border-zinc-800 rounded-2xl p-3.5 shadow-2xl">
          
          {/* HP Bar */}
          <div className="flex items-center gap-2">
            <Heart className="w-4 h-4 text-red-500 shrink-0" />
            <div className="flex-1 h-3 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
              <div 
                className="h-full bg-gradient-to-r from-red-600 to-rose-500 transition-all duration-300"
                style={{ width: `${Math.max(0, Math.min(100, hp))}%` }}
              />
            </div>
            <span className="text-xs font-bold text-red-400 w-9 text-right">{Math.round(hp)}%</span>
          </div>

          {/* Stamina Bar */}
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400 shrink-0" />
            <div className="flex-1 h-2 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
              <div 
                className="h-full bg-amber-400 transition-all duration-150"
                style={{ width: `${Math.max(0, Math.min(100, stamina))}%` }}
              />
            </div>
            <span className="text-xs font-bold text-amber-300 w-9 text-right">{Math.round(stamina)}%</span>
          </div>

          {/* Battery & Sanity row */}
          <div className="grid grid-cols-2 gap-3 pt-1 border-t border-zinc-800/80">
            {/* Battery */}
            <div className="flex items-center gap-1.5 text-xs">
              <Battery className={`w-4 h-4 ${battery < 20 ? 'text-red-400 animate-pulse' : 'text-yellow-400'}`} />
              <div className="flex-1 h-2 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
                <div 
                  className="h-full bg-yellow-400 transition-all duration-300"
                  style={{ width: `${battery}%` }}
                />
              </div>
              <span className="text-[11px] text-zinc-300">{Math.round(battery)}%</span>
            </div>

            {/* Sanity */}
            <div className="flex items-center gap-1.5 text-xs">
              <Eye className={`w-4 h-4 ${sanity < 30 ? 'text-purple-400 animate-pulse' : 'text-cyan-400'}`} />
              <div className="flex-1 h-2 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
                <div 
                  className="h-full bg-purple-400 transition-all duration-300"
                  style={{ width: `${sanity}%` }}
                />
              </div>
              <span className="text-[11px] text-zinc-300">{Math.round(sanity)}%</span>
            </div>
          </div>
        </div>

        {/* Right: Quick Action buttons (Inventory, Skills, Flashlight, Crouch, Sprint) */}
        <div className="flex flex-col md:flex-row items-end gap-2 pointer-events-auto">
          {/* Inventory Modal Trigger */}
          <button
            id="btn-open-inventory"
            onClick={onOpenInventory}
            className="flex items-center gap-2 bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 px-3.5 py-2.5 rounded-xl text-xs font-bold shadow-lg transition-all active:scale-95 cursor-pointer"
          >
            <Backpack className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">Инвентарь & Крафт</span>
          </button>

          {/* Skill Tree Modal Trigger */}
          <button
            id="btn-open-skills"
            onClick={onOpenSkills}
            className="flex items-center gap-2 bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 px-3.5 py-2.5 rounded-xl text-xs font-bold shadow-lg transition-all active:scale-95 cursor-pointer"
          >
            <Award className="w-4 h-4 text-purple-400" />
            <span className="hidden sm:inline">Прокачка</span>
          </button>

          {/* Flashlight Toggle */}
          <button
            id="btn-flashlight-toggle"
            onClick={onToggleFlashlight}
            className={`p-3 rounded-xl border transition-all cursor-pointer ${
              isFlashlightOn 
                ? 'bg-yellow-500 text-black border-yellow-300 shadow-[0_0_12px_rgba(234,179,8,0.7)]' 
                : 'bg-zinc-900 text-zinc-400 border-zinc-700'
            }`}
            title="Фонарик [F]"
          >
            <Zap className="w-5 h-5" />
          </button>

          {/* Mobile Crouch Button */}
          <button
            id="btn-mobile-crouch"
            onClick={() => {
              const next = !isCrouched;
              setIsCrouched(next);
              onToggleCrouch();
            }}
            className={`md:hidden p-3 rounded-xl border transition-all cursor-pointer ${
              isCrouched 
                ? 'bg-purple-900 text-purple-200 border-purple-500' 
                : 'bg-zinc-900 text-zinc-400 border-zinc-700'
            }`}
            title="Присесть"
          >
            <Footprints className="w-5 h-5" />
          </button>

          {/* Mobile Sprint Button */}
          <button
            id="btn-mobile-sprint"
            onTouchStart={() => {
              setIsSprintingLocal(true);
              onToggleSprint(true);
            }}
            onTouchEnd={() => {
              setIsSprintingLocal(false);
              onToggleSprint(false);
            }}
            onMouseDown={() => {
              setIsSprintingLocal(true);
              onToggleSprint(true);
            }}
            onMouseUp={() => {
              setIsSprintingLocal(false);
              onToggleSprint(false);
            }}
            className={`md:hidden p-3 rounded-xl border transition-all cursor-pointer ${
              isSprintingLocal 
                ? 'bg-amber-600 text-white border-amber-400 scale-95' 
                : 'bg-zinc-900 text-zinc-400 border-zinc-700'
            }`}
            title="Спринт"
          >
            <Zap className="w-5 h-5" />
          </button>
        </div>

      </div>

    </div>
  );
};
