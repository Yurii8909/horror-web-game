/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { ThreeForestEngine } from './game/ThreeForestEngine';
import { GameHUD } from './components/GameHUD';
import { InventoryCraftingModal } from './components/InventoryCraftingModal';
import { SkillUpgradeModal } from './components/SkillUpgradeModal';
import { RobloxDevKitModal } from './components/RobloxDevKitModal';
import { JumpscareOverlay } from './components/JumpscareOverlay';
import { EscapeVictoryModal } from './components/EscapeVictoryModal';
import { horrorAudio } from './audio/horrorAudio';
import { 
  CharacterProgress, 
  CoopPlayer, 
  CraftingRecipe, 
  ForestEvent, 
  ItemKey, 
  ResourceKey, 
  SurvivorSkills 
} from './types/game';

export default function App() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<ThreeForestEngine | null>(null);

  // Vitals & Status
  const [hp, setHp] = useState(100);
  const [stamina, setStamina] = useState(100);
  const [battery, setBattery] = useState(100);
  const [sanity, setSanity] = useState(100);
  const [isFlashlightOn, setIsFlashlightOn] = useState(true);
  const [monsterDist, setMonsterDist] = useState(60);
  const [nightTimeSeconds, setNightTimeSeconds] = useState(0);
  const [repairedGens, setRepairedGens] = useState(0);
  const [interactPrompt, setInteractPrompt] = useState<string | null>(null);
  const [activeEvent, setActiveEvent] = useState<ForestEvent>('none');

  // Mic Horror voice detection
  const [isMicActive, setIsMicActive] = useState(false);
  const [micLevel, setMicLevel] = useState(0);

  // Resources and items
  const [resources, setResources] = useState<{ [key in ResourceKey]: number }>({
    wood: 2,
    scrap: 2,
    battery: 1,
    herbs: 1,
    sulfur: 1,
    circuit: 1,
  });

  const [items, setItems] = useState<{ [key in ItemKey]: number }>({
    torch: 0,
    signal_flare: 1,
    bear_trap: 1,
    medkit: 1,
    super_battery: 0,
    adrenaline_shot: 0,
    generator_part: 1,
  });

  const [totalResourcesGathered, setTotalResourcesGathered] = useState(0);

  // Character Progression
  const [progress, setProgress] = useState<CharacterProgress>({
    level: 1,
    xp: 0,
    xpToNextLevel: 250,
    skillPoints: 1,
    skills: {
      sprintStaminaLevel: 1,
      stealthLevel: 1,
      perceptionLevel: 1,
      craftingSpeedLevel: 1,
      sanityResistanceLevel: 1,
    },
  });

  // Simulated Co-op teammates
  const [teammates, setTeammates] = useState<CoopPlayer[]>([
    {
      id: 'p1',
      name: 'Алексей (Скаутер)',
      avatarColor: '#06b6d4',
      status: 'alive',
      healthPercent: 90,
      distance: 28,
      isTalking: false,
      role: 'Scout',
    },
    {
      id: 'p2',
      name: 'Дмитрий (Инженер)',
      avatarColor: '#f59e0b',
      status: 'alive',
      healthPercent: 75,
      distance: 42,
      isTalking: false,
      role: 'Engineer',
    },
    {
      id: 'p3',
      name: 'Елена (Медик)',
      avatarColor: '#22c55e',
      status: 'alive',
      healthPercent: 100,
      distance: 18,
      isTalking: false,
      role: 'Medic',
    },
  ]);

  // Modals & Overlays
  const [isInventoryOpen, setIsInventoryOpen] = useState(false);
  const [isSkillsOpen, setIsSkillsOpen] = useState(false);
  const [isRobloxDevKitOpen, setIsRobloxDevKitOpen] = useState(false);
  const [isJumpscareVisible, setIsJumpscareVisible] = useState(false);
  const [isVictoryVisible, setIsVictoryVisible] = useState(false);

  // Day/Night & Performance & Safe House State
  const [isDaytime, setIsDaytime] = useState(true);
  const [dayNightRemainingSeconds, setDayNightRemainingSeconds] = useState(300);
  const [isInSafeHouse, setIsInSafeHouse] = useState(false);
  const [isDoorClosed, setIsDoorClosed] = useState(true);
  const [fps, setFps] = useState(60);
  const [performanceMode, setPerformanceMode] = useState<'turbo' | 'balanced' | 'ultra'>('turbo');

  // Initialize 3D Engine
  useEffect(() => {
    if (!containerRef.current) return;

    const engine = new ThreeForestEngine(containerRef.current, {
      onInteractPrompt: (prompt) => setInteractPrompt(prompt),
      onStatsUpdate: (stats) => {
        setHp(stats.hp);
        setStamina(stats.stamina);
        setBattery(stats.battery);
        setSanity(stats.sanity);
        setIsFlashlightOn(stats.isFlashlightOn);
        setMonsterDist(stats.monsterDist);
        setNightTimeSeconds(stats.nightTimeSeconds);
        setRepairedGens(stats.repairedGens);
        setIsDaytime(stats.isDaytime);
        setDayNightRemainingSeconds(stats.dayNightRemainingSeconds);
        setIsInSafeHouse(stats.isInSafeHouse);
        setIsDoorClosed(stats.isDoorClosed);
        setFps(stats.fps);
      },
      onJumpscareTrigger: () => {
        setIsJumpscareVisible(true);
      },
      onVictory: () => {
        setIsVictoryVisible(true);
        addXp(500);
      },
      onPickupResource: (type) => {
        setResources((prev) => ({ ...prev, [type]: (prev[type] || 0) + 1 }));
        setTotalResourcesGathered((prev) => prev + 1);
        addXp(25);
      },
      onEventTriggered: (event) => {
        setActiveEvent(event);
        setTimeout(() => setActiveEvent('none'), 12000);
      },
    });

    engineRef.current = engine;

    return () => {
      engine.cleanup();
      engineRef.current = null;
    };
  }, []);

  // XP & Level-up system
  const addXp = (amount: number) => {
    setProgress((prev) => {
      let newXp = prev.xp + amount;
      let newLevel = prev.level;
      let newSkillPoints = prev.skillPoints;
      let targetXp = prev.xpToNextLevel;

      while (newXp >= targetXp) {
        newXp -= targetXp;
        newLevel++;
        newSkillPoints++;
        targetXp = Math.round(targetXp * 1.35);
      }

      return {
        ...prev,
        xp: newXp,
        level: newLevel,
        skillPoints: newSkillPoints,
        xpToNextLevel: targetXp,
      };
    });
  };

  // Craft an item
  const handleCraftItem = (recipe: CraftingRecipe) => {
    // Deduct resources
    setResources((prev) => {
      const next = { ...prev };
      for (const [resKey, count] of Object.entries(recipe.ingredients)) {
        next[resKey as ResourceKey] = Math.max(0, (next[resKey as ResourceKey] || 0) - (count || 0));
      }
      return next;
    });

    // Add item
    setItems((prev) => ({
      ...prev,
      [recipe.id]: (prev[recipe.id] || 0) + 1,
    }));

    addXp(40);
  };

  // Use / Apply crafted item
  const handleUseItem = (itemKey: ItemKey) => {
    if ((items[itemKey] || 0) <= 0) return;

    if (itemKey === 'signal_flare') {
      engineRef.current?.usePlacedItem('signal_flare');
    } else if (itemKey === 'bear_trap') {
      engineRef.current?.usePlacedItem('bear_trap');
    } else if (itemKey === 'medkit') {
      engineRef.current?.healPlayer(50);
      setHp((prev) => Math.min(100, prev + 50));
    } else if (itemKey === 'super_battery') {
      engineRef.current?.rechargeBattery(100);
      setBattery(100);
    } else if (itemKey === 'adrenaline_shot') {
      engineRef.current?.setSprinting(true);
      setStamina(100);
    } else if (itemKey === 'generator_part') {
      engineRef.current?.tryInteract();
    }

    setItems((prev) => ({
      ...prev,
      [itemKey]: Math.max(0, prev[itemKey] - 1),
    }));
  };

  // Upgrade Character Skill
  const handleUpgradeSkill = (skillKey: keyof SurvivorSkills) => {
    if (progress.skillPoints <= 0) return;
    setProgress((prev) => ({
      ...prev,
      skillPoints: prev.skillPoints - 1,
      skills: {
        ...prev.skills,
        [skillKey]: prev.skills[skillKey] + 1,
      },
    }));
  };

  // Toggle Mic Detection (Voice Alert Horror Mechanic)
  const handleToggleMic = async () => {
    if (!isMicActive) {
      const success = await horrorAudio.enableMicrophoneDetection((vol) => {
        setMicLevel(vol);
      });
      if (success) {
        setIsMicActive(true);
      }
    } else {
      horrorAudio.disableMicrophoneDetection();
      setIsMicActive(false);
      setMicLevel(0);
    }
  };

  // Respawn after Jumpscare
  const handleRespawn = () => {
    setIsJumpscareVisible(false);
    engineRef.current?.respawnPlayer();
  };

  // Restart match on victory
  const handlePlayAgain = () => {
    setIsVictoryVisible(false);
    engineRef.current?.respawnPlayer();
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black select-none">
      {/* 3D WebGL Three.js Viewport */}
      <div 
        id="three-forest-viewport" 
        ref={containerRef} 
        className="w-full h-full cursor-crosshair"
      />

      {/* Horror HUD Overlay */}
      <GameHUD
        hp={hp}
        stamina={stamina}
        battery={battery}
        sanity={sanity}
        isFlashlightOn={isFlashlightOn}
        monsterDist={monsterDist}
        nightTimeSeconds={nightTimeSeconds}
        repairedGens={repairedGens}
        totalGens={4}
        interactPrompt={interactPrompt}
        activeEvent={activeEvent}
        teammates={teammates}
        micLevel={micLevel}
        isMicActive={isMicActive}
        isDaytime={isDaytime}
        dayNightRemainingSeconds={dayNightRemainingSeconds}
        isInSafeHouse={isInSafeHouse}
        isDoorClosed={isDoorClosed}
        fps={fps}
        performanceMode={performanceMode}
        onTogglePerformance={(mode) => {
          setPerformanceMode(mode);
          engineRef.current?.setPerformanceMode(mode);
        }}
        onSkipDay={() => engineRef.current?.skipDaytime()}
        onToggleFlashlight={() => engineRef.current?.toggleFlashlight()}
        onToggleCrouch={() => engineRef.current?.setCrouching(!engineRef.current)}
        onToggleSprint={(sprinting) => engineRef.current?.setSprinting(sprinting)}
        onInteract={() => engineRef.current?.tryInteract()}
        onOpenInventory={() => setIsInventoryOpen(true)}
        onOpenSkills={() => setIsSkillsOpen(true)}
        onOpenRobloxCode={() => setIsRobloxDevKitOpen(true)}
        onToggleMute={() => horrorAudio.toggleMute()}
        onToggleMic={handleToggleMic}
        onJoystickMove={(x, y) => {
          if (engineRef.current) {
            engineRef.current.joystickInput = { x, y };
          }
        }}
        onTouchLook={(dx, dy) => {
          if (engineRef.current) {
            engineRef.current.touchLookDelta = { x: dx, y: dy };
          }
        }}
      />

      {/* Inventory & Crafting Workbench Modal */}
      <InventoryCraftingModal
        isOpen={isInventoryOpen}
        onClose={() => setIsInventoryOpen(false)}
        resources={resources}
        items={items}
        onCraftItem={handleCraftItem}
        onUseItem={(itemKey) => {
          handleUseItem(itemKey);
          setIsInventoryOpen(false);
        }}
      />

      {/* Character Skills Upgrade Modal */}
      <SkillUpgradeModal
        isOpen={isSkillsOpen}
        onClose={() => setIsSkillsOpen(false)}
        progress={progress}
        onUpgradeSkill={handleUpgradeSkill}
      />

      {/* Roblox Studio & Python Scripts Exporter Modal */}
      <RobloxDevKitModal
        isOpen={isRobloxDevKitOpen}
        onClose={() => setIsRobloxDevKitOpen(false)}
      />

      {/* Jumpscare Screamer Screen */}
      <JumpscareOverlay
        isVisible={isJumpscareVisible}
        nightTimeSeconds={nightTimeSeconds}
        repairedGens={repairedGens}
        resourcesGathered={totalResourcesGathered}
        onRespawn={handleRespawn}
      />

      {/* Victory Escape Modal */}
      <EscapeVictoryModal
        isVisible={isVictoryVisible}
        nightTimeSeconds={nightTimeSeconds}
        xpEarned={500}
        onPlayAgain={handlePlayAgain}
        onOpenRobloxDevKit={() => {
          setIsVictoryVisible(false);
          setIsRobloxDevKitOpen(true);
        }}
      />
    </div>
  );
}
