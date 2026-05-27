import { useEffect } from 'react';
import { MapContainer, Marker, TileLayer, useMap, useMapEvent } from 'react-leaflet';
import L from 'leaflet';
import { AddressSearch } from './AddressSearch';

const DEFAULT_CENTER: [number, number] = [50.4501, 30.5234];
const DEFAULT_ZOOM = 12;

interface Props {
  latitude: number | null;
  longitude: number | null;
  onChange: (coords: {
    latitude: number;
    longitude: number;
    addressLabel?: string;
  }) => void;
}

const pickerIcon = L.divIcon({
  className: 'zbir-marker',
  html: '<div class="zbir-marker-inner" style="background:#8b5cf6"><span>●</span></div>',
  iconSize: [32, 40],
  iconAnchor: [16, 40],
});

function MapClickHandler({ onChange }: { onChange: Props['onChange'] }) {
  useMapEvent('click', (e) => {
    onChange({
      latitude: Number(e.latlng.lat.toFixed(6)),
      longitude: Number(e.latlng.lng.toFixed(6)),
    });
  });
  return null;
}

function MapInvalidator() {
  const map = useMap();
  useEffect(() => {
    const raf = requestAnimationFrame(() => map.invalidateSize());
    const t = setTimeout(() => map.invalidateSize(), 200);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(t);
    };
  }, [map]);
  return null;
}

function MapRecenter({ lat, lng, zoom }: { lat: number; lng: number; zoom?: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lng], zoom ?? map.getZoom(), { duration: 0.6 });
  }, [lat, lng, zoom, map]);
  return null;
}

export function LocationPicker({ latitude, longitude, onChange }: Props) {
  const hasCoords = latitude !== null && longitude !== null;
  const center: [number, number] = hasCoords ? [latitude, longitude] : DEFAULT_CENTER;

  return (
    <div className="space-y-2">
      <AddressSearch
        onPick={(r) =>
          onChange({
            latitude: Number(r.latitude.toFixed(6)),
            longitude: Number(r.longitude.toFixed(6)),
            addressLabel: r.displayName,
          })
        }
      />

      <p className="text-xs text-slate-500">
        Введіть адресу вище, клацніть по карті або перетягніть маркер для уточнення.
      </p>

      <div className="h-72 w-full overflow-hidden rounded-lg border border-slate-200">
        <MapContainer
          center={center}
          zoom={DEFAULT_ZOOM}
          scrollWheelZoom
          className="h-full w-full"
        >
          <MapInvalidator />
          <TileLayer
            attribution='&copy; OpenStreetMap'
            url="https://tile.openstreetmap.org.ua/styles/osm-bright/{z}/{x}/{y}.png"
            maxZoom={19}
          />
          <MapClickHandler onChange={onChange} />
          {hasCoords && (
            <>
              <Marker
                position={[latitude, longitude]}
                icon={pickerIcon}
                draggable
                eventHandlers={{
                  dragend: (e) => {
                    const { lat, lng } = e.target.getLatLng();
                    onChange({
                      latitude: Number(lat.toFixed(6)),
                      longitude: Number(lng.toFixed(6)),
                    });
                  },
                }}
              />
              <MapRecenter lat={latitude} lng={longitude} zoom={15} />
            </>
          )}
        </MapContainer>
      </div>

      {hasCoords && (
        <p className="text-xs text-slate-500">
          Координати: <code className="text-slate-700">{latitude}, {longitude}</code>
        </p>
      )}
    </div>
  );
}
