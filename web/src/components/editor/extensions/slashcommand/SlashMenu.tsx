import { useState, useEffect, useImperativeHandle, forwardRef, useRef } from 'react'
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
  ({ items, command, editor }, ref) => {
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

    return (
      <div className="bg-white shadow-lg rounded-lg border border-gray-200 p-2 w-56">
        <div className=' h-40 overflow-y-auto'>
          {items.map((item, i) => (
            <button
              key={i}
              ref={(el) => (itemRefs.current[i] = el!)}
              className={`w-full text-left px-3 py-1.5 rounded-md text-sm flex gap-2 items-center ${i === selectedIndex
                  ? 'bg-gray-200 text-gray-900'
                  : 'hover:bg-gray-100 text-gray-800'
                }`}
              onClick={() => command(item)}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>
      </div>
    )
  }
)
