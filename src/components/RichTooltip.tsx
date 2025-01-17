import React from 'react';
import style from './styles/RichTooltip.module.css';

import { format } from 'd3-format';
import TrendLine from './TrendLine';

import { timeFormat } from 'd3-time-format';
const formatDate = timeFormat("%m/%y");

import { parseDate } from '../utils';

interface RichTooltipProps {
    variable_suffix: string,
    hoverInfo: any,
    subscribed_val: number | null
}

const RichTooltip: React.FC<RichTooltipProps> = ({ variable_suffix, hoverInfo, subscribed_val }) => {

    // Filter the properties to only include the data we want to plot in
    // the line chart. If it starts with "2" it is a Pct. enrolled column
    const trendline_data: {date: Date, value: number}[] = [];
    for (const [key, value] of Object.entries(hoverInfo.feature.properties)) {
        if (key.startsWith("2") && typeof value == "number") {
            const date_converted: Date = parseDate(key);
            trendline_data.push({date: date_converted, value: value});
        }
    }

    trendline_data.sort((a: any, b: any) => a.date - b.date);

    return (
        <div className={style['tooltip']} style={{left: hoverInfo.x, top: hoverInfo.y}}>
            <div>
                <h2>Zipcode: {hoverInfo.feature.properties.Zipcode}</h2>
                <div>
                    <p>Congressional district: {hoverInfo.feature.properties['cd_name']}<br />
                    Counties: {hoverInfo.feature.properties['county_name']}</p>
                </div>
                <div className={style['metrics']}>
                    {/* Eligble: {hoverInfo.feature.properties['Eligible']}<br/> */}
                    <p><b>As of {formatDate(parseDate(variable_suffix))}</b>:</p>
                    <p>
                    Enrolled: {subscribed_val? format(",")(subscribed_val) : "N/A"}<br/>
                    Percent enrolled: {format(".3")(hoverInfo.feature.properties[variable_suffix]) + "%"}
                    </p>
                </div>
            </div>
            <TrendLine data={trendline_data} selected_date={parseDate(variable_suffix)} />
        </div>
    );
  
}

export default RichTooltip;