import { Node, mergeAttributes } from '@tiptap/core'
import LocationNodeComponent from './LocationNodeComponent'
import { ReactNodeViewRenderer } from '@tiptap/react'

export const LocationNode = Node.create({
  name: 'locationNode',

  group: 'block',
  atom: true,

  addAttributes() {
    return {
      lat: { default: null },
      lng: { default: null },
      name: { default: '' },
      address: { default: '' },
      zoom: { default: 15 },
    }
  },

  parseHTML() {
    return [{ tag: 'location-node' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['location-node', mergeAttributes(HTMLAttributes)]
  },

  addCommands() {
    return {
      ...this.parent?.(),
      setLocationNode:
        (options: { lat: number | null; lng: number | null; name: string; address: string; zoom?: number }) =>
        ({ chain }: any) =>
          chain()
            .insertContent({
              type: this.name,
              attrs: { zoom: 15, ...options },
            })
            .run(),
    }
  },

  addNodeView() {
    return ReactNodeViewRenderer(LocationNodeComponent)
  },
})
