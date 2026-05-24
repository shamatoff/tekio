import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { usePrefs } from '../../store/prefs'
import { SecTitle } from '../ui/Card'
import type { SectionConfig } from '../../lib/db/sectionConfig'

const SECTION_META: Record<string, { icon: string; label: string }> = {
  Weights:      { icon: '🏋️', label: 'Weights' },
  'Body Weight': { icon: '⚖️', label: 'Body Weight' },
  Cardio:       { icon: '❤️', label: 'Cardio' },
  Mobility:     { icon: '🧘', label: 'Mobility' },
  Skills:       { icon: '🎯', label: 'Skills' },
  Donations:    { icon: '🩸', label: 'Donations' },
}

// ─── Toggle pill ────────────────────────────────────────────────────────────

function Toggle({
  label,
  value,
  onChange,
}: {
  label: string
  value: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-xs text-muted">{label}</span>
      <button
        onClick={() => onChange(!value)}
        className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
          value
            ? 'bg-accent text-white'
            : 'bg-bg border border-border text-muted'
        }`}
      >
        {value ? 'ON' : 'OFF'}
      </button>
    </div>
  )
}

// ─── Sortable row ────────────────────────────────────────────────────────────

function SortableRow({ section }: { section: SectionConfig }) {
  const { setSection } = usePrefs()
  const meta = SECTION_META[section.sectionKey] ?? { icon: '📌', label: section.sectionKey }

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.sectionKey })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-surface border border-border rounded-xl p-3 flex items-start gap-3"
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        className="mt-1 text-muted hover:text-primary cursor-grab active:cursor-grabbing touch-none select-none text-base leading-none px-0.5"
        aria-label="Drag to reorder"
      >
        ≡
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-base">{meta.icon}</span>
          <span className="text-sm font-semibold text-primary">{meta.label}</span>
        </div>
        <div className="flex flex-col gap-1.5">
          <Toggle
            label="Show in menu"
            value={section.showInMenu}
            onChange={v => setSection(section.sectionKey, { showInMenu: v })}
          />
          <Toggle
            label="Show in Home"
            value={section.showInHome}
            onChange={v => setSection(section.sectionKey, { showInHome: v })}
          />
        </div>
      </div>
    </div>
  )
}

// ─── ProfileTab ──────────────────────────────────────────────────────────────

export function ProfileTab() {
  const { sections, reorderSections } = usePrefs()

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor,   { activationConstraint: { delay: 200, tolerance: 8 } })
  )

  const sectionIds = sections.map(s => s.sectionKey)

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = sectionIds.indexOf(active.id as string)
    const newIndex = sectionIds.indexOf(over.id as string)
    const newOrder = arrayMove(sectionIds, oldIndex, newIndex)
    reorderSections(newOrder)
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <SecTitle>Sections</SecTitle>
        <p className="text-xs text-muted mb-3">
          Drag ≡ to reorder. Changes are reflected in the menu and Home tab.
        </p>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={sectionIds} strategy={verticalListSortingStrategy}>
            <div className="flex flex-col gap-2">
              {sections.map(section => (
                <SortableRow key={section.sectionKey} section={section} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>
    </div>
  )
}
