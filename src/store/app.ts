import { create } from 'zustand'
import type { AppState } from '../types'

interface AppStore extends AppState {
  setWeights: (weights: AppState['weights']) => void
  setBodyweight: (bodyweight: AppState['bodyweight']) => void
  setCardio: (cardio: AppState['cardio']) => void
  setMobility: (mobility: AppState['mobility']) => void
  setSkills: (skills: AppState['skills']) => void
  setDonations: (donations: AppState['donations']) => void
  setProgram: (program: AppState['program']) => void
}

export const useAppStore = create<AppStore>((set) => ({
  weights: [],
  bodyweight: [],
  cardio: [],
  mobility: [],
  skills: [],
  donations: [],
  program: null,

  setWeights: (weights) => set({ weights }),
  setBodyweight: (bodyweight) => set({ bodyweight }),
  setCardio: (cardio) => set({ cardio }),
  setMobility: (mobility) => set({ mobility }),
  setSkills: (skills) => set({ skills }),
  setDonations: (donations) => set({ donations }),
  setProgram: (program) => set({ program }),
}))
