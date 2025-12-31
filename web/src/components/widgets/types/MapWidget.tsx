import { FC, useMemo, useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Loader2, X, ExternalLink } from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import { DivIcon } from 'leaflet';
import { getView, getViewObjects, getViews, getNotesForViewObject } from '@/api/view';
import { NoteData } from '@/api/note';
import useCurrentWorkspaceId from '@/hooks/use-currentworkspace-id';
import { MapWidgetConfig } from '@/types/widget';
import { MapMarkerData, ViewObject } from '@/types/view';
import { Link } from 'react-router-dom';
import Widget from '@/components/widgets/Widget';
import { registerWidget, WidgetProps, WidgetConfigFormProps } from '../widgetRegistry';

interface MapWidgetProps extends WidgetProps {
  config: MapWidgetConfig;
}

interface MarkerWithNotes {
  id: string;
  name: string;
  lat: number;
  lng: number;
  firstImageUrl?: string;
  noteCount: number;
}

// Helper function to extract first image URL from note content
const extractFirstImageFromNote = (note: NoteData): string | null => {
  try {
    const content = JSON.parse(note.content);

    const findImageNode = (node: any): string | null => {
      if (!node) return null;

      // Check if this node is an image
      if (node.type === 'image' && node.attrs?.src) {
        return node.attrs.src;
      }

      // Recursively search in content
      if (node.content && Array.isArray(node.content)) {
        for (const child of node.content) {
          const imageUrl = findImageNode(child);
          if (imageUrl) return imageUrl;
        }
      }

      return null;
    };

    return findImageNode(content);
  } catch (e) {
    console.error('Failed to parse note content:', e);
    return null;
  }
};

// Component to force map to recalculate size
const MapResizer: FC = () => {
  const map = useMap();

  useEffect(() => {
    // Aggressive size recalculation on mount
    const recalculate = () => {
      map.invalidateSize(true);
    };

    // Call immediately
    recalculate();

    // Then call multiple times with delays
    const timer1 = setTimeout(recalculate, 100);
    const timer2 = setTimeout(recalculate, 300);
    const timer3 = setTimeout(recalculate, 500);
    const timer4 = setTimeout(recalculate, 1000); 

    // Also recalculate on any move/zoom
    map.on('moveend', recalculate);
    map.on('zoomend', recalculate);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
      map.off('moveend', recalculate);
      map.off('zoomend', recalculate);
    };
  }, [map]);

  return null;
};

