import { CategoricalScale } from "../types/";
  
export const ACPMapScale : CategoricalScale = {
    default_color: 'rgba(255, 0, 0, 1)',
    steps: [
        {
            threshold: 0, 
            color: 'rgba(163, 226, 181, 1)',
            label: "0 - 25%"
        },
        {
            threshold: 25, 
            color: 'rgba(116, 168, 141, 1)',
            label: "25 - 50%"
        },
        {
            threshold: 50, 
            color: 'rgba(69, 110, 102, 1)',
            label: "50 - 75%"
        },
        {
            threshold: 75, 
            color: 'rgba(22, 52, 62, 1)',
            label: "75 - 100%"
        }
    ]
};
  