import { useEditor, EditorContext, EditorContent } from "@tiptap/react"
import { FloatingMenu, BubbleMenu } from '@tiptap/react/menus'
import StarterKit from "@tiptap/starter-kit"
import { useMemo } from "react"

const Editor = ()=>{
  
  const editor = useEditor({
    extensions: [StarterKit], // define your extension array
    content: '<p>Hello World!</p>', // initial content
  })

  const providerValue = useMemo(() => ({ editor }), [editor])

  return (
    <EditorContext.Provider value={providerValue}>
      <EditorContent editor={editor} />
      <FloatingMenu editor={editor}>This is the floating menu</FloatingMenu>
      <BubbleMenu editor={editor}>This is the bubble menu</BubbleMenu>
    </EditorContext.Provider>
  )
}

export default Editor