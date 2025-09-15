import { Dot } from "lucide-react"
import { FC } from "react"
import DOMPurify from 'dompurify';
import { PhotoView } from "react-photo-view";

interface Props {
    block: any
}

const BlockRenderer: FC<Props> = ({ block }) => {
    if (block.type == "paragraph") {
        return block.data.text == "" ? <div className=" p-4 "></div> : <div className=" px-4 ">
            <p className="leading-6" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(block.data.text) }}></p>
        </div>
    }
    else if (block.type == "header") {
        return block.data.level == 1 ? <h1 className=" px-4 py-3">{block.data.text}</h1> :
            block.data.level == 2 ? <h2 className=" px-4 py-2">{block.data.text}</h2> :
                block.data.level == 3 ? <h3 className=" px-4 py-1.5">{block.data.text}</h3> :
                    block.data.level == 4 ? <h4 className=" px-4 py-1.5">{block.data.text}</h4> :
                        block.data.level == 5 ? <h5 className=" px-4 py-1.5">{block.data.text}</h5> :
                            block.data.level == 6 ? <h6 className=" px-4 py-1.5">{block.data.text}</h6> : <></>
    }
    else if (block.type == "quote") {
        return <div className="py-2 px-4">
            <figure className="p-2 border-l-4 border-blue-500 pl-4 italic ">
                <blockquote>
                    {block.data.text}
                </blockquote>
            </figure>
        </div>
    }
    else if (block.type == "code") {
        return <div className="py-2 px-4">
            <pre className="p-4 bg-gray-100 text-gray-800 
            dark:bg-gray-900 dark:text-gray-100 dark:border rounded-lg whitespace-pre-wrap overflow-x-auto">
                <code className="font-mono text-sm">
                    {block.data.code}
                </code>
            </pre>
        </div>
    }
    else if (block.type == "embed") {
        return <div className="py-2 px-4">
            <iframe src={block.data.embed} width={"100%"} height={block.data.height} title={block.data.source} allowFullScreen></iframe>
        </div>
    }
    else if (block.type == "table") {
        const { withHeadings, content } = block.data;

        return (
            <div className="py-2 px-4 overflow-x-auto w-full">
                <table className="border-collapse border border-gray-400  w-full">
                    {withHeadings && (
                        <thead>
                            <tr className="bg-gray-100">
                                {content[0].map((cell: any, idx: number) => (
                                    <th className="whitespace-nowrap border border-gray-300 p-2 font-bold" key={idx}>{cell}</th>
                                ))}
                            </tr>
                        </thead>
                    )}
                    <tbody>
                        {content.slice(withHeadings ? 1 : 0).map((row: any, rowIdx: number) => (
                            <tr key={rowIdx}>
                                {row.map((cell: any, cellIdx: number) => (
                                    <td className="border border-gray-300 text-center p-2" key={cellIdx}>{cell}</td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    }
    else if (block.type == "attaches") {
        return <div className=" px-4 py-1.5">
            <a href={block.data.file.url} className="text-sky-700">
                {block.data.file.name}
            </a>
        </div>
    }
    else if (block.type == "image") {
        return <div className="px-4">
            <PhotoView src={block.data.file.url} >
                <img className=" rounded overflow-hidden max-w-full max-h-[620px]" alt={block.data.file.name} src={block.data.file.url} />
            </PhotoView>
        </div>
    }
    else if (block.type == "list" && block.data.style == "checklist") {
        return <div className="flex flex-col gap-0.5  px-4 py-1.5 leading-6">
            {
                block.data.items.map((x: any) => (
                    <div className="flex items-center gap-1">
                        <input type="checkbox" title={x.content} checked={x.meta.checked} readOnly />
                        {x.content}
                    </div>
                ))
            }
        </div>
    }
    else if (block.type == "list" && block.data.style == "ordered") {
        return <div className="flex flex-col gap-0.5  px-4 py-1.5 leading-6">
            {
                block.data.items.map((x: any, i: number) => (
                    <div className="flex items-center gap-1">
                        <span>
                            {i + 1}.
                        </span>
                        {x.content}
                    </div>
                ))
            }
        </div>
    }
    else if (block.type == "list" && block.data.style == "unordered") {
        return <div className="flex flex-col gap-0.5  px-4 py-1.5 leading-6">
            {
                block.data.items.map((x: any) => (
                    <div className="flex items-center gap-1">
                        <span>
                            <Dot />
                        </span>
                        {x.content}
                    </div>
                ))
            }
        </div>
    }

    return <>
        {JSON.stringify(block)}
    </>
}

export default BlockRenderer