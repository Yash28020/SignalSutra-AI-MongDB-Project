/**
 * SignalSutra AI — Celestial Audio Synthesizer
 * Uses Web Audio API for zero-dependency, procedural cosmic soundscapes.
 * Ambient space drone, dimensional portal chimes, and interaction harmonics.
 */

class CelestialAudioEngine {
  constructor() {
    this.ctx = null
    this.isMuted = true // Muted by default for polite UX
    this.droneGain = null
    this.droneOsc1 = null
    this.droneOsc2 = null
    this.filter = null
  }

  init() {
    if (this.ctx) return
    const AudioContext = window.AudioContext || window.webkitAudioContext
    if (!AudioContext) return
    this.ctx = new AudioContext()

    // Master filter for cosmic warmth
    this.filter = this.ctx.createBiquadFilter()
    this.filter.type = 'lowpass'
    this.filter.frequency.setValueAtTime(450, this.ctx.currentTime)
    this.filter.connect(this.ctx.destination)

    // Master drone gain
    this.droneGain = this.ctx.createGain()
    this.droneGain.gain.setValueAtTime(this.isMuted ? 0 : 0.08, this.ctx.currentTime)
    this.droneGain.connect(this.filter)

    // Cosmic drone oscillators (Deep root drone + subtle 5th harmonic)
    this.droneOsc1 = this.ctx.createOscillator()
    this.droneOsc1.type = 'sine'
    this.droneOsc1.frequency.setValueAtTime(55, this.ctx.currentTime) // A1
    this.droneOsc1.connect(this.droneGain)
    this.droneOsc1.start()

    this.droneOsc2 = this.ctx.createOscillator()
    this.droneOsc2.type = 'triangle'
    this.droneOsc2.frequency.setValueAtTime(82.4, this.ctx.currentTime) // E2
    this.droneOsc2.connect(this.droneGain)
    this.droneOsc2.start()
  }

  toggleMute() {
    this.init()
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume()
    }
    this.isMuted = !this.isMuted
    if (this.droneGain && this.ctx) {
      this.droneGain.gain.setTargetAtTime(this.isMuted ? 0 : 0.07, this.ctx.currentTime, 0.5)
    }
    return !this.isMuted
  }

  playPortalChime(pitchMultiplier = 1.0) {
    if (this.isMuted || !this.ctx) return
    try {
      const now = this.ctx.currentTime
      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()

      osc.type = 'sine'
      // Pentatonic celestial chime notes
      const baseFreq = 440 * pitchMultiplier
      osc.frequency.setValueAtTime(baseFreq, now)
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, now + 0.6)

      gain.gain.setValueAtTime(0.12, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2)

      osc.connect(gain)
      gain.connect(this.filter || this.ctx.destination)

      osc.start(now)
      osc.stop(now + 1.2)
    } catch (e) {
      // Audio autoplay policy catch
    }
  }

  playNodeBeep(severity = 'low') {
    if (this.isMuted || !this.ctx) return
    try {
      const now = this.ctx.currentTime
      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()

      const freqMap = {
        low: 523.25,      // C5
        moderate: 659.25, // E5
        high: 783.99,     // G5
        critical: 1046.50 // C6
      }

      osc.type = 'triangle'
      osc.frequency.setValueAtTime(freqMap[severity] || 523.25, now)

      gain.gain.setValueAtTime(0.08, now)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35)

      osc.connect(gain)
      gain.connect(this.filter || this.ctx.destination)

      osc.start(now)
      osc.stop(now + 0.35)
    } catch (e) {}
  }
}

export const celestialAudio = new CelestialAudioEngine()