const MapWidget: FC<MapWidgetProps> = ({ config }) => {
  const { t } = useTranslation();
  const workspaceId = useCurrentWorkspaceId();
  const [selectedMarkerIndex, setSelectedMarkerIndex] = useState<number | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [markersWithNotes, setMarkersWithNotes] = useState<Map<string, MarkerWithNotes>>(new Map());

  const { data: view, isLoading: isLoadingView } = useQuery({
    queryKey: ['view', workspaceId, config.viewId],
    queryFn: () => getView(workspaceId, config.viewId),
    enabled: !!workspaceId && !!config.viewId,
  });

  const { data: objects = [] } = useQuery({
    queryKey: ['view-objects', workspaceId, config.viewId],
    queryFn: () => getViewObjects(workspaceId, config.viewId, 1, 100),
    enabled: !!workspaceId && !!config.viewId,
  });

  // Parse markers from view objects for map view
  const markers = useMemo(() => {
    return objects
      .filter((obj: ViewObject) => obj.type === 'map_marker')
      .map((obj: ViewObject) => {
        try {
          const data = JSON.parse(obj.data) as MapMarkerData;
          return {
            id: obj.id,
            name: obj.name,
            lat: data.lat,
            lng: data.lng
          };
        } catch {
          return null;
        }
      })
      .filter((m): m is { id: string; name: string; lat: number; lng: number } => m !== null);
  }, [objects]);

  // Load notes for each marker
  useEffect(() => {
    const loadNotesForMarkers = async () => {
      const newMarkersWithNotes = new Map<string, MarkerWithNotes>();

      for (const marker of markers) {
        try {
          // Fetch notes for this marker
          const notes = await getNotesForViewObject(workspaceId, config.viewId, marker.id);

          // Extract first image from notes
          let firstImageUrl: string | undefined = undefined;
          for (const note of notes) {
            const imageUrl = extractFirstImageFromNote(note);
            if (imageUrl) {
              firstImageUrl = imageUrl;
              break;
            }
          }

          newMarkersWithNotes.set(marker.id, {
            ...marker,
            firstImageUrl,
            noteCount: notes.length
          });
        } catch (error) {
          console.error('Failed to load notes for marker:', marker.id, error);
          // Still add marker but without notes info
          newMarkersWithNotes.set(marker.id, {
            ...marker,
            noteCount: 0
          });
        }
      }

      setMarkersWithNotes(newMarkersWithNotes);
    };

    if (markers.length > 0 && workspaceId && config.viewId) {
      loadNotesForMarkers();
    }
  }, [markers, workspaceId, config.viewId]);

  // Delay map rendering to ensure container is fully sized
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 1);
    return () => clearTimeout(timer);
  }, []);

  // Use the first marker as center point
  const mapCenter: [number, number] = useMemo(() => {
    if (markers.length === 0) {
      return [25.0330, 121.5654]; // Default center
    }

    // Always use the first marker as center
    return [markers[0].lat, markers[0].lng];
  }, [markers]);

  // Calculate zoom level based on markers spread
  const zoom = useMemo(() => {
    if (markers.length <= 1) return 13;

    // Calculate rough bounds to determine appropriate zoom
    const lats = markers.map(m => m.lat);
    const lngs = markers.map(m => m.lng);
    const latSpread = Math.max(...lats) - Math.min(...lats);
    const lngSpread = Math.max(...lngs) - Math.min(...lngs);
    const maxSpread = Math.max(latSpread, lngSpread);

    if (maxSpread > 1) return 8;
    if (maxSpread > 0.5) return 10;
    if (maxSpread > 0.1) return 12;
    return 13;
  }, [markers]);

  // Create custom marker icon based on marker data
  const createMarkerIcon = (markerData: MarkerWithNotes) => {
    const { firstImageUrl, noteCount } = markerData;

    if (firstImageUrl) {
      // Use image as marker
      const html = `
        <div style="
          width: 40px;
          height: 40px;
          border-radius: 50%;
          overflow: hidden;
          border: 1px solid white;
          background: white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        ">
          <img
            src="${firstImageUrl}"
            style="
              width: 100%;
              height: 100%;
              object-fit: cover;
            "
            alt="marker"
          />
        </div>
      `;
      return new DivIcon({
        html,
        className: 'custom-marker-icon',
        iconSize: [40, 40],
        iconAnchor: [20, 20],
        popupAnchor: [0, -20]
      });
    } else {
      // Use note count as marker
      const html = `
        <div style="
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: white;
          border: 1px solid #aaa;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 12px;
        ">
          ${noteCount}
        </div>
      `;
      return new DivIcon({
        html,
        className: 'custom-marker-icon',
        iconSize: [40, 40],
        iconAnchor: [20, 20],
        popupAnchor: [0, -20]
      });
    }
  };

  const handleMarkerClick = (index: number) => {
    setSelectedMarkerIndex(index);
  };

  const selectedMarker = selectedMarkerIndex !== null ? {
    marker: markers[selectedMarkerIndex],
    viewObject: objects[selectedMarkerIndex]
  } : null;

  if (!config.viewId) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500 text-sm">
        {t('widgets.noViewSelected')}
      </div>
    );
  }

  if (isLoadingView) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="animate-spin text-gray-500" size={24} />
      </div>
    );
  }

  if (!view) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500 text-sm">
        {t('widgets.viewNotFound')}
      </div>
    );
  }

  if (view.type !== 'map') {
    return (
      <div className="h-full flex items-center justify-center text-gray-500 text-sm">
        {t('widgets.invalidViewType')}
      </div>
    );
  }

  return (
    <Widget withPadding={false}>
      <div className="h-full flex" onClick={(e) => e.preventDefault()}>
        <div className="flex-1 min-h-0 w-full">
          {/* Map Container */}
          <div
            className="w-full h-full rounded-lg overflow-hidden border dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 relative"
            style={{ transform: 'translateZ(0)' }}
          >
            {isReady ? (
              <>
                <MapContainer
                  center={mapCenter}
                  zoom={zoom}
                  className="h-full w-full"
                  scrollWheelZoom={true}
                  dragging={true}
                  zoomControl={true}
                  doubleClickZoom={true}
                  touchZoom={true}
                  preferCanvas={true}
                >
                  <MapResizer />
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  {markers.map((marker, index) => {
                    const markerData = markersWithNotes.get(marker.id);
                    const icon = markerData ? createMarkerIcon(markerData) : new DivIcon({
                      html: "<div></div>",
                      className: 'custom-marker-icon',
                      iconSize: [40, 40],
                      iconAnchor: [20, 20],
                      popupAnchor: [0, -20]
                    });

                    return (
                      <Marker
                        key={marker.id}
                        position={[marker.lat, marker.lng]}
                        icon={icon}
                        eventHandlers={{
                          click: () => handleMarkerClick(index)
                        }}
                      />
                    );
                  })}
                </MapContainer>

                {/* View Link Button */}
                <Link
                  to={`/workspaces/${workspaceId}/map/${config.viewId}`}
                  onClick={(e) => e.stopPropagation()}
                  className="absolute top-2 right-2 z-[1000] p-2 bg-white text-neutral-800 rounded shadow-md hover:shadow-lg transition-shadow border flex items-center gap-1.5"
                  title="Go to View"
                >
                  <ExternalLink size={18} />
                </Link>

                {/* Selected marker info */}
                {selectedMarker && (
                  <div className="absolute bottom-4 left-4 right-4 z-[1000] p-3 bg-white dark:bg-neutral-800 rounded-lg shadow-lg border dark:border-neutral-700">
                    <div className="flex items-center justify-between mb-1">
                      <Link
                        to={`/workspaces/${workspaceId}/map/${config.viewId}/marker/${selectedMarker.viewObject?.id}`}
                        className="font-semibold text-sm hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {selectedMarker.viewObject?.name || 'Marker'}
                      </Link>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          setSelectedMarkerIndex(null);
                        }}
                        className="p-1 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded"
                      >
                        <X size={14} />
                      </button>
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 space-y-0.5">
                      <div>Lat: {selectedMarker.marker.lat.toFixed(6)}</div>
                      <div>Lng: {selectedMarker.marker.lng.toFixed(6)}</div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="h-full w-full flex items-center justify-center text-neutral-500">
                Loading map...
              </div>
            )}
          </div>
        </div>
      </div>
    </Widget>
  );
};

