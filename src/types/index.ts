export interface CategoricalScaleStep {
    threshold: number;
    color: string;
    label: string;
}

export interface CategoricalScale {
    default_color: string;
    steps: CategoricalScaleStep[]
  }