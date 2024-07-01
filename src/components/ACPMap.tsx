import { useCallback, useState } from 'react';

import Map, {Source, Layer} from 'react-map-gl';
import { MapLayerMouseEvent } from 'mapbox-gl';

import style from './styles/ACPMap.module.css';

import type { FeatureCollection } from "geojson";

import acp_dta_geojson from '../data/acp_new_england.json';
const acp_dta = acp_dta_geojson as FeatureCollection;

import ControlPanel from './ControlPanel';
import RichTooltip from './RichTooltip';

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
            {/* <Source type="geojson" data={acp_dta}>
                <Layer {...dataLayer} />
            </Source> */}
            <Source 
              id="mapbox_test" 
              type="vector"
              url="mapbox://ruralinno.bead_blockv1b"
            >
              <Layer
                {...getFillLayer("mapbox_test", "Percent_" + variable_suffix, .7, ACPMapScale)}
              />
            </Source>
        </Map>
        {hoverInfo && <RichTooltip hoverInfo={hoverInfo} variable_suffix={variable_suffix} />}
      </div>
    </>
  )
}

export default ACPMap;
