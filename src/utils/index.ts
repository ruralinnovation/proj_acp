import { Expression } from "mapbox-gl";
import { CategoricalScale } from "../types";
import type {FillLayer} from 'react-map-gl';

export const getFillLayer = (
  layer_id: string, 
  variable: string, 
  fill_opacity: number, 
  scale: CategoricalScale
): FillLayer => {
    
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
    id: layer_id,
    source: "ruralinno.4b5py10v",
    "source-layer": "acp_all_simplified-4eyk9g",
    type: 'fill',
    paint: {
      'fill-color': fillColorArray,
      'fill-opacity': fill_opacity,
      'fill-outline-color': '#6B9C85'
    }
  };

  return dataLayer;
};

export const parseDate = (
  date: string
): Date => {

  // Split the string by '-'
  const parts = date.split('.');

  // Extract year, month (subtracting 1 for zero-indexed month), and day
  const year = parseInt(parts[0]);
  const month = parseInt(parts[1]) - 1; // Months in Date constructor are zero-indexed
  const day = parseInt(parts[2]);

  return new Date(year, month, day);
}