import { useState, useEffect, useImperativeHandle, forwardRef } from 'react'
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

    useEffect(() => {
      setSelectedIndex(0)
    }, [items])

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
        {items.map((item, i) => (
          <button
            key={i}
            className={`w-full text-left px-3 py-1.5 rounded-md text-sm ${
              i === selectedIndex
                ? 'bg-gray-200 text-gray-900'
                : 'hover:bg-gray-100 text-gray-800'
            }`}
            onClick={() => command(item)}
          >
            {item.label}
          </button>
        ))}
      </div>
    )
  }
)
