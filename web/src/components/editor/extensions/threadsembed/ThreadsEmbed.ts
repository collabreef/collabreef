import { Node, mergeAttributes } from '@tiptap/core'
import ThreadsEmbedComponent from './ThreadsEmbedComponent'
import { ReactNodeViewRenderer } from '@tiptap/react'

export const ThreadsEmbed = Node.create({
  name: 'threadsEmbed',

  group: 'block',
  atom: true,

  addAttributes() {
    return {
      url: { default: null },
    }
  },

  parseHTML() {
    return [{ tag: 'threads-embed' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['threads-embed', mergeAttributes(HTMLAttributes)]
  },

  addCommands() {
    return {
      ...this.parent?.(),
      setThreadsEmbed:
        (options: { url: string | null }) =>
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
    return ReactNodeViewRenderer(ThreadsEmbedComponent)
  },
})
