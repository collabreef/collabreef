import { NodeViewProps, NodeViewWrapper } from "@tiptap/react"

const AIGenerationComponent: React.FC<NodeViewProps> = ({ node }) => {

    return (
        <NodeViewWrapper as="p">
            123
            {JSON.stringify(node.attrs)}
        </NodeViewWrapper>
    )
}

export default AIGenerationComponent