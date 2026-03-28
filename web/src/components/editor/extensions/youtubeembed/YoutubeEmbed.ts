import { Node, mergeAttributes } from '@tiptap/core'
import YoutubeEmbedComponent from './YoutubeEmbedComponent'
import { ReactNodeViewRenderer } from '@tiptap/react'

export const YoutubeEmbed = Node.create({
  name: 'youtubeEmbed',

  group: 'block',
  atom: true,

  addAttributes() {
    return {
      url: { default: null },
    }
  },

  parseHTML() {
    return [{ tag: 'youtube-embed' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['youtube-embed', mergeAttributes(HTMLAttributes)]
  },

  addCommands() {
    return {
      ...this.parent?.(),
      setYoutubeEmbed:
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
    return ReactNodeViewRenderer(YoutubeEmbedComponent)
  },
})
