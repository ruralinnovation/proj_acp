import { useCallback, useState } from 'react';

import Map, {Source, Layer} from 'react-map-gl';
import { MapLayerMouseEvent } from 'mapbox-gl';

import style from './styles/ACPMap.module.css';

import type { FeatureCollection } from "geojson";

import acp_dta_geojson from '../data/acp_new_england.json';
const acp_dta = acp_dta_geojson as FeatureCollection;

import { format } from 'd3-format';
import ControlPanel from './ControlPanel';

import { getFillLayer } from '../utils';
import { ACPMapScale } from '../constants';


const dataLayer = getFillLayer("data", "Percent_2024.02.01", .7, ACPMapScale);

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

function ACPMap() {

  const [ hoverInfo, setHoverInfo ] = useState<any>(null);

  const onHover: ((e: MapLayerMouseEvent) => void) | undefined = useCallback((event: MapLayerMouseEvent) => {
    const {
      features,
      point: { x, y }
    } = event;
    const hoveredFeature = features && features[0];

    console.log("Event is ", hoveredFeature);
  
    setHoverInfo(hoveredFeature && { feature: hoveredFeature, x, y });

  }, []);

  return (
    <>
      <div className={style["acp-map"]}>
        <ControlPanel />
        <Map
            initialViewState={{
            latitude: 40,
            longitude: -100,
            zoom: 3
            }}
            mapStyle="mapbox://styles/mapbox/light-v9"
            mapboxAccessToken={MAPBOX_TOKEN}
            interactiveLayerIds={['data']}
            onMouseMove={onHover}
        >
            <Source type="geojson" data={acp_dta}>
                <Layer {...dataLayer} />
            </Source>
        </Map>
        {hoverInfo && (
            <div className={style['tooltip']} style={{left: hoverInfo.x, top: hoverInfo.y}}>
                <h2>Zipcode: {hoverInfo.feature.properties.Zipcode}</h2>
                <p>
                  Eligble: {hoverInfo.feature.properties['Eligible']}<br/>
                  Subscribed: {hoverInfo.feature.properties['Subscribed_2024.02.01']}<br/>
                  Percent subscribed: {format(".3")(hoverInfo.feature.properties['Percent_2024.02.01']) + "%"}<br/>
                  Change subscribed: {format(",")(hoverInfo.feature.properties['Change_Subscribed_2024.02.01'])}<br/>
                  Change percent: {format(",.2s")(hoverInfo.feature.properties['Change_Percent_2024.02.01']) + "%"}<br/>
                </p>
            </div>
        )}
      </div>
    </>
  )
}

export default ACPMap