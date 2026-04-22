import { Node, mergeAttributes } from '@tiptap/core'
import CarouselComponent from './CarouselComponent'
import { ReactNodeViewRenderer } from '@tiptap/react'

export interface CarouselItem {
  src: string
  name: string
  type: 'image' | 'video'
}

export const CarouselNode = Node.create({
  name: 'carouselNode',

  group: 'block',
  atom: true,

  addOptions() {
    return {
      upload: async (file: File) => ({
        src: URL.createObjectURL(file),
        name: file.name,
      }),
      workspaceId: '',
      listFiles: async () => ({ files: [] }),
    }
  },

  addAttributes() {
    return {
      items: {
        default: [],
        parseHTML: el => {
          try { return JSON.parse(el.getAttribute('data-items') ?? '[]') } catch { return [] }
        },
        renderHTML: attrs => ({ 'data-items': JSON.stringify(attrs.items ?? []) }),
      },
    }
  },

  parseHTML() {
    return [{ tag: 'carousel-node' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['carousel-node', mergeAttributes(HTMLAttributes)]
  },

  addCommands() {
    return {
      ...this.parent?.(),
      setCarousel:
        (options: { items: CarouselItem[] }) =>
        ({ chain }: any) =>
          chain()
            .insertContent({ type: this.name, attrs: options })
            .run(),
    }
  },

  addNodeView() {
    return ReactNodeViewRenderer(CarouselComponent)
  },
})