// Configuration Form Component
export const MapWidgetConfigForm: FC<WidgetConfigFormProps<MapWidgetConfig>> = ({
  config,
  onChange,
}) => {
  const { t } = useTranslation();
  const workspaceId = useCurrentWorkspaceId();

  const { data: views = [] } = useQuery({
    queryKey: ['views', workspaceId],
    queryFn: () => getViews(workspaceId),
    enabled: !!workspaceId,
  });

  // Filter only map views
  const mapViews = views.filter((view: any) => view.type === 'map');

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">{t('widgets.config.selectView')}</label>
        <select
          value={config.viewId}
          onChange={(e) => onChange({ ...config, viewId: e.target.value })}
          className="w-full px-3 py-2 rounded-lg border dark:border-neutral-600 bg-white dark:bg-neutral-800"
        >
          <option value="">{t('widgets.config.selectViewPlaceholder')}</option>
          {mapViews.map((view: any) => (
            <option key={view.id} value={view.id}>
              {view.name}
            </option>
          ))}
        </select>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="showControls"
          checked={config.showControls}
          onChange={(e) => onChange({ ...config, showControls: e.target.checked })}
        />
        <label htmlFor="showControls" className="text-sm">{t('widgets.config.showControls')}</label>
      </div>
    </div>
  );
};

// Register widget
registerWidget({
  type: 'map',
  label: 'widgets.types.map',
  description: 'widgets.types.mapDesc',
  defaultConfig: {
    viewId: '',
    showControls: true,
  },
  Component: MapWidget,
  ConfigForm: MapWidgetConfigForm,
});

export default MapWidget;
