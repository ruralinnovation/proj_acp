import { useCallback, useState, useMemo, useRef, useEffect } from 'react';
import Map, { Source, Layer, MapRef } from 'react-map-gl';
import mapboxgl, { MapLayerMouseEvent } from 'mapbox-gl'; // Import mapbox-gl here

import 'mapbox-gl/dist/mapbox-gl.css';
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css';
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';

import style from './styles/ACPMap.module.css';

import ControlPanel from './ControlPanel';
import RichTooltip from './RichTooltip';

import { getFillLayer } from '../utils';
import { ACPMapScale } from '../constants';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
const tileset_id = "ruralinno.4b5py10v";

const valid_dates: { value: number} [] = [];
const date_lookup: Record<number, string> = {};

let step: number = 0;
for (let year = 2022; year <= 2024; year++) {
  for (let month = 1; month <= 12; month++) {
    
    if (year === 2024 && month > 2) {
      break;
    }

    step = step + 1;

    valid_dates.push({value: step});
    date_lookup[step] = month + "/" + year;

  }
}

function ACPMap() {
  const [hoverInfo, setHoverInfo] = useState<any>(null);
  const [filterDate, setFilterDate] = useState<string>("02/2024");
  const [layerFilter, setLayerFilter] = useState<(string | (string | number | string[])[])[]>(['all']);

  const mapRef = useRef<MapRef>(null);
  const geocoderRef = useRef<MapboxGeocoder | null>(null); // Ref to hold the geocoder instance

  const [month, year]: string[] = filterDate.split("/");
  const variable_suffix: string = year + '.' + month.padStart(2, '0') + '.01';
  const dataLayer = useMemo(() => {
    return getFillLayer("mapbox-test-layer", "Percent_" + variable_suffix, .7, ACPMapScale);
  }, [variable_suffix]);

  const onHover: ((e: MapLayerMouseEvent) => void) | undefined = useCallback((event: MapLayerMouseEvent) => {
    const { features, point: { x, y } } = event;
    const hoveredFeature = features && features[0];
    setHoverInfo(hoveredFeature && { feature: hoveredFeature, x, y });
  }, []);

  useEffect(() => {
    if (mapRef.current) {
      const map = mapRef.current.getMap();

      if (geocoderRef.current === null) {

        const geocoder = new MapboxGeocoder({
          accessToken: MAPBOX_TOKEN,
          marker: false,
          mapboxgl: mapboxgl,
          countries: 'us'
        });

        map.addControl(geocoder, 'top-right');
        geocoderRef.current = geocoder;
      }
    }
  }, [mapRef.current]);

  return (
    <>
      <div className={style["acp-map"]}>
        <ControlPanel setParentDate={setFilterDate} setParentLayerFilter={setLayerFilter} valid_dates={valid_dates} date_lookup={date_lookup} />
        <Map
          ref={mapRef}
          initialViewState={{
            latitude: 40,
            longitude: -100,
            zoom: 4
          }}
          mapStyle="mapbox://styles/mapbox/light-v9"
          mapboxAccessToken={MAPBOX_TOKEN}
          interactiveLayerIds={['mapbox-test-layer']}
          onMouseMove={onHover}
          minZoom={4}
          maxZoom={13}
        >
          <Source
            id={tileset_id}
            type="vector"
            url={"mapbox://" + tileset_id}
          >
            <Layer
              {...dataLayer}
              filter={layerFilter}
            />
          </Source>
        </Map>
        {hoverInfo && <RichTooltip hoverInfo={hoverInfo} variable_suffix={variable_suffix} />}
      </div>
    </>
  );
}

export default ACPMap;

