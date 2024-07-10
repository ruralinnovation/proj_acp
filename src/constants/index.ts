import { CategoricalScale } from "../types/";
  
export const ACPMapScale : CategoricalScale = {
    default_color: 'rgba(208, 210, 206, 1)',
    steps: [
        {
            threshold: 0, 
            color: 'rgba(203,243,239, 1)',
            label: "0 - 25%"
        },
        {
            threshold: 25, 
            color: 'rgba(115,207,243, 1)',
            label: "25 - 50%"
        },
        {
            threshold: 50, 
            color: 'rgba(35,79, 191, 1)',
            label: "50 - 75%"
        },
        {
            threshold: 75, 
            color: 'rgba(40,0,80, 1)',
            label: "75 - 100%"
        }
    ]
};
  