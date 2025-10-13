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

// Sample Services Data
export const SAMPLE_SERVICES = [
  {
    id: '1',
    name: 'Bathroom Deep Cleaning',
    category: 'cleaning' as ServiceCategory,
    description: 'Professional bathroom cleaning with sanitization',
    price: 499,
    duration: 60,
    imageUrl: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a',
    rating: 4.8,
    reviewCount: 1234,
  },
  {
    id: '2',
    name: 'AC Service & Repair',
    category: 'appliance' as ServiceCategory,
    description: 'Complete AC servicing and gas refill',
    price: 699,
    duration: 90,
    imageUrl: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837',
    rating: 4.7,
    reviewCount: 892,
  },
  {
    id: '3',
    name: 'Hair Cut at Home',
    category: 'beauty' as ServiceCategory,
    description: 'Professional hair styling at your doorstep',
    price: 399,
    duration: 45,
    imageUrl: 'https://images.unsplash.com/photo-1560066984-138dadb4c035',
    rating: 4.9,
    reviewCount: 567,
  },
  {
    id: '4',
    name: 'Plumbing Repair',
    category: 'repairs' as ServiceCategory,
    description: 'Leakage, pipe fitting & more',
    price: 299,
    duration: 60,
    imageUrl: 'https://images.unsplash.com/photo-1607472586893-edb57bdc0e39',
    rating: 4.6,
    reviewCount: 445,
  },
  {
    id: '5',
    name: 'Interior Wall Painting',
    category: 'painting' as ServiceCategory,
    description: 'Premium quality paint with professional finish',
    price: 15000,
    duration: 480,
    imageUrl: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f',
    rating: 4.8,
    reviewCount: 234,
  },
  {
    id: '6',
    name: 'Pest Control Service',
    category: 'pest-control' as ServiceCategory,
    description: 'Safe & effective pest control treatment',
    price: 899,
    duration: 120,
    imageUrl: 'https://images.unsplash.com/photo-1563207153-f403bf289096',
    rating: 4.7,
    reviewCount: 678,
  },
];

// Sample Professionals Data
export const SAMPLE_PROFESSIONALS = [
  {
    id: '1',
    name: 'Rahul Sharma',
    photoUrl: 'https://i.pravatar.cc/150?img=12',
    bio: 'Expert in home cleaning with 5+ years of experience',
    rating: 4.9,
    reviewCount: 234,
    completedJobs: 567,
    services: ['1'],
    distance: 2.5,
  },
  {
    id: '2',
    name: 'Priya Patel',
    photoUrl: 'https://i.pravatar.cc/150?img=5',
    bio: 'Certified beautician specializing in hair & makeup',
    rating: 4.8,
    reviewCount: 189,
    completedJobs: 432,
    services: ['3'],
    distance: 1.8,
  },
  {
    id: '3',
    name: 'Amit Kumar',
    photoUrl: 'https://i.pravatar.cc/150?img=33',
    bio: 'Licensed electrician & plumber with 10 years experience',
    rating: 4.7,
    reviewCount: 456,
    completedJobs: 890,
    services: ['4'],
    distance: 3.2,
  },
  {
    id: '4',
    name: 'Sanjay Verma',
    photoUrl: 'https://i.pravatar.cc/150?img=15',
    bio: 'AC repair specialist with manufacturer certifications',
    rating: 4.9,
    reviewCount: 345,
    completedJobs: 678,
    services: ['2'],
    distance: 4.1,
  },
];

