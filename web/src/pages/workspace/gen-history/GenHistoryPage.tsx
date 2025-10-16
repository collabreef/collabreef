import { Search, X, Clock, AlertCircle } from "lucide-react"
import { useTranslation } from "react-i18next"
import SidebarButton from "@/components/sidebar/SidebarButton"
import { getGenHistories } from "@/api/gen-template"
import useCurrentWorkspaceId from "@/hooks/use-currentworkspace-id"
import { Link } from "react-router-dom"
import { useInfiniteQuery } from "@tanstack/react-query"
import { useRef, useCallback, useState, useEffect } from "react"
import TransitionWrapper from "@/components/transitionwrapper/TransitionWrapper"
import { Tooltip } from "radix-ui"
import Loader from "@/components/loader/Loader"
import GenHistoryCard from "./GenHistoryCard"

const PAGE_SIZE = 20;

const GenHistoryPage = () => {
    const [isSearchVisible, setIsSearchVisible] = useState(false);
    const currentWorkspaceId = useCurrentWorkspaceId();
    const { t } = useTranslation()
    const observerRef = useRef<IntersectionObserver | null>(null);

    const {
        data,
        isLoading,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        refetch
    } = useInfiniteQuery({
        queryKey: ['gen-histories', currentWorkspaceId],
        queryFn: ({ pageParam = 1 }: { pageParam?: unknown }) =>
            getGenHistories(currentWorkspaceId, Number(pageParam), PAGE_SIZE),
        enabled: !!currentWorkspaceId,
        getNextPageParam: (lastPage, allPages) => {
            if (!lastPage || lastPage.length < PAGE_SIZE) return undefined;
            return allPages.length + 1;
        },
        refetchOnWindowFocus: false,
        staleTime: 0,
        initialPageParam: 1
    })

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

    const histories = data?.pages.flat().filter(h => h !== null) || [];

    return <>
        <TransitionWrapper className="w-full">
            <div className="py-2">
                {
                    isSearchVisible ? <div className="block sm:hidden py-1">
                        <div className="w-full flex items-center gap-2 py-2 px-3 rounded-xl shadow-inner border dark:border-neutral-600 bg-neutral-200 dark:bg-neutral-900 dark:text-neutral-100">
                            <Search size={16} className="text-gray-400" />
                            <input type="text" className="bg-transparent flex-1" placeholder={t("placeholder.search")} />
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
                                    <Clock size={20} />
                                    {t("genHistory.title")}
                                </div>
                            </div>
                            <div className="flex items-center text-gray-600 dark:text-gray-400">
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
                            </div>
                        </div>
                }
            </div>
            <div className="flex flex-col gap-2 sm:gap-5">
                <div className="w-full">
                    {
                        isLoading ? <Loader /> :
                            <div className="space-y-3">
                                {histories.map((history) => (
                                    <GenHistoryCard
                                        key={history.id}
                                        history={history}
                                        onDeleted={refetch}
                                    />
                                ))}
                            </div>
                    }

                    <div ref={loadMoreRef} className="h-8"></div>
                    {isFetchingNextPage && <Loader />}
                    {!isLoading && !hasNextPage && histories.length > 0 && (
                        <div className="text-center py-4 text-gray-400">{t("messages.noMore")}</div>
                    )}
                    {!isLoading && histories.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                            <AlertCircle size={48} className="mb-4 opacity-50" />
                            <p className="text-lg">{t("genHistory.empty")}</p>
                            <p className="text-sm mt-2">{t("genHistory.emptyHint")}</p>
                        </div>
                    )}
                </div>
            </div>
        </TransitionWrapper>
    </>
}

export default GenHistoryPage