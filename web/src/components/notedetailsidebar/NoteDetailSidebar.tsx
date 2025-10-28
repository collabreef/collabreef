import { FC, useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { NoteData } from "@/api/note"
import { getViewObjectsForNote } from "@/api/view"
import useCurrentWorkspaceId from "@/hooks/use-currentworkspace-id"
import NoteTime from "../notetime/NoteTime"
import VisibilityLabel from "../visibilitylabel/VisibilityLabel"
import { useTranslation } from "react-i18next"
import { Info, ChevronRight, Calendar, MapPin } from "lucide-react"
import { CalendarSlotData, MapMarkerData } from "@/types/view"
import MiniCalendarView from "./MiniCalendarView"
import MiniMapView from "./MiniMapView"
import { Link } from "react-router-dom"

interface NoteDetailSidebarProps {
    note: NoteData
    onClose?: () => void
}

const NoteDetailSidebar: FC<NoteDetailSidebarProps> = ({ note, onClose }) => {
    const { t } = useTranslation()
    const currentWorkspaceId = useCurrentWorkspaceId()

    const { data: viewObjects = [] } = useQuery({
        queryKey: ['note-view-objects', currentWorkspaceId, note.id],
        queryFn: () => getViewObjectsForNote(currentWorkspaceId, note.id),
        enabled: !!note.id && !!currentWorkspaceId,
    })

    // Group view objects by view
    const groupedByView = useMemo(() => {
        const grouped = new Map()

        viewObjects.forEach(item => {
            const viewId = item.view.id
            if (!grouped.has(viewId)) {
                grouped.set(viewId, {
                    view: item.view,
                    viewObjects: []
                })
            }
            grouped.get(viewId).viewObjects.push(item.view_object)
        })

        return Array.from(grouped.values())
    }, [viewObjects])

    return (
        <div className="max-w-sm h-screen overflow-y-auto sticky top-0 bg-neutral-100 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100">
            {/* Sticky Header with Close Button */}
            <div className=" border-b dark:border-neutral-700 px-4 py-4 flex items-center justify-between z-10">
                <div className="flex items-center gap-2">
                    <Info size={18} />
                    <div className="text-lg font-semibold">{t("pages.noteDetail.note")}</div>
                </div>
                {onClose && (
                    <button
                        onClick={onClose}
                        className="lg:hidden p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg"
                        title="Hide Info"
                    >
                        <ChevronRight size={18} />
                    </button>
                )}
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
                {/* View Objects Section */}
                {groupedByView.length > 0 && (
                    <div className="space-y-4">
                        <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                            <span>{t("common.relatedViews")}</span>
                        </div>
                        {groupedByView.map((viewGroup, index) => (
                            <div key={viewGroup.view.id} className="space-y-2">
                                <Link
                                    to={`/workspaces/${currentWorkspaceId}/views/${viewGroup.view.id}`}
                                    className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-2 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                                >
                                    {viewGroup.view.type === 'calendar' ? (
                                        <Calendar size={14} />
                                    ) : (
                                        <MapPin size={14} />
                                    )}
                                    <span>
                                        {viewGroup.view.name}
                                        {viewGroup.viewObjects.length === 1 && (
                                            <span> - {viewGroup.viewObjects[0].name}</span>
                                        )}
                                        {viewGroup.viewObjects.length > 1 && (
                                            <span> ({viewGroup.viewObjects.length} items)</span>
                                        )}
                                    </span>
                                </Link>
                                {viewGroup.view.type === 'calendar' && (() => {
                                    try {
                                        const calendarViewObjects = viewGroup.viewObjects.filter(obj => obj.type === 'calendar_slot')
                                        const slots: CalendarSlotData[] = calendarViewObjects.map(obj => ({
                                            date: obj.data, // data is already a date string like "2024-01-15"
                                            color: undefined
                                        }))
                                        return <MiniCalendarView slots={slots} viewObjects={calendarViewObjects} />
                                    } catch (e) {
                                        console.error('Failed to parse calendar slot data:', e)
                                        return null
                                    }
                                })()}
                                {viewGroup.view.type === 'map' && (() => {
                                    try {
                                        const mapViewObjects = viewGroup.viewObjects.filter(obj => obj.type === 'map_marker')
                                        const markers: MapMarkerData[] = mapViewObjects.map(obj => JSON.parse(obj.data))
                                        return <MiniMapView markers={markers} viewObjects={mapViewObjects} />
                                    } catch (e) {
                                        console.error('Failed to parse map marker data:', e)
                                        return null
                                    }
                                })()}
                            </div>
                        ))}
                    </div>
                )}

                {/* Visibility Section */}
                <div className="space-y-2">
                    <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                        {t("common.visibility")}
                    </div>
                    <div className="text-gray-500 dark:text-gray-400">
                        <VisibilityLabel value={note.visibility} showText={true} />
                    </div>
                </div>

                {/* Creator Section */}
                {note.created_by && (
                    <div className="space-y-2">
                        <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                            {t("common.creator")}
                        </div>
                        <div className="text-orange-500">
                            {note.created_by}
                        </div>
                    </div>
                )}

                {/* Last Updated Section */}
                <div className="space-y-2">
                    <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                        {t("common.lastUpdated")}
                    </div>
                    <div className="text-gray-500 dark:text-gray-400">
                        <NoteTime time={note.updated_at ?? ""} />
                    </div>
                </div>
            </div>
        </div>
    )
}

export default NoteDetailSidebar