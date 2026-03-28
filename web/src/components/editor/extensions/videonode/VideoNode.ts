import { Node, mergeAttributes } from '@tiptap/core'
import VideoNodeComponent from './VideoNodeComponent'
import { ReactNodeViewRenderer } from '@tiptap/react'

export const VideoNode = Node.create({
  name: 'video',

  group: 'block',
  atom: true,

  addOptions() {
    return {
      upload: async (file: File) => {
        return {
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
    return [{ tag: 'video-node' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['video-node', mergeAttributes(HTMLAttributes)]
  },

  addCommands() {
    return {
      ...this.parent?.(),
      setVideo:
        (options: { src: string; name: string }) =>
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
    return ReactNodeViewRenderer(VideoNodeComponent)
  },
})
