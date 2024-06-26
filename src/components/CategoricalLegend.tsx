import React from 'react';
import style from './styles/CategoricalLegend.module.css';

import { CategoricalScale } from '../types';

interface CategoricalLegendProps {
  title: string;
  scale: CategoricalScale;
}

const CategoricalLegend: React.FC<CategoricalLegendProps> = ({ title, scale }) => {

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

  return (
    <div className={style['categorical-legend']}>
      <h2>{title}</h2>
      {legend_rows}
    </div>
  );
}

export default CategoricalLegend;
