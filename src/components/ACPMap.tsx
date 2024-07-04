import { useCallback, useState, useMemo } from 'react';

import Map, {Source, Layer} from 'react-map-gl';
import { MapLayerMouseEvent } from 'mapbox-gl';

import style from './styles/ACPMap.module.css';

import ControlPanel from './ControlPanel';
import RichTooltip from './RichTooltip';

import { getFillLayer } from '../utils';
import { ACPMapScale } from '../constants';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

const tileset_id = "ruralinno.4b5py10v";

function ACPMap() {
  const [ hoverInfo, setHoverInfo ] = useState<any>(null);
  const [ filterDate, setFilterDate ] = useState<string>("02/2024");
  const [ layerFilter, setLayerFilter ] = useState<(string | (string | number | string[])[])[]>(['all']);

  const [month, year]: string[] = filterDate.split("/");
  const variable_suffix: string = year + '.' + month.padStart(2, '0') + '.01'
  const dataLayer = useMemo(() => {
    return getFillLayer("mapbox-test-layer", "Percent_" + variable_suffix, .7, ACPMapScale);
  }, [variable_suffix]); 

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
        <ControlPanel setParentDate={setFilterDate} setParentLayerFilter={setLayerFilter} />
        <Map
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
  )
}

export default ACPMap;
