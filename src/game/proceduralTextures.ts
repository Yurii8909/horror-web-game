/**
 * Procedural Realistic Textures Generator
 * Creates high-detail procedural canvas textures for trees, bark, needles, terrain, and materials.
 * Runs 100% offline, zero network requests, ultra-fast on mobile and desktop.
 */
import * as THREE from 'three';

export class ProceduralTextureFactory {
  private static barkTexture: THREE.CanvasTexture | null = null;
  private static needleTexture: THREE.CanvasTexture | null = null;
  private static groundTexture: THREE.CanvasTexture | null = null;
  private static metalTexture: THREE.CanvasTexture | null = null;
  private static circuitTexture: THREE.CanvasTexture | null = null;

  /**
   * Realistic tree bark texture with vertical fissures, ridges, and moss
   */
  public static getBarkTexture(): THREE.CanvasTexture {
    if (this.barkTexture) return this.barkTexture;

    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    // Base dark rich wood bark
    ctx.fillStyle = '#1c130c';
    ctx.fillRect(0, 0, size, size);

    // Vertical bark fissures and ridges
    for (let x = 0; x < size; x += 3) {
      const shade = 18 + Math.floor(Math.random() * 26);
      const greenTint = Math.random() < 0.15 ? 12 : 0; // Moss patches
      ctx.fillStyle = `rgb(${shade + 10}, ${shade + greenTint}, ${shade - 5})`;
      ctx.fillRect(x, 0, 2 + Math.random() * 3, size);
    }

    // Organic crack lines
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 60; i++) {
      ctx.strokeStyle = '#0c0704';
      ctx.beginPath();
      let cx = Math.random() * size;
      let cy = 0;
      ctx.moveTo(cx, cy);
      while (cy < size) {
        cx += (Math.random() - 0.5) * 6;
        cy += 10 + Math.random() * 15;
        ctx.lineTo(cx, cy);
      }
      ctx.stroke();
    }

    // Lichen and moss speckles
    for (let i = 0; i < 800; i++) {
      const lx = Math.random() * size;
      const ly = Math.random() * size;
      const radius = 1 + Math.random() * 3;
      ctx.fillStyle = Math.random() < 0.6 ? '#1b2c17' : '#2b3f1f';
      ctx.beginPath();
      ctx.arc(lx, ly, radius, 0, Math.PI * 2);
      ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1, 4);
    this.barkTexture = texture;
    return texture;
  }

  /**
   * Detailed pine needles texture with needle clusters
   */
  public static getNeedleTexture(): THREE.CanvasTexture {
    if (this.needleTexture) return this.needleTexture;

    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    // Deep forest evergreen background
    ctx.fillStyle = '#08140c';
    ctx.fillRect(0, 0, size, size);

    // Fine pine needles
    for (let i = 0; i < 4000; i++) {
      const nx = Math.random() * size;
      const ny = Math.random() * size;
      const length = 8 + Math.random() * 14;
      const angle = Math.random() * Math.PI * 2;
      const brightness = Math.floor(Math.random() * 45);

      ctx.strokeStyle = `rgb(${10 + brightness * 0.4}, ${30 + brightness}, ${16 + brightness * 0.5})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(nx, ny);
      ctx.lineTo(nx + Math.cos(angle) * length, ny + Math.sin(angle) * length);
      ctx.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(3, 3);
    this.needleTexture = texture;
    return texture;
  }

  /**
   * Forest floor ground texture with damp earth, dead pine needles, and moss
   */
  public static getGroundTexture(): THREE.CanvasTexture {
    if (this.groundTexture) return this.groundTexture;

    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    // Base damp black soil
    ctx.fillStyle = '#090d0b';
    ctx.fillRect(0, 0, size, size);

    // Mud and dark dirt patches
    for (let i = 0; i < 300; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const r = 8 + Math.random() * 25;
      const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
      grad.addColorStop(0, '#131b14');
      grad.addColorStop(1, '#090d0b');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Fallen dry pine needles littering ground
    ctx.lineWidth = 1.2;
    for (let i = 0; i < 3500; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const l = 5 + Math.random() * 10;
      const a = Math.random() * Math.PI * 2;
      const isBrown = Math.random() < 0.7;
      ctx.strokeStyle = isBrown ? '#3b2518' : '#1b2c19';
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l);
      ctx.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(24, 24);
    this.groundTexture = texture;
    return texture;
  }

  /**
   * Brushed dark metal texture for tactical flashlight and machinery
   */
  public static getMetalTexture(): THREE.CanvasTexture {
    if (this.metalTexture) return this.metalTexture;

    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#1e242b';
    ctx.fillRect(0, 0, size, size);

    // Brushed metal streaks
    ctx.lineWidth = 1;
    for (let y = 0; y < size; y += 2) {
      const val = 25 + Math.floor(Math.random() * 20);
      ctx.strokeStyle = `rgb(${val}, ${val + 5}, ${val + 10})`;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(size, y);
      ctx.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    this.metalTexture = texture;
    return texture;
  }

  /**
   * Printed circuit board texture
   */
  public static getCircuitTexture(): THREE.CanvasTexture {
    if (this.circuitTexture) return this.circuitTexture;

    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    // Dark green fiberglass
    ctx.fillStyle = '#062817';
    ctx.fillRect(0, 0, size, size);

    // Gold/copper conductive traces
    ctx.strokeStyle = '#cda136';
    ctx.lineWidth = 2;
    for (let i = 0; i < 20; i++) {
      ctx.beginPath();
      let sx = Math.floor(Math.random() * 8) * 32;
      let sy = Math.floor(Math.random() * 8) * 32;
      ctx.moveTo(sx, sy);
      for (let j = 0; j < 3; j++) {
        if (Math.random() < 0.5) {
          sx += (Math.random() < 0.5 ? 32 : -32);
        } else {
          sy += (Math.random() < 0.5 ? 32 : -32);
        }
        ctx.lineTo(sx, sy);
      }
      ctx.stroke();

      // Solder point
      ctx.fillStyle = '#e5c064';
      ctx.beginPath();
      ctx.arc(sx, sy, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    this.circuitTexture = texture;
    return texture;
  }
}
