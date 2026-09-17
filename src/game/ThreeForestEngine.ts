import * as THREE from 'three';
import { horrorAudio } from '../audio/horrorAudio';
import { ForestEvent, ItemKey, MonsterState, ResourceKey } from '../types/game';
import { ProceduralModelFactory } from './proceduralModels';
import { ProceduralTextureFactory } from './proceduralTextures';
import { AdvancedMonsterAI } from './monsterAI';

export interface WorldInteractable {
  id: string;
  type: 'resource' | 'generator' | 'trap' | 'flare';
  position: THREE.Vector3;
  data?: any;
}

export interface EngineCallbacks {
  onInteractPrompt: (prompt: string | null) => void;
  onStatsUpdate: (stats: {
    hp: number;
    stamina: number;
    battery: number;
    sanity: number;
    isFlashlightOn: boolean;
    monsterDist: number;
    nightTimeSeconds: number;
    repairedGens: number;
    isDaytime: boolean;
    dayNightRemainingSeconds: number;
    isInSafeHouse: boolean;
    isDoorClosed: boolean;
    fps: number;
  }) => void;
  onJumpscareTrigger: () => void;
  onVictory: () => void;
  onPickupResource: (type: ResourceKey) => void;
  onEventTriggered: (event: ForestEvent) => void;
}

export class ThreeForestEngine {
  private container: HTMLElement;
  private callbacks: EngineCallbacks;

  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private clock: THREE.Clock;

  // Mobile Performance & FPS
  public isMobileDevice: boolean = false;
  public currentFps: number = 60;
  private frameCount: number = 0;
  private lastFpsTime: number = performance.now();
  private performanceMode: 'turbo' | 'balanced' | 'ultra' = 'turbo';

  // Lights & Atmosphere
  private ambientLight: THREE.AmbientLight;
  private dirLight: THREE.DirectionalLight;
  private flashlight: THREE.SpotLight;
  private flashlightTarget: THREE.Object3D;
  private flashlightViewModel: THREE.Group;
  private isFlashlightOn: boolean = true;
  private flashlightFlickerTimer: number = 0;

  // Player state
  private playerPos: THREE.Vector3 = new THREE.Vector3(0, 1.7, 0);
  private cameraPitch: number = 0;
  private cameraYaw: number = 0;
  private moveSpeed: number = 4.8;
  private sprintMultiplier: number = 1.75;
  private hp: number = 100;
  private stamina: number = 100;
  private battery: number = 100;
  private sanity: number = 100;
  private isCrouching: boolean = false;
  private isSprinting: boolean = false;
  private isPointerLocked: boolean = false;
  private repairedGenerators: number = 0;
  private headBobTimer: number = 0;

  // Safe House (Домик-Убежище)
  private safeHouseGroup: THREE.Group;
  private safeHouseDoorHinge: THREE.Group;
  private safeHouseDoorOpen: boolean = false;
  private isInSafeHouse: boolean = false;
  private safeHouseScratchTimer: number = 0;
  private readonly safeHousePos: THREE.Vector3 = new THREE.Vector3(0, 0, -32);

  // Day/Night Cycle (5 min Day, 15 min Night)
  public isDaytime: boolean = true;
  private cycleTime: number = 0; // 0..300 = Day (5 min), 300..1200 = Night (15 min)
  private hasPlayedDuskWarning: boolean = false;
  private readonly DAY_DURATION = 300; // 5 minutes = 300s
  private readonly NIGHT_DURATION = 900; // 15 minutes = 900s
  private readonly TOTAL_CYCLE = 1200; // 20 minutes total

  // Input state
  private keys: { [key: string]: boolean } = {};
  public joystickInput = { x: 0, y: 0 };
  public touchLookDelta = { x: 0, y: 0 };

  // World & Generation
  private treeTrunkMesh: THREE.InstancedMesh | null = null;
  private treeFoliageMeshes: THREE.InstancedMesh[] = [];
  private interactables: WorldInteractable[] = [];
  private generatorMeshes: THREE.Group[] = [];
  private activeFlares: { light: THREE.PointLight; mesh: THREE.Mesh; timeLeft: number }[] = [];
  private activeTraps: { mesh: THREE.Mesh; pos: THREE.Vector3; active: boolean }[] = [];

  // Main Monster & AI
  private monsterGroup: THREE.Group;
  private monsterAI: AdvancedMonsterAI;
  private monsterPos: THREE.Vector3 = new THREE.Vector3(0, 0, -60);
  private monsterState: MonsterState = 'stalking';
  private monsterSpeed: number = 3.6;
  private monsterEyeLeft: THREE.Mesh;
  private monsterEyeRight: THREE.Mesh;
  private monsterStunTimer: number = 0;
  private monsterTeleportTimer: number = 20;

  // Night Crawlers (Little monsters)
  private crawlers: {
    group: THREE.Group;
    pos: THREE.Vector3;
    speed: number;
    direction: THREE.Vector3;
    eyeLight: THREE.PointLight;
  }[] = [];

  // Silent Lurkers ("Маленькие тихие страшилки со светящимися глазами")
  private silentLurkers: {
    group: THREE.Group;
    pos: THREE.Vector3;
    speed: number;
    eyeLight: THREE.PointLight;
    fleeTimer: number;
  }[] = [];

  // Day/Night & Events
  private matchTimeSeconds: number = 0;
  private currentEvent: ForestEvent = 'none';
  private eventTimer: number = 30;

  // Animation frame
  private animFrameId: number | null = null;
  private isDestroyed: boolean = false;

  constructor(container: HTMLElement, callbacks: EngineCallbacks) {
    this.container = container;
    this.callbacks = callbacks;

    // Detect mobile device (specifically optimized for Motorola G54 5G & modern phones)
    this.isMobileDevice = 
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
      (typeof window !== 'undefined' && window.innerWidth <= 820);

    // 1. Setup Scene & Renderer with High-FPS Mobile Presets
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x355e78); // Start in daylight
    this.scene.fog = new THREE.FogExp2(0x42687d, 0.016);

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    this.camera = new THREE.PerspectiveCamera(72, width / height, 0.1, 120);
    this.camera.position.copy(this.playerPos);

    this.renderer = new THREE.WebGLRenderer({ 
      antialias: !this.isMobileDevice, // MSAA off on mobile for 100+ FPS!
      powerPreference: 'high-performance',
      precision: this.isMobileDevice ? 'mediump' : 'highp',
    });
    this.renderer.setSize(width, height);
    
