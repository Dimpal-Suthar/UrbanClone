import { CategoryInfo, ServiceCategory } from '@/types';

export const SERVICE_CATEGORIES: CategoryInfo[] = [
  {
    id: 'cleaning',
    name: 'Home Cleaning',
    icon: 'sparkles',
    image: require('@/assets/images/cleaning.jpg'),
    color: '#3B82F6',
    description: 'Professional home cleaning services',
  },
  {
    id: 'beauty',
    name: 'Beauty & Spa',
    icon: 'cut',
    image: require('@/assets/images/beauty.jpg'),
    color: '#EC4899',
    description: 'Beauty, grooming, and spa services',
  },
  {
    id: 'repairs',
    name: 'Repairs & Maintenance',
    icon: 'build',
    image: require('@/assets/images/repairs.jpg'),
    color: '#EF4444',
    description: 'General repairs and home maintenance',
  },
  {
    id: 'appliance',
    name: 'Appliance Repair',
    icon: 'tv',
    image: require('@/assets/images/appliance.jpg'),
    color: '#8B5CF6',
    description: 'Fix and maintain home appliances',
  },
  {
    id: 'painting',
    name: 'Painting',
    icon: 'color-palette',
    image: require('@/assets/images/painting.jpg'),
    color: '#F59E0B',
    description: 'Interior and exterior painting',
  },
  {
    id: 'pest-control',
    name: 'Pest Control',
    icon: 'bug',
    image: require('@/assets/images/pest-control.jpg'),
    color: '#10B981',
    description: 'Pest control and fumigation',
  },
  {
    id: 'plumbing',
    name: 'Plumbing',
    icon: 'water',
    image: require('@/assets/images/plumbing.jpg'),
    color: '#06B6D4',
    description: 'Plumbing installation and repairs',
  },
  {
    id: 'electrical',
    name: 'Electrical',
    icon: 'flash',
    image: require('@/assets/images/electrical.jpg'),
    color: '#FBBF24',
    description: 'Electrical work and installations',
  },
  {
    id: 'carpentry',
    name: 'Carpentry',
    icon: 'hammer',
    image: require('@/assets/images/carpentry.jpg'),
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

