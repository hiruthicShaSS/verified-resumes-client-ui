import { LucideIcon } from 'lucide-react';

export interface DashboardCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  color: string;
  delay?: number;
}
