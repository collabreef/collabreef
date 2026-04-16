import { Node, mergeAttributes } from '@tiptap/core'
import RatingNodeComponent from './RatingNodeComponent'
import { ReactNodeViewRenderer } from '@tiptap/react'

export const RatingNode = Node.create({
  name: 'ratingNode',

  group: 'block',
  atom: true,

  addAttributes() {
    return {
      rating: { default: 0 },
      maxRating: { default: 5 },
      label: { default: '' },
    }
  },

  parseHTML() {
    return [{ tag: 'rating-node' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['rating-node', mergeAttributes(HTMLAttributes)]
  },

  addCommands() {
    return {
      ...this.parent?.(),
      setRatingNode:
        (options: { rating: number; maxRating: number; label: string }) =>
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
    return ReactNodeViewRenderer(RatingNodeComponent)
  },
})
