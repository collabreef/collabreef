import { useState, useEffect, useImperativeHandle, forwardRef, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { CommandItem } from './SlashCommand'

interface Props {
  items: CommandItem[]
  editor: any
  command: (item: CommandItem) => void
}

export interface SlashMenuRef {
  onKeyDown: ({ event }: { event: KeyboardEvent }) => boolean
}

export const SlashMenu = forwardRef<SlashMenuRef, Props>(
  ({ items, command }, ref) => {
    const { t } = useTranslation()
    const [selectedIndex, setSelectedIndex] = useState(0)
    const itemRefs = useRef<HTMLButtonElement[]>([])

    useEffect(() => {
      setSelectedIndex(0)
    }, [items])

    useEffect(() => {
      const el = itemRefs.current[selectedIndex]
      if (el) {
        el.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
      }
    }, [selectedIndex])

    const upHandler = () => {
      setSelectedIndex((prev) => (prev - 1 + items.length) % items.length)
    }

    const downHandler = () => {
      setSelectedIndex((prev) => (prev + 1) % items.length)
    }

    const enterHandler = () => {
      const selected = items[selectedIndex]
      if (selected) {
        command(selected)
      }
    }

    useImperativeHandle(ref, () => ({
      onKeyDown: ({ event }) => {
        if (event.key === 'ArrowUp') {
          upHandler()
          return true
        }
        if (event.key === 'ArrowDown') {
          downHandler()
          return true
        }
        if (event.key === 'Enter') {
          enterHandler()
          return true
        }
        return false
      },
    }))

    if (!items.length) return null

    let lastCategory = ''
    const rendered: JSX.Element[] = []
    items.forEach((item, i) => {
      const showHeader = !!item.category && item.category !== lastCategory
      if (showHeader) {
        lastCategory = item.category!
        rendered.push(
          <div key={`cat-${item.category}`} className="px-3 pt-2 pb-0.5 text-xs font-semibold text-gray-400 dark:text-stone-500 uppercase tracking-wide select-none">
            {t(`editor.slashCategories.${item.category}`, item.category!)}
          </div>
        )
      }
      rendered.push(
        <button
          key={i}
          ref={(el) => (itemRefs.current[i] = el!)}
          className={`w-full text-left px-3 py-1.5 rounded-md text-sm flex gap-2 items-center ${i === selectedIndex
              ? 'bg-gray-200 text-gray-950 dark:bg-stone-950 dark:text-stone-200'
              : 'hover:bg-gray-100 text-gray-900 dark:hover:bg-stone-950 dark:text-stone-100'
            }`}
          onClick={() => command(item)}
        >
          {item.icon}
          {item.label}
        </button>
      )
    })

    return (
      <div className="bg-white dark:bg-stone-900 shadow-lg rounded-lg border border-gray-200 p-2 w-56">
        <div className='max-h-72 overflow-y-auto'>
          {rendered}
        </div>
      </div>
    )
  }
)
