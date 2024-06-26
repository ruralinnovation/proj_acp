import React from 'react';
import style from './styles/CategoricalLegend.module.css';

interface CategoricalLegendProps {
    title: string;
  }

const CategoricalLegend: React.FC<CategoricalLegendProps> = ({title}) => {
  return (
    <div className={style['categorical-legend']}>
      <h1>{title}</h1>
    </div>
  );
}

export default CategoricalLegend;
