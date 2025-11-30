import { Node, mergeAttributes } from '@tiptap/core'
import ImageComponent from './ImageComponent'
import { ReactNodeViewRenderer } from '@tiptap/react'

export const ImageNode = Node.create({
  name: 'image',

  group: 'block',
  atom: true,
  
  addOptions() {
    return {
      upload: async (file: File) => {
        return{
          url: URL.createObjectURL(file), name: file.name
        }
      },
      workspaceId: '',
      listFiles: async () => {
        return { files: [] }
      }
    }
  },

  addAttributes() {
    return {
      src: { default: null },
      name: { default: null },
    }
  },

  parseHTML() {
    return [{ tag: 'image-node' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['image-node', mergeAttributes(HTMLAttributes)]
  },

  addCommands() {
    return {
      ...this.parent?.(),
      setImage:
        (options: { src: string; name: string }) =>
        ({ chain }:any) =>
          chain()
            .insertContent({
              type: this.name,
              attrs: options,
            })
            .run(),
    }
  },

  addNodeView() {
    return ReactNodeViewRenderer(ImageComponent)
  },
})