import { Edit, FileText } from "lucide-react"
import { useTranslation } from "react-i18next"
import { getNotes, NoteData, createNote } from "@/api/note"
import useCurrentWorkspaceId from "@/hooks/use-currentworkspace-id"
import { useNavigate } from "react-router-dom"
import { useInfiniteQuery, useMutation } from "@tanstack/react-query"
import { useRef, useCallback } from "react"
import { toast } from "@/stores/toast"
import NoteList from "@/components/notecard/NoteList"
import NoteListSkeleton from "@/components/notecard/NoteListSkeleton"

const PAGE_SIZE = 10;

const NotesPage = () => {
    const currentWorkspaceId = useCurrentWorkspaceId();
    const { t } = useTranslation()
    const navigate = useNavigate();
    const observerRef = useRef<IntersectionObserver | null>(null);
    const scrollContainerRef = useRef<HTMLDivElement | null>(null);

    const createNoteMutation = useMutation({
        mutationFn: (data: NoteData) => createNote(currentWorkspaceId, data),
        onSuccess: (data) => {
            navigate(`./${data.id}?mode=edit`)
        },
        onError: (error) => {
            toast.error(t("messages.createNoteFailed"))
            console.error("Failed to create note:", error)
        }
    })

    const handleCreateNote = () => {
        const emptyContent = JSON.stringify({
            type: "doc",
            content: [{ type: "paragraph", content: [{ type: "text", text: "" }] }]
        })
        createNoteMutation.mutate({ content: emptyContent, visibility: "private" })
    }

    const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
        queryKey: ['notes', currentWorkspaceId, ''],
        queryFn: async ({ pageParam = 1 }: { pageParam?: unknown }) => {
            return await getNotes(currentWorkspaceId, Number(pageParam), PAGE_SIZE, "")
        },
        enabled: !!currentWorkspaceId,
        getNextPageParam: (lastPage, allPages) =>
            lastPage.length === PAGE_SIZE ? allPages.length + 1 : undefined,
        refetchOnWindowFocus: false,
        staleTime: 0,
        initialPageParam: 1
    })

    const loadMoreRef = useCallback((node: HTMLDivElement | null) => {
        if (observerRef.current) observerRef.current.disconnect();
        if (node && hasNextPage && !isFetchingNextPage && scrollContainerRef.current) {
            observerRef.current = new IntersectionObserver(
                (entries) => { if (entries[0].isIntersecting) fetchNextPage() },
                { root: scrollContainerRef.current, rootMargin: '50px', threshold: 0.1 }
            );
            observerRef.current.observe(node);
        }
    }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

    const notes = data?.pages.flat() || [];
    const isEmpty = !isLoading && notes.length === 0

    return (
        <div ref={scrollContainerRef} className="h-full overflow-auto bg-neutral-50 dark:bg-neutral-950">
            {isLoading ? (
                <div className="max-w-2xl mx-auto px-6 pt-8">
                    <NoteListSkeleton />
                </div>
            ) : isEmpty ? (
                <div className="flex flex-col items-center justify-center h-full text-center px-6">
                    <FileText size={48} className="text-gray-200 dark:text-neutral-700 mb-4" />
                    <p className="text-gray-400 dark:text-neutral-500 text-sm mb-6">
                        {t("messages.noMoreNotes")}
                    </p>
                    <button
                        onClick={handleCreateNote}
                        disabled={createNoteMutation.isPending}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                        <Edit size={15} />
                        {t("actions.newNote")}
                    </button>
                </div>
            ) : (
                <div className="max-w-2xl mx-auto px-6 pt-8 pb-4">
                    <NoteList notes={notes} maxNodes={3} getLinkTo={(note) => `${note.id}`} />
                    <div ref={loadMoreRef} className="h-4" />
                    {isFetchingNextPage && <NoteListSkeleton count={3} />}
                    {!hasNextPage && notes.length > 0 && (
                        <div className="text-center py-4 text-xs text-gray-400">
                            {t("messages.noMoreNotes")}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

export default NotesPage
