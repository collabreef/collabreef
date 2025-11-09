import { Calendar, MapPin } from "lucide-react"
import { useTranslation } from "react-i18next"
import SidebarButton from "@/components/sidebar/SidebarButton"
import { getPublicViews } from "@/api/view"
import { useInfiniteQuery } from "@tanstack/react-query"
import { useRef, useCallback, useState } from "react"
import OneColumn from "@/components/onecolumn/OneColumn"
import { Link } from "react-router-dom"
import { View } from "@/types/view"
import ViewsGridSkeleton from "@/components/skeletons/ViewsGridSkeleton"

const PAGE_SIZE = 20;

const ExploreViewsPage = () => {
    const [viewType, setViewType] = useState<'all' | 'calendar' | 'map'>('all')
    const { t } = useTranslation()
    const observerRef = useRef<IntersectionObserver | null>(null);

    const {
        data,
        isLoading,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
    } = useInfiniteQuery({
        queryKey: ['publicviews', viewType],
        queryFn: ({ pageParam = 1 }: { pageParam?: unknown }) =>
            getPublicViews(Number(pageParam), PAGE_SIZE, viewType === 'all' ? undefined : viewType),
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

    const views = (data?.pages.flat() || []).filter((view): view is View => view != null);

    return <>
        <OneColumn>
            <div className="w-full">
                <div className="py-2">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3 h-10">
                            <SidebarButton />
                            {t("common.views")}
                        </div>
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                            <button
                                onClick={() => setViewType('all')}
                                className={`px-3 py-1.5 rounded-lg ${viewType === 'all' ? 'bg-orange-500 text-white' : 'hover:bg-gray-200 dark:hover:bg-gray-800'}`}
                            >
                                {t("common.all")}
                            </button>
                            <button
                                onClick={() => setViewType('calendar')}
                                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 ${viewType === 'calendar' ? 'bg-orange-500 text-white' : 'hover:bg-gray-200 dark:hover:bg-gray-800'}`}
                            >
                                <Calendar size={16} />
                                {t("views.calendar")}
                            </button>
                            <button
                                onClick={() => setViewType('map')}
                                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 ${viewType === 'map' ? 'bg-orange-500 text-white' : 'hover:bg-gray-200 dark:hover:bg-gray-800'}`}
                            >
                                <MapPin size={16} />
                                {t("views.map")}
                            </button>
                        </div>
                    </div>
                </div>
                <div className="flex flex-col gap-2 sm:gap-5">
                    <div className="w-full">
                        {isLoading ? <ViewsGridSkeleton /> :
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {views.map((view: View) => (
                                    <Link
                                        key={view.id}
                                        to={`/explore/views/${view.id}`}
                                        className="p-4 rounded-lg border dark:border-neutral-600 bg-white dark:bg-neutral-800 hover:shadow-md transition-shadow"
                                    >
                                        <div className="flex items-center gap-2 mb-2">
                                            {view.type === 'calendar' ? (
                                                <Calendar size={18} className="text-orange-500" />
                                            ) : (
                                                <MapPin size={18} className="text-orange-500" />
                                            )}
                                            <div className="font-semibold text-lg truncate">{view.name}</div>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                            <span>{t(`views.${view.type}`)}</span>
                                            <span>•</span>
                                            <span>{view.created_by}</span>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        }

                        <div ref={loadMoreRef} className="h-8" ></div>
                        {isFetchingNextPage && <ViewsGridSkeleton count={3} />}
                        {!isLoading && !hasNextPage && <div className="text-center py-4 text-gray-400">{t("messages.noMoreViews")}</div>}
                    </div>
                </div>
            </div >
        </OneColumn>
    </>
}

export default ExploreViewsPage