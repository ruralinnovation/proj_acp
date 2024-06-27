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

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

function ACPMap() {
  const [ hoverInfo, setHoverInfo ] = useState<any>(null);
  const [ filterDate, setFilterDate] = useState<string>("02/2024");

  const [month, year]: string[] = filterDate.split("/");
  const variable_suffix: string = year + '.' + month.padStart(2, '0') + '.01'
  const dataLayer = getFillLayer("data", "Percent_" + variable_suffix, .7, ACPMapScale);

  const onHover: ((e: MapLayerMouseEvent) => void) | undefined = useCallback((event: MapLayerMouseEvent) => {
    const {
      features,
      point: { x, y }
    } = event;
    const hoveredFeature = features && features[0];
  
    setHoverInfo(hoveredFeature && { feature: hoveredFeature, x, y });

  }, []);

  return (
    <>
      <div className={style["acp-map"]}>
        <ControlPanel setParentDate={setFilterDate} />
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
                  Subscribed: {hoverInfo.feature.properties['Subscribed_' + variable_suffix]}<br/>
                  Percent subscribed: {format(".3")(hoverInfo.feature.properties['Percent_' + variable_suffix]) + "%"}<br/>
                  Change subscribed: {format(",")(hoverInfo.feature.properties['Change_Subscribed_' + variable_suffix])}<br/>
                  Change percent: {format(",.2s")(hoverInfo.feature.properties['Change_Percent_' + variable_suffix]) + "%"}<br/>
                </p>
            </div>
        )}
      </div>
    </>
  )
}

export default ACPMap;
