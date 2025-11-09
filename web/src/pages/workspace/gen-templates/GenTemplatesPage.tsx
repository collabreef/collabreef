import { Plus, Search, X } from "lucide-react"
import { useTranslation } from "react-i18next"
import SidebarButton from "@/components/sidebar/SidebarButton"
import { getGenTemplates } from "@/api/gen-template"
import useCurrentWorkspaceId from "@/hooks/use-currentworkspace-id"
import { Link } from "react-router-dom"
import { useInfiniteQuery } from "@tanstack/react-query"
import { useRef, useCallback, useState, useEffect } from "react"
import { Tooltip } from "radix-ui"
import OneColumn from "@/components/onecolumn/OneColumn"
import GenTemplatesGridSkeleton from "@/components/skeletons/GenTemplatesGridSkeleton"

const PAGE_SIZE = 20;

const GenTemplatesPage = () => {
    const [query, setQuery] = useState("")
    const [debouncedQuery, setDebouncedQuery] = useState(query);
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
        queryKey: ['gen-templates', currentWorkspaceId],
        queryFn: ({ pageParam = 1 }: { pageParam?: unknown }) =>
            getGenTemplates(currentWorkspaceId, Number(pageParam), PAGE_SIZE, debouncedQuery),
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

    const templates = data?.pages.flat().filter(t => t !== null) || [];

    return <>
        <OneColumn>
            <div className="w-full">
                <div className="py-2">
                    {
                        isSearchVisible ? <div className="block sm:hidden py-1">
                            <div className="w-full flex items-center gap-2 py-2 px-3 rounded-xl shadow-inner border dark:border-neutral-600 bg-neutral-200 dark:bg-neutral-900 dark:text-neutral-100">
                                <Search size={16} className="text-gray-400" />
                                <input type="text" value={query} onChange={e => setQuery(e.target.value)} className="bg-transparent flex-1" placeholder={t("placeholder.search")} />
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
                                        {t("genTemplates.title")}
                                    </div>
                                </div>
                                <div className="flex items-center text-gray-600 dark:text-gray-400">
                                    <div className="hidden sm:block px-1.5">
                                        <div className="flex items-center gap-2 py-2 px-3 rounded-xl dark:border-neutral-600 bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-100">
                                            <Search size={16} className="text-gray-400" />
                                            <input type="text" value={query} onChange={e => setQuery(e.target.value)} className="flex-1 bg-transparent" placeholder={t("placeholder.search")} />
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
                                                <Link to="new" className="p-3">
                                                    <Plus size={20} />
                                                </Link>
                                            </Tooltip.Trigger>
                                            <Tooltip.Portal>
                                                <Tooltip.Content
                                                    className="select-none rounded-lg bg-gray-900 text-white dark:bg-gray-100 dark:text-black px-2 py-1 text-sm"
                                                    side="bottom"
                                                >
                                                    <Tooltip.Arrow className="fill-gray-900 dark:fill-gray-100" />
                                                    {t("genTemplates.new")}
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
                            isLoading ? <GenTemplatesGridSkeleton /> :
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {templates.map((template) => (
                                        <Link
                                            key={template.id}
                                            to={`${template.id}`}
                                            className="p-4 rounded-lg border dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:shadow-md transition-shadow"
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="font-semibold text-lg">{template.name}</div>
                                                <span className="text-xs px-2 py-1 rounded bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                                                    {template.modality}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
                                                {template.prompt}
                                            </p>
                                            <div className="text-xs text-gray-500 dark:text-gray-500">
                                                Model: {template.model}
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                        }

                        <div ref={loadMoreRef} className="h-8"></div>
                        {isFetchingNextPage && <GenTemplatesGridSkeleton count={3} />}
                        {!isLoading && !hasNextPage && templates.length > 0 && (
                            <div className="text-center py-4 text-gray-400">{t("messages.noMore")}</div>
                        )}
                        {!isLoading && templates.length === 0 && (
                            <div className="text-center py-8 text-gray-400">{t("genTemplates.empty")}</div>
                        )}
                    </div>
                </div>
            </div>
        </OneColumn>
    </>
}

export default GenTemplatesPage