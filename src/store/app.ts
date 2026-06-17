import { create } from 'zustand'
import type {
  AppState,
  WeightEntry,
  BodyweightEntry,
  CardioEntry,
  MobilityEntry,
  SkillEntry,
  NewSkillFlags,
  DonationEntry,
  Program,
  EditModalTarget,
} from '../types'
import { getOrCreateUser } from '../lib/db/user'
import {
  loadWeights,
  saveWeightEntry,
  deleteWeightEntry,
  updateWeightEntry,
} from '../lib/db/weights'
import {
  loadActivePrograms,
  saveProgram,
  advanceProgram,
  pauseProgram,
  hardDeleteProgram,
  restartProgram,
} from '../lib/db/program'
import { loadBodyweight, saveBodyweightEntry, deleteBodyweightEntry, updateBodyweightEntry } from '../lib/db/bodyweight'
import { loadCardio, saveCardioEntry, deleteCardioEntry, updateCardioEntry } from '../lib/db/cardio'
import { loadMobility, saveMobilityEntry, deleteMobilityEntry, updateMobilityEntry } from '../lib/db/mobility'
import { loadSkills, loadSkillTypes, saveSkillEntry, deleteSkillEntry, updateSkillEntry } from '../lib/db/skills'
import { loadDonations, saveDonationEntry, deleteDonationEntry, updateDonationEntry } from '../lib/db/donations'
import { usePrefs } from './prefs'
import type { LiftSet } from '../types'

interface AppStore extends AppState {
  loading: boolean
  toast: string

  // Edit modal
  editModal: EditModalTarget | null
  openEditModal: (target: EditModalTarget) => void
  closeEditModal: () => void

  setWeights: (weights: AppState['weights']) => void
  setBodyweight: (bodyweight: AppState['bodyweight']) => void
  setCardio: (cardio: AppState['cardio']) => void
  setMobility: (mobility: AppState['mobility']) => void
  setSkills: (skills: AppState['skills']) => void
  setSkillTypes: (skillTypes: AppState['skillTypes']) => void
  setDonations: (donations: AppState['donations']) => void
  setToast: (msg: string) => void

  bootstrap: () => Promise<void>

  // Weights
  addWeightEntry: (entry: Omit<WeightEntry, 'id'>) => Promise<void>
  removeWeightEntry: (id: string) => Promise<void>
  editWeightEntry: (id: string, patch: { sets: LiftSet[]; date?: string }) => Promise<void>

  // Programs
  saveActiveProgram: (program: Program, programId?: string, userProgramId?: string) => Promise<void>
  advanceActiveProgram: (userProgramId: string, newIndex: number, date: string) => Promise<void>
  restartActiveProgram: (userProgramId: string, startDate: string) => Promise<void>
  pauseActiveProgram: (userProgramId: string) => Promise<void>
  removeProgram: (programId: string, userProgramId: string) => Promise<void>

  // Bodyweight
  addBodyweightEntry: (entry: Omit<BodyweightEntry, 'id'>) => Promise<void>
  removeBodyweightEntry: (id: string) => Promise<void>
  editBodyweightEntry: (id: string, patch: Omit<BodyweightEntry, 'id'>) => Promise<void>

  // Cardio
  addCardioEntry: (entry: Omit<CardioEntry, 'id'>) => Promise<void>
  removeCardioEntry: (id: string) => Promise<void>
  editCardioEntry: (id: string, patch: Omit<CardioEntry, 'id'>) => Promise<void>

  // Mobility
  addMobilityEntry: (entry: Omit<MobilityEntry, 'id'>) => Promise<void>
  removeMobilityEntry: (id: string) => Promise<void>
  editMobilityEntry: (id: string, patch: Omit<MobilityEntry, 'id'>) => Promise<void>

