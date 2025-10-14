import { CategoryInfo, ServiceCategory } from '@/types';

export const SERVICE_CATEGORIES: CategoryInfo[] = [
  {
    id: 'cleaning',
    name: 'Home Cleaning',
    icon: 'sparkles',
    color: '#3B82F6',
    description: 'Professional home cleaning services',
  },
  {
    id: 'repairs',
    name: 'Repairs & Maintenance',
    icon: 'build',
    color: '#EF4444',
    description: 'General repairs and home maintenance',
  },
  {
    id: 'beauty',
    name: 'Beauty & Spa',
    icon: 'cut',
    color: '#EC4899',
    description: 'Beauty, grooming, and spa services',
  },
  {
    id: 'appliance',
    name: 'Appliance Repair',
    icon: 'tv',
    color: '#8B5CF6',
    description: 'Fix and maintain home appliances',
  },
  {
    id: 'painting',
    name: 'Painting',
    icon: 'color-palette',
    color: '#F59E0B',
    description: 'Interior and exterior painting',
  },
  {
    id: 'pest-control',
    name: 'Pest Control',
    icon: 'bug',
    color: '#10B981',
    description: 'Pest control and fumigation',
  },
  {
    id: 'plumbing',
    name: 'Plumbing',
    icon: 'water',
    color: '#06B6D4',
    description: 'Plumbing installation and repairs',
  },
  {
    id: 'electrical',
    name: 'Electrical',
    icon: 'flash',
    color: '#FBBF24',
    description: 'Electrical work and installations',
  },
  {
    id: 'carpentry',
    name: 'Carpentry',
    icon: 'hammer',
    color: '#92400E',
    description: 'Furniture and woodwork services',
  },
];

export const getCategoryInfo = (categoryId: ServiceCategory): CategoryInfo => {
  return SERVICE_CATEGORIES.find((cat) => cat.id === categoryId) || SERVICE_CATEGORIES[0];
};

export const getCategoryColor = (categoryId: ServiceCategory): string => {
  return getCategoryInfo(categoryId).color;
};

export const getCategoryIcon = (categoryId: ServiceCategory): string => {
  return getCategoryInfo(categoryId).icon;
};

export const getCategoryName = (categoryId: ServiceCategory): string => {
  return getCategoryInfo(categoryId).name;
};

