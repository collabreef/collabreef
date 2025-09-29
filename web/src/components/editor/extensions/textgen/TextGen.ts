import { Node, mergeAttributes } from '@tiptap/core'
import TextGenComponent from './TextGenComponent'
import { ReactNodeViewRenderer } from '@tiptap/react'

export const TextGenNode = Node.create({
    name: 'textgen',

    group: 'block',
    atom: true,

    addOptions() {
        return {
            listModels: async () => {
                return {
                    models: []
                }
            },
            generate: async (prompt: string, model: string) => {
                return {
                    text: ""
                }
            }
        }
    },

    parseHTML() {
        return [{ tag: 'textgen-node' }]
    },

    renderHTML({ HTMLAttributes }) {
        return ['textgen-node', mergeAttributes(HTMLAttributes)]
    },

    addCommands() {
        return {
            ...this.parent?.(),
            addTextGen:
                () =>
                    ({ chain }: any) =>
                        chain()
                            .insertContent({
                                type: this.name,
                            })
                            .run(),
        }
    },

    addNodeView() {
        return ReactNodeViewRenderer(TextGenComponent)
    },
})