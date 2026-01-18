import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AudioService {
  private audioContext: AudioContext;
  private buffers: Map<string, AudioBuffer> = new Map();

  constructor() {
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    this.preloadSounds();
  }

  private async preloadSounds() {
    const sounds = [
      { name: 'quack', url: 'assets/sfx/quack.wav' },
      { name: 'shot', url: 'assets/sfx/gunshot.wav' },
      { name: 'hit', url: 'assets/sfx/duck-hit.wav' },
      { name: 'fall', url: 'assets/sfx/duck-falling.wav' }
    ];

    for (const sound of sounds) {
      const response = await fetch(sound.url);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      this.buffers.set(sound.name, audioBuffer);
    }
  }

  play(name: string) {
    const buffer = this.buffers.get(name);
    if (buffer) {
      const source = this.audioContext.createBufferSource();
      source.buffer = buffer;
      source.connect(this.audioContext.destination);
      source.start(0);
    }
  }
}