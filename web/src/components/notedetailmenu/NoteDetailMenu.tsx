import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Ellipsis, Trash2 } from "lucide-react"
import { DropdownMenu } from "radix-ui"
import { useNavigate } from "react-router-dom"
import { deleteNote } from "../../api/note"
import useCurrentWorkspaceId from "../../hooks/useCurrentworkspaceId"
import { useTranslation } from "react-i18next"

interface Props {
    noteId: string
}

const NoteDetailMenu: React.FC<Props> = ({ noteId }) => {
    const { t } = useTranslation()
    const currentWorkspaceId = useCurrentWorkspaceId()
    const queryClient = useQueryClient()
    const navigate = useNavigate()
    const deleteNoteMutation = useMutation({
        mutationFn: () => deleteNote(currentWorkspaceId, noteId),
        onSuccess: async () => {
            try {
                await queryClient.invalidateQueries({ queryKey: ['notes', currentWorkspaceId] })
                navigate(`/workspaces/${currentWorkspaceId}`)
            } catch (error) {
                console.error('Error invalidating queries:', error)

            }
        },
    })

    const handleDelete = () => {
        deleteNoteMutation.mutate()
    }


    return <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
            <button
                title="menu" className="p-3 rounded-full "
            >
                <Ellipsis size={20} />
            </button>
        </DropdownMenu.Trigger>

        <DropdownMenu.Portal>
            <DropdownMenu.Content
                className="rounded-md w-48 bg-white text-gray-900 dark:bg-neutral-800 dark:border dark:border-gray-100 p-[5px] shadow-[0px_10px_38px_-10px_rgba(22,_23,_24,_0.35),_0px_10px_20px_-15px_rgba(22,_23,_24,_0.2)] will-change-[opacity,transform] data-[side=bottom]:animate-slideUpAndFade data-[side=left]:animate-slideRightAndFade data-[side=right]:animate-slideLeftAndFade data-[side=top]:animate-slideDownAndFade"

                align="end"
            >
                <DropdownMenu.Item className=" text-red-600  select-none rounded-lg leading-none text-violet11 outline-none data-[disabled]:pointer-events-none data-[highlighted]:bg-red-100 dark:data-[highlighted]:text-red-900 ">
                    <button onClick={handleDelete} className="flex gap-3 p-3 items-center w-full" >
                        <Trash2 size={20} />
                        {t("actions.delete")}
                    </button>
                </DropdownMenu.Item>
            </DropdownMenu.Content>
        </DropdownMenu.Portal>
    </DropdownMenu.Root>
}

export default NoteDetailMenu