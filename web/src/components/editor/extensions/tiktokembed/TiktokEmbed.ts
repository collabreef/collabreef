import { Node, mergeAttributes } from '@tiptap/core'
import TiktokEmbedComponent from './TiktokEmbedComponent'
import { ReactNodeViewRenderer } from '@tiptap/react'

export const TiktokEmbed = Node.create({
  name: 'tiktokEmbed',

  group: 'block',
  atom: true,

  addAttributes() {
    return {
      url: { default: null },
    }
  },

  parseHTML() {
    return [{ tag: 'tiktok-embed' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['tiktok-embed', mergeAttributes(HTMLAttributes)]
  },

  addCommands() {
    return {
      ...this.parent?.(),
      setTiktokEmbed:
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
    return ReactNodeViewRenderer(TiktokEmbedComponent)
  },
})
