import style from './styles/ControlPanel.module.css';

import CategoricalLegend from './CategoricalLegend';

function ControlPanel() {

  return (
    <div className={style['control-panel']}>
      <h1>ACP Enrollment</h1>
      <p>
        Map showing ACP enrollment by zipcode in February 2024. Hover over a zipcode to see details.
      </p>
      <hr />
      <CategoricalLegend title={"Categorical legend title"} />
    </div>
  )

}

export default ControlPanel;