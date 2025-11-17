import { Calendar, MapPin } from "lucide-react"
import { ViewObject } from "@/types/view"

interface ViewObjectDataDisplayProps {
    viewObject: ViewObject
    variant?: "card" | "detail"
}

const ViewObjectDataDisplay = ({ viewObject, variant = "card" }: ViewObjectDataDisplayProps) => {
    if (!viewObject.data) return null

    const isDetailView = variant === "detail"
    const iconSize = isDetailView ? 14 : 12

    if (viewObject.type === 'map_marker') {
        try {
            const coords = JSON.parse(viewObject.data)
            if (coords.lat && coords.lng) {
                return (
                    <div className={`flex items-center gap-${isDetailView ? '2' : '1'}`}>
                        <MapPin
                            size={iconSize}
                            className={`flex-shrink-0 ${isDetailView ? 'text-blue-500' : ''}`}
                        />
                        <span className={isDetailView ? 'font-mono' : 'text-xs'}>
                            {coords.lat.toFixed(6)}, {coords.lng.toFixed(6)}
                        </span>
                    </div>
                )
            }
        } catch (e) {
            return isDetailView ? (
                <pre className="bg-gray-50 dark:bg-neutral-700 p-2 rounded overflow-x-auto text-xs">
                    {viewObject.data}
                </pre>
            ) : (
                <p className="whitespace-pre-wrap text-sm">{viewObject.data}</p>
            )
        }
    }

    if (viewObject.type === 'calendar_slot') {
        return (
            <div className={`flex items-center gap-${isDetailView ? '2' : '1'}`}>
                <Calendar
                    size={iconSize}
                    className={`flex-shrink-0 ${isDetailView ? 'text-blue-500' : ''}`}
                />
                <span className={isDetailView ? 'font-medium' : 'text-xs'}>
                    {viewObject.data}
                </span>
            </div>
        )
    }

    return isDetailView ? (
        <pre className="">{viewObject.data}</pre>
    ) : (
        <p className="whitespace-pre-wrap text-sm">{viewObject.data}</p>
    )
}

export default ViewObjectDataDisplay