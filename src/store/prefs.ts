import { create } from 'zustand'
import type { SectionConfig } from '../lib/db/sectionConfig'
import { loadSectionConfig, updateSectionField, saveSectionConfig } from '../lib/db/sectionConfig'

interface PrefsStore {
  sections: SectionConfig[]
  loadPrefs: () => Promise<void>
  setSection: (key: string, patch: Partial<Pick<SectionConfig, 'showInMenu' | 'showInHome'>>) => Promise<void>
  reorderSections: (newOrder: string[]) => Promise<void>
}

export const usePrefs = create<PrefsStore>((set, get) => ({
  sections: [],

  loadPrefs: async () => {
    const sections = await loadSectionConfig()
    set({ sections })
  },

  setSection: async (key, patch) => {
    // Optimistic update
    set(s => ({
      sections: s.sections.map(sc =>
        sc.sectionKey === key ? { ...sc, ...patch } : sc
      ),
    }))
    await updateSectionField(key, patch)
  },

  reorderSections: async (newOrder) => {
    const { sections } = get()
    const reordered = newOrder.map((key, i) => {
      const existing = sections.find(s => s.sectionKey === key)!
      return { ...existing, sortOrder: i }
    })
    // Optimistic update
    set({ sections: reordered })
    await saveSectionConfig(reordered)
  },
}))
