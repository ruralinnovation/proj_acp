import style from './styles/ControlPanel.module.css';

function ControlPanel() {

  return (
    <div className={style['control-panel']}>
      <h1>ACP Enrollment</h1>
      <p>
        Map showing ACP enrollment by zipcode in February 2024. Hover over a zipcode to see details.
      </p>
    </div>
  )

}

export default ControlPanel;