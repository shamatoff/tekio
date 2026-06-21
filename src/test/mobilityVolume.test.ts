import { describe, it, expect } from 'vitest'
import { weeklyMuscleVolume } from '../lib/utils'
import type { MobilityEntry } from '../types'

function entry(date: string, exercises: MobilityEntry['exercises']): MobilityEntry {
  return { id: date, date, exercises, duration: exercises.reduce((s, e) => s + e.duration, 0) }
}

describe('weeklyMuscleVolume', () => {
  const mobility: MobilityEntry[] = [
    entry('2026-06-22', [
      { name: 'Couch Stretch', duration: 3, notes: '', muscleGroups: ['Hip Flexors', 'Quadriceps'] },
      { name: 'Pancake', duration: 2, notes: '', muscleGroups: ['Adductors', 'Hamstrings'] },
    ]),
    entry('2026-06-24', [
      { name: 'Couch Stretch', duration: 4, notes: '', muscleGroups: ['Hip Flexors', 'Quadriceps'] },
    ]),
    // Outside the week — must be excluded
    entry('2026-06-15', [
      { name: 'Calf Stretch', duration: 9, notes: '', muscleGroups: ['Calves'] },
    ]),
    // Untagged exercise contributes nothing
    entry('2026-06-23', [
      { name: 'Foam Roll', duration: 5, notes: '', muscleGroups: [] },
    ]),
  ]

  it('sums minutes per muscle group within the week, crediting every targeted group', () => {
    const vol = weeklyMuscleVolume(mobility, '2026-06-22', '2026-06-28')
    expect(vol['Hip Flexors']).toBe(7)   // 3 + 4
    expect(vol['Quadriceps']).toBe(7)    // 3 + 4
    expect(vol['Adductors']).toBe(2)
    expect(vol['Hamstrings']).toBe(2)
    expect(vol['Calves']).toBeUndefined() // outside the week
  })

  it('returns an empty object when nothing falls in the week', () => {
    expect(weeklyMuscleVolume(mobility, '2026-07-06', '2026-07-12')).toEqual({})
  })
})
