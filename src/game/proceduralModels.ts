/**
 * Procedural Realistic Models
 * Replaces boxy placeholders with realistic organic and industrial shapes:
 * - Handheld tactical flashlight with ribbed barrel, bezel & glass lens
 * - Multi-tiered organic spruce trees with root flares & drooping needle boughs
 * - Anatomical demon monster with curved horns, articulated claws, exposed ribs & spine
 * - Chitinous multi-legged night crawlers
 * - High-detail 3D resources (log bundles, mechanical gears, lithium cells, fern fronds, crystals, PCB circuits)
 * - Industrial diesel generator with engine block, exhaust, gauges & radio mast
 */
import * as THREE from 'three';
import { ProceduralTextureFactory } from './proceduralTextures';
import { ResourceKey } from '../types/game';

export class ProceduralModelFactory {
  /**
   * Creates a realistic tactical handheld flashlight (first-person viewmodel)
   */
  public static createTacticalFlashlight(): THREE.Group {
    const group = new THREE.Group();
    group.name = 'FlashlightViewModel';

    const metalMat = new THREE.MeshStandardMaterial({
      color: 0x181c22,
      roughness: 0.35,
      metalness: 0.85,
      map: ProceduralTextureFactory.getMetalTexture(),
    });

    const rubberMat = new THREE.MeshStandardMaterial({
      color: 0x0d0f12,
      roughness: 0.8,
      metalness: 0.1,
    });

    const lensMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transmission: 0.85,
      opacity: 0.9,
      transparent: true,
      roughness: 0.05,
      ior: 1.5,
    });

    const emitterMat = new THREE.MeshBasicMaterial({
      color: 0xfffbe6,
    });

    // 1. Main knurled barrel body
    const barrel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.042, 0.042, 0.38, 16),
      metalMat
    );
    barrel.rotation.x = Math.PI / 2;
    group.add(barrel);

    // 2. Rubber knurled grip rings
    for (let i = -0.09; i <= 0.06; i += 0.035) {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(0.0435, 0.005, 8, 20),
        rubberMat
      );
      ring.position.z = i;
      group.add(ring);
    }

    // 3. Flared tactical head assembly
    const headCone = new THREE.Mesh(
      new THREE.CylinderGeometry(0.065, 0.043, 0.1, 16),
      metalMat
    );
    headCone.rotation.x = Math.PI / 2;
    headCone.position.z = -0.23;
    group.add(headCone);

    // 4. Scalloped bezel ring
    const bezel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.066, 0.065, 0.04, 16),
      metalMat
    );
    bezel.rotation.x = Math.PI / 2;
    bezel.position.z = -0.29;
    group.add(bezel);

    // 5. Optical glass lens
    const lens = new THREE.Mesh(
      new THREE.CylinderGeometry(0.058, 0.058, 0.005, 16),
      lensMat
    );
    lens.rotation.x = Math.PI / 2;
    lens.position.z = -0.302;
    group.add(lens);

    // 6. Internal LED emitter chip
    const ledChip = new THREE.Mesh(
      new THREE.CylinderGeometry(0.015, 0.015, 0.008, 12),
      emitterMat
    );
    ledChip.rotation.x = Math.PI / 2;
    ledChip.position.z = -0.295;
    ledChip.name = 'flashlightLed';
    group.add(ledChip);

    // 7. Tactical tail-cap switch
    const tailcap = new THREE.Mesh(
      new THREE.CylinderGeometry(0.045, 0.044, 0.05, 16),
      metalMat
    );
    tailcap.rotation.x = Math.PI / 2;
    tailcap.position.z = 0.21;
    group.add(tailcap);

    const button = new THREE.Mesh(
      new THREE.CylinderGeometry(0.018, 0.018, 0.012, 12),
      rubberMat
    );
    button.rotation.x = Math.PI / 2;
    button.position.z = 0.238;
    group.add(button);

    // Scale to realistic first-person weapon/tool size
    group.scale.set(1.4, 1.4, 1.4);
    return group;
  }

  /**
   * Builds realistic organic multi-tiered pine tree geometry
   */
  public static createRealisticTreeGeometries() {
    // 1. Gnarled organic trunk with root flaring
    const trunkGeo = new THREE.CylinderGeometry(0.42, 0.95, 14, 10);
    // Displace vertices slightly for organic bark feel
    const pos = trunkGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i);
      // Flaring at the base (roots)
      if (y < -4.5) {
        const factor = 1 + ((-4.5 - y) / 2.5) * 0.45;
        pos.setX(i, pos.getX(i) * factor);
        pos.setZ(i, pos.getZ(i) * factor);
      }
    }
    trunkGeo.computeVertexNormals();

    // 2. Realistic 4-tiered pine foliage canopy (compound cones with drooping skirts)
    // Tier 1 (bottom wide)
    const t1 = new THREE.ConeGeometry(5.2, 5.5, 10);
    t1.translate(0, 5.0, 0);

    // Tier 2
    const t2 = new THREE.ConeGeometry(4.3, 5.0, 10);
    t2.translate(0, 8.0, 0);

    // Tier 3
    const t3 = new THREE.ConeGeometry(3.2, 4.5, 10);
    t3.translate(0, 10.8, 0);

    // Tier 4 (top tip)
    const t4 = new THREE.ConeGeometry(2.0, 4.0, 10);
    t4.translate(0, 13.2, 0);

    // Merge tiers into single instanced foliage geometry for maximum mobile performance!
    return {
      trunkGeo,
      foliageGeoList: [t1, t2, t3, t4],
    };
  }

  /**
   * Anatomically terrifying demon monster model (Shadow Nemesis)
   * High-detail organic silhouette with horns, ribcage, vertebrae & claw talons
   */
  public static createRealisticMonster(): THREE.Group {
    const group = new THREE.Group();
    group.name = 'DemonMonster';

    const skinMat = new THREE.MeshStandardMaterial({
      color: 0x07080a,
      roughness: 0.9,
      metalness: 0.15,
    });

    const boneMat = new THREE.MeshStandardMaterial({
      color: 0x1f1a16,
      roughness: 0.85,
    });

    const eyeMat = new THREE.MeshBasicMaterial({
      color: 0xff002b,
    });

    // 1. Emaciated curved spine with vertebrae bumps
    const spineCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 1.8, 0.15),
      new THREE.Vector3(0, 2.7, -0.1),
      new THREE.Vector3(0, 3.8, 0.18),
      new THREE.Vector3(0, 4.6, 0.4),
    ]);
    const spineGeo = new THREE.TubeGeometry(spineCurve, 12, 0.18, 8, false);
    const spine = new THREE.Mesh(spineGeo, skinMat);
    group.add(spine);

    // Exposed vertebrae knobs
    for (let i = 0; i <= 8; i++) {
      const knob = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.12, 0.18), boneMat);
      knob.position.set(0, 2.0 + i * 0.32, -0.08 + (i % 2 === 0 ? 0.05 : 0));
      group.add(knob);
    }

    // 2. Ribcage structure
    for (let r = 0; r < 5; r++) {
      const ribL = new THREE.Mesh(new THREE.TorusGeometry(0.55 - r * 0.05, 0.06, 6, 12, Math.PI * 0.8), boneMat);
      ribL.position.set(0, 2.4 + r * 0.35, 0.1);
      ribL.rotation.y = Math.PI / 2;
      group.add(ribL);
    }

    // 3. Demonic skull head
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 4.7, 0.45);

    // Cranium
    const skull = new THREE.Mesh(new THREE.SphereGeometry(0.48, 10, 10), skinMat);
    skull.scale.set(0.9, 1.15, 1.2);
    headGroup.add(skull);

    // Curved ram/demon horns
    for (const side of [-1, 1]) {
      const hornCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(side * 0.35, 0.2, 0),
        new THREE.Vector3(side * 0.75, 0.65, -0.2),
        new THREE.Vector3(side * 0.95, 0.95, -0.55),
        new THREE.Vector3(side * 0.7, 1.1, -0.85),
      ]);
      const hornGeo = new THREE.TubeGeometry(hornCurve, 10, 0.1, 6, false);
      const horn = new THREE.Mesh(hornGeo, boneMat);
      headGroup.add(horn);
    }

    // Burning glowing eyes
    const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), eyeMat);
    eyeL.name = 'monsterEyeL';
    eyeL.position.set(-0.22, 0.05, 0.48);
    headGroup.add(eyeL);

    const eyeR = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), eyeMat);
    eyeR.name = 'monsterEyeR';
    eyeR.position.set(0.22, 0.05, 0.48);
    headGroup.add(eyeR);

    // Gaping jaw with fangs
    const jaw = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.22, 0.4, 8), skinMat);
    jaw.position.set(0, -0.32, 0.35);
    jaw.rotation.x = 0.4;
    headGroup.add(jaw);

    // Sharp needle fangs
    for (let f = -3; f <= 3; f++) {
      if (f === 0) continue;
      const fang = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.14, 5), boneMat);
      fang.position.set(f * 0.07, -0.25, 0.48);
      fang.rotation.x = Math.PI;
      headGroup.add(fang);
    }

    group.add(headGroup);

    // 4. Elongated articulated arms with long razor claws
    for (const side of [-1, 1]) {
      const armGroup = new THREE.Group();
      armGroup.position.set(side * 0.85, 3.8, 0.1);

      // Upper arm
      const upperArm = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.1, 1.6, 8), skinMat);
      upperArm.position.y = -0.7;
      upperArm.rotation.z = side * -0.15;
      armGroup.add(upperArm);

      // Forearm
      const forearm = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.08, 1.8, 8), skinMat);
      forearm.position.set(side * 0.15, -2.1, 0.1);
      forearm.rotation.z = side * 0.1;
      armGroup.add(forearm);

      // 3 Talon claws
      for (let c = -1; c <= 1; c++) {
        const claw = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.55, 6), boneMat);
        claw.position.set(side * (0.15 + c * 0.08), -3.2, 0.1 + c * 0.04);
        claw.rotation.x = 0.3;
        claw.rotation.z = side * -0.2;
        armGroup.add(claw);
      }

      group.add(armGroup);
    }

    // 5. Elongated legs
    for (const side of [-1, 1]) {
      const legGroup = new THREE.Group();
      legGroup.position.set(side * 0.45, 1.8, 0);

      // Thigh
      const thigh = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.14, 1.5, 8), skinMat);
      thigh.position.y = -0.75;
      legGroup.add(thigh);

      // Shin (backwards digitigrade bend)
      const shin = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.1, 1.6, 8), skinMat);
      shin.position.set(0, -2.0, -0.1);
      shin.rotation.x = -0.25;
      legGroup.add(shin);

      // Clawed foot
      const foot = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.12, 0.55), skinMat);
      foot.position.set(0, -2.7, 0.1);
      legGroup.add(foot);

      group.add(legGroup);
    }

    // 6. Demonic crimson volumetric aura light
    const auraLight = new THREE.PointLight(0xff002b, 2.5, 16);
    auraLight.position.set(0, 3.8, 0.5);
    group.add(auraLight);

    return group;
  }

  /**
   * Chitinous insectoid Night Crawler minion with articulated legs
   */
  public static createRealisticCrawler(): THREE.Group {
    const group = new THREE.Group();
    group.name = 'NightCrawler';

    const shellMat = new THREE.MeshStandardMaterial({
      color: 0x0a110d,
      roughness: 0.5,
      metalness: 0.3,
    });

    const eyeMat = new THREE.MeshBasicMaterial({
      color: 0x84cc16, // Toxic lime eyes
    });

    // Segmented curved thorax & abdomen
    const thorax = new THREE.Mesh(new THREE.SphereGeometry(0.45, 8, 8), shellMat);
    thorax.scale.set(1.1, 0.7, 1.6);
    thorax.position.y = 0.45;
    group.add(thorax);

    const abdomen = new THREE.Mesh(new THREE.ConeGeometry(0.38, 1.2, 8), shellMat);
    abdomen.rotation.x = -Math.PI / 2;
    abdomen.position.set(0, 0.42, -1.0);
    group.add(abdomen);

    // Head with compound eyes
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 8), shellMat);
    head.scale.set(1.1, 0.8, 1.0);
    head.position.set(0, 0.45, 0.95);
    group.add(head);

    // Glowing eyes cluster (4 eyes)
    for (const [ex, ey] of [[-0.12, 0.52], [0.12, 0.52], [-0.2, 0.45], [0.2, 0.45]]) {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 6), eyeMat);
      eye.position.set(ex, ey, 1.18);
      group.add(eye);
    }

    // Mandibles
    for (const s of [-1, 1]) {
      const mand = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.25, 5), shellMat);
      mand.position.set(s * 0.15, 0.38, 1.25);
      mand.rotation.x = Math.PI / 2.5;
      mand.rotation.y = s * 0.4;
      group.add(mand);
    }

    // 6 Spindly jointed legs
    for (let side = -1; side <= 1; side += 2) {
      for (let i = 0; i < 3; i++) {
        const zOffset = 0.35 - i * 0.45;
        const upperLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.035, 0.6, 6), shellMat);
        upperLeg.position.set(side * 0.55, 0.55, zOffset);
        upperLeg.rotation.z = side * -0.7;
        group.add(upperLeg);

        const lowerLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.02, 0.75, 6), shellMat);
        lowerLeg.position.set(side * 0.95, 0.25, zOffset);
        lowerLeg.rotation.z = side * 0.5;
        group.add(lowerLeg);
      }
    }

    // Glow light
    const eyeLight = new THREE.PointLight(0x84cc16, 1.2, 9);
    eyeLight.position.set(0, 0.5, 1.2);
    group.add(eyeLight);

    return group;
  }

  /**
   * Realistic 3D Resource Models (Log bundles, Gears, Lithium battery, Herbs, Crystals, PCB)
   */
  public static createResourceModel(type: ResourceKey): THREE.Group {
    const group = new THREE.Group();
    group.name = `Resource_${type}`;

    if (type === 'wood') {
      // Stack of 3 cut logs with bark texture and cut ends
      const barkMat = new THREE.MeshStandardMaterial({
        roughness: 0.9,
        map: ProceduralTextureFactory.getBarkTexture(),
      });
      const endMat = new THREE.MeshStandardMaterial({
        color: 0xcca072,
        roughness: 0.8,
      });

      const logGeo = new THREE.CylinderGeometry(0.18, 0.18, 1.4, 10);
      const positions = [
        [-0.22, 0.18, 0],
        [0.22, 0.18, 0],
        [0, 0.48, 0],
      ];
      positions.forEach(([x, y, z]) => {
        const log = new THREE.Mesh(logGeo, [barkMat, endMat, endMat]);
        log.rotation.z = Math.PI / 2;
        log.position.set(x, y, z);
        group.add(log);
      });
    } else if (type === 'scrap') {
      // Industrial mechanical gear with teeth and hollow center + curved steel pipe
      const ironMat = new THREE.MeshStandardMaterial({
        color: 0x475569,
        metalness: 0.85,
        roughness: 0.45,
        map: ProceduralTextureFactory.getMetalTexture(),
      });

      // Gear wheel
      const gearRing = new THREE.Mesh(new THREE.TorusGeometry(0.35, 0.1, 8, 20), ironMat);
      gearRing.rotation.x = Math.PI / 2;
      gearRing.position.y = 0.15;
      group.add(gearRing);

      // Gear teeth
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        const tooth = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.15, 0.14), ironMat);
        tooth.position.set(Math.cos(angle) * 0.46, 0.15, Math.sin(angle) * 0.46);
        tooth.rotation.y = -angle;
        group.add(tooth);
      }

      // Curved steel pipe
      const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.9, 10), ironMat);
      pipe.rotation.set(0.4, 0.5, 0.8);
      pipe.position.set(0.1, 0.25, 0);
      group.add(pipe);
    } else if (type === 'battery') {
      // Tactical heavy-duty lithium cell with brass contacts & hazard stripes
      const bodyMat = new THREE.MeshStandardMaterial({
        color: 0xca8a04,
        metalness: 0.8,
        roughness: 0.3,
      });
      const terminalMat = new THREE.MeshStandardMaterial({
        color: 0xd4d4d8,
        metalness: 0.95,
        roughness: 0.2,
      });

      // Battery cylinder
      const cell = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.65, 16), bodyMat);
      cell.position.y = 0.35;
      group.add(cell);

      // Positive button terminal
      const posTerm = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.08, 12), terminalMat);
      posTerm.position.y = 0.7;
      group.add(posTerm);

      // Base negative cap
      const negTerm = new THREE.Mesh(new THREE.CylinderGeometry(0.175, 0.175, 0.05, 16), terminalMat);
      negTerm.position.y = 0.04;
      group.add(negTerm);
    } else if (type === 'herbs') {
      // Forest fern / nightshade plant with curved fronds and glowing spores
      const leafMat = new THREE.MeshStandardMaterial({
        color: 0x166534,
        roughness: 0.6,
        side: THREE.DoubleSide,
      });
      const sporeMat = new THREE.MeshBasicMaterial({
        color: 0x4ade80,
      });

      // 5 Curved leafy fronds
      for (let i = 0; i < 5; i++) {
        const angle = (i / 5) * Math.PI * 2;
        const frond = new THREE.Mesh(new THREE.PlaneGeometry(0.35, 0.85, 3, 3), leafMat);
        frond.rotation.set(0.5, angle, 0);
        frond.position.set(Math.cos(angle) * 0.2, 0.35, Math.sin(angle) * 0.2);
        group.add(frond);

        // Spores
        const spore = new THREE.Mesh(new THREE.SphereGeometry(0.045, 6, 6), sporeMat);
        spore.position.set(Math.cos(angle) * 0.25, 0.45, Math.sin(angle) * 0.25);
        group.add(spore);
      }
    } else if (type === 'sulfur') {
      // Natural jagged sulfur crystal shard cluster with glowing core
      const crystalMat = new THREE.MeshStandardMaterial({
        color: 0xf59e0b,
        emissive: 0xd97706,
        emissiveIntensity: 0.65,
        roughness: 0.2,
        metalness: 0.1,
      });

      const clusterOffsets = [
        [0, 0, 0.9, 0],
        [-0.15, 0.12, 0.7, 0.25],
        [0.18, -0.1, 0.65, -0.3],
        [-0.12, -0.15, 0.5, 0.4],
        [0.14, 0.15, 0.8, -0.2],
      ];

      clusterOffsets.forEach(([x, z, h, lean]) => {
        const shard = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.12, h, 6), crystalMat);
        shard.position.set(x, h / 2, z);
        shard.rotation.set(lean, lean * 1.5, 0);
        group.add(shard);
      });
    } else if (type === 'circuit') {
      // Detailed printed circuit board with soldered microchips
      const boardMat = new THREE.MeshStandardMaterial({
        roughness: 0.4,
        map: ProceduralTextureFactory.getCircuitTexture(),
      });
      const chipMat = new THREE.MeshStandardMaterial({
        color: 0x111827,
        metalness: 0.7,
        roughness: 0.3,
      });
      const capacitorMat = new THREE.MeshStandardMaterial({
        color: 0x2563eb,
        metalness: 0.6,
        roughness: 0.3,
      });

      // PCB plate
      const board = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.04, 0.55), boardMat);
      board.position.y = 0.05;
      group.add(board);

      // CPU Microchip
      const cpu = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.06, 0.24), chipMat);
      cpu.position.set(-0.12, 0.1, 0);
      group.add(cpu);

      // Small capacitors
      for (let c = 0; c < 3; c++) {
        const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.12, 8), capacitorMat);
        cap.position.set(0.18, 0.12, -0.15 + c * 0.14);
        group.add(cap);
      }
    }

    // Add ambient item beacon glow
    const glowColors: { [key in ResourceKey]: number } = {
      wood: 0x92400e,
      scrap: 0x94a3b8,
      battery: 0xfacc15,
      herbs: 0x22c55e,
      sulfur: 0xf97316,
      circuit: 0x06b6d4,
    };
    const itemLight = new THREE.PointLight(glowColors[type], 1.2, 5.5);
    itemLight.position.y = 0.6;
    group.add(itemLight);

    return group;
  }

  /**
   * Realistic Industrial Diesel Generator with lattice radio mast
   */
  public static createRealisticGenerator(index: number): THREE.Group {
    const genGroup = new THREE.Group();
    genGroup.name = `Generator_${index}`;

    const metalChassisMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      metalness: 0.75,
      roughness: 0.4,
      map: ProceduralTextureFactory.getMetalTexture(),
    });

    const engineBlockMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.9,
      roughness: 0.3,
    });

    const pipeMat = new THREE.MeshStandardMaterial({
      color: 0x64748b,
      metalness: 0.85,
      roughness: 0.3,
    });

    const copperMat = new THREE.MeshStandardMaterial({
      color: 0xb45309,
      metalness: 0.95,
      roughness: 0.25,
    });

    // 1. Heavy industrial steel skid frame
    const skid = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.4, 3.2), metalChassisMat);
    skid.position.y = 0.2;
    genGroup.add(skid);

    // 2. Generator casing body with chamfered edges
    const body = new THREE.Mesh(new THREE.BoxGeometry(3.6, 2.4, 2.6), metalChassisMat);
    body.position.y = 1.6;
    genGroup.add(body);

    // 3. Cylindrical turbine / alternator housing
    const alternator = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.85, 2.2, 14), engineBlockMat);
    alternator.rotation.z = Math.PI / 2;
    alternator.position.set(0, 1.7, 1.1);
    genGroup.add(alternator);

    // 4. Exhaust pipe & muffler stack
    const muffler = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 1.2, 10), pipeMat);
    muffler.position.set(-1.2, 3.4, -0.7);
    genGroup.add(muffler);

    const exhaustTip = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.16, 0.5, 10), pipeMat);
    exhaustTip.position.set(-1.2, 4.2, -0.7);
    exhaustTip.rotation.x = 0.4;
    genGroup.add(exhaustTip);

    // 5. Analog round dials / pressure gauges
    for (let g = -1; g <= 1; g += 2) {
      const gauge = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.08, 14), copperMat);
      gauge.rotation.x = Math.PI / 2;
      gauge.position.set(g * 0.6, 2.1, 1.34);
      genGroup.add(gauge);
    }

    // 6. Radio lattice transmission tower (mast)
    const towerPoles = [
      [-0.4, -0.4],
      [0.4, -0.4],
      [-0.4, 0.4],
      [0.4, 0.4],
    ];
    towerPoles.forEach(([tx, tz]) => {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 7.5, 6), pipeMat);
      leg.position.set(tx, 6.5, tz);
      genGroup.add(leg);
    });

    // Horizontal crossbars
    for (let y = 3.5; y <= 9.5; y += 1.5) {
      const bar = new THREE.Mesh(new THREE.TorusGeometry(0.45, 0.04, 6, 4), pipeMat);
      bar.rotation.x = Math.PI / 2;
      bar.position.set(0, y, 0);
      genGroup.add(bar);
    }

    // 7. Beacon lamp (Red when broken, Bright cyan when repaired)
    const beaconGeo = new THREE.SphereGeometry(0.45, 10, 10);
    const beaconMat = new THREE.MeshBasicMaterial({ color: 0xff2222 });
    const beaconMesh = new THREE.Mesh(beaconGeo, beaconMat);
    beaconMesh.name = 'beaconMesh';
    beaconMesh.position.set(0, 10.5, 0);
    genGroup.add(beaconMesh);

    const beaconLight = new THREE.PointLight(0xff2222, 2.5, 20);
    beaconLight.name = 'beaconLight';
    beaconLight.position.set(0, 10.5, 0);
    genGroup.add(beaconLight);

    return genGroup;
  }

  /**
   * Creates a dedicated Fortified Safe Cabin (Убежище) with an interactive swinging door,
   * safe interior lantern, and exterior beacon lantern to guide lost survivors.
   */
  public static createSafeCabin(): {
    group: THREE.Group;
    doorHinge: THREE.Group;
    interiorLight: THREE.PointLight;
    exteriorLantern: THREE.PointLight;
  } {
    const group = new THREE.Group();
    group.name = 'SafeCabin';

    const barkMat = new THREE.MeshStandardMaterial({
      roughness: 0.9,
      map: ProceduralTextureFactory.getBarkTexture(),
    });
    const woodPlankMat = new THREE.MeshStandardMaterial({
      color: 0x3d271d,
      roughness: 0.85,
    });
    const ironMat = new THREE.MeshStandardMaterial({
      color: 0x27272a,
      roughness: 0.4,
      metalness: 0.8,
    });
    const roofMat = new THREE.MeshStandardMaterial({
      color: 0x181e18,
      roughness: 0.9,
    });

    const cabinWidth = 11;
    const cabinDepth = 13;
    const logRadius = 0.32;
    const wallHeightLogs = 8;

    // 1. Wooden floor deck
    const floorGeo = new THREE.BoxGeometry(cabinWidth - 0.5, 0.3, cabinDepth - 0.5);
    const floor = new THREE.Mesh(floorGeo, woodPlankMat);
    floor.position.set(0, 0.15, 0);
    floor.receiveShadow = true;
    group.add(floor);

    // 2. Interlocking log walls
    for (let h = 0; h < wallHeightLogs; h++) {
      const y = 0.4 + h * (logRadius * 2);

      // Back wall (Z = -cabinDepth/2)
      const backLog = new THREE.Mesh(
        new THREE.CylinderGeometry(logRadius, logRadius, cabinWidth, 8),
        barkMat
      );
      backLog.rotation.z = Math.PI / 2;
      backLog.position.set(0, y, -cabinDepth / 2);
      group.add(backLog);

      // Front wall (with doorway opening in the middle)
      if (h >= 5) {
        // Top lintel above doorway
        const frontLintel = new THREE.Mesh(
          new THREE.CylinderGeometry(logRadius, logRadius, cabinWidth, 8),
          barkMat
        );
        frontLintel.rotation.z = Math.PI / 2;
        frontLintel.position.set(0, y, cabinDepth / 2);
        group.add(frontLintel);
      } else {
        // Left of door
        const logL = new THREE.Mesh(
          new THREE.CylinderGeometry(logRadius, logRadius, 3.8, 8),
          barkMat
        );
        logL.rotation.z = Math.PI / 2;
        logL.position.set(-3.5, y, cabinDepth / 2);
        group.add(logL);

        // Right of door
        const logR = new THREE.Mesh(
          new THREE.CylinderGeometry(logRadius, logRadius, 3.8, 8),
          barkMat
        );
        logR.rotation.z = Math.PI / 2;
        logR.position.set(3.5, y, cabinDepth / 2);
        group.add(logR);
      }

      // Left wall (X = -cabinWidth/2)
      const leftLog = new THREE.Mesh(
        new THREE.CylinderGeometry(logRadius, logRadius, cabinDepth, 8),
        barkMat
      );
      leftLog.rotation.x = Math.PI / 2;
      leftLog.position.set(-cabinWidth / 2, y, 0);
      group.add(leftLog);

      // Right wall (X = cabinWidth/2)
      const rightLog = new THREE.Mesh(
        new THREE.CylinderGeometry(logRadius, logRadius, cabinDepth, 8),
        barkMat
      );
      rightLog.rotation.x = Math.PI / 2;
      rightLog.position.set(cabinWidth / 2, y, 0);
      group.add(rightLog);
    }

    // 3. Interactive Heavy Wooden Door with Hinge Pivot
    const doorHinge = new THREE.Group();
    doorHinge.name = 'DoorHinge';
    // Pivot at left edge of doorway
    doorHinge.position.set(-1.6, 0.3, cabinDepth / 2);

    const doorWidth = 3.15;
    const doorHeight = 3.0;
    const doorThickness = 0.18;

    const doorMesh = new THREE.Mesh(
      new THREE.BoxGeometry(doorWidth, doorHeight, doorThickness),
      woodPlankMat
    );
    // Center mesh relative to hinge pivot
    doorMesh.position.set(doorWidth / 2, doorHeight / 2, 0);
    doorMesh.castShadow = true;
    doorHinge.add(doorMesh);

    // Iron cross braces on door
    const brace1 = new THREE.Mesh(new THREE.BoxGeometry(doorWidth - 0.2, 0.12, 0.22), ironMat);
    brace1.position.set(doorWidth / 2, 0.7, 0);
    doorHinge.add(brace1);

    const brace2 = new THREE.Mesh(new THREE.BoxGeometry(doorWidth - 0.2, 0.12, 0.22), ironMat);
    brace2.position.set(doorWidth / 2, 2.3, 0);
    doorHinge.add(brace2);

    // Heavy iron bolt handle
    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.45, 8), ironMat);
    handle.position.set(doorWidth - 0.35, 1.5, 0.15);
    doorHinge.add(handle);

    group.add(doorHinge);

    // 4. Sturdy Gabled Overhanging Roof
    const roof = new THREE.Mesh(
      new THREE.ConeGeometry(cabinWidth * 0.78, 3.8, 4),
      roofMat
    );
    roof.rotation.y = Math.PI / 4;
    roof.position.set(0, 6.6, 0);
    roof.castShadow = true;
    group.add(roof);

    // 5. Warm interior lantern (Safe Zone sanctuary light)
    const interiorLanternGeo = new THREE.CylinderGeometry(0.18, 0.22, 0.45, 8);
    const lanternGlassMat = new THREE.MeshBasicMaterial({ color: 0xffe6a3 });
    const interiorLanternMesh = new THREE.Mesh(interiorLanternGeo, lanternGlassMat);
    interiorLanternMesh.position.set(0, 3.6, 0);
    group.add(interiorLanternMesh);

    const interiorLight = new THREE.PointLight(0xf59e0b, 2.0, 16);
    interiorLight.position.set(0, 3.5, 0);
    interiorLight.castShadow = false; // keep mobile fast
    group.add(interiorLight);

    // Safe Zone Green Rune / Sign inside
    const signGeo = new THREE.PlaneGeometry(2.4, 0.6);
    const signMat = new THREE.MeshBasicMaterial({ color: 0x10b981 });
    const signMesh = new THREE.Mesh(signGeo, signMat);
    signMesh.position.set(0, 3.2, -cabinDepth / 2 + 0.5);
    group.add(signMesh);

    // 6. Porch Exterior Lantern above the door (guides player home in darkness)
    const porchLanternMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.2, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0xfde047 })
    );
    porchLanternMesh.position.set(0, 4.2, cabinDepth / 2 + 0.4);
    group.add(porchLanternMesh);

    const exteriorLantern = new THREE.PointLight(0xfde047, 1.8, 20);
    exteriorLantern.position.set(0, 4.0, cabinDepth / 2 + 0.6);
    exteriorLantern.castShadow = false;
    group.add(exteriorLantern);

    return {
      group,
      doorHinge,
      interiorLight,
      exteriorLantern,
    };
  }

  /**
   * Creates the Silent Lurker (Тихая тень / Светящиеся глаза):
   * Tiny, low-profile stealth entity that creeps completely silent in the pitch dark.
   * In the dark, ONLY its piercing glowing eyes are visible from afar!
   */
  public static createSilentLurker(): THREE.Group {
    const group = new THREE.Group();
    group.name = 'SilentLurker';

    const stealthMat = new THREE.MeshStandardMaterial({
      color: 0x050507,
      roughness: 0.95,
      metalness: 0.05,
    });

    // 1. Low creeping body (almost hugs the moss ground)
    const bodyGeo = new THREE.SphereGeometry(0.32, 8, 6);
    bodyGeo.scale(1.0, 0.45, 1.5);
    const body = new THREE.Mesh(bodyGeo, stealthMat);
    body.position.y = 0.22;
    body.castShadow = false; // Mobile performance!
    group.add(body);

    // 2. Small stealth head
    const headGeo = new THREE.SphereGeometry(0.2, 8, 6);
    headGeo.scale(0.9, 0.7, 1.0);
    const head = new THREE.Mesh(headGeo, stealthMat);
    head.position.set(0, 0.26, 0.45);
    group.add(head);

    // 3. Piercing glowing eyes (The ONLY tell in pitch black darkness!)
    const eyeGeo = new THREE.SphereGeometry(0.055, 8, 8);
    // Eerie glowing cyan-white eyes
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x67e8f9 });

    const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
    eyeL.position.set(-0.11, 0.28, 0.6);
    group.add(eyeL);

    const eyeR = new THREE.Mesh(eyeGeo, eyeMat);
    eyeR.position.set(0.11, 0.28, 0.6);
    group.add(eyeR);

    // Eye glow visible from afar
    const eyeLight = new THREE.PointLight(0x38bdf8, 1.5, 9);
    eyeLight.position.set(0, 0.3, 0.65);
    eyeLight.name = 'eyeGlow';
    group.add(eyeLight);

    // 4. Subtle spidery stealth legs
    for (const side of [-1, 1]) {
      for (let legIdx = 0; legIdx < 3; legIdx++) {
        const leg = new THREE.Mesh(
          new THREE.CylinderGeometry(0.02, 0.02, 0.35, 4),
          stealthMat
        );
        leg.rotation.z = (side * Math.PI) / 3.5;
        leg.position.set(side * 0.25, 0.14, -0.2 + legIdx * 0.25);
        group.add(leg);
      }
    }

    return group;
  }
}

