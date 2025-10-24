import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

interface RendererProps {
    content: string
}

const Renderer: React.FC<RendererProps> = ({ content }) => {
    const { t } = useTranslation()
    const processedContent = useMemo(() => {
        if (!content) return ''

        const parser = new DOMParser()
        const doc = parser.parseFromString(content, 'text/html')

        // Convert <image-node> tags to <img> tags
        const imageNodes = doc.querySelectorAll('image-node')
        imageNodes.forEach(node => {
            const src = node.getAttribute('src')
            const name = node.getAttribute('name')

            if (src) {
                const img = doc.createElement('img')
                img.src = src
                img.alt = name || ''
                img.className = 'image-node select-none rounded box-border w-auto'
                node.replaceWith(img)
            }
        })

        // Convert <file-node> tags to download links
        const fileNodes = doc.querySelectorAll('file-node')
        fileNodes.forEach(node => {
            const src = node.getAttribute('src')
            const name = node.getAttribute('name')

            if (src && name) {
                const wrapper = doc.createElement('div')
                wrapper.className = 'file-node select-none border rounded p-2 flex items-center gap-2 bg-gray-50 my-2'

                const link = doc.createElement('a')
                link.href = src
                link.textContent = name
                link.target = '_blank'
                link.rel = 'noopener noreferrer'
                link.className = 'text-blue-700 underline'

                const downloadLink = doc.createElement('a')
                downloadLink.href = src
                downloadLink.download = name
                downloadLink.className = 'ml-auto text-sm text-gray-600 hover:text-gray-900'
                downloadLink.innerHTML = t('actions.download')
                downloadLink.title = t('actions.download')

                wrapper.appendChild(link)
                wrapper.appendChild(downloadLink)
                node.replaceWith(wrapper)
            }
        })

        // Remove <textgen-node> tags (they should not appear in saved content)
        const textgenNodes = doc.querySelectorAll('textgen-node')
        textgenNodes.forEach(node => node.remove())

        return doc.body.innerHTML
    }, [content, t])

    return (
        <div
            className='prose prose-sm sm:prose-base lg:prose-lg xl:prose-2xl px-4 max-w-full overflow-x-auto'
            dangerouslySetInnerHTML={{ __html: processedContent }}
        />
    )
}

export default Renderer