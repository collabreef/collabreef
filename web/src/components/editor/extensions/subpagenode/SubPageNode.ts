import { Node, mergeAttributes } from '@tiptap/core'
import SubPageComponent from './SubPageComponent'
import { ReactNodeViewRenderer } from '@tiptap/react'
import { NoteData } from '@/api/note'

export const SubPageNode = Node.create({
  name: 'subPage',

  group: 'block',
  atom: true,

  addOptions() {
    return {
      workspaceId: '',
      parentNoteId: '',
      createNote: async (_workspaceId: string, _data: Partial<NoteData>) => ({ id: '' }),
    }
  },

  addAttributes() {
    return {
      noteId: { default: null },
      title: { default: '' },
    }
  },

  parseHTML() {
    return [{ tag: 'sub-page-node' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['sub-page-node', mergeAttributes(HTMLAttributes)]
  },

  addCommands() {
    return {
      ...this.parent?.(),
      setSubPage:
        (options: { noteId: string | null; title: string }) =>
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
    return ReactNodeViewRenderer(SubPageComponent)
  },
})