  // Skills
  addSkillEntry: (entry: Omit<SkillEntry, 'id'>, newSkillFlags?: NewSkillFlags) => Promise<void>
  removeSkillEntry: (id: string) => Promise<void>
  editSkillEntry: (id: string, patch: Omit<SkillEntry, 'id'>, newSkillFlags?: NewSkillFlags) => Promise<void>

  // Donations
  addDonationEntry: (entry: Omit<DonationEntry, 'id'>) => Promise<void>
  removeDonationEntry: (id: string) => Promise<void>
  editDonationEntry: (id: string, patch: Omit<DonationEntry, 'id'>) => Promise<void>
}

export const useAppStore = create<AppStore>((set) => ({
  weights: [],
  bodyweight: [],
  cardio: [],
  mobility: [],
  skills: [],
  skillTypes: [],
  donations: [],
  programs: [],
  loading: true,
  toast: '',
  editModal: null,

  // ── Edit modal ──────────────────────────────────────────────────────────────
  openEditModal: (target) => set({ editModal: target }),
  closeEditModal: () => set({ editModal: null }),

  // ── Setters ─────────────────────────────────────────────────────────────────
  setWeights: (weights) => set({ weights }),
  setBodyweight: (bodyweight) => set({ bodyweight }),
  setCardio: (cardio) => set({ cardio }),
  setMobility: (mobility) => set({ mobility }),
  setSkills: (skills) => set({ skills }),
  setSkillTypes: (skillTypes) => set({ skillTypes }),
  setDonations: (donations) => set({ donations }),
  setToast: (toast) => {
    set({ toast })
    if (toast) setTimeout(() => set({ toast: '' }), 3000)
  },

  // ── Bootstrap ────────────────────────────────────────────────────────────────
  bootstrap: async () => {
    set({ loading: true })
    try {
      await getOrCreateUser()
      const [weights, activePrograms, bodyweight, cardio, mobility, skills, skillTypes, donations] = await Promise.all([
        loadWeights(),
        loadActivePrograms(),
        loadBodyweight(),
        loadCardio(),
        loadMobility(),
        loadSkills(),
        loadSkillTypes(),
        loadDonations(),
        usePrefs.getState().loadPrefs(),
      ])
      set({
        weights,
        bodyweight,
        cardio,
        mobility,
        skills,
        skillTypes,
        donations,
        programs: activePrograms,
      })
    } finally {
      set({ loading: false })
    }
  },

  // ── Weights ──────────────────────────────────────────────────────────────────
  addWeightEntry: async (entry) => {
    const saved = await saveWeightEntry(entry)
    set(s => ({ weights: [saved, ...s.weights] }))
  },
  removeWeightEntry: async (id) => {
    await deleteWeightEntry(id)
    set(s => ({ weights: s.weights.filter(w => w.id !== id) }))
  },
  editWeightEntry: async (id, patch) => {
    await updateWeightEntry(id, patch)
    set(s => ({
      weights: s.weights.map(w =>
        w.id === id
          ? { ...w, sets: patch.sets, ...(patch.date ? { date: patch.date } : {}) }
          : w
      ),
    }))
  },

  // ── Programs ─────────────────────────────────────────────────────────────────
  saveActiveProgram: async (program, programId, userProgramId) => {
    const result = await saveProgram(program, programId, userProgramId)
    set(s => {
      const others = s.programs.filter(p => p.userProgramId !== result.userProgramId)
      return { programs: [...others, result] }
    })
  },
  advanceActiveProgram: async (userProgramId, newIndex, date) => {
    await advanceProgram(userProgramId, newIndex, date)
    set(s => ({
      programs: s.programs.map(p =>
        p.userProgramId === userProgramId
          ? { ...p, currentDayIndex: newIndex, lastAdvancedDate: date }
          : p
      ),
    }))
  },
  restartActiveProgram: async (userProgramId, startDate) => {
    await restartProgram(userProgramId, startDate)
    set(s => ({
      programs: s.programs.map(p =>
        p.userProgramId === userProgramId
          ? { ...p, startDate, currentDayIndex: 0, lastAdvancedDate: startDate }
          : p
      ),
    }))
  },
  pauseActiveProgram: async (userProgramId) => {
    await pauseProgram(userProgramId)
    set(s => ({ programs: s.programs.filter(p => p.userProgramId !== userProgramId) }))
  },
  removeProgram: async (programId, userProgramId) => {
    await hardDeleteProgram(programId, userProgramId)
    set(s => ({ programs: s.programs.filter(p => p.userProgramId !== userProgramId) }))
  },

  // ── Bodyweight ───────────────────────────────────────────────────────────────
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
  editBodyweightEntry: async (id, patch) => {
    await updateBodyweightEntry(id, patch)
    set(s => ({
      bodyweight: s.bodyweight
        .map(b => (b.id === id ? { ...b, ...patch } : b))
        .sort((a, b) => b.date.localeCompare(a.date)),
    }))
  },

  // ── Cardio ───────────────────────────────────────────────────────────────────
  addCardioEntry: async (entry) => {
    const saved = await saveCardioEntry(entry)
    set(s => ({ cardio: [saved, ...s.cardio] }))
  },
  removeCardioEntry: async (id) => {
    await deleteCardioEntry(id)
    set(s => ({ cardio: s.cardio.filter(c => c.id !== id) }))
  },
  editCardioEntry: async (id, patch) => {
    await updateCardioEntry(id, patch)
    set(s => ({ cardio: s.cardio.map(c => (c.id === id ? { ...c, ...patch } : c)) }))
  },

  // ── Mobility ─────────────────────────────────────────────────────────────────
  addMobilityEntry: async (entry) => {
    const saved = await saveMobilityEntry(entry)
    set(s => ({ mobility: [saved, ...s.mobility] }))
  },
  removeMobilityEntry: async (id) => {
    await deleteMobilityEntry(id)
    set(s => ({ mobility: s.mobility.filter(m => m.id !== id) }))
  },
  editMobilityEntry: async (id, patch) => {
    await updateMobilityEntry(id, patch)
    set(s => ({ mobility: s.mobility.map(m => (m.id === id ? { ...m, ...patch } : m)) }))
  },

  // ── Skills ───────────────────────────────────────────────────────────────────
  addSkillEntry: async (entry, newSkillFlags) => {
    const saved = await saveSkillEntry(entry, newSkillFlags)
    set(s => ({
      skills: [saved, ...s.skills],
      skillTypes: newSkillFlags
        ? [...s.skillTypes.filter(t => t.name.toLowerCase() !== saved.skill.toLowerCase()), { name: saved.skill, ...newSkillFlags }]
        : s.skillTypes,
    }))
  },
  removeSkillEntry: async (id) => {
    await deleteSkillEntry(id)
    set(s => ({ skills: s.skills.filter(sk => sk.id !== id) }))
  },
  editSkillEntry: async (id, patch, newSkillFlags) => {
    await updateSkillEntry(id, patch, newSkillFlags)
    set(s => ({
      skills: s.skills.map(sk => (sk.id === id ? { ...sk, ...patch } : sk)),
      skillTypes: newSkillFlags
        ? [...s.skillTypes.filter(t => t.name.toLowerCase() !== patch.skill.toLowerCase()), { name: patch.skill, ...newSkillFlags }]
        : s.skillTypes,
    }))
  },

  // ── Donations ────────────────────────────────────────────────────────────────
  addDonationEntry: async (entry) => {
    const saved = await saveDonationEntry(entry)
    set(s => ({ donations: [saved, ...s.donations] }))
  },
  removeDonationEntry: async (id) => {
    await deleteDonationEntry(id)
    set(s => ({ donations: s.donations.filter(d => d.id !== id) }))
  },
  editDonationEntry: async (id, patch) => {
    await updateDonationEntry(id, patch)
    set(s => ({ donations: s.donations.map(d => (d.id === id ? { ...d, ...patch } : d)) }))
  },
}))
