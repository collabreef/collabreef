import { Node, mergeAttributes } from '@tiptap/core'
import CalendarNodeComponent from './CalendarNodeComponent'
import { ReactNodeViewRenderer } from '@tiptap/react'

export const CalendarNode = Node.create({
  name: 'calendarNode',

  group: 'block',
  atom: true,

  addAttributes() {
    return {
      date: { default: null },
      title: { default: '' },
      description: { default: '' },
    }
  },

  parseHTML() {
    return [{ tag: 'calendar-node' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['calendar-node', mergeAttributes(HTMLAttributes)]
  },

  addCommands() {
    return {
      ...this.parent?.(),
      setCalendarNode:
        (options: { date: string | null; title: string; description: string }) =>
        ({ chain }: any) =>
          chain()
            .insertContent({
              type: this.name,
              attrs: options,
            })
            .run(),
    }
  },

  addNodeView() {
    return ReactNodeViewRenderer(CalendarNodeComponent)
  },
})
