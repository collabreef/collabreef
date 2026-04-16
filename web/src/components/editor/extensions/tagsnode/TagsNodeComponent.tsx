import { NodeViewProps, NodeViewWrapper } from '@tiptap/react'
import { ChevronUp, ChevronDown, Trash2, Tag, X, Plus } from 'lucide-react'
import { useState, useRef, useEffect, KeyboardEvent } from 'react'

// ── Deterministic colour per tag (hue derived from tag text) ─────────────────
const TAG_STYLE = { bg: 'bg-gray-100 dark:bg-neutral-700', text: 'text-gray-600 dark:text-gray-300' }

// ── Tag chip ──────────────────────────────────────────────────────────────────
function TagChip({ label, onRemove }: { label: string; onRemove?: () => void }) {
  const { bg, text } = TAG_STYLE
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${bg} ${text} select-none`}>
      {label}
      {onRemove && (
        <button
          onClick={onRemove}
          className="ml-0.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 p-0.5 transition-colors"
          tabIndex={-1}
        >
          <X size={10} strokeWidth={2.5} />
        </button>
      )}
    </span>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
const TagsNodeComponent: React.FC<NodeViewProps> = ({
  node,
  updateAttributes,
  selected,
  editor,
  deleteNode,
  getPos,
}) => {
  const tags: string[] = node.attrs.tags ?? []
  const isEditable = editor.isEditable

  const [showActions, setShowActions] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [_, setIsFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-focus when freshly inserted and empty
  useEffect(() => {
    if (isEditable && tags.length === 0) {
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const addTag = (raw: string) => {
    const trimmed = raw.trim().replace(/^#+/, '') // strip leading #
    if (!trimmed || tags.includes(trimmed)) return
    updateAttributes({ tags: [...tags, trimmed] })
  }

  const removeTag = (idx: number) => {
    updateAttributes({ tags: tags.filter((_, i) => i !== idx) })
  }

  const commitInput = () => {
    // split on comma/space so user can paste "a, b, c"
    inputValue.split(/[,，\s]+/).forEach(t => addTag(t))
    setInputValue('')
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',' || e.key === '，') {
      e.preventDefault()
      commitInput()
    } else if (e.key === 'Backspace' && inputValue === '' && tags.length > 0) {
      removeTag(tags.length - 1)
    } else if (e.key === 'Escape') {
      setInputValue('')
      inputRef.current?.blur()
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
    editor.view.dispatch(state.tr.replaceWith(pos - nodeBefore.nodeSize, pos + node.nodeSize, [node, nodeBefore]))
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
    editor.view.dispatch(state.tr.replaceWith(pos, nodeAfterPos + nodeAfter.nodeSize, [nodeAfter, node]))
  }

  // ── Read-only display ───────────────────────────────────────────────────────
  if (!isEditable) {
    if (tags.length === 0) return null
    return (
      <NodeViewWrapper>
        <div className="flex flex-wrap gap-1.5 my-1">
          {tags.map(t => <TagChip key={t} label={t} />)}
        </div>
      </NodeViewWrapper>
    )
  }

  // ── Editable ────────────────────────────────────────────────────────────────
  return (
    <NodeViewWrapper>
      <div
        className={`relative group my-1`}
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
      >
        <div
          className="flex flex-wrap items-center gap-1.5 px-1 py-1 cursor-text"
          onClick={() => inputRef.current?.focus()}
        >
          {/* Tag icon */}
          <Tag size={14} className="text-gray-400 dark:text-gray-500 shrink-0" />

          {/* Existing tags */}
          {tags.map((t, i) => (
            <TagChip key={t} label={t} onRemove={() => removeTag(i)} />
          ))}

          {/* Input */}
          <input
            ref={inputRef}
            type="text"
            className="flex-1 min-w-[120px] bg-transparent text-sm text-gray-800 dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-500 outline-none border-none"
            placeholder={tags.length === 0 ? 'Add tags… (Enter or comma to confirm)' : 'Add tag…'}
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => { setIsFocused(false); commitInput() }}
          />

          {/* Inline add button */}
          {inputValue.trim() && (
            <button
              onMouseDown={e => { e.preventDefault(); commitInput() }}
              className="shrink-0 p-0.5 rounded hover:bg-gray-200 dark:hover:bg-neutral-700 text-gray-500 transition-colors"
              tabIndex={-1}
            >
              <Plus size={14} />
            </button>
          )}
        </div>

        {/* Action buttons */}
        {(showActions || selected) && (
          <div className="absolute top-1/2 -translate-y-1/2 right-1.5 flex gap-1 z-10">
            <button
              onClick={handleMoveUp}
              className="p-1.5 bg-white dark:bg-neutral-800 hover:bg-gray-100 dark:hover:bg-neutral-700 rounded-md shadow border border-gray-200 dark:border-neutral-600 transition-colors"
              title="Move up"
            >
              <ChevronUp size={14} className="text-gray-600 dark:text-gray-300" />
            </button>
            <button
              onClick={handleMoveDown}
              className="p-1.5 bg-white dark:bg-neutral-800 hover:bg-gray-100 dark:hover:bg-neutral-700 rounded-md shadow border border-gray-200 dark:border-neutral-600 transition-colors"
              title="Move down"
            >
              <ChevronDown size={14} className="text-gray-600 dark:text-gray-300" />
            </button>
            <button
              onClick={deleteNode}
              className="p-1.5 bg-white dark:bg-neutral-800 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-md shadow border border-gray-200 dark:border-neutral-600 transition-colors"
              title="Delete"
            >
              <Trash2 size={14} className="text-red-500 dark:text-red-400" />
            </button>
          </div>
        )}
      </div>
    </NodeViewWrapper>
  )
}

export default TagsNodeComponent
