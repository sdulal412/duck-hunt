import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })

export class AudioService {

  private buffers = new Map<string, AudioBuffer>();
  private audioContext: AudioContext = new AudioContext();

  private readonly SOUND_ASSETS = [
    { name: 'shot', url: 'assets/sfx/gunshot.wav' },
    { name: 'hit', url: 'assets/sfx/duck-hit.wav' },
    { name: 'fall', url: 'assets/sfx/duck-falling.wav' }
  ];

  constructor() {
    this.preloadSounds();
  }

  private async preloadSounds(): Promise<void> {
    const loadTasks = this.SOUND_ASSETS.map(async (sound) => {
      try {
        const response = await fetch(sound.url);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
        this.buffers.set(sound.name, audioBuffer);
      } catch {}
    });
    await Promise.all(loadTasks);
  }

  public async resume(): Promise<void> {
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
  }

  public play(name: string, volume: number = 0.1): void {
    const buffer = this.buffers.get(name);
    if (!buffer) return;

    const gainNode = this.audioContext.createGain();
    gainNode.gain.value = volume;

    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;

    source.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    source.start(0);
  }
}