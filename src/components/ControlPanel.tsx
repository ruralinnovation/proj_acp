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
}

function ControlPanel({ setParentDate }: ControlPanelProps) {

  const [ date, setDate ] = useState<string>(date_lookup[26]);

  const handleChange = (_event: Event, newValue: number | number[]) => {

    if (typeof newValue == "number") {
      setDate(date_lookup[newValue]);
      setParentDate(date_lookup[newValue]);
    }

  };

  return (
    <div className={style['control-panel']}>
      <h1>ACP Enrollment</h1>
      <p>
        Map showing ACP enrollment by zipcode in February 2024. Hover over a zipcode to see details.
      </p>
      <hr />
      <CategoricalLegend title={"Percent enrolled"} scale={ ACPMapScale }/>
      <hr />
      <div className={style['slider']}>
        <p><b>Month</b>: {date}</p>
        <Slider
          aria-label="Custom marks"
          defaultValue={26}
          step={1}
          valueLabelDisplay="off"
          marks={valid_dates}
          onChange={handleChange}
          min={1}
          max={26}
        />
      </div>
    </div>
  )

}

export default ControlPanel;
