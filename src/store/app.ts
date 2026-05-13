import { create } from 'zustand'
import type { AppState, WeightEntry, BodyweightEntry, CardioEntry, MobilityEntry, SkillEntry, DonationEntry, Program } from '../types'
import { getOrCreateUser } from '../lib/db/user'
import { loadWeights, saveWeightEntry, deleteWeightEntry, updateWeightEntry } from '../lib/db/weights'
import { loadActiveProgram, saveProgram, advanceProgram, deleteProgram } from '../lib/db/program'
import { loadBodyweight, saveBodyweightEntry, deleteBodyweightEntry } from '../lib/db/bodyweight'
import { loadCardio, saveCardioEntry, deleteCardioEntry } from '../lib/db/cardio'
import { loadMobility, saveMobilityEntry, deleteMobilityEntry } from '../lib/db/mobility'
import { loadSkills, saveSkillEntry, deleteSkillEntry } from '../lib/db/skills'
import { loadDonations, saveDonationEntry, deleteDonationEntry } from '../lib/db/donations'
import type { LiftSet } from '../types'

interface AppStore extends AppState {
  loading: boolean
  toast: string
  programId: string | null
  userProgramId: string | null

  setWeights: (weights: AppState['weights']) => void
  setBodyweight: (bodyweight: AppState['bodyweight']) => void
  setCardio: (cardio: AppState['cardio']) => void
  setMobility: (mobility: AppState['mobility']) => void
  setSkills: (skills: AppState['skills']) => void
  setDonations: (donations: AppState['donations']) => void
  setProgram: (program: AppState['program']) => void
  setToast: (msg: string) => void

  bootstrap: () => Promise<void>

  // Weights
  addWeightEntry: (entry: Omit<WeightEntry, 'id'>) => Promise<void>
  removeWeightEntry: (id: string) => Promise<void>
  editWeightEntry: (id: string, sets: LiftSet[]) => Promise<void>

  // Program
  saveActiveProgram: (program: Program) => Promise<void>
  advanceActiveProgram: (newIndex: number, date: string) => Promise<void>
  removeProgram: () => Promise<void>

  // Bodyweight
  addBodyweightEntry: (entry: Omit<BodyweightEntry, 'id'>) => Promise<void>
  removeBodyweightEntry: (id: string) => Promise<void>

  // Cardio
  addCardioEntry: (entry: Omit<CardioEntry, 'id'>) => Promise<void>
  removeCardioEntry: (id: string) => Promise<void>

  // Mobility
  addMobilityEntry: (entry: Omit<MobilityEntry, 'id'>) => Promise<void>
  removeMobilityEntry: (id: string) => Promise<void>

  // Skills
  addSkillEntry: (entry: Omit<SkillEntry, 'id'>) => Promise<void>
  removeSkillEntry: (id: string) => Promise<void>

  // Donations
  addDonationEntry: (entry: Omit<DonationEntry, 'id'>) => Promise<void>
  removeDonationEntry: (id: string) => Promise<void>
}

export const useAppStore = create<AppStore>((set, get) => ({
  weights: [],
  bodyweight: [],
  cardio: [],
  mobility: [],
  skills: [],
  donations: [],
  program: null,
  loading: true,
  toast: '',
  programId: null,
  userProgramId: null,

  setWeights: (weights) => set({ weights }),
  setBodyweight: (bodyweight) => set({ bodyweight }),
  setCardio: (cardio) => set({ cardio }),
  setMobility: (mobility) => set({ mobility }),
  setSkills: (skills) => set({ skills }),
  setDonations: (donations) => set({ donations }),
  setProgram: (program) => set({ program }),
  setToast: (toast) => {
    set({ toast })
    if (toast) setTimeout(() => set({ toast: '' }), 3000)
  },

  bootstrap: async () => {
    set({ loading: true })
    await getOrCreateUser()
    const [weights, activeProg, bodyweight, cardio, mobility, skills, donations] = await Promise.all([
      loadWeights(),
      loadActiveProgram(),
      loadBodyweight(),
      loadCardio(),
      loadMobility(),
      loadSkills(),
      loadDonations(),
    ])
    set({
      weights,
      bodyweight,
      cardio,
      mobility,
      skills,
      donations,
      program: activeProg?.program ?? null,
      programId: activeProg?.programId ?? null,
      userProgramId: activeProg?.userProgramId ?? null,
      loading: false,
    })
  },

  // Weights
  addWeightEntry: async (entry) => {
    const saved = await saveWeightEntry(entry)
    set(s => ({ weights: [saved, ...s.weights] }))
  },
  removeWeightEntry: async (id) => {
    await deleteWeightEntry(id)
    set(s => ({ weights: s.weights.filter(w => w.id !== id) }))
  },
  editWeightEntry: async (id, sets) => {
    await updateWeightEntry(id, sets)
    set(s => ({ weights: s.weights.map(w => w.id === id ? { ...w, sets } : w) }))
  },

  // Program
  saveActiveProgram: async (program) => {
    const { programId, userProgramId } = get()
    const result = await saveProgram(program, programId ?? undefined, userProgramId ?? undefined)
    set({ program: result.program, programId: result.programId, userProgramId: result.userProgramId })
  },
  advanceActiveProgram: async (newIndex, date) => {
    const { userProgramId, program } = get()
    if (!userProgramId || !program) return
    await advanceProgram(userProgramId, newIndex, date)
    set({ program: { ...program, currentDayIndex: newIndex, lastAdvancedDate: date } })
  },
  removeProgram: async () => {
    const { programId, userProgramId } = get()
    if (programId && userProgramId) await deleteProgram(programId, userProgramId)
    set({ program: null, programId: null, userProgramId: null })
  },

  // Bodyweight
  addBodyweightEntry: async (entry) => {
    const saved = await saveBodyweightEntry(entry)
    set(s => ({
      bodyweight: [saved, ...s.bodyweight.filter(b => b.date !== saved.date)].sort(
        (a, b) => b.date.localeCompare(a.date)
      ),
    }))
  },
  removeBodyweightEntry: async (id) => {
    await deleteBodyweightEntry(id)
    set(s => ({ bodyweight: s.bodyweight.filter(b => b.id !== id) }))
  },

  // Cardio
  addCardioEntry: async (entry) => {
    const saved = await saveCardioEntry(entry)
    set(s => ({ cardio: [saved, ...s.cardio] }))
  },
  removeCardioEntry: async (id) => {
    await deleteCardioEntry(id)
    set(s => ({ cardio: s.cardio.filter(c => c.id !== id) }))
  },

  // Mobility
  addMobilityEntry: async (entry) => {
    const saved = await saveMobilityEntry(entry)
    set(s => ({ mobility: [saved, ...s.mobility] }))
  },
  removeMobilityEntry: async (id) => {
    await deleteMobilityEntry(id)
    set(s => ({ mobility: s.mobility.filter(m => m.id !== id) }))
  },

  // Skills
  addSkillEntry: async (entry) => {
    const saved = await saveSkillEntry(entry)
    set(s => ({ skills: [saved, ...s.skills] }))
  },
  removeSkillEntry: async (id) => {
    await deleteSkillEntry(id)
    set(s => ({ skills: s.skills.filter(sk => sk.id !== id) }))
  },

  // Donations
  addDonationEntry: async (entry) => {
    const saved = await saveDonationEntry(entry)
    set(s => ({ donations: [saved, ...s.donations] }))
  },
  removeDonationEntry: async (id) => {
    await deleteDonationEntry(id)
    set(s => ({ donations: s.donations.filter(d => d.id !== id) }))
  },
}))
