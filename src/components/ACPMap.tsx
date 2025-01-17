import { useCallback, useState, useMemo, useRef, useEffect } from 'react';
import Map, { Source, Layer, MapRef } from 'react-map-gl';
import mapboxgl, { MapLayerMouseEvent } from 'mapbox-gl'; // Import mapbox-gl here

import 'mapbox-gl/dist/mapbox-gl.css';
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css';
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';

import { csv } from 'd3-fetch';
import type { DSVRowArray } from 'd3';

import style from './styles/ACPMap.module.css';

import ControlPanel from './ControlPanel';
import RichTooltip from './RichTooltip';

import { getFillLayer } from '../utils';
import { ACPMapScale } from '../constants';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
const tileset_id = "ruralinno.2x4she31";

const valid_dates: { value: number} [] = [];
const date_lookup: Record<number, string> = {};

// Generate date array and lookup for the date filter
let step: number = 0;
for (let year = 2022; year <= 2024; year++) {
  for (let month = 1; month <= 12; month++) {
    
    if (year === 2024 && month > 1) {
      break;
    }

    if (month % 2 === 0) {
      continue
    }

    step = step + 1;

    valid_dates.push({value: step});
    date_lookup[step] = month + "/" + year;

  }
}

function ACPMap() {

  const [hoverInfo, setHoverInfo] = useState<any>(null);
  const [filterDate, setFilterDate] = useState<string>("01/2024");
  const [layerFilter, setLayerFilter] = useState<(string | (string | number | string[])[])[]>(['all']);
  
  // stores the number of subscribers by Zip code over time
  const [subscribedLookup, setSubscribedLookup] = useState<DSVRowArray<string> | null>(null);
  // Number of subscribers for a selected date
  const [subscribedVal, setSubscribedVal] = useState<number | null>(null);

  const mapRef = useRef<MapRef>(null);
  const geocoderRef = useRef<MapboxGeocoder | null>(null); // Ref to hold the geocoder instance

  const [month, year]: string[] = filterDate.split("/");
  // The variable suffix encodes the year and month (e.g., 24_01 is January 2024)
  const variable_suffix: string = year.slice(-2) + '_' + month.padStart(2, '0');

  const dataLayer = useMemo(() => {
    return getFillLayer("mapbox-test-layer", variable_suffix, .7, ACPMapScale);
  }, [variable_suffix]);

  const onHover: ((e: MapLayerMouseEvent) => void) | undefined = useCallback((event: MapLayerMouseEvent) => {

    const { features, point: { x, y } } = event;
    const hoveredFeature = features && features[0];
    setHoverInfo(hoveredFeature && { feature: hoveredFeature, x, y });

    if (subscribedLookup !== null && hoveredFeature !== undefined && hoveredFeature.properties !== null) {
      const subscribed_obj = subscribedLookup.find(d => d.Zipcode === hoveredFeature.properties!.Zipcode);
      if (subscribed_obj) {
        // Update the number of subscribers to be for the right date
        const subscribed_obj_val: number = +subscribed_obj[variable_suffix];
        setSubscribedVal(subscribed_obj_val);
      }
    }
    else {
      setSubscribedVal(null);
    }

  }, [subscribedLookup]);

  // Add a Mapbox Geocoding widget
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

  // Load supplementary ACP enrollment data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await csv('subscribed_lookup.csv'); // Adjust the path as needed
        setSubscribedLookup(data);
      } catch (error) {
        console.error('Error reading CSV file:', error);
      }
    };

    fetchData();
  }, []);

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
          onMouseOut={_event => {
            setHoverInfo(null);
          }}
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
        {hoverInfo && <RichTooltip hoverInfo={hoverInfo} variable_suffix={variable_suffix} subscribed_val={subscribedVal} />}
      </div>
    </>
  );
}

export default ACPMap;

