import style from './styles/ControlPanel.module.css';

import CategoricalLegend from './CategoricalLegend';
import { ACPMapScale } from '../constants';

import { Dispatch, SetStateAction, useCallback, useEffect } from 'react';

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

  const [ date, setDate ] = useState<string>(date_lookup[13]);
  const [ proportionFilter, setProportionFilter ] = useState<number[]>([0, 100]);

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
      updateLayerFilter(date, numberArray);
    }
  };

  const updateLayerFilter = useCallback(
    debounce((date: string, numberArray: number[]) => {
      const [month, year]: string[] = date.split("/");
      const variable_suffix: string = year.slice(-2) + '_' + month.padStart(2, '0');
      const layer_filter = [
        'all',
        ['>=', ['get', variable_suffix], numberArray[0]],
        ['<=', ['get', variable_suffix], numberArray[1]]
      ];
      setParentLayerFilter(layer_filter);
    }, 300),
    [setParentLayerFilter]
  );

  useEffect(() => {
    updateLayerFilter(date, proportionFilter);
  }, [date, proportionFilter, updateLayerFilter]);


  return (
    <div className={style['control-panel']}>
      <div className={style["logos-wrapper"]}>
        <img className={style["logo"]} src={lisc_logo} alt="Rural LISC logo"/>
        <img className={style["logo"]} src={cori_logo} alt="CORI logo"/>
      </div>
      <h1>ACP Enrollment</h1>
      <p style={{fontSize: ".9rem", color: "dimgray"}}>
        The <a href="https://www.fcc.gov/acp" target="_blank">Affordable Connectivity Program</a> (ACP) was an FCC program that alleviated the cost 
        burden of broadband for low-income households. This map allows users to investigate the percentage of ACP enrollment participation by ZIP code over time.
      </p>
      <hr />
      <CategoricalLegend title={"Percent of eligible households enrolled"} scale={ ACPMapScale } na_message='No data available'/>
      <hr />
      <div className={style['filters']}>
        <h2>Filters</h2>
        <div className={style['slider']}>
          <p><b>Month</b>: {date}</p>
          <Slider
            aria-label="Custom marks"
            defaultValue={13}
            step={1}
            valueLabelDisplay="off"
            marks={valid_dates}
            onChange={handleDateChange}
            min={1}
            max={13}
          />
        </div>
        <div id={style['enrollment-slider']} className={style['slider']}>
          <p><b>Percent enrolled</b>: {proportionFilter[0] + "-" + proportionFilter[1] + "%" }</p>
          <Slider
            getAriaLabel={() => 'Percent subscribed'}
            value={proportionFilter}
            valueLabelDisplay="off"
            onChange={handleProportionChange}
          />
        </div>
        <hr />
      </div>
      <div className={style['methodology']}>
        <h2>Methodology</h2>
        <p>
          <a
            href="https://www.lisc.org/rural/our-work/broadband-infrastructure/resources/ruralacp/"
            target="_blank"
            >Learn more about our data methodology.</a>
        </p>
      </div>
    </div>
  )

}

export default ControlPanel;
