import { NodeViewProps, NodeViewWrapper } from "@tiptap/react"
import { ChevronUp, ChevronDown, Edit3, Trash2, CalendarDays } from "lucide-react"
import { useState, useRef, useEffect } from "react"

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

function formatDate(dateStr: string): { day: string; month: string; year: string; weekday: string } | null {
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return null
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    return {
      day: String(d.getDate()).padStart(2, '0'),
      month: MONTH_NAMES[d.getMonth()],
      year: String(d.getFullYear()),
      weekday: weekdays[d.getDay()],
    }
  } catch {
    return null
  }
}

const CalendarNodeComponent: React.FC<NodeViewProps> = ({ node, updateAttributes, selected, editor, deleteNode, getPos }) => {
  const { date, title, description } = node.attrs
  const isEditable = editor.isEditable
  const [showActions, setShowActions] = useState(false)
  const [isEditing, setIsEditing] = useState(!date && !title)
  const [inputDate, setInputDate] = useState(date ?? '')
  const [inputTitle, setInputTitle] = useState(title ?? '')
  const [inputDescription, setInputDescription] = useState(description ?? '')
  const titleRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isEditing) {
      setTimeout(() => titleRef.current?.focus(), 0)
    }
  }, [isEditing])

  const handleSubmit = () => {
    updateAttributes({
      date: inputDate || null,
      title: inputTitle,
      description: inputDescription,
    })
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
    if (e.key === 'Escape' && (date || title)) {
      setInputDate(date ?? '')
      setInputTitle(title ?? '')
      setInputDescription(description ?? '')
      setIsEditing(false)
    }
  }

  const handleMoveUp = () => {
    const pos = getPos()
    if (pos === undefined) return
    const { state } = editor
    const $pos = state.doc.resolve(pos)
    if ($pos.index() === 0) return
    const nodeBefore = $pos.nodeBefore
    if (!nodeBefore) return
    editor.view.dispatch(
      state.tr.replaceWith(pos - nodeBefore.nodeSize, pos + node.nodeSize, [node, nodeBefore])
    )
  }

  const handleMoveDown = () => {
    const pos = getPos()
    if (pos === undefined) return
    const { state } = editor
    const $pos = state.doc.resolve(pos)
    if ($pos.index() >= $pos.parent.childCount - 1) return
    const nodeAfterPos = pos + node.nodeSize
    const nodeAfter = state.doc.resolve(nodeAfterPos).nodeAfter
    if (!nodeAfter) return
    editor.view.dispatch(
      state.tr.replaceWith(pos, nodeAfterPos + nodeAfter.nodeSize, [nodeAfter, node])
    )
  }

  const formatted = date ? formatDate(date) : null

  if (isEditing || (!date && !title)) {
    return (
      <NodeViewWrapper className="calendar-node select-none border dark:border-neutral-700 rounded p-3 bg-gray-100 dark:bg-neutral-800">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
            <CalendarDays size={18} />
            <span className="text-sm font-medium">Calendar Event</span>
          </div>
          <input
            ref={titleRef}
            type="text"
            className="px-3 py-2 text-sm rounded border border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Event title..."
            value={inputTitle}
            onChange={e => setInputTitle(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <input
            type="date"
            className="px-3 py-2 text-sm rounded border border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
            value={inputDate}
            onChange={e => setInputDate(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <textarea
            className="px-3 py-2 text-sm rounded border border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
            placeholder="Description (optional)..."
            rows={2}
            value={inputDescription}
            onChange={e => setInputDescription(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <div className="flex gap-2">
            <button
              className="px-3 py-2 text-sm rounded bg-blue-600 hover:bg-blue-700 text-white transition-colors disabled:opacity-50"
              onClick={handleSubmit}
              disabled={!inputTitle.trim() && !inputDate}
            >
              Save
            </button>
            {(date || title) && (
              <button
                className="px-3 py-2 text-sm rounded border border-gray-300 dark:border-neutral-600 hover:bg-gray-200 dark:hover:bg-neutral-700 text-gray-700 dark:text-gray-300 transition-colors"
                onClick={() => {
                  setInputDate(date ?? '')
                  setInputTitle(title ?? '')
                  setInputDescription(description ?? '')
                  setIsEditing(false)
                }}
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      </NodeViewWrapper>
    )
  }

  return (
    <NodeViewWrapper>
      <div
        className="relative group my-1"
        onMouseEnter={() => isEditable && setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
      >
        <div className="flex flex-wrap items-center gap-1.5 px-1 py-1">
          <CalendarDays size={14} className="text-gray-400 dark:text-gray-500 shrink-0" />
          {formatted && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-neutral-700 text-gray-600 dark:text-gray-300 select-none">
              {formatted.month} {formatted.day}, {formatted.year}
            </span>
          )}
          {title && (
            <span className="text-sm text-gray-800 dark:text-gray-200 truncate">{title}</span>
          )}
          {description && (
            <span className="text-xs text-gray-500 dark:text-gray-400 truncate">{description}</span>
          )}
        </div>

        {isEditable && (showActions || selected) && (
          <div className="absolute top-1/2 -translate-y-1/2 right-1.5 flex gap-1 z-10">
            <button onClick={handleMoveUp} className="p-1.5 bg-white dark:bg-neutral-800 hover:bg-gray-100 dark:hover:bg-neutral-700 rounded-md shadow border border-gray-200 dark:border-neutral-600 transition-colors" title="Move up">
              <ChevronUp size={14} className="text-gray-600 dark:text-gray-300" />
            </button>
            <button onClick={handleMoveDown} className="p-1.5 bg-white dark:bg-neutral-800 hover:bg-gray-100 dark:hover:bg-neutral-700 rounded-md shadow border border-gray-200 dark:border-neutral-600 transition-colors" title="Move down">
              <ChevronDown size={14} className="text-gray-600 dark:text-gray-300" />
            </button>
            <button
              onClick={() => { setInputDate(date ?? ''); setInputTitle(title ?? ''); setInputDescription(description ?? ''); setIsEditing(true) }}
              className="p-1.5 bg-white dark:bg-neutral-800 hover:bg-gray-100 dark:hover:bg-neutral-700 rounded-md shadow border border-gray-200 dark:border-neutral-600 transition-colors"
              title="Edit"
            >
              <Edit3 size={14} className="text-gray-600 dark:text-gray-300" />
            </button>
            <button onClick={deleteNode} className="p-1.5 bg-white dark:bg-neutral-800 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-md shadow border border-gray-200 dark:border-neutral-600 transition-colors" title="Delete">
              <Trash2 size={14} className="text-red-500 dark:text-red-400" />
            </button>
          </div>
        )}
      </div>
    </NodeViewWrapper>
  )
}

export default CalendarNodeComponent
