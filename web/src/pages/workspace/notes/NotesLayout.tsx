import { Edit, Search, X, FileText } from "lucide-react"
import { useTranslation } from "react-i18next"
import SidebarButton from "@/components/sidebar/SidebarButton"
import { getNotes, NoteData, createNote } from "@/api/note"
import useCurrentWorkspaceId from "@/hooks/use-currentworkspace-id"
import { Outlet, useNavigate, NavLink, useParams } from "react-router-dom"
import { useInfiniteQuery, useMutation } from "@tanstack/react-query"
import { useRef, useCallback, useState, useEffect } from "react"
import { Tooltip } from "radix-ui"
import { toast } from "@/stores/toast"

const PAGE_SIZE = 30;

function getNoteTitle(note: NoteData): string {
    if (note.title) return note.title
    try {
        const doc = JSON.parse(note.content)
        const firstBlock = doc?.content?.[0]
        const text = firstBlock?.content?.map((n: { text?: string }) => n.text ?? "").join("") ?? ""
        return text.trim() || "Untitled"
    } catch {
        return "Untitled"
    }
}

const NotesLayout = () => {
    const [query, setQuery] = useState("")
    const [debouncedQuery, setDebouncedQuery] = useState(query);
    const currentWorkspaceId = useCurrentWorkspaceId();
    const [isSearchVisible, setIsSearchVisible] = useState(false);
    const { t } = useTranslation()
    const observerRef = useRef<IntersectionObserver | null>(null);
    const scrollContainerRef = useRef<HTMLDivElement | null>(null);
    const navigate = useNavigate();
    const { noteId } = useParams()

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

    useEffect(() => {
        const handler = setTimeout(() => setDebouncedQuery(query), 300);
        return () => clearTimeout(handler);
    }, [query]);

    const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
        queryKey: ['notes', currentWorkspaceId, debouncedQuery],
        queryFn: async ({ pageParam = 1 }: { pageParam?: unknown }) => {
            return await getNotes(currentWorkspaceId, Number(pageParam), PAGE_SIZE, debouncedQuery)
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

    return (
        <div className="flex h-screen">
            {/* Notion-style sidebar */}
            <div
                ref={scrollContainerRef}
                className="w-full xl:w-[240px] h-full overflow-auto shrink-0 bg-neutral-50 dark:bg-neutral-800 border-r border-neutral-200 dark:border-neutral-800 hidden xl:flex flex-col"
            >
                {/* Header */}
                <div className="shrink-0">
                    {isSearchVisible ? (
                        <div className="px-3 pt-3 pb-1">
                            <div className="flex items-center gap-2 py-1.5 px-2 rounded-md border dark:border-neutral-700 bg-white dark:bg-neutral-800 dark:text-neutral-100">
                                <Search size={13} className="text-gray-400 shrink-0" />
                                <input
                                    autoFocus
                                    type="text"
                                    value={query}
                                    onChange={e => setQuery(e.target.value)}
                                    className="bg-transparent flex-1 text-sm outline-none"
                                    placeholder={t("placeholder.search")}
                                />
                                <button title="close search" onClick={() => { setIsSearchVisible(false); setQuery("") }}>
                                    <X size={13} className="text-gray-400" />
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="pt-2 px-3 flex items-center justify-between">
                            <div className="flex gap-2 items-center">
                                <SidebarButton />
                                <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                                    {t("menu.notes")}
                                </span>
                            </div>
                            <div className="flex items-center">
                                <Tooltip.Root>
                                    <Tooltip.Trigger asChild>
                                        <button
                                            aria-label="search"
                                            className="p-1.5 rounded-md hover:bg-neutral-200 dark:hover:bg-neutral-800 text-gray-500 dark:text-gray-400"
                                            onClick={() => setIsSearchVisible(true)}
                                        >
                                            <Search size={15} />
                                        </button>
                                    </Tooltip.Trigger>
                                    <Tooltip.Portal>
                                        <Tooltip.Content className="select-none rounded-lg bg-gray-900 text-white dark:bg-gray-100 dark:text-black px-2 py-1 text-xs" side="bottom">
                                            <Tooltip.Arrow className="fill-gray-900 dark:fill-gray-100" />
                                            {t("actions.filter")}
                                        </Tooltip.Content>
                                    </Tooltip.Portal>
                                </Tooltip.Root>
                                <Tooltip.Root>
                                    <Tooltip.Trigger asChild>
                                        <button
                                            onClick={handleCreateNote}
                                            aria-label="new note"
                                            disabled={createNoteMutation.isPending}
                                            className="p-1.5 rounded-md hover:bg-neutral-200 dark:hover:bg-neutral-800 text-gray-500 dark:text-gray-400 disabled:opacity-40"
                                        >
                                            <Edit size={15} />
                                        </button>
                                    </Tooltip.Trigger>
                                    <Tooltip.Portal>
                                        <Tooltip.Content className="select-none rounded-lg bg-gray-900 text-white dark:bg-gray-100 dark:text-black px-2 py-1 text-xs" side="bottom">
                                            <Tooltip.Arrow className="fill-gray-900 dark:fill-gray-100" />
                                            {t("actions.newNote")}
                                        </Tooltip.Content>
                                    </Tooltip.Portal>
                                </Tooltip.Root>
                            </div>
                        </div>
                    )}
                </div>

                {/* Note title list */}
                <nav className="flex-1 overflow-auto py-1 px-1">
                    {isLoading ? (
                        <div className="flex flex-col gap-0.5 px-1 py-1">
                            {Array.from({ length: 8 }).map((_, i) => (
                                <div key={i} className="h-7 rounded-md bg-neutral-200 dark:bg-neutral-800 animate-pulse" style={{ width: `${60 + (i * 13) % 35}%` }} />
                            ))}
                        </div>
                    ) : notes.length === 0 ? (
                        <div className="px-3 py-4 text-xs text-gray-400 dark:text-neutral-600">
                            {t("messages.noMoreNotes")}
                        </div>
                    ) : (
                        <>
                            {notes.map((note: NoteData) => (
                                <NavLink
                                    key={note.id}
                                    to={`${note.id}`}
                                    className={() => {
                                        const isActive = noteId === note.id
                                        return [
                                            "flex items-center gap-2 px-2 py-1.5 rounded-md text-sm cursor-pointer select-none transition-colors duration-100 group",
                                            isActive
                                                ? "bg-neutral-200 dark:bg-neutral-700 text-gray-900 dark:text-gray-100 font-medium"
                                                : "text-gray-600 dark:text-gray-400 hover:bg-neutral-200 dark:hover:bg-neutral-800 hover:text-gray-900 dark:hover:text-gray-100"
                                        ].join(" ")
                                    }}
                                >
                                    <FileText size={14} className="shrink-0 opacity-50" />
                                    <span className="truncate leading-snug">
                                        {getNoteTitle(note)}
                                    </span>
                                </NavLink>
                            ))}
                            <div ref={loadMoreRef} className="h-2" />
                            {isFetchingNextPage && (
                                <div className="flex flex-col gap-0.5 px-1 py-1">
                                    {Array.from({ length: 3 }).map((_, i) => (
                                        <div key={i} className="h-7 rounded-md bg-neutral-200 dark:bg-neutral-800 animate-pulse" />
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </nav>
            </div>

            {/* Main content */}
            <div className="flex-1 overflow-hidden">
                <div className="pt-2 px-3 xl:hidden  flex items-center justify-between">
                    <div className="flex gap-2 items-center">
                        <SidebarButton />
                        <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                            {t("menu.notes")}
                        </span>
                    </div>
                </div>
                <Outlet />
            </div>
        </div>
    )
}

export default NotesLayout
