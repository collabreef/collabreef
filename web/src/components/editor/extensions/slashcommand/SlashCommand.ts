import { Extension } from '@tiptap/core'
import Suggestion, { SuggestionOptions } from '@tiptap/suggestion'
import { ReactRenderer } from '@tiptap/react'
import tippy, { Instance as TippyInstance } from 'tippy.js'
import { SlashMenu } from './SlashMenu'

export interface CommandItem {
  label: string
  command: (ctx: { editor: any }) => void
}

export interface SlashCommandOptions {
  suggestion: Partial<SuggestionOptions>
  commands: CommandItem[]
}
export const SlashCommand = Extension.create({
  name: 'slash-command',

  addOptions() {
    return {
      suggestion: {
        char: '/',
        items: ({ query }: { query: string }): CommandItem[] => {
          return [
            {
              label: 'Heading 1',
              command: ({ editor }:any) =>
                editor.chain().focus().toggleHeading({ level: 1 }).run(),
            },
            {
              label: 'Bullet List',
              command: ({ editor }:any) =>
                editor.chain().focus().toggleBulletList().run(),
            },
            {
              label: 'Task List',
              command: ({ editor }:any) =>
                editor.chain().focus().toggleTaskList().run(),
            },
          ].filter((item) =>
            item.label.toLowerCase().includes(query.toLowerCase())
          )
        },
        command: ({ editor, range, props }) => {
          editor.chain().focus().deleteRange(range).run()
          props.command({ editor })
        },
        render: () => {
          let reactRenderer: any
          let popup: TippyInstance[]

          return {
            onStart: (props) => {
              reactRenderer = new ReactRenderer(SlashMenu, {
                props: {
                  ...props,
                  editor: props.editor,
                  command: props.command,
                },
                editor: props.editor,
              })

              popup = tippy('body', {
                getReferenceClientRect: props.clientRect as any,
                appendTo: () => document.body,
                content: reactRenderer.element,
                showOnCreate: true,
                interactive: true,
                trigger: 'manual',
                placement: 'bottom-start',
              })
            },

            onUpdate(props) {
              reactRenderer.updateProps({
                ...props,
                editor: props.editor,
                command: props.command,
              })
              popup[0].setProps({
                getReferenceClientRect: props.clientRect as any,
              })
            },

            onKeyDown(props) {
              if (props.event.key === 'Escape') {
                popup[0].hide()
                return true
              }

              return reactRenderer.ref?.onKeyDown?.(props) || false
            },

            onExit() {
              popup[0].destroy()
              reactRenderer.destroy()
            },
          }
        },
      } as Partial<SuggestionOptions>,
    }
  },

  addProseMirrorPlugins() {
    return [Suggestion({ ...this.options.suggestion, editor: this.editor })]
  },
})
