import { ViewObject } from "@/types/view"

interface ViewObjectDataDisplayProps {
    viewObject: ViewObject
}

const ViewObjectDataDisplay = ({ viewObject}: ViewObjectDataDisplayProps) => {
    if (!viewObject.data) return null

    if (viewObject.type === 'map_marker') {
        const coords = JSON.parse(viewObject.data)
        if (coords.lat && coords.lng) {
            return (
                <div className={`flex items-center gap-2`}>
                    <span className={'text-xs'}>
                        {coords.lat.toFixed(6)}, {coords.lng.toFixed(6)}
                    </span>
                </div>
            )
        }
    }

    if (viewObject.type === 'calendar_slot') {
        return (
            <div className={`flex items-center gap-2`}>
                <span className={'text-xs'}>
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