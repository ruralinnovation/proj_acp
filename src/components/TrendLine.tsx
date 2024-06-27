import React from 'react';
import style from './styles/TrendLine.module.css';

import { useRef, useEffect } from 'react';
import * as d3 from 'd3';

import { timeFormat } from 'd3-time-format';
const formatDate = timeFormat("%Y-%m");

interface TrendLineProps {
    data: {date: Date, value: number}[]
}

const chartStyle = {
    // margin
    margin: {top: 10, left: 0, bottom: 35, right: 25},
    // Axis ticks
    tickFontSize: "1rem",
    tickFontFamily: "Lato, monospace",
    tickFontColor: "black",
    tickLineColor: "#d0d2ce",
    xTickSize: 12,
    yTickSize: 6,
    yTickOpacity: 0,
    // Data labels
    dataLabelFontSize: "1rem",
    dataLabelFontFamily: "Lato, monospace",
    dataLabelFontColor: "black",
    dataLabelFontWeight: "bold",
    // Gridlines
    gridLineColor: "#d0d2ce",
    gridLineOpacity: 1,
    // Colors and fills
    defaultBarFill: "#00835D",
    // Line chart style
    strokeWidth: 4,
    strokeOpacity: 0.9

}

const TrendLine: React.FC<TrendLineProps> = ({ data }) => {

    const svgRef = useRef<SVGSVGElement>(null);

    const width = 200;
    const height = 200;

    useEffect(() => {
    
        if (!svgRef.current) return;
    
        const margin = {...chartStyle.margin};
        const tick_number = Math.floor(width / 225);
        const y_axis_tick_size = 8;
    
        const svg = d3.select(svgRef.current)
          .attr("viewBox", `0 0 ${width} ${height}`)
          .attr("preserveAspectRatio", "xMidYMid meet");

        const xScale = d3.scaleTime()
            .domain(d3.extent(data, d => d.date) as [Date, Date])
            .range([margin.left, width - margin.right]);
    
        const yScale = d3
          .scaleLinear()
          .domain([0, 100])
          .nice()
          .range([margin.top, height - margin.bottom]);
    
        let xAxis = d3.axisBottom<Date>(xScale); // later is reassigned
        const yAxis = d3.axisLeft<number>(yScale)
          .ticks(tick_number, "%")
          .tickSize(y_axis_tick_size);
    
        svg
          .select<SVGGElement>('.x-axis')
          .attr('transform', `translate(0, ${height - margin.bottom})`)
          .call(xAxis);
    
        svg.select<SVGGElement>('.y-axis')
          .attr("transform", `translate(${margin.left},0)`)
          .call(yAxis)
          .call(g => g.select(".domain").remove());
    
        svg.selectAll(".y-axis text")
          .style("font-family", chartStyle.tickFontFamily)
          .style("font-size", chartStyle.tickFontSize)
          .style("color", chartStyle.tickFontColor)      
    
        // Define line generator
        const line = d3.line<{date: Date, value: number}>()
          .defined(d => d.value !== null) 
          .x(d => xScale(d.date))
          .y(d => yScale(+d.value!));
    
        svg.selectAll(".data-lines").remove();
        svg.append("path")
        .datum(data)
        .attr("class", "data-lines")
        .attr("fill", "none")
        .attr("stroke", chartStyle.defaultBarFill)
        .attr("stroke-width", chartStyle.strokeWidth)
        .attr("stroke-opacity", chartStyle.strokeOpacity)
        .attr("d", line);
        
      }, [data]);    

  return (
    <div>
        <h2>Empty</h2>
        <svg ref={svgRef} style={{width: "100%"}}>
            <g className="x-axis" />
            <g className="y-axis" />
        </svg>
    </div>
  );
  
}

export default TrendLine;