import { Expression } from "mapbox-gl";
import { CategoricalScale } from "../types";
import type {FillLayer} from 'react-map-gl';

export const getFillLayer = (layer_id: string, variable: string, fill_opacity: number, scale: CategoricalScale): FillLayer => {
    
  // Initialize the fill-color array with the default color from the scale
  let fillColorArray: Expression = [
    'step',
    ['coalesce', ['get', variable], -99],
    scale.default_color
  ];

  // Iterate over each step in the scale and add it to the fillColorArray
  scale.steps.forEach(step => {
    fillColorArray.push(step.threshold);
    fillColorArray.push(step.color);
  });

  // Construct the data layer object
  let dataLayer: FillLayer = {
    id: "mapbox-test-layer",
    source: "ruralinno.6xfksolh",
    "source-layer": "acp_new_england",
    type: 'fill',
    paint: {
      'fill-color': fillColorArray,
      'fill-opacity': fill_opacity,
      'fill-outline-color': '#6B9C85'
    }
  };

  return dataLayer;
};