import React from 'react'
import { NoteData } from '../../api/note'
import { PhotoView } from 'react-photo-view'
import ShikiHighlighter from "react-shiki";

interface Node {
    type: string
    content?: Node[]
    text?: string
    marks?: { type: string; attrs?: any }[]
    attrs?: any
}

interface RendererProps {
    json: Node
}

const Renderer: React.FC<RendererProps> = ({ json }) => {
    const renderNode = (node: Node, key?: React.Key): React.ReactNode => {
        if (!node) return null

        const renderContent = () =>
            node.content?.map((child, idx) => renderNode(child, idx))

        switch (node.type) {
            case 'paragraph':
                return <p className='px-4 leading-6' key={key}>{renderContent()}</p>
            case 'heading':
                const level = node.attrs?.level || 1
                const HeadingTag = `h${level}` as keyof JSX.IntrinsicElements
                return <HeadingTag key={key} className='px-4 py-2'>{renderContent()}</HeadingTag>
            case 'bulletList':
                return <ul key={key} className="px-4">{renderContent()}</ul>
            case 'orderedList':
                return <ol key={key} className="px-4">{renderContent()}</ol>
            case 'taskList':
                return <div key={key} className="px-4">{renderContent()}</div>
            case 'taskItem':
                return <div className='px-4 flex'><input disabled={true} type='checkbox' checked={node.attrs.checked} aria-label='checkbox' />{renderContent()}</div>
            case 'listItem':
                return <li key={key} className="px-4">{renderContent()}</li>
            case 'codeBlock':
                return <div className='px-4 py-1'>
                    <ShikiHighlighter language={node.attrs.language} showLineNumbers={true} theme="ayu-dark">
                        {node.content?.map(d => d.text).join('') ?? ""}
                    </ShikiHighlighter>
                </div>
            case 'blockquote':
                return <div className='px-4 py-1'>
                    <blockquote key={key} className="border-l-4 border-gray-300">{renderContent()}</blockquote>
                </div>
            case 'horizontalRule':
                return <div className='p-4'>
                    <hr key={key} />
                </div>
            case 'image':
                return <div className="px-4">
                    <PhotoView src={node.attrs?.src} >
                        <img className=" rounded overflow-hidden max-w-full max-h-[620px]" key={key} alt={node.attrs?.name || ''} src={node.attrs?.src} />
                    </PhotoView>
                </div>
            case 'attachment':
                return <a href={node.attrs.src} className="px-4 text-blue-600">{node.attrs.name}</a>
            case 'table':
                return <div className='px-4 max-w-full overflow-x-auto'>
                    <table className='w-full table-fixed'>{renderContent()}</table>
                </div>
            case 'tableRow':
                return <tr>{renderContent()}</tr>
            case 'tableHeader':
                return <th className='border bg-gray-200 dark:bg-gray-900'>{renderContent()}</th>
            case 'tableCell':
                return <td className='border'>{renderContent()}</td>
            case 'hardBreak':
                return <br key={key} />
            case 'text':
                let text: React.ReactNode = node.text
                if (node.marks) {
                    node.marks.forEach(mark => {
                        switch (mark.type) {
                            case 'bold':
                                text = <strong key={key}>{text}</strong>
                                break
                            case 'italic':
                                text = <em key={key}>{text}</em>
                                break
                            case 'strike':
                                text = <s key={key}>{text}</s>
                                break
                            case 'code':
                                text = <code key={key}>{text}</code>
                                break
                            case 'link':
                                text = (
                                    <a
                                        key={key}
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
            default:
                return <></>
        }
    }

    return <div className=' max-w-full  overflow-x-auto'>{(json.content || []).map((node, idx) => renderNode(node, idx))}</div>
}

export const ConvertToNode: (n: NoteData) => Node = (noteData: NoteData) => {
    let node: Node = {
        type: 'doc',
        content: []
    }

    node.content = noteData.blocks?.map(b => {
        return {
            type: b.type,
            content: b.data.content,
            attrs: b.data.attrs
        }
    })

    return node
}

export default Renderer