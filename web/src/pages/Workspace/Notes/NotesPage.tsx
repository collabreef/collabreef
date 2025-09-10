import Masonry from "../../../components/masonry/Masonry"
import { Filter, MoveDiagonal, PlusCircle, Search, X } from "lucide-react"
import { useTranslation } from "react-i18next"
import SidebarButton from "../../../components/sidebar/SidebarButton"
import { getNotes, NoteData } from "../../../api/note"
import useCurrentWorkspaceId from "../../../hooks/useCurrentworkspaceId"
import { Link } from "react-router-dom"
import { useInfiniteQuery } from "@tanstack/react-query"
import { useRef, useCallback, useState, useEffect } from "react"
import ExpandableNote from "../../../components/expandablenote/ExpandableNote"
import TransitionWrapper from "../../../components/transitionwrapper/TransitionWrapper"
import { Tooltip } from "radix-ui"
import Loader from "../../../components/loader/Loader"
import { useWorkspaceStore } from "../../../stores/workspace"

const PAGE_SIZE = 20;

const Notes = () => {
    const [query, setQuery] = useState("")
    const [debouncedQuery, setDebouncedQuery] = useState(query);
    const { getWorkspaceById } = useWorkspaceStore()
    const currentWorkspaceId = useCurrentWorkspaceId();
    const [isSearchVisible, setIsSearchVisible] = useState(false);
    const { t } = useTranslation()

    const observerRef = useRef<IntersectionObserver | null>(null);

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

    function formatRelativeTime(dateString: string) {
        const date = new Date(dateString);
        const now = new Date();
        const diff = (now.getTime() - date.getTime()) / 1000;
        if (diff < 60) {
            return t("time.just_now");
        } else if (diff < 3600) {
            const mins = Math.floor(diff / 60);
            return t("time.minutes_ago", { count: mins });
        } else if (diff < 86400) {
            const hours = Math.floor(diff / 3600);
            return t("time.hours_ago", { count: hours });
        } else {
            const y = date.getFullYear();
            const m = (date.getMonth() + 1).toString().padStart(2, '0');
            const d = date.getDate().toString().padStart(2, '0');
            if (y === now.getFullYear()) {
                return t("time.date_md", { month: m, day: d });
            } else {
                return t("time.date_ymd", { year: y, month: m, day: d });
            }
        }
    }


    const notes = data?.pages.flat() || [];

    return <>
        <TransitionWrapper className="w-full">
            <div className=" py-2 ">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3 h-10">
                        <SidebarButton />
                        <div className=" max-w-[calc(100vw-165px)] overflow-x-auto whitespace-nowrap sm:text-xl font-semibold hide-scrollbar">
                            {getWorkspaceById(currentWorkspaceId)?.name ?? ""}
                        </div>
                    </div>
                    <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                        {isSearchVisible && <div className="hidden sm:block">
                            <div className="flex items-center gap-2 py-2 px-3 rounded-xl dark:border-neutral-600 bg-neutral-200 dark:bg-neutral-900 dark:text-neutral-100">
                                <Search size={16} className="text-gray-400" />
                                <input type="text" value={query} onChange={e => setQuery(e.target.value)} className=" flex-1 bg-transparent" placeholder={t("placeholder.search")} />
                                <button title="toggle isSearchVisible" onClick={() => setIsSearchVisible(false)}>
                                    <X size={16} className="text-gray-400" />
                                </button>
                            </div>
                        </div>}
                        <div className="">
                            {
                                !isSearchVisible && <button title="toggle the filter" className="p-3" onClick={() => setIsSearchVisible(!isSearchVisible)}>
                                    <Filter size={20} />
                                </button>
                            }
                        </div>
                        <div className="flex items-center">
                            <Tooltip.Root>
                                <Tooltip.Trigger asChild>
                                    <Link to="note/new" className=" p-3 rounded-full">
                                        <PlusCircle size={20} />
                                    </Link>
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
            </div>
            <div className="flex flex-col gap-2 sm:gap-5">
                {
                    isSearchVisible && < div className="block sm:hidden pb-1">
                        <div className="w-full flex items-center gap-2 py-2 px-3 rounded-xl shadow-inner border dark:border-neutral-600 bg-neutral-200 dark:bg-neutral-900 dark:text-neutral-100">
                            <Search size={16} className="text-gray-400" />
                            <input type="text" value={query} onChange={e => setQuery(e.target.value)} className=" bg-transparent flex-1" placeholder={t("placeholder.search")} />
                            <button title="toggle isSearchVisible" onClick={() => setIsSearchVisible(false)}>
                                <X size={16} className="text-gray-400" />
                            </button>
                        </div>
                    </div>
                }
                <div className="">
                    {
                        isLoading ? <Loader />
                            : <Masonry>
                                {
                                    notes && notes?.map((n: NoteData, idx: number) => (
                                        n && <div key={n.id || idx} className="bg-white dark:bg-neutral-900 border sm:shadow-sm dark:border-neutral-600 rounded-lg overflow-auto flex flex-col gap-2 ">
                                            <div className="flex justify-between text-gray-500 px-4 pt-4">
                                                <div>
                                                    {formatRelativeTime(n.created_at || '')}
                                                </div>
                                                <div>
                                                    <Link to={"note/" + n.id!} >
                                                        <MoveDiagonal size={16} />
                                                    </Link>
                                                </div>
                                            </div>
                                            <div className="break-all w-full flex flex-col m-auto">

                                                <ExpandableNote note={n} />
                                            </div>
                                        </div>
                                    ))
                                }
                            </Masonry>
                    }

                    <div ref={loadMoreRef} className="h-8" ></div>
                    {isFetchingNextPage && <Loader />}
                    {!isLoading && !hasNextPage && <div className="text-center py-4 text-gray-400">{t("message.noMoreNotes")}</div>}
                </div>
            </div>
        </TransitionWrapper >
    </>
}

export default Notes