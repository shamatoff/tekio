import { create } from 'zustand'
import type { SectionConfig } from '../lib/db/sectionConfig'
import { loadSectionConfig, updateSectionField, saveSectionConfig } from '../lib/db/sectionConfig'
import { getWeekStartDay, updateWeekStartDay } from '../lib/db/user'
import type { WeekStartDay } from '../lib/utils'

interface PrefsStore {
  sections: SectionConfig[]
  weekStartDay: WeekStartDay
  loadPrefs: () => Promise<void>
  setSection: (key: string, patch: Partial<Pick<SectionConfig, 'showInMenu' | 'showInHome'>>) => Promise<void>
  reorderSections: (newOrder: string[]) => Promise<void>
  setWeekStartDay: (value: WeekStartDay) => Promise<void>
}

export const usePrefs = create<PrefsStore>((set, get) => ({
  sections: [],
  weekStartDay: 'monday',

  loadPrefs: async () => {
    const [sections, weekStartDay] = await Promise.all([loadSectionConfig(), getWeekStartDay()])
    set({ sections, weekStartDay })
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

  setWeekStartDay: async (value) => {
    set({ weekStartDay: value })
    await updateWeekStartDay(value)
  },
}))
