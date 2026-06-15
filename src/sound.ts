const AUDIO_PATH = '/audio/'

class AudioClip {
  private audio: HTMLAudioElement

  constructor(filename: string) {
    this.audio = document.createElement('audio')
    this.audio.src = AUDIO_PATH + filename
    this.audio.load()
  }

  play(): void {
    try {
      this.audio.currentTime = 0
      this.audio.play().catch(() => {})
    } catch {}
  }

  get isFree(): boolean {
    return this.audio.currentTime === 0 || this.audio.currentTime === this.audio.duration
  }
}

export class SoundGroup {
  private filename: string
  private channels: AudioClip[]

  constructor(filename: string, channelCount = 1) {
    this.filename = filename
    this.channels = Array.from({ length: channelCount }, () => new AudioClip(filename))
  }

  play(mute = false): void {
    if (mute) return
    this.getFreeChannel().play()
  }

  private getFreeChannel(): AudioClip {
    return this.channels.find(c => c.isFree) ?? this.addChannel()
  }

  private addChannel(): AudioClip {
    const channel = new AudioClip(this.filename)
    this.channels.push(channel)
    return channel
  }
}
