import style from './styles/ControlPanel.module.css';

import CategoricalLegend from './CategoricalLegend';
import { ACPMapScale } from '../constants';

import { Dispatch, SetStateAction, useCallback } from 'react';

import debounce from 'lodash/debounce';

import Slider from '@mui/material/Slider';
import { useState } from 'react';

import lisc_logo from "../assets/Rural_stacked corrected png.png";
import cori_logo from "../assets/Full-Logo_CORI_Black.svg";

interface ControlPanelProps {
  setParentDate: Dispatch<SetStateAction<string>>;
  setParentLayerFilter: Dispatch<SetStateAction<(string | (string | number | string[])[])[]>>;
  valid_dates: { value: number} [];
  date_lookup: Record<number, string>;
}

function ControlPanel({ setParentDate, setParentLayerFilter, valid_dates, date_lookup }: ControlPanelProps) {

  const [ date, setDate ] = useState<string>(date_lookup[26]);
  const [ proportionFilter, setProportionFilter ] = useState<number[]>([0, 100]);

  const [month, year]: string[] = date.split("/");
  const variable_suffix: string = year + '.' + month.padStart(2, '0') + '.01';

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
      debouncedSetParentLayerFilter(numberArray);
    }
  };

  const debouncedSetParentLayerFilter = useCallback(
    debounce((numberArray: number[]) => {
      const layer_filter = [
        'all',
        ['>=', ['get', 'Percent_' + variable_suffix], numberArray[0]],
        ['<=', ['get', 'Percent_' + variable_suffix], numberArray[1]]
      ];
      setParentLayerFilter(layer_filter);
    }, 300),
    [variable_suffix, setParentLayerFilter]
  );

  return (
    <div className={style['control-panel']}>
      <div className={style["logos-wrapper"]}>
        <img className={style["logo"]} src={lisc_logo} alt="Rural LISC logo"/>
        <img className={style["logo"]} src={cori_logo} alt="CORI logo"/>
      </div>
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
      <div id={style['enrollment-slider']} className={style['slider']}>
        <p><b>Filter percent enrolled</b>: {proportionFilter[0] + "-" + proportionFilter[1] + "%" }</p>
        <Slider
          getAriaLabel={() => 'Percent subscribed'}
          value={proportionFilter}
          valueLabelDisplay="off"
          onChange={handleProportionChange}
        />
      </div>
    </div>
  )

}

export default ControlPanel;
