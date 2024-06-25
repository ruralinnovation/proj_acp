import Map, {Source, Layer} from 'react-map-gl';

import style from './styles/ACPMap.module.css';

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
            {/* <Source type="geojson" data={data}>
                <Layer {...dataLayer} />
            </Source> */}
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