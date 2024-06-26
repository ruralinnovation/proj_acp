import Map, {Source, Layer} from 'react-map-gl';

import style from './styles/ACPMap.module.css';

import type { FeatureCollection } from "geojson";

import acp_dta_geojson from '../data/acp_new_england.json';
const acp_dta = acp_dta_geojson as FeatureCollection;


import type {FillLayer} from 'react-map-gl';

// Subscribed_2024.02.01
export const dataLayer: FillLayer = {
  id: 'data',
  type: 'fill',
  paint: {
    'fill-color': {
      property: 'Subscribed_2024.02.01',
      stops: [
        [0, '#3288bd'],
        [1, '#66c2a5'],
        [2, '#abdda4'],
        [3, '#e6f598'],
        [4, '#ffffbf'],
        [5, '#fee08b'],
        [6, '#fdae61'],
        [7, '#f46d43'],
        [8, '#d53e4f']
      ]
    },
    'fill-opacity': 0.8
  }
};

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

function ACPMap() {

  return (
    <>
      <div className={style["acp-map"]}>
        <Map
            initialViewState={{
            latitude: 40,
            longitude: -100,
            zoom: 3
            }}
            mapStyle="mapbox://styles/mapbox/light-v9"
            mapboxAccessToken={MAPBOX_TOKEN}
            interactiveLayerIds={['data']}
        >
            <Source type="geojson" data={acp_dta}>
                <Layer {...dataLayer} />
            </Source>
            {/* {hoverInfo && (
                <div className="tooltip" style={{left: hoverInfo.x, top: hoverInfo.y}}>
                    <div>State: {hoverInfo.feature.properties.name}</div>
                    <div>Median Household Income: {hoverInfo.feature.properties.value}</div>
                    <div>Percentile: {(hoverInfo.feature.properties.percentile / 8) * 100}</div>
                </div>
            )} */}
        </Map>

      </div>
    </>
  )
}

export default ACPMap