    // Pixel ratio: on Motorola G54 (1080x2400) capping at 1.1x gives 60-100+ FPS buttery smooth!
    const targetPixelRatio = this.isMobileDevice ? Math.min(window.devicePixelRatio, 1.1) : Math.min(window.devicePixelRatio, 1.5);
    this.renderer.setPixelRatio(targetPixelRatio);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = this.isMobileDevice ? THREE.BasicShadowMap : THREE.PCFSoftShadowMap;
    container.appendChild(this.renderer.domElement);

    this.clock = new THREE.Clock();

    // 2. Setup Lighting & Handheld Tactical Flashlight Viewmodel
    this.ambientLight = new THREE.AmbientLight(0xb2d5f0, 1.0); // Daylight start
    this.scene.add(this.ambientLight);

    this.dirLight = new THREE.DirectionalLight(0xfff7d6, 1.5);
    this.dirLight.position.set(30, 80, -20);
    this.dirLight.castShadow = false;
    this.scene.add(this.dirLight);

    // Tactical Flashlight 3D Model attached to First-Person Camera View
    this.flashlightViewModel = ProceduralModelFactory.createTacticalFlashlight();
    this.flashlightViewModel.position.set(0.24, -0.21, -0.42);
    this.camera.add(this.flashlightViewModel);
    this.scene.add(this.camera);

    // Flashlight SpotLight Beam (512 map on mobile for ultra performance)
    this.flashlight = new THREE.SpotLight(0xfff4d6, 4.2, 40, Math.PI / 5.2, 0.45, 1.2);
    this.flashlight.position.copy(this.playerPos);
    this.flashlight.castShadow = true;
    const shadowRes = this.isMobileDevice ? 512 : 1024;
    this.flashlight.shadow.mapSize.width = shadowRes;
    this.flashlight.shadow.mapSize.height = shadowRes;

    this.flashlightTarget = new THREE.Object3D();
    this.scene.add(this.flashlightTarget);
    this.flashlight.target = this.flashlightTarget;
    this.scene.add(this.flashlight);

    // 3. Build Safe House (Домик-Убежище)
    const safeHouseData = ProceduralModelFactory.createSafeCabin();
    this.safeHouseGroup = safeHouseData.group;
    this.safeHouseDoorHinge = safeHouseData.doorHinge;
    this.safeHouseGroup.position.copy(this.safeHousePos);
    this.scene.add(this.safeHouseGroup);

    // 4. Build Monster and Scene Models
    this.monsterGroup = this.createMainMonsterModel();
    const [eyeL, eyeR] = this.extractMonsterEyes(this.monsterGroup);
    this.monsterEyeLeft = eyeL;
    this.monsterEyeRight = eyeR;
    this.scene.add(this.monsterGroup);
    this.monsterGroup.visible = false; // Hidden during initial daytime!

    // Initialize Advanced Monster AI
    this.monsterAI = new AdvancedMonsterAI(this.monsterPos);

    this.buildTerrain();
    this.buildProceduralTrees();
    this.buildGenerators();
    this.spawnInitialResources();
    this.spawnNightCrawlers(4);
    this.spawnSilentLurkers(5);

    // 5. Attach Event Listeners
    this.attachEvents();

