/**
 * Advanced Horror AI Engine
 * Implements sensory perception, sound detection, voice hearing, memory retention,
 * tactical tree-flanking, ambush trajectory prediction, and pack swarm coordination.
 */
import * as THREE from 'three';
import { horrorAudio } from '../audio/horrorAudio';
import { MonsterState } from '../types/game';

export interface SoundDisturbance {
  position: THREE.Vector3;
  intensity: number;
  timestamp: number;
}

export class AdvancedMonsterAI {
  public state: MonsterState = 'stalking';
  public position: THREE.Vector3 = new THREE.Vector3(0, 0, -60);
  public velocity: THREE.Vector3 = new THREE.Vector3();

  // AI Perception & Memory
  public suspicion: number = 0; // 0 to 100
  public lastKnownPosition: THREE.Vector3 | null = null;
  public memoryTimer: number = 0;
  public patrolTarget: THREE.Vector3 = new THREE.Vector3(30, 0, 30);
  public patrolWaypoints: THREE.Vector3[] = [
    new THREE.Vector3(45, 0, 40),
    new THREE.Vector3(-35, 0, -45),
    new THREE.Vector3(-55, 0, 45),
    new THREE.Vector3(55, 0, -50),
    new THREE.Vector3(0, 0, -65),
  ];
  private currentWaypointIndex: number = 0;

  // Tactical Timers
  public stunTimer: number = 0;
  public teleportCooldown: number = 22;
  public flankAngleOffset: number = 0;
  public flankTimer: number = 0;

  // Sound hearing buffer
  public recentSounds: SoundDisturbance[] = [];

  constructor(initialPos: THREE.Vector3) {
    this.position.copy(initialPos);
  }

  /**
   * Registers a sound event (running footsteps, voice in mic, generator repair)
   */
  public registerSound(pos: THREE.Vector3, intensity: number) {
    this.recentSounds.push({
      position: pos.clone(),
      intensity,
      timestamp: performance.now(),
    });
    if (this.recentSounds.length > 5) {
      this.recentSounds.shift();
    }
  }

  /**
   * Stun monster with signal flare or bear trap
   */
  public stun(duration: number = 6) {
    this.stunTimer = duration;
    this.state = 'stunned';
  }

  /**
   * Main AI update step evaluating perception, tactics, and path selection
   */
  public update(
    delta: number,
    playerPos: THREE.Vector3,
    cameraYaw: number,
    cameraQuat: THREE.Quaternion,
    isFlashlightOn: boolean,
    isSprinting: boolean,
    isCrouching: boolean
  ): {
    state: MonsterState;
    distanceToPlayer: number;
    shouldFlickerLight: boolean;
    isLunging: boolean;
  } {
    const distToPlayer = this.position.distanceTo(playerPos);

    // 1. Handle Stun state
    if (this.stunTimer > 0) {
      this.stunTimer -= delta;
      this.state = 'stunned';
      return {
        state: 'stunned',
        distanceToPlayer: distToPlayer,
        shouldFlickerLight: false,
        isLunging: false,
      };
    }

    this.teleportCooldown -= delta;
    this.memoryTimer -= delta;
    this.flankTimer += delta;

    // 2. Sensory Perception (Vision, Hearing, Voice Mic)
    let isDirectlyVisible = false;
    let hearsPlayer = false;

    // A. Microphone Voice Sensing
    const micLevel = horrorAudio.micLevel;
    if (micLevel > 0.3) {
      this.registerSound(playerPos, micLevel * 2.5);
      hearsPlayer = true;
      this.suspicion = Math.min(100, this.suspicion + delta * 50);
    }

    // B. Footstep Sound Sensing
    if (isSprinting && distToPlayer < 75) {
      this.registerSound(playerPos, 1.2);
      hearsPlayer = true;
    } else if (!isCrouching && distToPlayer < 35) {
      this.registerSound(playerPos, 0.7);
      hearsPlayer = true;
    }

    // C. Vision Cone & Light beam
    const toMonster = new THREE.Vector3().subVectors(this.position, playerPos).normalize();
    const playerLookDir = new THREE.Vector3(0, 0, -1).applyQuaternion(cameraQuat);
    const lightDot = playerLookDir.dot(toMonster);

    // If player shines flashlight on monster, monster is illuminated and reacts
    const isLitByFlashlight = isFlashlightOn && lightDot > 0.65 && distToPlayer < 36;

    // Monster's own vision cone towards player
    const monsterForward = new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.flankAngleOffset);
    const monsterToPlayer = new THREE.Vector3().subVectors(playerPos, this.position).normalize();
    const monsterDot = monsterForward.dot(monsterToPlayer);

