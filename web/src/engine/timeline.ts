import type { AlgorithmStep } from './types'

export type TimelineSnapshot<TStep> = { steps: readonly TStep[]; index: number; playing: boolean; speed: number }

export class Timeline<TStep extends AlgorithmStep<unknown>> {
  private snapshot: TimelineSnapshot<TStep>
  private listeners = new Set<() => void>()
  private timer: ReturnType<typeof setTimeout> | undefined
  private breakpoint?: (step: TStep, index: number) => boolean

  constructor(steps: readonly TStep[]) { this.snapshot = { steps, index: 0, playing: false, speed: 1 } }
  getSnapshot = () => this.snapshot
  subscribe = (listener: () => void) => { this.listeners.add(listener); return () => { this.listeners.delete(listener) } }
  private publish = (patch: Partial<TimelineSnapshot<TStep>>) => {
    this.snapshot = { ...this.snapshot, ...patch }
    this.listeners.forEach(listener => listener())
  }
  private cancel = () => { if (this.timer !== undefined) clearTimeout(this.timer); this.timer = undefined }
  private schedule = () => {
    this.cancel()
    const { steps, index, playing, speed } = this.snapshot
    if (!playing || index >= steps.length - 1) return
    this.timer = setTimeout(() => {
      this.timer = undefined
      if (!this.snapshot.playing) return
      const next = this.snapshot.index + 1
      this.publish({ index: next, playing: next < this.snapshot.steps.length - 1 && !this.breakpoint?.(this.snapshot.steps[next], next) })
      this.schedule()
    }, Math.max(0, Math.round((steps[index].duration ?? 800) / speed)))
  }
  play = () => {
    const { steps, index } = this.snapshot
    if (steps.length < 2 || this.snapshot.playing) return
    this.publish({ index: index >= steps.length - 1 ? 0 : index, playing: true })
    this.schedule()
  }
  pause = () => { this.cancel(); if (this.snapshot.playing) this.publish({ playing: false }) }
  seek = (index: number) => {
    this.cancel()
    const end = Math.max(0, this.snapshot.steps.length - 1)
    this.publish({ index: Math.max(0, Math.min(end, Math.trunc(Number.isFinite(index) ? index : 0))), playing: false })
  }
  next = () => this.seek(this.snapshot.index + 1)
  previous = () => this.seek(this.snapshot.index - 1)
  reset = () => this.seek(0)
  setSpeed = (speed: number) => {
    if (!Number.isFinite(speed) || speed <= 0) throw new Error('播放速度必须大于 0。')
    this.publish({ speed })
    if (this.snapshot.playing) this.schedule()
  }
  setBreakpoint = (predicate?: (step: TStep, index: number) => boolean) => { this.breakpoint = predicate }
  replace = (steps: readonly TStep[]) => { this.cancel(); this.publish({ steps, index: 0, playing: false }) }
  dispose = () => { this.cancel(); this.snapshot = { ...this.snapshot, playing: false } }
}
