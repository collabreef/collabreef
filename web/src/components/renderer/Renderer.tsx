import React, { useState, useEffect, useRef } from 'react'
import { PhotoView, PhotoProvider } from 'react-photo-view'
import ShikiHighlighter from "react-shiki"
import { useTranslation } from 'react-i18next'
import { FileText, ChevronDown, LoaderCircle, CalendarDays, MapPin, ExternalLink } from 'lucide-react'
import { useParams } from 'react-router-dom'
import { getNote, NoteData } from '@/api/note'
import { MapContainer, TileLayer, Marker } from 'react-leaflet'
import { Icon } from 'leaflet'

const InstagramRendererEmbed: React.FC<{ url: string }> = ({ url }) => {
    const containerRef = useRef<HTMLDivElement>(null)
    useEffect(() => {
        if (!url || !containerRef.current) return
        const match = (() => { try { return new URL(url).pathname.match(/\/(p|reel|tv)\/([^/?#]+)/) } catch { return null } })()
        const postId = match?.[2]
        if (!postId) return
        const container = containerRef.current
        container.innerHTML = ''
        const blockquote = document.createElement('blockquote')
        blockquote.className = 'instagram-media'
        blockquote.setAttribute('data-instgrm-captioned', '')
        blockquote.setAttribute('data-instgrm-permalink', url)
        blockquote.setAttribute('data-instgrm-version', '14')
        blockquote.style.cssText = 'background:#FFF;border:0;border-radius:3px;box-shadow:0 0 1px 0 rgba(0,0,0,0.5),0 1px 10px 0 rgba(0,0,0,0.15);margin:1px;max-width:540px;min-width:326px;padding:0;width:99.375%'
        container.appendChild(blockquote)
        const existing = document.getElementById('instagram-embed-js')
        if (existing) existing.remove()
        const script = document.createElement('script')
        script.id = 'instagram-embed-js'
        script.src = 'https://www.instagram.com/embed.js'
        script.async = true
        container.appendChild(script)
        return () => { container.innerHTML = '' }
    }, [url])
    return <div ref={containerRef} />
}

const TiktokRendererEmbed: React.FC<{ url: string }> = ({ url }) => {
    const containerRef = useRef<HTMLDivElement>(null)
    useEffect(() => {
        if (!url || !containerRef.current) return
        const match = (() => { try { return new URL(url).pathname.match(/\/video\/(\d+)/) } catch { return null } })()
        const videoId = match?.[1]
        if (!videoId) return
        const container = containerRef.current
        container.innerHTML = ''
        const blockquote = document.createElement('blockquote')
        blockquote.className = 'tiktok-embed'
        blockquote.setAttribute('cite', url)
        blockquote.setAttribute('data-video-id', videoId)
        blockquote.style.cssText = 'max-width:605px;min-width:325px;'
        const section = document.createElement('section')
        blockquote.appendChild(section)
        container.appendChild(blockquote)
        const existing = document.getElementById('tiktok-embed-js')
        if (existing) existing.remove()
        const script = document.createElement('script')
        script.id = 'tiktok-embed-js'
        script.src = 'https://www.tiktok.com/embed.js'
        script.async = true
        container.appendChild(script)
        return () => { container.innerHTML = '' }
    }, [url])
    return <div ref={containerRef} />
}

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

// ── Leaflet marker icon (same as editor) ─────────────────────────────────────
const rendererMarkerIcon = new Icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
})

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const WEEKDAYS   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

const CalendarEventRenderer: React.FC<{ date?: string; title?: string; description?: string }> = ({ date, title, description }) => {
    const formatted = (() => {
        if (!date) return null
        try {
            const d = new Date(date)
            if (isNaN(d.getTime())) return null
            return {
                day: String(d.getDate()).padStart(2, '0'),
                month: MONTH_NAMES[d.getMonth()],
                year: String(d.getFullYear()),
                weekday: WEEKDAYS[d.getDay()],
            }
        } catch { return null }
    })()

    return (
        <div className="my-1 flex items-stretch rounded-lg border dark:border-neutral-700 overflow-hidden bg-white dark:bg-neutral-900 shadow-sm">
            <div className="flex flex-col items-center justify-center bg-blue-600 dark:bg-blue-700 text-white px-4 py-3 min-w-[72px] select-none">
                {formatted ? (
                    <>
                        <span className="text-xs font-medium uppercase tracking-wide opacity-80">{formatted.month}</span>
                        <span className="text-3xl font-bold leading-none">{formatted.day}</span>
                        <span className="text-xs opacity-80 mt-0.5">{formatted.weekday}</span>
                    </>
                ) : (
                    <CalendarDays size={28} className="opacity-70" />
                )}
            </div>
            <div className="flex flex-col justify-center px-4 py-3 flex-1 min-w-0">
                {title && <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">{title}</p>}
                {formatted && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {formatted.weekday}, {formatted.month} {formatted.day}, {formatted.year}
                    </p>
                )}
                {description && <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">{description}</p>}
            </div>
        </div>
    )
}

const LocationRenderer: React.FC<{ lat: number; lng: number; name?: string; address?: string; zoom?: number }> = ({
    lat, lng, name, address, zoom = 15,
}) => (
    <div className="my-1 rounded-lg border dark:border-neutral-700 overflow-hidden bg-white dark:bg-neutral-900 shadow-sm">
        <div style={{ height: 220 }} className="w-full">
            <MapContainer
                center={[lat, lng]}
                zoom={zoom}
                className="h-full w-full"
                zoomControl={false}
                scrollWheelZoom={false}
                dragging={false}
                doubleClickZoom={false}
                attributionControl={false}
            >
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <Marker position={[lat, lng]} icon={rendererMarkerIcon} />
            </MapContainer>
        </div>
        <div className="flex items-center justify-between gap-2 px-3 py-2 border-t dark:border-neutral-700">
            <div className="flex items-center gap-1.5 min-w-0">
                <MapPin size={14} className="text-red-500 shrink-0" />
                <div className="min-w-0">
                    {name && <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">{name}</p>}
                    {address && address !== name && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{address}</p>
                    )}
                </div>
            </div>
            <a
                href={`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=15/${lat}/${lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 p-1 rounded hover:bg-gray-100 dark:hover:bg-neutral-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                title="Open in OpenStreetMap"
            >
                <ExternalLink size={14} />
            </a>
        </div>
    </div>
)

const SubPageRendererBlock: React.FC<{ noteId: string; title: string; workspaceId?: string }> = ({ noteId, title, workspaceId: workspaceIdProp }) => {
    const { t } = useTranslation()
    const { workspaceId: workspaceIdParam } = useParams<{ workspaceId?: string }>()
    const workspaceId = workspaceIdProp || workspaceIdParam
    const [isExpanded, setIsExpanded] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [subNote, setSubNote] = useState<NoteData | null>(null)

    const handleClick = async () => {
        if (!workspaceId) return
        const expanding = !isExpanded
        setIsExpanded(expanding)
        if (expanding && !subNote && !isLoading) {
            setIsLoading(true)
            try {
                const note = await getNote(workspaceId, noteId)
                setSubNote(note)
            } catch (e) {
                console.error('Failed to fetch sub note', e)
            } finally {
                setIsLoading(false)
            }
        }
    }

    return (
        <div className="border dark:border-neutral-700 rounded-lg my-1 overflow-hidden">
            <div
                className={`flex items-center gap-2 p-3 bg-gray-50 dark:bg-neutral-800/50 transition-colors ${workspaceId ? 'cursor-pointer hover:bg-gray-100 dark:hover:bg-neutral-700/50' : 'cursor-default'}`}
                onClick={handleClick}
            >
                <FileText size={16} className="text-gray-400 flex-shrink-0" />
                <span className="flex-1 text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                    {title || t("notes.untitled")}
                </span>
                {workspaceId && (
                    <ChevronDown size={14} className={`text-gray-400 flex-shrink-0 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                )}
            </div>
            {isExpanded && (
                <div className="p-3 border-t dark:border-neutral-700">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-3">
                            <LoaderCircle size={16} className="text-gray-400 animate-spin" />
                        </div>
                    ) : subNote ? (
                        <>
                            {subNote.title && (
                                <div className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-2">
                                    {subNote.title}
                                </div>
                            )}
                            <Renderer content={subNote.content} workspaceId={workspaceId} />
                        </>
                    ) : null}
                </div>
            )}
        </div>
    )
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
    workspaceId?: string
}

const Renderer: React.FC<RendererProps> = ({ content, maxNodes, workspaceId: workspaceIdProp }) => {
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
            case 'instagramEmbed':
                return <InstagramRendererEmbed key={key} url={node.attrs?.url} />
            case 'tiktokEmbed':
                return <TiktokRendererEmbed key={key} url={node.attrs?.url} />
            case 'calendarNode':
                return <CalendarEventRenderer key={key} date={node.attrs?.date} title={node.attrs?.title} description={node.attrs?.description} />
            case 'locationNode': {
                const { lat, lng } = node.attrs ?? {}
                if (lat == null || lng == null) return null
                return <LocationRenderer key={key} lat={lat} lng={lng} name={node.attrs?.name} address={node.attrs?.address} zoom={node.attrs?.zoom ?? 15} />
            }
            case 'subPage':
                if (!node.attrs?.noteId) return null
                return <SubPageRendererBlock key={key} noteId={node.attrs.noteId} title={node.attrs?.title || ''} workspaceId={workspaceIdProp} />
            case 'video':
                return <div key={key} className="w-full rounded overflow-hidden">
                    <video className="w-full max-h-[620px]" src={node.attrs?.src} controls />
                </div>
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
    const trimTrailingEmptyParagraphs = (nodes: Node[]) => {
        let end = nodes.length
        while (end > 0 && nodes[end - 1].type === 'paragraph' && !nodes[end - 1].content) end--
        return nodes.slice(0, end)
    }
    const hasLimit = maxNodes && maxNodes > 0
    const shouldLimit = hasLimit && !isExpanded
    const nodesToRender = trimTrailingEmptyParagraphs(shouldLimit ? allNodes.slice(0, maxNodes) : allNodes)
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