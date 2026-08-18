export type Category = {
  id: string;
  emoji: string;
  label: string;
  labelSw: string;
  color: string;
  accent: string;
};

export type Template = {
  id: string;
  categoryId: string;
  title: string;
  subtitle: string;
  bgGradient: string;
  textColor: string;
  accentColor: string;
  uses: number;
  premium: boolean;
};
