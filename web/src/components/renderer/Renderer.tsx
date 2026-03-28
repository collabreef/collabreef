import React, { useState, useEffect, useRef } from 'react'
import { PhotoView, PhotoProvider } from 'react-photo-view'
import ShikiHighlighter from "react-shiki"
import { useTranslation } from 'react-i18next'

const ThreadsRendererEmbed: React.FC<{ url: string }> = ({ url }) => {
    const containerRef = useRef<HTMLDivElement>(null)
    useEffect(() => {
        if (!url || !containerRef.current) return
        const match = (() => { try { return new URL(url).pathname.match(/\/post\/([^/?#]+)/) } catch { return null } })()
        const postId = match?.[1]
        if (!postId) return
        const container = containerRef.current
        container.innerHTML = ''
        const blockquote = document.createElement('blockquote')
        blockquote.className = 'text-post-media'
        blockquote.setAttribute('data-text-post-permalink', url)
        blockquote.setAttribute('data-text-post-version', '0')
        blockquote.id = `ig-tp-${postId}`
        blockquote.style.cssText = 'background:#FFF;border-width:1px;border-style:solid;border-color:#00000026;border-radius:16px;max-width:650px;margin:1px;min-width:270px;padding:0;width:99.375%'
        container.appendChild(blockquote)
        const existing = document.getElementById('threads-embed-js')
        if (existing) existing.remove()
        const script = document.createElement('script')
        script.id = 'threads-embed-js'
        script.src = 'https://www.threads.com/embed.js'
        script.async = true
        container.appendChild(script)
        return () => { container.innerHTML = '' }
    }, [url])
    return <div ref={containerRef} />
}

interface Node {
    type: string
    content?: Node[]
    text?: string
    marks?: { type: string; attrs?: any }[]
    attrs?: any
}

interface RendererProps {
    content: string
    maxNodes?: number
}

const Renderer: React.FC<RendererProps> = ({ content, maxNodes }) => {
    const { t } = useTranslation()
    const [isExpanded, setIsExpanded] = useState(false)

    let json: Node
    try {
        json = JSON.parse(content)
    } catch (error) {
        return <div className='text-red-500'>Error parsing content</div>
    }

    const renderNode = (node: Node, key?: React.Key): React.ReactNode => {
        if (!node) return null

        const renderContent = () =>
            node.content?.map((child, idx) => renderNode(child, idx))

        switch (node.type) {
            case 'paragraph':
                return node.content ? <p className='leading-6' key={key}>{renderContent()}</p> : <div className='h-6' key={key}></div>
            case 'heading':
                const level = node.attrs?.level || 1
                const HeadingTag = `h${level}` as keyof JSX.IntrinsicElements
                return <HeadingTag key={key} className='py-2'>{renderContent()}</HeadingTag>
            case 'bulletList':
                return <ul key={key} className="">{renderContent()}</ul>
            case 'orderedList':
                return <ol key={key} className="">{renderContent()}</ol>
            case 'taskList':
                return <div key={key} className="list-none">{renderContent()}</div>
            case 'taskItem':
                return <div key={key} className='flex gap-1 items-start'>
                     <input
                            type='checkbox'
                            className="size-4 rounded bg-white mt-1 shrink-0"
                            checked={node.attrs?.checked}
                            disabled={true}
                            aria-label='checkbox'
                        />
                    {renderContent()}
                </div>
            case 'listItem':
                return <li key={key} className="">{renderContent()}</li>
            case 'codeBlock':
                return <div className='py-1' key={key}>
                    <ShikiHighlighter language={node.attrs?.language || 'text'} showLineNumbers={true} theme="ayu-dark">
                        {node.content?.map(d => d.text).join('') ?? ""}
                    </ShikiHighlighter>
                </div>
            case 'blockquote':
                return <div className='py-1' key={key}>
                    <blockquote className="border-l-4 border-gray-300 pl-4 italic text-gray-600">{renderContent()}</blockquote>
                </div>
            case 'horizontalRule':
                return <div className='' key={key}>
                    <hr />
                </div>
            case 'image':
                return <div className="" key={key}>
                    <PhotoView src={node.attrs?.src}>
                        <img className="rounded overflow-hidden max-w-full max-h-[620px]" alt={node.attrs?.alt || ''} src={node.attrs?.src} />
                    </PhotoView>
                </div>
            case 'attachment':
                return <a key={key} href={node.attrs?.src} className="text-blue-600">{node.attrs?.name}</a>
            case 'youtubeEmbed': {
                const url = node.attrs?.url
                let videoId: string | null = null
                try {
                    const parsed = new URL(url)
                    if (parsed.hostname === 'youtu.be') {
                        videoId = parsed.pathname.slice(1).split('?')[0] || null
                    } else if (parsed.hostname.includes('youtube.com')) {
                        if (parsed.pathname === '/watch') videoId = parsed.searchParams.get('v')
                        else if (parsed.pathname.startsWith('/embed/')) videoId = parsed.pathname.split('/embed/')[1].split('?')[0] || null
                        else if (parsed.pathname.startsWith('/shorts/')) videoId = parsed.pathname.split('/shorts/')[1].split('?')[0] || null
                    }
                } catch { /* ignore */ }
                if (!videoId) return null
                return <div key={key} className="w-full aspect-video rounded overflow-hidden">
                    <iframe className="w-full h-full" src={`https://www.youtube.com/embed/${videoId}`} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen title="YouTube video" />
                </div>
            }
            case 'threadsEmbed':
                return <ThreadsRendererEmbed key={key} url={node.attrs?.url} />
            case 'table':
                return <div className='max-w-full overflow-x-auto' key={key}>
                    <table className='w-full table-fixed'>{renderContent()}</table>
                </div>
            case 'tableRow':
                return <tr key={key}>{renderContent()}</tr>
            case 'tableHeader':
                return <th key={key} className='border bg-gray-200 dark:bg-gray-900'>{renderContent()}</th>
            case 'tableCell':
                return <td key={key} className='border'>{renderContent()}</td>
            case 'hardBreak':
                return <br key={key} />
            case 'text':
                let text: React.ReactNode = node.text
                if (node.marks) {
                    node.marks.forEach(mark => {
                        switch (mark.type) {
                            case 'bold':
                                text = <strong className='font-bold'>{text}</strong>
                                break
                            case 'italic':
                                text = <em className='italic'>{text}</em>
                                break
                            case 'strike':
                                text = <s className="line-through">{text}</s>
                                break
                            case 'code':
                                text = <code className='rounded text-sm bg-gray-300 text-gray-600 px-1 py-0.5'>{text}</code>
                                break
                            case 'link':
                                text = (
                                    <a
                                        href={mark.attrs?.href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        {text}
                                    </a>
                                )
                                break
                            default:
                                break
                        }
                    })
                }
                return text
            case 'doc':
                return <>{renderContent()}</>
            default:
                return null
        }
    }

    const allNodes = json.content || []
    const hasLimit = maxNodes && maxNodes > 0
    const shouldLimit = hasLimit && !isExpanded
    const nodesToRender = shouldLimit ? allNodes.slice(0, maxNodes) : allNodes
    const hasHiddenNodes = shouldLimit && allNodes.length > maxNodes
    const showCollapseButton = isExpanded && hasLimit

    return (
        <PhotoProvider>
            <div className='prose prose-sm sm:prose-base lg:prose-lg xl:prose-2xl max-w-full overflow-x-auto text-neutral-800 dark:text-gray-400'>
                {nodesToRender.map((node, idx) => renderNode(node, idx))}
                {hasHiddenNodes && (
                    <button
                        onClick={() => setIsExpanded(true)}
                        className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                    >
                        {t('actions.showMore')}
                    </button>
                )}
                {showCollapseButton && (
                    <button
                        onClick={() => setIsExpanded(false)}
                        className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                    >
                        {t('actions.showLess')}
                    </button>
                )}
            </div>
        </PhotoProvider>
    )
}

export default Renderer