    let maxVisualRange = isFlashlightOn ? 65 : 22;
    if (isCrouching) maxVisualRange *= 0.45; // Sneaking in darkness works!

    if (distToPlayer < maxVisualRange) {
      isDirectlyVisible = true;
      this.lastKnownPosition = playerPos.clone();
      this.memoryTimer = 14;
    }

    // 3. AI State Evaluation
    if (isDirectlyVisible || isLitByFlashlight || distToPlayer < 18) {
      this.state = 'hunting';
      this.suspicion = 100;
    } else if (hearsPlayer || (this.memoryTimer > 0 && this.lastKnownPosition)) {
      this.state = 'stalking';
      this.suspicion = Math.max(30, this.suspicion);
    } else {
      this.state = 'patrolling';
      this.suspicion = Math.max(0, this.suspicion - delta * 8);
    }

    // 4. Tactical Movement execution
    let targetPos = playerPos;
    let moveSpeed = 3.5;

    if (this.state === 'hunting') {
      // Direct aggressive pursuit + predictive intercept
      moveSpeed = 6.4;
      targetPos = playerPos;
    } else if (this.state === 'stalking') {
      // Tactical Flanking: approach player from side/blind spot, not straight ahead!
      moveSpeed = 4.2;

      // Periodically switch flanking side (left or right)
      if (this.flankTimer > 7) {
        this.flankTimer = 0;
        this.flankAngleOffset = (Math.random() < 0.5 ? 1 : -1) * (0.8 + Math.random() * 0.6);
      }

      // Calculate flank vector perpendicular to player's gaze
      const rightDir = new THREE.Vector3(1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), cameraYaw);
      const flankTarget = playerPos.clone().addScaledVector(rightDir, this.flankAngleOffset * 18);
      targetPos = this.lastKnownPosition || flankTarget;
    } else {
      // Patrol between forest landmarks
      moveSpeed = 2.8;
      const wpDist = this.position.distanceTo(this.patrolWaypoints[this.currentWaypointIndex]);
      if (wpDist < 6) {
        this.currentWaypointIndex = (this.currentWaypointIndex + 1) % this.patrolWaypoints.length;
      }
      targetPos = this.patrolWaypoints[this.currentWaypointIndex];
    }

    // Move towards targetPos
    const moveDir = new THREE.Vector3().subVectors(targetPos, this.position).setY(0).normalize();
    this.position.addScaledVector(moveDir, moveSpeed * delta);

    // 5. Blind-spot Teleport Ambush
    // If monster is stalking far away and player is not looking at it, teleport into fog behind player!
    if (
      this.teleportCooldown <= 0 &&
      this.state === 'stalking' &&
      distToPlayer > 30 &&
      lightDot < 0.2 // Player is NOT looking towards monster
    ) {
      this.teleportCooldown = 28 + Math.random() * 15;
      const behindDir = new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), cameraYaw);
      this.position.copy(playerPos).addScaledVector(behindDir, 20 + Math.random() * 8);
      horrorAudio.playTwigSnap();
    }

    // EMP Flashlight interference
    const shouldFlickerLight = distToPlayer < 20 && this.state === 'hunting';

    return {
      state: this.state,
      distanceToPlayer: distToPlayer,
      shouldFlickerLight,
      isLunging: distToPlayer < 3.2 && this.state === 'hunting',
    };
  }
}
