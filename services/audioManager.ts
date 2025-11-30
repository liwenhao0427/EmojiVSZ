import { SOUND_DATA_URIS } from '../audio/sounds';

class AudioManager {
  private static instance: AudioManager;
  private audioContext: AudioContext | null = null;
  private buffers: Map<string, AudioBuffer> = new Map();
  private musicSource: AudioBufferSourceNode | null = null;
  private soundSources: Set<AudioBufferSourceNode> = new Set();
  
  private constructor() {}

  public static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }
  
  private initContext() {
      // Allow interaction to create AudioContext
      if (this.audioContext) return;
      try {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      } catch(e) {
        console.error("Web Audio API is not supported in this browser");
      }
  }

  public async load(soundMap: { [key: string]: string }) {
    this.initContext();
    if (!this.audioContext) return;
    
    const promises: Promise<void>[] = [];
    for (const key in soundMap) {
      if (!this.buffers.has(key)) {
        const promise = fetch(soundMap[key])
          .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.arrayBuffer();
          })
          .then(arrayBuffer => this.audioContext!.decodeAudioData(arrayBuffer))
          .then(audioBuffer => {
            this.buffers.set(key, audioBuffer);
          }).catch(e => {
            console.error(`Failed to load or decode sound: ${key}`, e);
          });
        promises.push(promise);
      }
    }
    await Promise.all(promises);
  }

  public play(key: string, options: { loop?: boolean, volume?: number } = {}) {
    // Lazy init context on first play attempt
    this.initContext();
    if (!this.audioContext || !this.buffers.has(key)) return;
    
    // Browsers require user interaction to start AudioContext
    if (this.audioContext.state === 'suspended') {
        this.audioContext.resume();
    }

    const source = this.audioContext.createBufferSource();
    source.buffer = this.buffers.get(key)!;
    
    const gainNode = this.audioContext.createGain();
    gainNode.gain.setValueAtTime(options.volume ?? 1.0, this.audioContext.currentTime);

    source.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    source.loop = options.loop ?? false;
    source.start(0);

    if (options.loop) {
      if (this.musicSource) {
        try { this.musicSource.stop(); } catch(e) {}
      }
      this.musicSource = source;
    } else {
      this.soundSources.add(source);
      source.onended = () => {
        this.soundSources.delete(source);
        source.disconnect();
        gainNode.disconnect();
      };
    }
  }

  public stopMusic() {
    if (this.musicSource) {
      try {
        this.musicSource.stop();
      } catch(e) {}
      this.musicSource = null;
    }
  }

  public stopAllSounds() {
    this.soundSources.forEach(source => {
        try { source.stop(); } catch(e) {}
    });
    this.soundSources.clear();
  }
}

// Use the embedded sound data URIs
export const SOUND_MAP = SOUND_DATA_URIS;

export const audioManager = AudioManager.getInstance();