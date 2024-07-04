import style from './styles/ControlPanel.module.css';

import CategoricalLegend from './CategoricalLegend';
import { ACPMapScale } from '../constants';

import { Dispatch, SetStateAction } from 'react';

import Slider from '@mui/material/Slider';
import { useState } from 'react';

const valid_dates: { value: number} [] = [];
const date_lookup: Record<number, string> = {};

// 2022.01.01 - Start
// 2024.02.01 - End

let step: number = 0;
for (let year = 2022; year <= 2024; year++) {
  for (let month = 1; month <= 12; month++) {
    
    if (year === 2024 && month > 2) {
      break;
    }

    step = step + 1;

    valid_dates.push({value: step});
    date_lookup[step] = month + "/" + year;

  }
}

interface ControlPanelProps {
  setParentDate: Dispatch<SetStateAction<string>>;
  setParentLayerFilter: Dispatch<SetStateAction<(string | (string | number | string[])[])[]>>;
}

function ControlPanel({ setParentDate, setParentLayerFilter }: ControlPanelProps) {

  const [ date, setDate ] = useState<string>(date_lookup[26]);
  const [ proportionFilter, setProportionFilter ] = useState<number[]>([0, 100]);

  const [month, year]: string[] = date.split("/");
  const variable_suffix: string = year + '.' + month.padStart(2, '0') + '.01'

  const handleDateChange = (_event: Event, newValue: number | number[]) => {

    if (typeof newValue == "number") {
      setDate(date_lookup[newValue]);
      setParentDate(date_lookup[newValue]);
    }

  };

  const handleProportionChange = (_event: Event, newValue: number | number[]) => {
    const isNumberArray: boolean = Array.isArray(newValue) && newValue.every(item => typeof item === 'number');
    if (isNumberArray) {
      const numberArray = newValue as number[];
      setProportionFilter(numberArray);
      const layer_filter = [
        'all',
        ['>=', ['get', 'Percent_' + variable_suffix], numberArray[0]],
        ['<=', ['get', 'Percent_' + variable_suffix], numberArray[1]]
      ];
      setParentLayerFilter(layer_filter);
    }
  };
  

  return (
    <div className={style['control-panel']}>
      <h1>ACP Enrollment</h1>
      <p>
        Map showing ACP enrollment by zipcode by month. Hover over a zipcode to see details.
      </p>
      <hr />
      <CategoricalLegend title={"Percent enrolled"} scale={ ACPMapScale } na_message='No data available'/>
      <hr />
      <div className={style['slider']}>
        <p><b>Month</b>: {date}</p>
        <Slider
          aria-label="Custom marks"
          defaultValue={26}
          step={1}
          valueLabelDisplay="off"
          marks={valid_dates}
          onChange={handleDateChange}
          min={1}
          max={26}
        />
      </div>
      <hr />
      <div className={style['slider']}>
        <p><b>Percent enrolled filter</b>: {proportionFilter[0] + "-" + proportionFilter[1] + "%" }</p>
        <Slider
          getAriaLabel={() => 'Percent subscribed'}
          value={proportionFilter}
          valueLabelDisplay="auto"
          onChange={handleProportionChange}
        />
      </div>
    </div>
  )

}

export default ControlPanel;
