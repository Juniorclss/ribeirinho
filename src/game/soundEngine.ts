/**
 * FASE 11 & 21: SISTEMA DE ÁUDIO ORIGINAL 16-BITS (MÚSICAS REGIONAIS & EFEITOS SONOROS)
 * Sintetizador chiptune via Web Audio API inspirado no chip SPC700 do Super Nintendo
 * e nas melodias do Vale do Juruá.
 */

export type SoundEffectType =
  | 'hoe'
  | 'water'
  | 'plant'
  | 'harvest'
  | 'fish_cast'
  | 'fish_catch'
  | 'coin'
  | 'door'
  | 'step'
  | 'animal'
  | 'quest_complete';

class RetroSoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted = false;
  private musicInterval: number | null = null;
  private currentTheme: string | null = null;
  private stepIndex = 0;

  private ensureContext(): AudioContext | null {
    if (this.isMuted || typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted) {
      this.stopMusic();
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public playSfx(effect: SoundEffectType) {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    switch (effect) {
      case 'hoe': {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.exponentialRampToValueAtTime(65, now + 0.09);
        gain.gain.setValueAtTime(0.14, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
        break;
      }
      case 'water': {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(580, now + 0.14);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
        break;
      }
      case 'plant': {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(260, now);
        osc.frequency.setValueAtTime(390, now + 0.06);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
        osc.start(now);
        osc.stop(now + 0.14);
        break;
      }
      case 'harvest':
      case 'fish_catch': {
        osc.type = 'square';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.setValueAtTime(554.37, now + 0.07);
        osc.frequency.setValueAtTime(659.25, now + 0.14);
        gain.gain.setValueAtTime(0.09, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
        break;
      }
      case 'coin':
      case 'quest_complete': {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(587.33, now);
        osc.frequency.setValueAtTime(880, now + 0.08);
        gain.gain.setValueAtTime(0.14, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.26);
        osc.start(now);
        osc.stop(now + 0.26);
        break;
      }
      case 'animal': {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(340, now);
        osc.frequency.exponentialRampToValueAtTime(460, now + 0.12);
        gain.gain.setValueAtTime(0.07, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
        break;
      }
      default: {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(220, now);
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
        osc.start(now);
        osc.stop(now + 0.07);
        break;
      }
    }
  }

  /**
   * Emite um som de voz sintetizada ("voice blip") com timbre e altura (pitch)
   * variados conforme o personagem (grave, médio, agudo, ancião) e entonação da palavra.
   */
  public playVoiceBlip(characterId: string, wordText = '') {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const idLower = characterId.toLowerCase();
    let baseFreq = 265;
    let waveType: OscillatorType = 'triangle';

    if (idLower.includes('caua') || idLower.includes('protagonist')) {
      baseFreq = 250;
      waveType = 'triangle';
    } else if (idLower.includes('francisca') || idLower.includes('helena') || idLower.includes('maria') || idLower.includes('lara') || idLower.includes('clara') || idLower.includes('rosa') || idLower.includes('ana')) {
      baseFreq = 355;
      waveType = 'sine';
    } else if (idLower.includes('raimundo') || idLower.includes('bento') || idLower.includes('valdir')) {
      baseFreq = 195;
      waveType = 'triangle';
    } else {
      let hash = 0;
      for (let i = 0; i < idLower.length; i++) {
        hash = (hash * 31 + idLower.charCodeAt(i)) & 0xffff;
      }
      baseFreq = 215 + (hash % 135);
      waveType = hash % 2 === 0 ? 'triangle' : 'sine';
    }

    // Variação natural aleatória + entonação por pontuação da palavra
    const jitter = (Math.random() - 0.5) * 48;
    const isQuestion = wordText.includes('?');
    const isExclaim = wordText.includes('!');
    const startFreq = Math.max(120, baseFreq + jitter);
    const endFreq = isQuestion
      ? startFreq * 1.24
      : isExclaim
      ? startFreq * 1.15
      : startFreq * (0.94 + Math.random() * 0.14);

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = waveType;
    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.exponentialRampToValueAtTime(endFreq, now + 0.055);

    gain.gain.setValueAtTime(0.065, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.065);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.068);
  }

  public startMusic(theme: string) {
    if (this.isMuted) return;
    if (this.currentTheme === theme && this.musicInterval !== null) return;
    this.stopMusic();
    this.currentTheme = theme;
    this.stepIndex = 0;

    const melodies: Record<string, number[]> = {
      fazenda: [293.66, 329.63, 392.0, 440.0, 392.0, 329.63, 293.66, 246.94],
      vila: [261.63, 329.63, 392.0, 523.25, 440.0, 392.0, 329.63, 293.66],
      centro: [349.23, 440.0, 523.25, 587.33, 523.25, 440.0, 392.0, 349.23],
      floresta: [220.0, 261.63, 329.63, 293.66, 261.63, 220.0, 196.0, 220.0],
      rio: [246.94, 293.66, 369.99, 440.0, 369.99, 293.66, 246.94, 220.0],
      feira: [392.0, 493.88, 587.33, 659.25, 587.33, 493.88, 440.0, 392.0]
    };

    const notes = melodies[theme] ?? melodies.fazenda;

    this.musicInterval = window.setInterval(() => {
      if (this.isMuted) return;
      const ctx = this.ensureContext();
      if (!ctx) return;

      const freq = notes[this.stepIndex % notes.length];
      this.stepIndex++;

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(0.025, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.36);
    }, 450);
  }

  public stopMusic() {
    if (this.musicInterval !== null) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
    this.currentTheme = null;
  }
}

export const soundEngine = new RetroSoundEngine();
