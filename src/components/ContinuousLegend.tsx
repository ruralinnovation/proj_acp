import React from 'react';
import style from './styles/ContinuousLegend.module.css';

interface ContinuousLegendProps {
    title: string;
    description: string;
    start_val: number;
    end_val: number;
  }

const ContinuousLegend: React.FC<ContinuousLegendProps> = ({}) => {
  return (
    <div className={style['continuous-legend']}>
      <h1>Map Legend</h1>
    </div>
  );
}

export default ContinuousLegend;
