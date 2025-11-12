import { FC, useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { NoteData } from "@/api/note"
import { getViewObjectsForNote, getPublicViewObjectsForNote } from "@/api/view"
import NoteTime from "../notetime/NoteTime"
import VisibilityLabel from "../visibilitylabel/VisibilityLabel"
import { useTranslation } from "react-i18next"
import { Info, ChevronRight, Calendar, MapPin } from "lucide-react"
import { CalendarSlotData, MapMarkerData, ViewObject } from "@/types/view"
import MiniCalendarView from "./MiniCalendarView"
import MiniMapView from "./MiniMapView"
import { Link, useParams } from "react-router-dom"

interface NoteDetailSidebarProps {
    note: NoteData
    onClose?: () => void
}

const NoteDetailSidebar: FC<NoteDetailSidebarProps> = ({ note, onClose }) => {
    const { t } = useTranslation()
    const { workspaceId } = useParams<{ workspaceId?: string }>()

    // Use public endpoint when viewing from explore page (no workspaceId in URL)
    // Use workspace endpoint when viewing from workspace context
    const { data: viewObjects = [] } = useQuery({
        queryKey: workspaceId
            ? ['note-view-objects', workspaceId, note.id]
            : ['public-note-view-objects', note.id],
        queryFn: () => {
            if (workspaceId && note.id) {
                return getViewObjectsForNote(workspaceId, note.id)
            } else if (note.id) {
                return getPublicViewObjectsForNote(note.id)
            }
            return Promise.resolve([])
        },
        enabled: !!note.id,
    })

    // Group view objects by view and filter out private views
    const groupedByView = useMemo(() => {
        const grouped = new Map()

        viewObjects.forEach(item => {
            // Only include views that are public or workspace-visible
            // Skip private views when viewing from explore page (no workspace context)
            if (!workspaceId && item.view.visibility === 'private') {
                return
            }

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
    }, [viewObjects, workspaceId])

    return (
        <div className="w-full h-full overflow-y-auto bg-neutral-100 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100">
            {/* Content */}
            <div className="p-6 space-y-6">
                {/* View Objects Section */}
                {groupedByView.length > 0 && (
                    <div className="space-y-4">
                        {groupedByView.map((viewGroup) => (
                            <div key={viewGroup.view.id} className="space-y-2">
                                <Link
                                    to={workspaceId
                                        ? `/workspaces/${workspaceId}/views/${viewGroup.view.id}`
                                        : `/explore/views/${viewGroup.view.id}`
                                    }
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
                                        const calendarViewObjects = viewGroup.viewObjects.filter((obj: ViewObject) => obj.type === 'calendar_slot')
                                        const slots: CalendarSlotData[] = calendarViewObjects.map((obj: ViewObject) => ({
                                            date: obj.data, // data is already a date string like "2024-01-15"
                                            color: undefined
                                        }))
                                        return <MiniCalendarView
                                            slots={slots}
                                            viewObjects={calendarViewObjects}
                                            viewId={viewGroup.view.id}
                                            workspaceId={workspaceId}
                                        />
                                    } catch (e) {
                                        console.error('Failed to parse calendar slot data:', e)
                                        return null
                                    }
                                })()}
                                {viewGroup.view.type === 'map' && (() => {
                                    try {
                                        const mapViewObjects = viewGroup.viewObjects.filter((obj: ViewObject) => obj.type === 'map_marker')
                                        const markers: MapMarkerData[] = mapViewObjects.map((obj: ViewObject) => JSON.parse(obj.data))
                                        return <MiniMapView
                                            markers={markers}
                                            viewObjects={mapViewObjects}
                                            viewId={viewGroup.view.id}
                                            workspaceId={workspaceId}
                                        />
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