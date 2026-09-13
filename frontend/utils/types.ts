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

export type PublicUser = {
  id: number;
  full_name: string;
  email: string;
  phone_number: string;
  role: "super_admin" | "event_host" | "usher";
};
