import React from 'react';
import style from './styles/TrendLine.module.css';

import { useRef, useEffect } from 'react';
import * as d3 from 'd3';

const formatTickDate = d3.timeFormat("%m/%y");
const formatPercentTick = (d: number) => `${d}%`;

interface TrendLineProps {
    data: {date: Date, value: number}[];
    selected_date: Date;
}

const chartStyle = {
    // margin
    margin: {top: 10, left: 25, bottom: 25, right: 25},
    // Axis ticks
    tickFontSize: "1rem",
    tickFontFamily: "Courier New, monospace",
    tickFontColor: "black",
    tickLineColor: "#d0d2ce",
    xTickSize: 12,
    yTickSize: 6,
    yTickOpacity: 0,
    // Data labels
    dataLabelFontSize: "1rem",
    dataLabelFontFamily: "Courier New, monospace",
    dataLabelFontColor: "black",
    dataLabelFontWeight: "bold",
    // Gridlines
    gridLineColor: "#d0d2ce",
    gridLineOpacity: 1,
    // Colors and fills
    defaultBarFill: "#234FBF",
    // Line chart style
    strokeWidth: 4,
    strokeOpacity: 0.9

}

const TrendLine: React.FC<TrendLineProps> = ({ data, selected_date }) => {

    const svgRef = useRef<SVGSVGElement>(null);

    const width = 225;
    const height = 90;

    useEffect(() => {
    
        if (!svgRef.current) return;
    
        const margin = {...chartStyle.margin};
        const tick_number = 4;
    
        const svg = d3.select(svgRef.current)
          .attr("viewBox", `0 0 ${width} ${height}`)
          .attr("preserveAspectRatio", "xMidYMid meet");


        const start_date = new Date(2022, 0, 1);
        const end_date = new Date(2024, 0, 1);
        const xScale = d3.scaleTime()
            .domain([start_date, end_date])
            .range([margin.left, width - margin.right]);

        const yScale = d3
          .scaleLinear()
          .domain([100, 0])
          .nice()
          .range([margin.top, height - margin.bottom]);
    
        let xAxis = d3.axisBottom<Date>(xScale)
            .ticks(tick_number)
            .tickSize(9)
            .tickFormat(formatTickDate);

        const yAxis = d3.axisLeft<number>(yScale)
          .tickValues([0, 50, 100])
          .tickFormat(formatPercentTick)
          .tickSize(0);
    
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
          .style("font-size", ".6rem")
          .style("color", chartStyle.tickFontColor)  
          
          svg.selectAll(".x-axis text")
          .style("font-family", chartStyle.tickFontFamily)
          .style("font-size", ".6rem")
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

        const selected_date_value = data.find(element => element.date.getTime() == selected_date.getTime())?.value;
        svg.selectAll(".selected-date-circle").remove();
        svg.append("circle")
          .attr("class", "selected-date-circle")
          .attr('cx', xScale(selected_date))
          .attr('cy', yScale(selected_date_value? selected_date_value: 0))
          .attr('r','4px')
          .style('fill', 'black');
          
        
      }, [data, selected_date]);    

  return (
    <div className={style['trendline']}>
        <h3>Percent enrolled over time</h3>
        <svg ref={svgRef} style={{width: "100%"}}>
            <g className="x-axis" />
            <g className="y-axis" />
        </svg>
    </div>
  );
  
}

export default TrendLine;