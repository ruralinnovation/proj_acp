import React from 'react';
import style from './styles/CategoricalLegend.module.css';

import { CategoricalScale } from '../types';

interface CategoricalLegendProps {
  title: string;
  scale: CategoricalScale;
  na_message?: string;
}

const CategoricalLegend: React.FC<CategoricalLegendProps> = ({ title, scale, na_message = "N/A"}) => {

	const legend_rows = [];
  for (let i in scale.steps) {
    legend_rows.push(
      <div key={i} className={style['legend-entry']} >
        <div 
          className={style['key']}
          style={{
            backgroundColor: scale.steps[i].color
          }}
        >
        </div>
        <p>{scale.steps[i].label}</p>
      </div>
    )
  }

  // Push N/A entry
  legend_rows.push(
    <div key={"NA"} className={style['legend-entry']} >
      <div 
        className={style['key']}
        style={{
          backgroundColor: scale.default_color
        }}
      >
      </div>
      <p>{na_message}</p>
    </div>
  )

  return (
    <div className={style['categorical-legend']}>
      <h2>{title}</h2>
      {legend_rows}
    </div>
  );
}

export default CategoricalLegend;
