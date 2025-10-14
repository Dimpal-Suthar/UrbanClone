import { ServiceCategory } from '../types';

export interface CategoryItem {
  id: ServiceCategory;
  name: string;
  icon: string;
  color: string;
  description: string;
}

export const CATEGORIES: CategoryItem[] = [
  {
    id: 'cleaning',
    name: 'Cleaning',
    icon: 'sparkles',
    color: '#4CAF50',
    description: 'Home & Office Cleaning',
  },
  {
    id: 'repairs',
    name: 'Repairs',
    icon: 'build',
    color: '#FF9800',
    description: 'Plumbing, Electrician & More',
  },
  {
    id: 'beauty',
    name: 'Beauty',
    icon: 'cut',
    color: '#E91E63',
    description: 'Salon & Spa at Home',
  },
  {
    id: 'appliance',
    name: 'Appliances',
    icon: 'tv',
    color: '#2196F3',
    description: 'AC, Fridge & More',
  },
  {
    id: 'painting',
    name: 'Painting',
    icon: 'color-palette',
    color: '#9C27B0',
    description: 'Interior & Exterior',
  },
  {
    id: 'pest-control',
    name: 'Pest Control',
    icon: 'bug',
    color: '#795548',
    description: 'Mosquito, Termite & More',
  },
];


