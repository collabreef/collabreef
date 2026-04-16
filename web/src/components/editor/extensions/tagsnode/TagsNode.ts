import { Node, mergeAttributes } from '@tiptap/core'
import TagsNodeComponent from './TagsNodeComponent'
import { ReactNodeViewRenderer } from '@tiptap/react'

export const TagsNode = Node.create({
  name: 'tagsNode',

  group: 'block',
  atom: true,

  addAttributes() {
    return {
      tags: {
        default: [],
        parseHTML: el => {
          try { return JSON.parse(el.getAttribute('data-tags') ?? '[]') } catch { return [] }
        },
        renderHTML: attrs => ({ 'data-tags': JSON.stringify(attrs.tags ?? []) }),
      },
    }
  },

  parseHTML() {
    return [{ tag: 'tags-node' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['tags-node', mergeAttributes(HTMLAttributes)]
  },

  addCommands() {
    return {
      ...this.parent?.(),
      setTagsNode:
        (options: { tags: string[] }) =>
        ({ chain }: any) =>
          chain()
            .insertContent({ type: this.name, attrs: options })
            .run(),
    }
  },

  addNodeView() {
    return ReactNodeViewRenderer(TagsNodeComponent)
  },
})
