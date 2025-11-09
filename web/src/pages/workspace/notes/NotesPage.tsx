import { Edit, LayoutGrid, LayoutList, Search, X } from "lucide-react"
import { useTranslation } from "react-i18next"
import SidebarButton from "@/components/sidebar/SidebarButton"
import { getNotes, NoteData, createNote } from "@/api/note"
import useCurrentWorkspaceId from "@/hooks/use-currentworkspace-id"
import { useNavigate } from "react-router-dom"
import { useInfiniteQuery, useMutation } from "@tanstack/react-query"
import { useRef, useCallback, useState, useEffect } from "react"
import { Tooltip } from "radix-ui"
import { useWorkspaceStore } from "@/stores/workspace"
import NoteMasonry from "@/components/notecard/NoteMasonry"
import NoteList from "@/components/notecard/NoteList"
import NoteMasonrySkeleton from "@/components/notecard/NoteMasonrySkeleton"
import NoteListSkeleton from "@/components/notecard/NoteListSkeleton"
import { toast } from "@/stores/toast"
import OneColumn from "@/components/onecolumn/OneColumn"

const PAGE_SIZE = 20;

const NotesPage = () => {
    const [query, setQuery] = useState("")
    const [debouncedQuery, setDebouncedQuery] = useState(query);
    const { getWorkspaceById } = useWorkspaceStore()
    const currentWorkspaceId = useCurrentWorkspaceId();
    const [isSearchVisible, setIsSearchVisible] = useState(false);
    const { t } = useTranslation()
    const [isMasonryView, setIsMasonryView] = useState(true)
    const observerRef = useRef<IntersectionObserver | null>(null);
    const navigate = useNavigate();

    const createNoteMutation = useMutation({
        mutationFn: (data: NoteData) => createNote(currentWorkspaceId, data),
        onSuccess: (data) => {
            navigate(`note/${data.id}`)
        },
        onError: (error) => {
            toast.error(t("messages.createNoteFailed"))
            console.error("Failed to create note:", error)
        }
    })

    const handleCreateNote = () => {
        createNoteMutation.mutate({
            content: "",
            visibility: "private"
        })
    }

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedQuery(query);
        }, 500);

        return () => {
            clearTimeout(handler);
        };
    }, [query]);

    const {
        data,
        isLoading,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        refetch
    } = useInfiniteQuery({
        queryKey: ['notes', currentWorkspaceId],
        queryFn: ({ pageParam = 1 }: { pageParam?: unknown }) =>
            getNotes(currentWorkspaceId, Number(pageParam), PAGE_SIZE, debouncedQuery),
        enabled: !!currentWorkspaceId,
        getNextPageParam: (lastPage, allPages) => {
            if (!lastPage || lastPage.length < PAGE_SIZE) return undefined;
            return allPages.length + 1;
        },
        refetchOnWindowFocus: false,
        staleTime: 0,
        initialPageParam: 1
    })

    useEffect(() => {
        refetch();
    }, [debouncedQuery, refetch]);

    const loadMoreRef = useCallback((node: HTMLDivElement | null) => {
        if (observerRef.current) {
            observerRef.current.disconnect();
        }
        if (node && hasNextPage && !isLoading) {
            observerRef.current = new IntersectionObserver((entries) => {
                if (entries[0].isIntersecting) {
                    fetchNextPage();
                }
            }, { root: null });
            observerRef.current.observe(node);
        }
    }, [hasNextPage, isLoading, fetchNextPage]);

    const notes = data?.pages.flat() || [];

    return <>
        <OneColumn>
            <div className="w-full">
                <div className=" py-2 ">
                    {
                        isSearchVisible ? < div className="block sm:hidden py-1">
                            <div className="w-full flex items-center gap-2 py-2 px-3 rounded-xl shadow-inner border dark:border-neutral-600 bg-neutral-200 dark:bg-neutral-900 dark:text-neutral-100">
                                <Search size={16} className="text-gray-400" />
                                <input type="text" value={query} onChange={e => setQuery(e.target.value)} className=" bg-transparent flex-1" placeholder={t("placeholder.search")} />
                                <button title="toggle isSearchVisible" onClick={() => setIsSearchVisible(false)}>
                                    <X size={16} className="text-gray-400" />
                                </button>
                            </div>
                        </div>
                            :
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-3 h-10">
                                    <SidebarButton />
                                    <div className="flex gap-2 items-center max-w-[calc(100vw-165px)] overflow-x-auto whitespace-nowrap sm:text-xl font-semibold hide-scrollbar">
                                        {getWorkspaceById(currentWorkspaceId)?.name ?? ""}
                                    </div>
                                </div>
                                <div className="flex items-center text-gray-600 dark:text-gray-400">
                                    <div className="hidden sm:block px-1.5">
                                        <div className="flex items-center gap-2 py-2 px-3 rounded-xl dark:border-neutral-600 bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-100">
                                            <Search size={16} className="text-gray-400" />
                                            <input type="text" value={query} onChange={e => setQuery(e.target.value)} className=" flex-1 bg-transparent" placeholder={t("placeholder.search")} />
                                        </div>
                                    </div>
                                    <div className="hidden sm:block">
                                        <div className="p-3 flex items-center ">
                                            <button onClick={() => setIsMasonryView(!isMasonryView)}>
                                                {
                                                    isMasonryView ? <LayoutGrid size={20} /> : <LayoutList size={20} />
                                                }
                                            </button>
                                        </div>
                                    </div>
                                    <div className="sm:hidden">
                                        {
                                            !isSearchVisible && <Tooltip.Root>
                                                <Tooltip.Trigger asChild>
                                                    <button aria-label="toggle the filter" className="p-3" onClick={() => setIsSearchVisible(!isSearchVisible)}>
                                                        <Search size={20} />
                                                    </button>
                                                </Tooltip.Trigger>
                                                <Tooltip.Portal>
                                                    <Tooltip.Content
                                                        className="select-none rounded-lg bg-gray-900 text-white dark:bg-gray-100 dark:text-black px-2 py-1 text-sm"
                                                        side="bottom"
                                                    >
                                                        <Tooltip.Arrow className="fill-gray-900 dark:fill-gray-100" />
                                                        {t("actions.filter")}
                                                    </Tooltip.Content>
                                                </Tooltip.Portal>
                                            </Tooltip.Root>
                                        }
                                    </div>
                                    <div className="flex items-center">
                                        <Tooltip.Root>
                                            <Tooltip.Trigger asChild>
                                                <button onClick={handleCreateNote} aria-label="edit" disabled={createNoteMutation.isPending} className="p-3">
                                                    <Edit size={20} />
                                                </button>
                                            </Tooltip.Trigger>
                                            <Tooltip.Portal>
                                                <Tooltip.Content
                                                    className="select-none rounded-lg bg-gray-900 text-white dark:bg-gray-100 dark:text-black px-2 py-1 text-sm"
                                                    side="bottom"
                                                >
                                                    <Tooltip.Arrow className="fill-gray-900 dark:fill-gray-100" />
                                                    {t("actions.newNote")}
                                                </Tooltip.Content>
                                            </Tooltip.Portal>
                                        </Tooltip.Root>
                                    </div>
                                </div>
                            </div>
                    }
                </div>
                <div className="flex flex-col gap-2 sm:gap-5">
                    <div className="w-full">
                        {
                            isLoading ? (
                                isMasonryView ? <NoteMasonrySkeleton /> : <NoteListSkeleton />
                            ) : (
                                isMasonryView ? <NoteMasonry notes={notes} getLinkTo={(note) => `note/${note.id}`} />
                                    : <NoteList notes={notes} getLinkTo={(note) => `note/${note.id}`} />
                            )}

                        <div ref={loadMoreRef} className="h-8" ></div>
                        {isFetchingNextPage && (
                            isMasonryView ? <NoteMasonrySkeleton count={3} /> : <NoteListSkeleton count={3} />
                        )}
                        {!isLoading && !hasNextPage && <div className="text-center py-4 text-gray-400">{t("messages.noMoreNotes")}</div>}
                    </div>
                </div>
            </div>
        </OneColumn>
    </>
}

export default NotesPage