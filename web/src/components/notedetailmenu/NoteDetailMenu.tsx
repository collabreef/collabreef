import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Building, Ellipsis, Globe, Info, Lock, Trash2 } from "lucide-react"
import { DropdownMenu } from "radix-ui"
import { useNavigate } from "react-router-dom"
import { deleteNote, NoteData, updateNoteVisibility } from "@/api/note"
import useCurrentWorkspaceId from "@/hooks/use-currentworkspace-id"
import { useTranslation } from "react-i18next"
import { toast } from '@/stores/toast';
import { FC, ReactNode } from "react"
import { Visibility } from "@/types/visibility"
import { useTwoColumn } from "@/components/twocolumn"
import { twMerge } from "tailwind-merge"

interface Props {
    note: NoteData
}

const NoteDetailMenu: React.FC<Props> = ({ note }) => {
    const { t } = useTranslation()
    const { isSidebarCollapsed, toggleSidebar } = useTwoColumn()
    const currentWorkspaceId = useCurrentWorkspaceId()
    const queryClient = useQueryClient()
    const navigate = useNavigate()
    const deleteNoteMutation = useMutation({
        mutationFn: () => deleteNote(currentWorkspaceId, note.id!),
        onSuccess: async () => {
            try {
                await queryClient.invalidateQueries({ queryKey: ['notes', currentWorkspaceId] })
                navigate(`/workspaces/${currentWorkspaceId}`)
            } catch (error) {
                toast.error("failed to delete note")
            }
        },
    })
    const updateVisibiltyMutation = useMutation({
        mutationFn: (visibility: Visibility) => updateNoteVisibility(currentWorkspaceId, note.id!, visibility),
        onSuccess: async () => {
            try {
                await queryClient.invalidateQueries({ queryKey:  ['note', currentWorkspaceId, note.id!] })
            } catch (error) {
                toast.error("failed to update note visibility")
            }
        },
    })

    const handleDelete = () => {
        deleteNoteMutation.mutate()
    }

    const handleUpdateVisibility = (visibility: Visibility) =>{
        if(confirm(`Make this note ${visibility}?`)){
            updateVisibiltyMutation.mutate(visibility)
        }
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
                className="rounded-md w-56 bg-white text-gray-900 dark:bg-neutral-800  p-[5px] shadow-[0px_10px_38px_-10px_rgba(22,_23,_24,_0.35),_0px_10px_20px_-15px_rgba(22,_23,_24,_0.2)] will-change-[opacity,transform] data-[side=bottom]:animate-slideUpAndFade data-[side=left]:animate-slideRightAndFade data-[side=right]:animate-slideLeftAndFade data-[side=top]:animate-slideDownAndFade"
                align="end"
            >
                {
                    <DropdownItem className="lg:hidden">
                        <button
                            onClick={toggleSidebar}
                            className=" flex gap-3 p-3 items-center w-full"
                            title={isSidebarCollapsed ? "Show Info" : "Hide Info"}
                        >
                            <Info size={18} />
                            {t("actions.openNoteInfo")}
                        </button>
                    </DropdownItem>
                }
                {
                    note.visibility != "public" && <DropdownItem>
                        <button onClick={() => handleUpdateVisibility("public")} className="flex gap-3 p-3 items-center w-full" >
                            <Globe size={20} />
                            {t("actions.makePublic")}
                        </button>
                    </DropdownItem>
                }

                {
                    note.visibility != "workspace" && <DropdownItem>
                        <button onClick={() => handleUpdateVisibility("workspace")} className="flex gap-3 p-3 items-center w-full" >
                            <Building size={20} />
                            {t("actions.makeWorkspace")}
                        </button>
                    </DropdownItem>
                }

                {
                    note.visibility != "private" && <DropdownItem>
                        <button onClick={() => handleUpdateVisibility("private")} className="flex gap-3 p-3 items-center w-full" >
                            <Lock size={20} />
                            {t("actions.makePrivate")}
                        </button>
                    </DropdownItem>
                }

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

interface DropdownItemProps {
    children: ReactNode
    className?: string
}

const DropdownItem: FC<DropdownItemProps> = ({ children, className }) => {
    return <DropdownMenu.Item className={twMerge("select-none dark:text-gray-100 rounded-lg leading-none outline-none data-[disabled]:pointer-events-none data-[highlighted]:bg-neutral-300 dark:data-[highlighted]:text-neutral-700", className)}>
        {children}
    </DropdownMenu.Item>
}


export default NoteDetailMenu