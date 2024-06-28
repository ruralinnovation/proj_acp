import React from 'react';
import style from './styles/RichTooltip.module.css';

import { format } from 'd3-format';
import TrendLine from './TrendLine';

import { timeFormat } from 'd3-time-format';
const formatDate = timeFormat("%m-%y");

interface RichTooltipProps {
    variable_suffix: string,
    hoverInfo: any
}

const RichTooltip: React.FC<RichTooltipProps> = ({ variable_suffix, hoverInfo }) => {

    const trendline_data: {date: Date, value: number}[] = [];
    for (const [key, value] of Object.entries(hoverInfo.feature.properties)) {
        if (key.startsWith("Percent_") && typeof value == "number") {
            const clean_date = key.replace("Percent_", "").replace(/\./g, "-");
            const date_converted: Date = new Date(clean_date);
            trendline_data.push({date: date_converted, value: value});
        }
    }

    return (
        <div className={style['tooltip']} style={{left: hoverInfo.x, top: hoverInfo.y}}>
            <div>
                <h2>Zipcode: {hoverInfo.feature.properties.Zipcode}</h2>
                <p className={style['metrics']}>
                    {/* Eligble: {hoverInfo.feature.properties['Eligible']}<br/> */}
                    <b>As of {formatDate(new Date(variable_suffix.replace(/\./g, "-")))}</b>:<br/>
                    Subscribed: {hoverInfo.feature.properties['Subscribed_' + variable_suffix]}<br/>
                    Percent subscribed: {format(".3")(hoverInfo.feature.properties['Percent_' + variable_suffix]) + "%"}<br/>
                    Change subscribed: {format(",")(hoverInfo.feature.properties['Change_Subscribed_' + variable_suffix])}<br/>
                    Change percent: {format(",.2s")(hoverInfo.feature.properties['Change_Percent_' + variable_suffix]) + "%"}<br/>
                </p>
            </div>
            <TrendLine data={trendline_data} selected_date={new Date(variable_suffix.replace(/\./g, "-"))} />
        </div>
    );
  
}

export default RichTooltip;