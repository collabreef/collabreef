import { Node, mergeAttributes } from '@tiptap/core'
import InstagramEmbedComponent from './InstagramEmbedComponent'
import { ReactNodeViewRenderer } from '@tiptap/react'

export const InstagramEmbed = Node.create({
  name: 'instagramEmbed',

  group: 'block',
  atom: true,

  addAttributes() {
    return {
      url: { default: null },
    }
  },

  parseHTML() {
    return [{ tag: 'instagram-embed' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['instagram-embed', mergeAttributes(HTMLAttributes)]
  },

  addCommands() {
    return {
      ...this.parent?.(),
      setInstagramEmbed:
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
    return ReactNodeViewRenderer(InstagramEmbedComponent)
  },
})