    // 6. Start Render Loop
    this.loop();
  }

  /**
   * Builds atmospheric terrain with dark soil, rocks, and grass blades
   */
  private buildTerrain() {
    const groundGeo = new THREE.PlaneGeometry(350, 350, 64, 64);
    // Add subtle height undulations
    const pos = groundGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const vx = pos.getX(i);
      const vy = pos.getY(i);
      const elevation = Math.sin(vx * 0.05) * Math.cos(vy * 0.05) * 0.8 + Math.sin(vx * 0.02) * 1.2;
      pos.setZ(i, elevation);
    }
    groundGeo.computeVertexNormals();

    const groundMat = new THREE.MeshStandardMaterial({
      roughness: 0.9,
      metalness: 0.05,
      map: ProceduralTextureFactory.getGroundTexture(),
    });

    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);

    // Abandoned wooden log cabins
    this.createCabin(-35, -45);
    this.createCabin(45, 40);
  }

  /**
   * Creates realistic rustic horror cabin made of horizontal interlocking timber logs
   */
  private createCabin(x: number, z: number) {
    const cabinGroup = new THREE.Group();
    const barkMat = new THREE.MeshStandardMaterial({
      roughness: 0.9,
      map: ProceduralTextureFactory.getBarkTexture(),
    });
    const roofMat = new THREE.MeshStandardMaterial({ color: 0x141a15, roughness: 0.9 });

    // Stacked realistic horizontal wooden logs
    for (let h = 0; h < 7; h++) {
      const y = 0.35 + h * 0.65;
      // Front and Back walls (logs)
      for (const zOff of [-6, 6]) {
        if (zOff === 6 && h < 5) {
          // Leave doorway opening in the front
          const logL = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 3.8, 8), barkMat);
          logL.rotation.z = Math.PI / 2;
          logL.position.set(-3.1, y, zOff);
          cabinGroup.add(logL);

          const logR = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 3.8, 8), barkMat);
          logR.rotation.z = Math.PI / 2;
          logR.position.set(3.1, y, zOff);
          cabinGroup.add(logR);
        } else {
          const log = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 10.5, 8), barkMat);
          log.rotation.z = Math.PI / 2;
          log.position.set(0, y, zOff);
          cabinGroup.add(log);
        }
      }
      // Left and Right walls (logs)
      for (const xOff of [-5, 5]) {
        const sideLog = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 12.2, 8), barkMat);
        sideLog.rotation.x = Math.PI / 2;
        sideLog.position.set(xOff, y, 0);
        cabinGroup.add(sideLog);
      }
    }

    // Doorway opening frame
    const doorHole = new THREE.Mesh(
      new THREE.PlaneGeometry(2.4, 3.4),
      new THREE.MeshBasicMaterial({ color: 0x010203 })
    );
    doorHole.position.set(0, 1.7, 6.05);
    cabinGroup.add(doorHole);

    // Gabled Roof
    const roof = new THREE.Mesh(new THREE.ConeGeometry(9.5, 3.2, 4), roofMat);
    roof.position.set(0, 6.2, 0);
    roof.rotation.y = Math.PI / 4;
    cabinGroup.add(roof);

    cabinGroup.position.set(x, 0, z);
    this.scene.add(cabinGroup);
  }

  /**
   * Creates a dense, terrifying forest with 380+ realistic organic spruce trees
   * Features gnarled tapering trunks with root flaring and 4 multi-tiered drooping branch layers.
   * High performance instanced rendering ensures smooth 60 FPS on both mobile and desktop!
   */
  private buildProceduralTrees() {
    const treeCount = 380;
    const { trunkGeo, foliageGeoList } = ProceduralModelFactory.createRealisticTreeGeometries();

    const trunkMat = new THREE.MeshStandardMaterial({
      roughness: 0.9,
      map: ProceduralTextureFactory.getBarkTexture(),
    });
    const foliageMat = new THREE.MeshStandardMaterial({
      roughness: 0.85,
      map: ProceduralTextureFactory.getNeedleTexture(),
    });

    this.treeTrunkMesh = new THREE.InstancedMesh(trunkGeo, trunkMat, treeCount);
    this.treeFoliageMeshes = foliageGeoList.map(geo => new THREE.InstancedMesh(geo, foliageMat, treeCount));

    const dummy = new THREE.Object3D();
    const mapRadius = 145;

    let index = 0;
    for (let i = 0; i < treeCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      // Clear radius around spawn center (14m) and clearings around cabins
      const dist = 14 + Math.sqrt(Math.random()) * (mapRadius - 14);
      const x = Math.cos(angle) * dist;
      const z = Math.sin(angle) * dist;

      // Avoid spawning directly inside cabins
      const distCabin1 = Math.hypot(x - (-35), z - (-45));
      const distCabin2 = Math.hypot(x - 45, z - 40);
      if (distCabin1 < 10 || distCabin2 < 10) continue;

      const scale = 0.8 + Math.random() * 0.55;
      const rotY = Math.random() * Math.PI * 2;
      const tiltX = (Math.random() - 0.5) * 0.08;
      const tiltZ = (Math.random() - 0.5) * 0.08;

      // Organic Trunk Matrix
      dummy.position.set(x, (14 * scale) / 2, z);
      dummy.scale.set(scale, scale, scale);
      dummy.rotation.set(tiltX, rotY, tiltZ);
      dummy.updateMatrix();
      this.treeTrunkMesh.setMatrixAt(index, dummy.matrix);

      // 4 Multi-Tier Foliage Canopies
      this.treeFoliageMeshes.forEach(mesh => {
        mesh.setMatrixAt(index, dummy.matrix);
      });

      index++;
    }

    this.treeTrunkMesh.count = index;
    this.treeTrunkMesh.instanceMatrix.needsUpdate = true;
    this.treeTrunkMesh.castShadow = true;
    this.scene.add(this.treeTrunkMesh);

    this.treeFoliageMeshes.forEach(mesh => {
      mesh.count = index;
      mesh.instanceMatrix.needsUpdate = true;
      mesh.castShadow = true;
      this.scene.add(mesh);
    });
  }

  /**
   * Escape Generators with detailed industrial diesel engines, pipes, gauges, and radio masts
   */
  private buildGenerators() {
    const angles = [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2];
    angles.forEach((angle, idx) => {
      const dist = 55 + (idx % 2 === 0 ? 12 : -10);
      const x = Math.cos(angle) * dist;
      const z = Math.sin(angle) * dist;

      // Create realistic industrial generator
      const genGroup = ProceduralModelFactory.createRealisticGenerator(idx + 1);
      genGroup.position.set(x, 0, z);
      this.scene.add(genGroup);
      this.generatorMeshes.push(genGroup);

      this.interactables.push({
        id: `gen_${idx + 1}`,
        type: 'generator',
        position: new THREE.Vector3(x, 1.6, z),
        data: { repaired: false, index: idx + 1 },
      });
    });
  }

  /**
   * Scatter realistic 3D collectible resources in the forest
   */
  private spawnInitialResources() {
    const resourceTypes: ResourceKey[] = ['wood', 'scrap', 'battery', 'herbs', 'sulfur', 'circuit'];
    const count = 54;

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 10 + Math.random() * 115;
      const x = Math.cos(angle) * dist;
      const z = Math.sin(angle) * dist;
      const type = resourceTypes[Math.floor(Math.random() * resourceTypes.length)];

      // Realistic 3D resource model
      const group = ProceduralModelFactory.createResourceModel(type);
      group.position.set(x, 0, z);
      this.scene.add(group);

      this.interactables.push({
        id: `res_${i}`,
        type: 'resource',
        position: new THREE.Vector3(x, 0.5, z),
        data: { resourceType: type, groupMesh: group },
      });
    }
  }

  /**
   * Creates the terrifying anatomically detailed Shadow Nemesis monster
   */
  private createMainMonsterModel(): THREE.Group {
    const group = ProceduralModelFactory.createRealisticMonster();
    group.position.copy(this.monsterPos);
    return group;
  }

  private extractMonsterEyes(group: THREE.Group): [THREE.Mesh, THREE.Mesh] {
    let l = group.getObjectByName('monsterEyeL') as THREE.Mesh;
    let r = group.getObjectByName('monsterEyeR') as THREE.Mesh;
    return [l, r];
  }

  /**
   * Spawns realistic chitinous Night Crawlers with articulated legs
   */
  private spawnNightCrawlers(count: number) {
    for (let i = 0; i < count; i++) {
      const g = ProceduralModelFactory.createRealisticCrawler();
      const eyeGlow = g.getObjectByName('eyeLight') as THREE.PointLight || new THREE.PointLight(0x84cc16, 1.2, 9);

      const angle = Math.random() * Math.PI * 2;
      const dist = 25 + Math.random() * 45;
      const spawnX = this.playerPos.x + Math.cos(angle) * dist;
      const spawnZ = this.playerPos.z + Math.sin(angle) * dist;
      g.position.set(spawnX, 0, spawnZ);

      this.scene.add(g);

      this.crawlers.push({
        group: g,
        pos: g.position,
        speed: 5.5 + Math.random() * 1.5,
        direction: new THREE.Vector3(Math.random() - 0.5, 0, Math.random() - 0.5).normalize(),
        eyeLight: eyeGlow,
      });
    }
  }

  /**
   * Attach keyboard, mouse, pointer lock, and resize events
   */
  private attachEvents() {
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('resize', this.onResize);
    this.renderer.domElement.addEventListener('click', this.requestPointerLock);
    document.addEventListener('pointerlockchange', this.onPointerLockChange);
    document.addEventListener('mousemove', this.onMouseMove);
  }

  private onResize = () => {
    if (this.isDestroyed || !this.container) return;
    const w = this.container.clientWidth || window.innerWidth;
    const h = this.container.clientHeight || window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  };

  private requestPointerLock = () => {
    if (!this.isPointerLocked) {
      this.renderer.domElement.requestPointerLock?.();
      horrorAudio.init();
    }
  };

  private onPointerLockChange = () => {
    this.isPointerLocked = document.pointerLockElement === this.renderer.domElement;
  };

  private onMouseMove = (e: MouseEvent) => {
    if (!this.isPointerLocked) return;
    const sensitivity = 0.0022;
    this.cameraYaw -= e.movementX * sensitivity;
    this.cameraPitch -= e.movementY * sensitivity;
    this.cameraPitch = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, this.cameraPitch));
  };

  private onKeyDown = (e: KeyboardEvent) => {
    this.keys[e.code] = true;

    // Flashlight Toggle (F)
    if (e.code === 'KeyF') {
      this.toggleFlashlight();
    }

    // Interact (E)
    if (e.code === 'KeyE') {
      this.tryInteract();
    }

    // Crouch Toggle or Hold (KeyC)
    if (e.code === 'KeyC') {
      this.isCrouching = !this.isCrouching;
    }
  };

  private onKeyUp = (e: KeyboardEvent) => {
    this.keys[e.code] = false;
  };

  public toggleFlashlight() {
    if (this.battery <= 0) return;
    this.isFlashlightOn = !this.isFlashlightOn;
    this.flashlight.visible = this.isFlashlightOn;

    // Update LED chip in 3D viewmodel
    const led = this.flashlightViewModel.getObjectByName('flashlightLed') as THREE.Mesh;
    if (led && led.material) {
      (led.material as THREE.MeshBasicMaterial).color.setHex(this.isFlashlightOn ? 0xfffbe6 : 0x18181b);
    }

    horrorAudio.playFlashlightClick(this.isFlashlightOn);
  }

  public setCrouching(crouching: boolean) {
    this.isCrouching = crouching;
  }

  public setSprinting(sprinting: boolean) {
    this.isSprinting = sprinting;
  }

  /**
   * Places an item in the 3D world (e.g., Bear Trap or Flare)
   */
  public usePlacedItem(itemType: 'signal_flare' | 'bear_trap') {
    if (itemType === 'signal_flare') {
      // Create bright red burning flare at player position
      const flareLight = new THREE.PointLight(0xff2222, 6.5, 32);
      flareLight.position.set(this.playerPos.x, 0.4, this.playerPos.z);

      const flareMesh = new THREE.Mesh(
        new THREE.CylinderGeometry(0.12, 0.12, 0.8, 8),
        new THREE.MeshBasicMaterial({ color: 0xffffff })
      );
      flareMesh.position.set(this.playerPos.x, 0.4, this.playerPos.z);
      this.scene.add(flareLight);
      this.scene.add(flareMesh);

      this.activeFlares.push({ light: flareLight, mesh: flareMesh, timeLeft: 15 });
      horrorAudio.playFlareHiss();

      // Blind & stun monster if nearby
      const dist = this.monsterPos.distanceTo(this.playerPos);
      if (dist < 30) {
        this.monsterStunTimer = 8;
        this.monsterState = 'stunned';
        this.monsterAI.stun(8);
      }
    } else if (itemType === 'bear_trap') {
      const trapMesh = new THREE.Mesh(
        new THREE.CylinderGeometry(0.8, 0.8, 0.15, 8),
        new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.8, roughness: 0.4 })
      );
      trapMesh.position.set(this.playerPos.x, 0.1, this.playerPos.z);
      this.scene.add(trapMesh);

      this.activeTraps.push({
        mesh: trapMesh,
        pos: new THREE.Vector3(this.playerPos.x, 0.1, this.playerPos.z),
        active: true,
      });
      horrorAudio.playItemPickup();
    }
  }

  /**
   * Recharge flashlight battery
   */
  public rechargeBattery(amount: number = 100) {
    this.battery = Math.min(100, this.battery + amount);
    if (this.battery > 0 && this.isFlashlightOn) {
      this.flashlight.visible = true;
    }
  }

  /**
   * Heal player
   */
  public healPlayer(amount: number = 50) {
    this.hp = Math.min(100, this.hp + amount);
    this.sanity = Math.min(100, this.sanity + 25);
    horrorAudio.playCraftSuccess();
  }

  /**
   * Safe House Door Control
   */
  public toggleSafeHouseDoor() {
    this.safeHouseDoorOpen = !this.safeHouseDoorOpen;
    this.safeHouseDoorHinge.rotation.y = this.safeHouseDoorOpen ? Math.PI * 0.48 : 0;
    horrorAudio.playDoor(!this.safeHouseDoorOpen);
  }

  /**
   * Skip Daytime to Night (for impatient players/testing)
   */
  public skipDaytime() {
    if (this.isDaytime) {
      this.cycleTime = this.DAY_DURATION - 1;
    }
  }

  /**
   * Set Performance Mode (Optimized for Motorola G54 5G 60-100+ FPS)
   */
  public setPerformanceMode(mode: 'turbo' | 'balanced' | 'ultra') {
    this.performanceMode = mode;
    if (!this.renderer) return;

    if (mode === 'turbo') {
      this.renderer.setPixelRatio(this.isMobileDevice ? 0.95 : 1.0);
      this.renderer.shadowMap.type = THREE.BasicShadowMap;
      this.flashlight.shadow.mapSize.width = 512;
      this.flashlight.shadow.mapSize.height = 512;
    } else if (mode === 'balanced') {
      this.renderer.setPixelRatio(1.15);
      this.renderer.shadowMap.type = THREE.PCFShadowMap;
      this.flashlight.shadow.mapSize.width = 512;
      this.flashlight.shadow.mapSize.height = 512;
    } else {
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      this.flashlight.shadow.mapSize.width = 1024;
      this.flashlight.shadow.mapSize.height = 1024;
    }
  }

  /**
   * Spawn 5 Silent Lurkers (Маленькие тихие страшилки со светящимися глазами)
   */
  private spawnSilentLurkers(count: number = 5) {
    for (let i = 0; i < count; i++) {
      const lurkerGroup = ProceduralModelFactory.createSilentLurker();
      const angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
      const dist = 32 + Math.random() * 45;
      const pos = new THREE.Vector3(Math.cos(angle) * dist, 0, Math.sin(angle) * dist);
      lurkerGroup.position.copy(pos);
      lurkerGroup.visible = false;
      this.scene.add(lurkerGroup);

      const eyeLight = lurkerGroup.getObjectByName('eyeGlow') as THREE.PointLight;

      this.silentLurkers.push({
        group: lurkerGroup,
        pos,
        speed: 3.0 + Math.random() * 0.7,
        eyeLight,
        fleeTimer: 0,
      });
    }
  }

  /**
   * Attempt to interact with nearest generator, safe cabin door, or resource
   */
  public tryInteract(): boolean {
    // 1. Check distance to Safe House door (at x: 0, z: -25.5)
    const distToDoor = Math.hypot(this.playerPos.x - 0, this.playerPos.z - (-25.5));
    if (distToDoor < 4.2) {
      this.toggleSafeHouseDoor();
      return true;
    }

    let nearest: WorldInteractable | null = null;
    let minDist = 3.8;

    for (const item of this.interactables) {
      const d = item.position.distanceTo(this.playerPos);
      if (d < minDist) {
        minDist = d;
        nearest = item;
      }
    }

    if (!nearest) return false;

    if (nearest.type === 'resource') {
      const resType = nearest.data.resourceType as ResourceKey;
      this.callbacks.onPickupResource(resType);
      horrorAudio.playItemPickup();

      // Remove 3D group from scene
      if (nearest.data.groupMesh) {
        this.scene.remove(nearest.data.groupMesh);
      }
      this.interactables = this.interactables.filter(i => i.id !== nearest!.id);
      return true;
    }

    if (nearest.type === 'generator') {
      if (!nearest.data.repaired) {
        nearest.data.repaired = true;
        this.repairedGenerators++;
        horrorAudio.playCraftSuccess();

        // Update generator visual beacon to blue/cyan
        const genGroup = this.generatorMeshes[nearest.data.index - 1];
        if (genGroup) {
          const beaconMesh = genGroup.getObjectByName('beaconMesh') as THREE.Mesh;
          const beaconLight = genGroup.getObjectByName('beaconLight') as THREE.PointLight;
          if (beaconMesh && beaconLight) {
            (beaconMesh.material as THREE.MeshBasicMaterial).color.setHex(0x00f0ff);
            beaconLight.color.setHex(0x00f0ff);
            beaconLight.intensity = 3.5;
          }
        }

        // Check victory condition (4 generators repaired)
        if (this.repairedGenerators >= 4) {
          this.callbacks.onVictory();
        }
        return true;
      }
    }

    return false;
  }

  /**
   * Main game physics, AI, and render loop
   */
  private loop = () => {
    if (this.isDestroyed) return;

    const delta = Math.min(0.1, this.clock.getDelta());
    this.matchTimeSeconds += delta;

    // Track real FPS for Motorola G54 5G & mobile
    this.frameCount++;
    const now = performance.now();
    if (now - this.lastFpsTime >= 500) {
      this.currentFps = Math.round((this.frameCount * 1000) / (now - this.lastFpsTime));
      this.frameCount = 0;
      this.lastFpsTime = now;
    }

    this.updateDayNightCycle(delta);
    this.updatePlayer(delta);
    this.updateMonsterAI(delta);
    this.updateNightCrawlers(delta);
    this.updateSilentLurkers(delta);
    this.updateFlaresAndTraps(delta);
    this.updateEnvironmentAndEvents(delta);

    // Render 3D scene
    this.renderer.render(this.scene, this.camera);

    this.animFrameId = requestAnimationFrame(this.loop);
  };

  /**
   * Day/Night Cycle Logic (Day: 5 min / 300s, Night: 15 min / 900s)
   */
  private updateDayNightCycle(delta: number) {
    this.cycleTime = (this.cycleTime + delta) % this.TOTAL_CYCLE;
    this.isDaytime = this.cycleTime < this.DAY_DURATION;

    if (this.isDaytime) {
      const remainingDay = Math.floor(this.DAY_DURATION - this.cycleTime);

      // Warning siren at dusk (last 30 seconds of day)
      if (remainingDay <= 30 && !this.hasPlayedDuskWarning) {
        this.hasPlayedDuskWarning = true;
        horrorAudio.playDuskWarning();
        this.callbacks.onEventTriggered('blood_fog');
      }

      if (remainingDay > 30) {
        // Bright peaceful daylight
        this.scene.background = new THREE.Color(0x355e78);
        (this.scene.fog as THREE.FogExp2).color.setHex(0x42687d);
        (this.scene.fog as THREE.FogExp2).density = 0.016;

        this.ambientLight.color.setHex(0xb2d5f0);
        this.ambientLight.intensity = 1.1;

        this.dirLight.color.setHex(0xfff7d6);
        this.dirLight.intensity = 1.5;
        this.dirLight.position.set(30, 80, -20);
      } else {
        // Blood dusk transition
        this.scene.background = new THREE.Color(0x541818);
        (this.scene.fog as THREE.FogExp2).color.setHex(0x5c1d1d);
        (this.scene.fog as THREE.FogExp2).density = 0.028;

        this.ambientLight.color.setHex(0xa85848);
        this.ambientLight.intensity = 0.55;

        this.dirLight.color.setHex(0xe2522b);
        this.dirLight.intensity = 0.85;
      }
    } else {
      // Deep ominous night (15 minutes)
      this.hasPlayedDuskWarning = false;

      this.scene.background = new THREE.Color(0x020307);
      (this.scene.fog as THREE.FogExp2).color.setHex(0x020307);
      (this.scene.fog as THREE.FogExp2).density = 0.045;

      this.ambientLight.color.setHex(0x0a101f);
      this.ambientLight.intensity = 0.35;

      this.dirLight.color.setHex(0x1a2640);
      this.dirLight.intensity = 0.2;
      this.dirLight.position.set(20, 50, -20);
    }
  }

  /**
   * Player movement, stamina, battery, safe house check, and camera head-bob
   */
  private updatePlayer(delta: number) {
    // Touch look input for mobile
    if (this.touchLookDelta.x !== 0 || this.touchLookDelta.y !== 0) {
      this.cameraYaw -= this.touchLookDelta.x * 0.0035;
      this.cameraPitch -= this.touchLookDelta.y * 0.0035;
      this.cameraPitch = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, this.cameraPitch));
      this.touchLookDelta.x = 0;
      this.touchLookDelta.y = 0;
    }

    // Direction vector
    const forward = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.cameraYaw);
    const right = new THREE.Vector3(1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.cameraYaw);

    let moveX = 0;
    let moveZ = 0;

    if (this.keys['KeyW'] || this.keys['ArrowUp']) moveZ += 1;
    if (this.keys['KeyS'] || this.keys['ArrowDown']) moveZ -= 1;
    if (this.keys['KeyA'] || this.keys['ArrowLeft']) moveX -= 1;
    if (this.keys['KeyD'] || this.keys['ArrowRight']) moveX += 1;

    // Add virtual joystick
    moveX += this.joystickInput.x;
    moveZ += -this.joystickInput.y;

    const isMoving = Math.abs(moveX) > 0.05 || Math.abs(moveZ) > 0.05;
    const wantsSprint = (this.keys['ShiftLeft'] || this.keys['ShiftRight'] || this.isSprinting) && isMoving && !this.isCrouching;

    let currentSpeed = this.moveSpeed;
    if (this.isCrouching) {
      currentSpeed = this.moveSpeed * 0.55;
    } else if (wantsSprint && this.stamina > 0) {
      currentSpeed = this.moveSpeed * this.sprintMultiplier;
      this.stamina = Math.max(0, this.stamina - delta * 24);
    } else {
      // Regenerate stamina
      this.stamina = Math.min(100, this.stamina + delta * 15);
    }

    if (isMoving) {
      const moveVec = new THREE.Vector3()
        .addScaledVector(forward, moveZ)
        .addScaledVector(right, moveX)
        .normalize();

      this.playerPos.addScaledVector(moveVec, currentSpeed * delta);

      // Constrain player within map boundaries
      this.playerPos.x = Math.max(-135, Math.min(135, this.playerPos.x));
      this.playerPos.z = Math.max(-135, Math.min(135, this.playerPos.z));

      // Head bobbing
      this.headBobTimer += delta * (wantsSprint ? 14 : 9);
      if (Math.sin(this.headBobTimer) < -0.95) {
        horrorAudio.playFootstep(wantsSprint);
      }
    }

    // Camera height (crouching lowers eye level)
    const targetEyeY = this.isCrouching ? 1.05 : 1.75;
    const bobOffset = isMoving ? Math.sin(this.headBobTimer) * 0.06 : 0;
    this.playerPos.y = targetEyeY + bobOffset;

    this.camera.position.copy(this.playerPos);

    // Camera rotation
    const euler = new THREE.Euler(this.cameraPitch, this.cameraYaw, 0, 'YXZ');
    this.camera.quaternion.setFromEuler(euler);

    // Update Flashlight position & direction
    this.flashlight.position.copy(this.camera.position);
    const lightDir = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
    this.flashlightTarget.position.copy(this.camera.position).add(lightDir.multiplyScalar(15));

    // Natural tactical flashlight viewmodel bobbing & sway in first-person view
    const swayX = Math.sin(this.headBobTimer * 0.5) * 0.012;
    const swayY = Math.cos(this.headBobTimer) * 0.009;
    this.flashlightViewModel.position.set(0.24 + swayX, -0.21 + swayY, -0.42);
    this.flashlightViewModel.rotation.set(0.04 - swayY * 1.8, 0.02 + swayX * 2, -0.04);

    // Flashlight battery consumption (only at night or when on)
    if (this.isFlashlightOn) {
      this.battery = Math.max(0, this.battery - delta * 0.7);
      if (this.battery <= 0) {
        this.flashlight.visible = false;
        const led = this.flashlightViewModel.getObjectByName('flashlightLed') as THREE.Mesh;
        if (led && led.material) {
          (led.material as THREE.MeshBasicMaterial).color.setHex(0x18181b);
        }
      }
    }

    // Check Safe House bounds
    const inCabinX = this.playerPos.x >= -4.8 && this.playerPos.x <= 4.8;
    const inCabinZ = this.playerPos.z >= -37.0 && this.playerPos.z <= -25.5;
    this.isInSafeHouse = inCabinX && inCabinZ;

    // Check distance to Safe House door
    const distToDoor = Math.hypot(this.playerPos.x - 0, this.playerPos.z - (-25.5));
    if (distToDoor < 4.2) {
      this.callbacks.onInteractPrompt(
        this.safeHouseDoorOpen
          ? '[E] / [Тап] ЗАКРЫТЬ ДВЕРЬ УБЕЖИЩА'
          : '[E] / [Тап] ОТКРЫТЬ ДВЕРЬ УБЕЖИЩА'
      );
    } else {
      this.updateInteractionPrompt();
    }

    // When inside barricaded safe house (door closed), recover sanity and stamina rapidly
    if (this.isInSafeHouse && !this.safeHouseDoorOpen) {
      this.sanity = Math.min(100, this.sanity + delta * 6.5);
      this.stamina = Math.min(100, this.stamina + delta * 20);
    } else if (this.isDaytime) {
      // Peaceful daylight regenerates sanity
      this.sanity = Math.min(100, this.sanity + delta * 2.5);
    } else {
      // Nighttime sanity drop in complete darkness
      if (!this.isFlashlightOn || this.battery <= 0) {
        this.sanity = Math.max(0, this.sanity - delta * 1.6);
      } else {
        this.sanity = Math.min(100, this.sanity + delta * 0.8);
      }
    }
  }

  private updateInteractionPrompt() {
    let nearest: WorldInteractable | null = null;
    let minDist = 3.6;
    for (const item of this.interactables) {
      const d = item.position.distanceTo(this.playerPos);
      if (d < minDist) {
        minDist = d;
        nearest = item;
      }
    }

    if (nearest) {
      if (nearest.type === 'resource') {
        const typeRu =
          nearest.data.resourceType === 'wood' ? 'Сухие ветви' :
          nearest.data.resourceType === 'scrap' ? 'Металлолом' :
          nearest.data.resourceType === 'battery' ? 'Батарейка' :
          nearest.data.resourceType === 'herbs' ? 'Целебные травы' :
          nearest.data.resourceType === 'sulfur' ? 'Серный порох' : 'Плата';
        this.callbacks.onInteractPrompt(`[E] / [Тап] Подобрать: ${typeRu}`);
      } else if (nearest.type === 'generator') {
        if (!nearest.data.repaired) {
          this.callbacks.onInteractPrompt(`[E] / [Тап] Починить Радиовышку #${nearest.data.index}`);
        } else {
          this.callbacks.onInteractPrompt(`Радиовышка #${nearest.data.index} [АКТИВНА]`);
        }
      }
    } else {
      this.callbacks.onInteractPrompt(null);
    }
  }

  /**
   * Main Monster AI logic: Powered by AdvancedMonsterAI with sound perception,
   * voice microphone sensing, tree-flanking, and predictive ambush tactics
   */
  private updateMonsterAI(delta: number) {
    // 1. Daytime Behavior: Monster is dormant underground and doesn't hunt
    if (this.isDaytime) {
      this.monsterGroup.visible = false;
      this.callbacks.onStatsUpdate({
        hp: this.hp,
        stamina: this.stamina,
        battery: this.battery,
        sanity: this.sanity,
        isFlashlightOn: this.isFlashlightOn,
        monsterDist: 999,
        nightTimeSeconds: Math.floor(this.matchTimeSeconds),
        repairedGens: this.repairedGenerators,
        isDaytime: true,
        dayNightRemainingSeconds: Math.max(0, Math.floor(this.DAY_DURATION - this.cycleTime)),
        isInSafeHouse: this.isInSafeHouse,
        isDoorClosed: !this.safeHouseDoorOpen,
        fps: this.currentFps,
      });
      return;
    }

    // 2. Nighttime Emergence
    this.monsterGroup.visible = true;

    // Check if player is safely sheltered inside the closed cabin
    const isSheltered = this.isInSafeHouse && !this.safeHouseDoorOpen;

    const isSprinting = this.keys['ShiftLeft'] || this.keys['ShiftRight'] || this.isSprinting;

    // Run Advanced AI update
    const aiResult = this.monsterAI.update(
      delta,
      this.playerPos,
      this.cameraYaw,
      this.camera.quaternion,
      this.isFlashlightOn && this.battery > 0,
      isSprinting,
      this.isCrouching
    );

    this.monsterState = aiResult.state;
    this.monsterPos.copy(this.monsterAI.position);

    // If player is sheltered inside closed cabin, monster cannot enter through door!
    if (isSheltered) {
      const distToCabin = this.monsterPos.distanceTo(this.safeHousePos);
      if (distToCabin < 15) {
        // Monster roams the front porch and claws at the wooden boards
        this.monsterPos.set(0, 0, -22);
        this.safeHouseScratchTimer -= delta;
        if (this.safeHouseScratchTimer <= 0) {
          this.safeHouseScratchTimer = 3.2 + Math.random() * 2.5;
          horrorAudio.playCabinScratch();
        }
      }
    }

    this.monsterGroup.position.copy(this.monsterPos);
    this.monsterGroup.lookAt(this.playerPos.x, this.monsterPos.y, this.playerPos.z);

    // Sinister organic breathing & hunting spine twitch
    const breath = Math.sin(this.matchTimeSeconds * 3.5) * 0.05;
    this.monsterGroup.position.y = breath;
    this.monsterGroup.rotation.z = Math.sin(this.matchTimeSeconds * 2.2) * 0.04;

    // Flashlight EMP flicker when monster is close and hunting
    if (aiResult.shouldFlickerLight && this.isFlashlightOn && !isSheltered) {
      this.flashlightFlickerTimer += delta;
      if (Math.random() < 0.18) {
        this.flashlight.visible = !this.flashlight.visible;
      }
    } else if (this.isFlashlightOn && this.battery > 0) {
      this.flashlight.visible = true;
    }

    // Jumpscare collision check (cannot happen if inside closed safe house)
    if (!isSheltered && (aiResult.isLunging || (aiResult.distanceToPlayer < 2.4 && this.monsterState === 'hunting'))) {
      this.triggerJumpscare();
    }

    // Audio & Heartbeat tension updates
    horrorAudio.updateTension(
      isSheltered ? 40 : aiResult.distanceToPlayer, 
      this.sanity, 
      !isSheltered && this.monsterState === 'hunting'
    );

    // Notify HUD
    this.callbacks.onStatsUpdate({
      hp: this.hp,
      stamina: this.stamina,
      battery: this.battery,
      sanity: this.sanity,
      isFlashlightOn: this.isFlashlightOn,
      monsterDist: Math.round(aiResult.distanceToPlayer),
      nightTimeSeconds: Math.floor(this.matchTimeSeconds),
      repairedGens: this.repairedGenerators,
      isDaytime: false,
      dayNightRemainingSeconds: Math.max(0, Math.floor(this.DAY_DURATION + this.NIGHT_DURATION - this.cycleTime)),
      isInSafeHouse: this.isInSafeHouse,
      isDoorClosed: !this.safeHouseDoorOpen,
      fps: this.currentFps,
    });
  }

  /**
   * Night Crawlers swarm logic
   */
  private updateNightCrawlers(delta: number) {
    if (this.isDaytime) {
      this.crawlers.forEach((c) => (c.group.visible = false));
      return;
    }

    const isSheltered = this.isInSafeHouse && !this.safeHouseDoorOpen;

    this.crawlers.forEach((crawler, idx) => {
      crawler.group.visible = true;
      const dist = crawler.pos.distanceTo(this.playerPos);

      // Flee from bright flashlight or flare
      const lightDir = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
      const toCrawler = new THREE.Vector3().subVectors(crawler.pos, this.playerPos).normalize();
      const dot = lightDir.dot(toCrawler);

      const isFleeing = this.isFlashlightOn && dot > 0.7 && dist < 16;

      if (isFleeing) {
        // Run away from flashlight
        const fleeDir = toCrawler.clone().negate();
        crawler.pos.addScaledVector(fleeDir, crawler.speed * 1.3 * delta);
      } else if (dist < 32 && !isSheltered) {
        // Creep towards player
        const stalkDir = toCrawler.setY(0).normalize();
        crawler.pos.addScaledVector(stalkDir, crawler.speed * delta);

        if (dist < 1.8) {
          // Bite player
          this.hp = Math.max(0, this.hp - delta * 12);
          this.stamina = Math.max(0, this.stamina - delta * 20);
          horrorAudio.playCrawlerHiss();
        }
      }

      crawler.group.position.copy(crawler.pos);
      crawler.group.lookAt(this.playerPos.x, crawler.pos.y, this.playerPos.z);

      // Realistic insectoid skitter animation
      const legCycle = Math.sin(this.matchTimeSeconds * 14 + idx * 1.5) * 0.08;
      crawler.group.rotation.z = legCycle;
    });
  }

  /**
   * Silent Lurkers (Маленькие тихие страшилки со светящимися глазами)
   * They move completely silently in the darkness. Only their glowing yellow eyes are visible.
   * If flashlight hits them, they hiss and flee. If they sneak up unnoticed, they leap and bite!
   */
  private updateSilentLurkers(delta: number) {
    if (this.isDaytime) {
      this.silentLurkers.forEach((l) => (l.group.visible = false));
      return;
    }

    const isSheltered = this.isInSafeHouse && !this.safeHouseDoorOpen;
    const lightDir = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);

    this.silentLurkers.forEach((lurker, idx) => {
      lurker.group.visible = true;
      const dist = lurker.pos.distanceTo(this.playerPos);

      // Check if flashlight is shining on lurker
      const toLurker = new THREE.Vector3().subVectors(lurker.pos, this.playerPos).normalize();
      const dot = lightDir.dot(toLurker);
      const isIlluminated = this.isFlashlightOn && this.battery > 0 && dot > 0.82 && dist < 28;

      if (isIlluminated && lurker.fleeTimer <= 0) {
        lurker.fleeTimer = 3.5;
        horrorAudio.playLurkerHiss();
      }

      if (lurker.fleeTimer > 0) {
        lurker.fleeTimer -= delta;
        // Scuttle away in opposite direction
        const fleeDir = toLurker.clone().setY(0).normalize();
        lurker.pos.addScaledVector(fleeDir, lurker.speed * 1.7 * delta);
      } else if (!isSheltered) {
        if (dist < 40) {
          // Creep completely silently towards the player
          const stalkDir = new THREE.Vector3().subVectors(this.playerPos, lurker.pos).setY(0).normalize();
          lurker.pos.addScaledVector(stalkDir, lurker.speed * delta);

          // Lethal surprise ambush bite!
          if (dist < 1.7) {
            this.hp = Math.max(0, this.hp - 25);
            this.sanity = Math.max(0, this.sanity - 15);
            horrorAudio.playLurkerBite();
            lurker.fleeTimer = 4.5;
            if (this.hp <= 0) {
              this.triggerJumpscare();
            }
          }
        }
      } else {
        // Player is safe in closed cabin; lurker retreats slightly
        const awayFromCabin = new THREE.Vector3().subVectors(lurker.pos, this.safeHousePos).setY(0).normalize();
        lurker.pos.addScaledVector(awayFromCabin, lurker.speed * 0.6 * delta);
      }

      // Constrain inside world boundary
      lurker.pos.x = Math.max(-130, Math.min(130, lurker.pos.x));
      lurker.pos.z = Math.max(-130, Math.min(130, lurker.pos.z));

      lurker.group.position.copy(lurker.pos);
      lurker.group.lookAt(this.playerPos.x, lurker.pos.y, this.playerPos.z);

      // Low creepy ground stalk bobbing
      const walkBob = Math.sin(this.matchTimeSeconds * 16 + idx * 2) * 0.035;
      lurker.group.position.y = walkBob;
    });
  }

  /**
   * Flares and Bear traps
   */
  private updateFlaresAndTraps(delta: number) {
    // Flares
    for (let i = this.activeFlares.length - 1; i >= 0; i--) {
      const flare = this.activeFlares[i];
      flare.timeLeft -= delta;
      flare.light.intensity = Math.max(0, (flare.timeLeft / 15) * 6.5);
      if (flare.timeLeft <= 0) {
        this.scene.remove(flare.light);
        this.scene.remove(flare.mesh);
        this.activeFlares.splice(i, 1);
      }
    }

    // Bear Traps
    this.activeTraps.forEach(trap => {
      if (!trap.active) return;
      const monsterDist = trap.pos.distanceTo(this.monsterPos);
      if (monsterDist < 2.5) {
        trap.active = false;
        this.monsterStunTimer = 6;
        this.monsterState = 'stunned';
        this.monsterAI.stun(6);
        horrorAudio.playBearTrapSnap();
      }
    });
  }

  /**
   * Random Forest Events (Blood Fog, Whispering Winds, Crows)
   */
  private updateEnvironmentAndEvents(delta: number) {
    this.eventTimer -= delta;
    if (this.eventTimer <= 0) {
      this.eventTimer = 45 + Math.random() * 30;
      const events: ForestEvent[] = ['blood_fog', 'whispers', 'blackout_pulse', 'crows_swarm', 'supply_drop'];
      this.currentEvent = events[Math.floor(Math.random() * events.length)];
      this.callbacks.onEventTriggered(this.currentEvent);

      if (this.currentEvent === 'blood_fog') {
        (this.scene.fog as THREE.FogExp2).color.setHex(0x2b0606);
        this.scene.background = new THREE.Color(0x2b0606);
        setTimeout(() => {
          (this.scene.fog as THREE.FogExp2).color.setHex(0x020307);
          this.scene.background = new THREE.Color(0x020307);
        }, 16000);
      } else if (this.currentEvent === 'blackout_pulse') {
        this.flashlight.visible = false;
        horrorAudio.playMonsterRoar(0.2);
        setTimeout(() => {
          if (this.isFlashlightOn && this.battery > 0) {
            this.flashlight.visible = true;
          }
        }, 4000);
      } else if (this.currentEvent === 'whispers') {
        horrorAudio.playTwigSnap();
      }
    }
  }

  /**
   * Sudden terrifying screamer jumpscare
   */
  private triggerJumpscare() {
    horrorAudio.playJumpscare();
    this.hp = 0;
    this.callbacks.onJumpscareTrigger();
  }

  public respawnPlayer() {
    this.hp = 100;
    this.stamina = 100;
    this.sanity = 100;
    this.battery = 80;
    this.playerPos.set(0, 1.7, 0);
    this.monsterPos.set(0, 0, -60);
    this.monsterState = 'stalking';
    this.monsterStunTimer = 5;
    this.flashlight.visible = true;
    this.isFlashlightOn = true;
    this.silentLurkers.forEach((l) => {
      l.fleeTimer = 6.0;
    });
  }

  public cleanup() {
    this.isDestroyed = true;
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
    }

    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('resize', this.onResize);
    document.removeEventListener('pointerlockchange', this.onPointerLockChange);
    document.removeEventListener('mousemove', this.onMouseMove);

    this.renderer.dispose();
    if (this.container.contains(this.renderer.domElement)) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}
