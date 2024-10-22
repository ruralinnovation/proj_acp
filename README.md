# Affordable Connectivity Program (ACP) Map

This project is an interactive map of ACP enrollment over time, built using Vite, React, TypeScript, and Mapbox. Notably, we used `tippecanoe` to generate Mapbox tiles and `react-map-gl` to create the interactive map. You can read more about the impacts of the ACP's discontinuation in our [blog post on the subject](https://ruralinnovation.us/blog/affordable-connectivity-program-impact/).

## Getting started

To get set up locally, clone the repository and run `npm install` and then `npm run dev`.

## Project structure

Data processing scripts for generating a `geojson` file that is then converted to an `mbtiles` file are located in the `R` subdirectory. React components and code are located in the `src` subdirectory. `ACPMap.tsx` implements an interactive Mapbox map using `react-map-gl`. `ControlPanel.tsx` implements the map's data controls. `Trendline.tsx` implements a D3 line chart that is rendered in the map tooltip.
