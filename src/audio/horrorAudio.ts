/**
 * Atmospheric Horror Audio Synthesizer
 * Uses native Web Audio API for procedural sound effects, spatial audio cues,
 * adaptive heartbeat generator, and microphone voice detection.
 */

class HorrorAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private ambientGain: GainNode | null = null;
  private heartbeatGain: GainNode | null = null;
  
  // Ambient oscillators
  private droneOsc1: OscillatorNode | null = null;
  private droneOsc2: OscillatorNode | null = null;
  private droneFilter: BiquadFilterNode | null = null;

  // Heartbeat tracking
  private heartbeatInterval: number | null = null;
  private currentHeartRateBpm: number = 65;

  // Microphone detection for "voice chat alert" horror mechanic
  private micStream: MediaStream | null = null;
  private micSource: MediaStreamAudioSourceNode | null = null;
  private micAnalyser: AnalyserNode | null = null;
  private micDataArray: Uint8Array | null = null;
  public micLevel: number = 0; // 0.0 to 1.0

  private isMuted: boolean = false;
  private isInitialized: boolean = false;

  public init() {
    if (this.isInitialized && this.ctx) {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      return;
    }

    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.75, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.ambientGain = this.ctx.createGain();
      this.ambientGain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      this.ambientGain.connect(this.masterGain);

      this.heartbeatGain = this.ctx.createGain();
      this.heartbeatGain.gain.setValueAtTime(0, this.ctx.currentTime);
      this.heartbeatGain.connect(this.masterGain);

      this.startDarkAmbience();
      this.startHeartbeatLoop();
      this.isInitialized = true;
    } catch (e) {
      console.warn('Web Audio API not supported or blocked:', e);
    }
  }

  public setVolume(volume: number) {
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : Math.max(0, Math.min(1, volume)), this.ctx.currentTime);
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.75, this.ctx.currentTime);
    }
    return this.isMuted;
  }

  /**
   * Continuous deep drone creating a suffocating horror atmosphere
   */
  private startDarkAmbience() {
    if (!this.ctx || !this.ambientGain) return;

    try {
      this.droneOsc1 = this.ctx.createOscillator();
      this.droneOsc2 = this.ctx.createOscillator();
      this.droneFilter = this.ctx.createBiquadFilter();

      this.droneFilter.type = 'lowpass';
      this.droneFilter.frequency.setValueAtTime(140, this.ctx.currentTime);
      this.droneFilter.Q.setValueAtTime(3.5, this.ctx.currentTime);

      this.droneOsc1.type = 'sawtooth';
      this.droneOsc1.frequency.setValueAtTime(43.65, this.ctx.currentTime); // F1 note

      this.droneOsc2.type = 'triangle';
      this.droneOsc2.frequency.setValueAtTime(45.5, this.ctx.currentTime); // Detuned beat frequency

      this.droneOsc1.connect(this.droneFilter);
      this.droneOsc2.connect(this.droneFilter);
      this.droneFilter.connect(this.ambientGain);

      this.droneOsc1.start();
      this.droneOsc2.start();
    } catch (e) {
      console.error('Failed to start ambient drone', e);
    }
  }

  /**
   * Adaptive Heartbeat pulse - speeds up when monster is near or player sanity is low
   */
  private startHeartbeatLoop() {
    const playThump = () => {
      if (!this.ctx || !this.heartbeatGain || this.isMuted) return;

      const now = this.ctx.currentTime;
      // First thump: "LUB"
      const osc1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(80, now);
      osc1.frequency.exponentialRampToValueAtTime(35, now + 0.12);

      gain1.gain.setValueAtTime(0.7, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

      osc1.connect(gain1);
      gain1.connect(this.heartbeatGain);
      osc1.start(now);
      osc1.stop(now + 0.16);

      // Second thump: "DUB" (slightly quieter and delayed)
      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(70, now + 0.14);
      osc2.frequency.exponentialRampToValueAtTime(30, now + 0.25);

      gain2.gain.setValueAtTime(0.5, now + 0.14);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

      osc2.connect(gain2);
      gain2.connect(this.heartbeatGain);
      osc2.start(now + 0.14);
      osc2.stop(now + 0.3);
    };

    const scheduleNext = () => {
      playThump();
      const intervalMs = (60 / Math.max(50, this.currentHeartRateBpm)) * 1000;
      this.heartbeatInterval = window.setTimeout(scheduleNext, intervalMs);
    };

    scheduleNext();
  }

  /**
   * Update heart rate and intensity based on monster distance and sanity
   */
  public updateTension(monsterDist: number, sanity: number, isBeingHunted: boolean) {
    if (!this.ctx || !this.heartbeatGain || !this.ambientGain) return;

    let targetBpm = 65;
    let targetHeartGain = 0.05;
    let ambientCutoff = 160;

    if (isBeingHunted) {
      targetBpm = 175;
      targetHeartGain = 0.7;
      ambientCutoff = 350;
    } else if (monsterDist < 20) {
      const dangerRatio = 1 - monsterDist / 20; // 0 to 1
      targetBpm = 110 + dangerRatio * 55;
      targetHeartGain = 0.3 + dangerRatio * 0.4;
      ambientCutoff = 180 + dangerRatio * 150;
    } else if (sanity < 50) {
      targetBpm = 85 + (50 - sanity);
      targetHeartGain = 0.25;
    }

    this.currentHeartRateBpm = targetBpm;
    const now = this.ctx.currentTime;
    this.heartbeatGain.gain.setTargetAtTime(targetHeartGain, now, 0.2);

    if (this.droneFilter) {
      this.droneFilter.frequency.setTargetAtTime(ambientCutoff, now, 0.5);
    }
  }

  /**
   * Terrifying Jumpscare audio stinger
   */
  public playJumpscare() {
    if (!this.ctx || !this.masterGain) return;
    this.init();

    const now = this.ctx.currentTime;

    // High dissonant screech
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const noise = this.ctx.createBufferSource();
    const screamerGain = this.ctx.createGain();

    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(880, now);
    osc1.frequency.exponentialRampToValueAtTime(1600, now + 0.1);
    osc1.frequency.linearRampToValueAtTime(320, now + 0.8);

    osc2.type = 'square';
    osc2.frequency.setValueAtTime(925, now); // Trill discord
    osc2.frequency.exponentialRampToValueAtTime(1750, now + 0.15);
    osc2.frequency.linearRampToValueAtTime(280, now + 0.9);

    // Procedural noise burst for slam
    const bufferSize = this.ctx.sampleRate * 1.0;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.2));
    }
    noise.buffer = buffer;

    screamerGain.gain.setValueAtTime(0.9, now);
    screamerGain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

    osc1.connect(screamerGain);
    osc2.connect(screamerGain);
    noise.connect(screamerGain);
    screamerGain.connect(this.masterGain);

    osc1.start(now);
    osc2.start(now);
    noise.start(now);

    osc1.stop(now + 1.25);
    osc2.stop(now + 1.25);
    noise.stop(now + 1.25);
  }

  /**
   * Monster distant roar or shriek
   */
  public playMonsterRoar(distanceRatio: number = 0.5) {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(320, now);
    filter.Q.setValueAtTime(4.0, now);

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(110, now);
    osc.frequency.exponentialRampToValueAtTime(260, now + 0.4);
    osc.frequency.exponentialRampToValueAtTime(80, now + 1.2);

    const volume = Math.max(0.1, 0.7 * (1 - distanceRatio));
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.3);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 1.35);
  }

  /**
   * Crawler minion skittering hiss
   */
  public playCrawlerHiss() {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const bufferSize = this.ctx.sampleRate * 0.4;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.sin(i * 0.05);
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(2000, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    noise.start(now);
  }

  /**
   * Footstep sound
   */
  public playFootstep(isSprinting: boolean = false) {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    const pitch = 70 + Math.random() * 25;
    osc.frequency.setValueAtTime(pitch, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.08);

    const vol = isSprinting ? 0.28 : 0.14;
    gain.gain.setValueAtTime(vol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.1);
  }

  /**
   * Twig snapping in the dark woods
   */
  public playTwigSnap() {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const bufferSize = this.ctx.sampleRate * 0.12;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / 800);
    }
    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1400, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    source.start(now);
  }

  /**
   * Flashlight switch click
   */
  public playFlashlightClick(isOn: boolean) {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(isOn ? 1800 : 1200, now);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.05);
  }

  /**
   * Item pickup sound
   */
  public playItemPickup() {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.15);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.22);
  }

  /**
   * Crafting successful sound
   */
  public playCraftSuccess() {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    [523.25, 659.25, 783.99].forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);
      gain.gain.setValueAtTime(0.2, now + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.25);

      osc.connect(gain);
      gain.connect(this.masterGain!);
      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.28);
    });
  }

  /**
   * Flare burning noise
   */
  public playFlareHiss() {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const bufferSize = this.ctx.sampleRate * 2.5;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.6;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(2200, now);
    filter.Q.setValueAtTime(2.0, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 2.5);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    noise.start(now);
  }

  /**
   * Bear trap clamping shut
   */
  public playBearTrapSnap() {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(380, now);
    osc.frequency.exponentialRampToValueAtTime(60, now + 0.15);

    gain.gain.setValueAtTime(0.6, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.25);
  }

  /**
   * Safe Cabin Heavy Wooden Door creak and bolt lock
   */
  public playDoor(isClosing: boolean) {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    
    // Low creak
    const creakOsc = this.ctx.createOscillator();
    const creakGain = this.ctx.createGain();
    creakOsc.type = 'sawtooth';
    creakOsc.frequency.setValueAtTime(isClosing ? 120 : 90, now);
    creakOsc.frequency.exponentialRampToValueAtTime(isClosing ? 80 : 140, now + 0.35);

    creakGain.gain.setValueAtTime(0.35, now);
    creakGain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

    creakOsc.connect(creakGain);
    creakGain.connect(this.masterGain!);
    creakOsc.start(now);
    creakOsc.stop(now + 0.45);

    // Heavy thud & iron bolt latch
    if (isClosing) {
      setTimeout(() => {
        if (!this.ctx || this.isMuted) return;
        const thudTime = this.ctx.currentTime;
        const thudOsc = this.ctx.createOscillator();
        const thudGain = this.ctx.createGain();
        thudOsc.type = 'triangle';
        thudOsc.frequency.setValueAtTime(80, thudTime);
        thudOsc.frequency.exponentialRampToValueAtTime(25, thudTime + 0.2);

        thudGain.gain.setValueAtTime(0.6, thudTime);
        thudGain.gain.exponentialRampToValueAtTime(0.001, thudTime + 0.25);

        thudOsc.connect(thudGain);
        thudGain.connect(this.masterGain!);
        thudOsc.start(thudTime);
        thudOsc.stop(thudTime + 0.3);
      }, 250);
    }
  }

  /**
   * Monster furious claw scratching on cabin wooden wall outside
   */
  public playCabinScratch() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    
    for (let i = 0; i < 3; i++) {
      const startTime = now + i * 0.12;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(450 + Math.random() * 200, startTime);
      osc.frequency.linearRampToValueAtTime(150, startTime + 0.1);

      gain.gain.setValueAtTime(0.4, startTime);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.11);

      osc.connect(gain);
      gain.connect(this.masterGain!);
      osc.start(startTime);
      osc.stop(startTime + 0.12);
    }
  }

  /**
   * Silent Lurker scared hiss when illuminated by flashlight
   */
  public playLurkerHiss() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;

    // Filtered noise hiss
    const bufferSize = this.ctx.sampleRate * 0.25;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(3200, now);
    filter.frequency.linearRampToValueAtTime(1200, now + 0.25);
    filter.Q.value = 4;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain!);
    noise.start(now);
  }

  /**
   * Silent Lurker stealth bite attack
   */
  public playLurkerBite() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(650, now);
    osc.frequency.exponentialRampToValueAtTime(120, now + 0.2);

    gain.gain.setValueAtTime(0.7, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.22);

    osc.connect(gain);
    gain.connect(this.masterGain!);
    osc.start(now);
    osc.stop(now + 0.25);
  }

  /**
   * Ominous Dusk Warning Siren (Night is falling)
   */
  public playDuskWarning() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(260, now);
    osc.frequency.linearRampToValueAtTime(420, now + 1.2);
    osc.frequency.linearRampToValueAtTime(280, now + 2.5);

    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.45, now + 0.6);
    gain.gain.linearRampToValueAtTime(0.01, now + 2.6);

    osc.connect(gain);
    gain.connect(this.masterGain!);
    osc.start(now);
    osc.stop(now + 2.7);
  }

  /**
   * Microphone volume detection (Voice Chat Alert Horror Mechanic)
   */
  public async enableMicrophoneDetection(onVolumeUpdate?: (level: number) => void): Promise<boolean> {
    try {
      this.init();
      if (!this.ctx) return false;

      this.micStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      this.micSource = this.ctx.createMediaStreamSource(this.micStream);
      this.micAnalyser = this.ctx.createAnalyser();
      this.micAnalyser.fftSize = 256;
      this.micSource.connect(this.micAnalyser);

      const bufferLength = this.micAnalyser.frequencyBinCount;
      this.micDataArray = new Uint8Array(bufferLength);

      const checkVolume = () => {
        if (!this.micAnalyser || !this.micDataArray) return;
        this.micAnalyser.getByteFrequencyData(this.micDataArray as any);
        let sum = 0;
        for (let i = 0; i < this.micDataArray.length; i++) {
          sum += this.micDataArray[i];
        }
        const avg = sum / this.micDataArray.length;
        this.micLevel = Math.min(1.0, avg / 85); // Normalized
        if (onVolumeUpdate) onVolumeUpdate(this.micLevel);
        requestAnimationFrame(checkVolume);
      };

      checkVolume();
      return true;
    } catch (err) {
      console.warn('Microphone permission denied or not available:', err);
      return false;
    }
  }

  public disableMicrophoneDetection() {
    if (this.micStream) {
      this.micStream.getTracks().forEach(track => track.stop());
      this.micStream = null;
    }
    this.micLevel = 0;
  }

  public cleanup() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    this.disableMicrophoneDetection();
    if (this.ctx) {
      this.ctx.close();
      this.ctx = null;
    }
    this.isInitialized = false;
  }
}

export const horrorAudio = new HorrorAudioEngine();
