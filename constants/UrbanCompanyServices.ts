import { CreateServiceInput, ServiceCategory } from '@/types';

/**
 * Urban Company Services - Exact Match
 * These are the actual services offered by Urban Company
 */

export const URBAN_COMPANY_SERVICES: CreateServiceInput[] = [
  // ===== SALON FOR WOMEN =====
  {
    name: 'Hair Cut',
    category: 'beauty',
    description: 'Professional hair cutting and styling for women. Includes consultation, wash, cut, and blow dry.',
    basePrice: 349,
    duration: 45,
    whatsIncluded: [
      'Professional consultation',
      'Hair wash with premium shampoo',
      'Precision cutting by expert stylist',
      'Blow dry and styling',
      'Hair care tips and advice'
    ],
    isActive: true,
  },
  {
    name: 'Hair Spa & Treatment',
    category: 'beauty',
    description: 'Deep conditioning hair spa treatment with L\'Oréal products. Includes massage, steam, and wash.',
    basePrice: 899,
    duration: 90,
    whatsIncluded: [
      'Hair analysis and consultation',
      'Deep cleansing with premium shampoo',
      'Hair massage with nourishing oil',
      'Steam treatment for deep conditioning',
      'Hair mask application',
      'Final wash and styling'
    ],
    isActive: true,
  },
  {
    name: 'Facial',
    category: 'beauty',
    description: 'VLCC/O3+ facial with cleansing, scrubbing, massage, pack, and serum. Glowing skin guaranteed.',
    basePrice: 799,
    duration: 60,
    isActive: true,
  },
  {
    name: 'Waxing - Full Arms & Legs',
    category: 'beauty',
    description: 'Rica waxing for arms and legs. Smooth, hair-free skin for weeks.',
    basePrice: 649,
    duration: 60,
    isActive: true,
  },
  {
    name: 'Pedicure',
    category: 'beauty',
    description: 'Professional pedicure with scrubbing, nail shaping, cuticle care, and massage.',
    basePrice: 499,
    duration: 50,
    isActive: true,
  },
  {
    name: 'Manicure',
    category: 'beauty',
    description: 'Professional manicure with nail care, cuticle treatment, and hand massage.',
    basePrice: 399,
    duration: 40,
    isActive: true,
  },
  {
    name: 'Bleach',
    category: 'beauty',
    description: 'Face and neck bleaching with VLCC/O3+ products for brighter, even-toned skin.',
    basePrice: 399,
    duration: 30,
    isActive: true,
  },
  {
    name: 'Threading - Face',
    category: 'beauty',
    description: 'Complete face threading including eyebrows, upper lip, forehead, and chin.',
    basePrice: 99,
    duration: 20,
    isActive: true,
  },

  // ===== SALON FOR MEN =====
  {
    name: 'Haircut - Men',
    category: 'beauty',
    description: 'Professional hair cutting and styling for men. Includes consultation, wash, cut, and styling.',
    basePrice: 249,
    duration: 30,
    isActive: true,
  },
  {
    name: 'Shave & Facial - Men',
    category: 'beauty',
    description: 'Clean shave with hot towel treatment and post-shave facial.',
    basePrice: 299,
    duration: 40,
    isActive: true,
  },
  {
    name: 'Head Massage - Men',
    category: 'beauty',
    description: 'Relaxing head massage with nourishing hair oil for 20 minutes.',
    basePrice: 199,
    duration: 25,
    isActive: true,
  },

  // ===== SPA =====
  {
    name: 'Full Body Massage',
    category: 'beauty',
    description: 'Swedish/Deep tissue full body massage with aromatherapy oils. Complete relaxation.',
    basePrice: 1499,
    duration: 90,
    isActive: true,
  },
  {
    name: 'Thai Massage',
    category: 'beauty',
    description: 'Traditional Thai massage with stretching techniques. Improves flexibility and relieves tension.',
    basePrice: 1799,
    duration: 90,
    isActive: true,
  },
  {
    name: 'Foot Massage',
    category: 'beauty',
    description: 'Relaxing foot massage with reflexology techniques. Relieves tired feet.',
    basePrice: 599,
    duration: 30,
    isActive: true,
  },

  // ===== HOME CLEANING =====
  {
    name: 'Bathroom Cleaning',
    category: 'cleaning',
    description: 'Deep cleaning of bathroom tiles, toilet, sink, mirrors, and fittings. Includes scrubbing and sanitization.',
    basePrice: 449,
    duration: 90,
    isActive: true,
  },
  {
    name: 'Kitchen Cleaning',
    category: 'cleaning',
    description: 'Deep cleaning of kitchen platform, cabinets, sink, gas stove, and tiles. Includes degreasing.',
    basePrice: 549,
    duration: 120,
    isActive: true,
  },
  {
    name: 'Full Home Deep Cleaning',
    category: 'cleaning',
    description: 'Complete house cleaning including dusting, mopping, bathroom, kitchen, and balcony. Professional team.',
    basePrice: 2499,
    duration: 240,
    whatsIncluded: [
      'Complete dusting of all surfaces',
      'Deep cleaning of all bathrooms',
      'Kitchen deep cleaning and degreasing',
      'Floor mopping and sanitization',
      'Balcony and terrace cleaning',
      'Window and glass cleaning',
      'Furniture dusting and polishing',
      'Trash disposal and organization'
    ],
    isActive: true,
  },
  {
    name: 'Sofa Cleaning',
    category: 'cleaning',
    description: 'Deep cleaning of sofa with vacuum and stain removal. 3-seater sofa.',
    basePrice: 849,
    duration: 60,
    isActive: true,
  },
  {
    name: 'Carpet Cleaning',
    category: 'cleaning',
    description: 'Professional carpet shampooing and vacuum cleaning. Per sqft pricing.',
    basePrice: 499,
    duration: 90,
    isActive: true,
  },

  // ===== APPLIANCE REPAIR =====
  {
    name: 'AC Service & Repair',
    category: 'appliance',
    description: 'AC servicing including gas refilling, deep cleaning, and general repair. Covers all brands.',
    basePrice: 349,
    duration: 60,
    isActive: true,
  },
  {
    name: 'Washing Machine Repair',
    category: 'appliance',
    description: 'Expert repair for all washing machine issues. Includes diagnosis and parts.',
    basePrice: 249,
    duration: 45,
    isActive: true,
  },
  {
    name: 'Refrigerator Repair',
    category: 'appliance',
    description: 'Professional refrigerator repair service. Covers cooling, noise, and all other issues.',
    basePrice: 349,
    duration: 60,
    isActive: true,
  },
  {
    name: 'Geyser Repair',
    category: 'appliance',
    description: 'Complete geyser repair and servicing. Element replacement, thermostat check.',
    basePrice: 249,
    duration: 45,
    isActive: true,
  },
  {
    name: 'Microwave Repair',
    category: 'appliance',
    description: 'Microwave oven repair for all brands. Heating, turntable, and display issues.',
    basePrice: 299,
    duration: 45,
    isActive: true,
  },
  {
    name: 'RO Water Purifier Service',
    category: 'appliance',
    description: 'RO service including filter replacement, membrane cleaning, and sanitization.',
    basePrice: 349,
    duration: 60,
    isActive: true,
  },

  // ===== PAINTING =====
  {
    name: '1 BHK Painting - Interior',
    category: 'painting',
    description: 'Complete interior painting of 1 BHK with Asian Paints/Berger. Includes 2 coats.',
    basePrice: 8999,
    duration: 480,
    isActive: true,
  },
  {
    name: '2 BHK Painting - Interior',
    category: 'painting',
    description: 'Complete interior painting of 2 BHK with premium paints. Professional team.',
    basePrice: 14999,
    duration: 720,
    isActive: true,
  },
  {
    name: 'Single Wall Painting',
    category: 'painting',
    description: 'Single wall painting with primer and 2 coats. Up to 100 sqft.',
    basePrice: 1499,
    duration: 120,
    isActive: true,
  },
  {
    name: 'Texture Painting',
    category: 'painting',
    description: 'Designer texture painting for accent walls. Multiple designs available.',
    basePrice: 2499,
    duration: 180,
    isActive: true,
  },

  // ===== PEST CONTROL =====
  {
    name: 'Cockroach Control',
    category: 'pest-control',
    description: 'Complete cockroach pest control with gel treatment. 3 months warranty.',
    basePrice: 699,
    duration: 45,
    isActive: true,
  },
  {
    name: 'Termite Control',
    category: 'pest-control',
    description: 'Anti-termite treatment for home. Drilling and chemical treatment. 5 years warranty.',
    basePrice: 2499,
    duration: 180,
    isActive: true,
  },
  {
    name: 'Bedbug Control',
    category: 'pest-control',
    description: 'Bedbug elimination with professional treatment. Safe for kids and pets.',
    basePrice: 1499,
    duration: 90,
    isActive: true,
  },
  {
    name: 'General Pest Control',
    category: 'pest-control',
    description: 'Complete home pest control covering all pests. Quarterly service available.',
    basePrice: 899,
    duration: 60,
    isActive: true,
  },

  // ===== PLUMBING =====
  {
    name: 'Tap Repair/Installation',
    category: 'plumbing',
    description: 'Fixing leaking taps, replacement, or new installation. All brands.',
    basePrice: 149,
    duration: 30,
    isActive: true,
  },
  {
    name: 'Washbasin Installation',
    category: 'plumbing',
    description: 'Complete washbasin installation with piping and fittings.',
    basePrice: 549,
    duration: 90,
    isActive: true,
  },
  {
    name: 'Toilet Repair',
    category: 'plumbing',
    description: 'Toilet flush repair, seat replacement, and other toilet issues.',
    basePrice: 199,
    duration: 45,
    isActive: true,
  },
  {
    name: 'Drain/Pipe Blockage',
    category: 'plumbing',
    description: 'Clearing blocked drains and pipes. Includes jet cleaning if needed.',
    basePrice: 349,
    duration: 60,
    isActive: true,
  },
  {
    name: 'Water Tank Cleaning',
    category: 'plumbing',
    description: 'Complete water tank cleaning and sanitization. Up to 500L capacity.',
    basePrice: 799,
    duration: 120,
    isActive: true,
  },

  // ===== ELECTRICIAN =====
  {
    name: 'Switch/Socket Installation',
    category: 'electrical',
    description: 'Installation or replacement of switches and sockets. Per point.',
    basePrice: 99,
    duration: 20,
    isActive: true,
  },
  {
    name: 'Fan Repair/Installation',
    category: 'electrical',
    description: 'Ceiling fan repair, regulator replacement, or new installation.',
    basePrice: 149,
    duration: 30,
    isActive: true,
  },
  {
    name: 'Light Installation',
    category: 'electrical',
    description: 'Installing lights, chandeliers, or LED panels. Includes wiring.',
    basePrice: 149,
    duration: 30,
    isActive: true,
  },
  {
    name: 'MCB/Fuse Repair',
    category: 'electrical',
    description: 'MCB tripping issue, fuse box repair, and electrical panel servicing.',
    basePrice: 199,
    duration: 45,
    isActive: true,
  },
  {
    name: 'Wiring & Rewiring',
    category: 'electrical',
    description: 'Complete house wiring or rewiring. Professional electricians.',
    basePrice: 499,
    duration: 120,
    isActive: true,
  },

  // ===== CARPENTRY =====
  {
    name: 'Furniture Assembly',
    category: 'carpentry',
    description: 'Assembly of flat-pack furniture from IKEA, Amazon, etc. Per item.',
    basePrice: 299,
    duration: 60,
    isActive: true,
  },
  {
    name: 'Door/Window Repair',
    category: 'carpentry',
    description: 'Fixing door hinges, locks, handles, window shutters, and alignment.',
    basePrice: 249,
    duration: 45,
    isActive: true,
  },
  {
    name: 'Kitchen Cabinet Repair',
    category: 'carpentry',
    description: 'Cabinet hinge replacement, drawer repair, and handle fixing.',
    basePrice: 199,
    duration: 45,
    isActive: true,
  },
  {
    name: 'Furniture Polishing',
    category: 'carpentry',
    description: 'Furniture polishing and restoration. Makes old furniture look new.',
    basePrice: 499,
    duration: 90,
    isActive: true,
  },
  {
    name: 'Drill & Hang',
    category: 'carpentry',
    description: 'Drilling and hanging pictures, shelves, TV mounts, etc. Per item.',
    basePrice: 99,
    duration: 20,
    isActive: true,
  },
];

/**
 * Helper function to add Urban Company services to Firestore
 * Run this once to populate your database
 */
export const getUrbanCompanyServicesForImport = () => {
  return URBAN_COMPANY_SERVICES;
};

/**
 * Total count of services
 */
export const URBAN_COMPANY_SERVICE_COUNT = URBAN_COMPANY_SERVICES.length;

/**
 * Services grouped by category
 */
export const getServicesByCategory = (category: ServiceCategory) => {
  return URBAN_COMPANY_SERVICES.filter((service) => service.category === category);
};

/**
 * Category counts
 */
export const getCategoryCounts = () => {
  const counts: { [key: string]: number } = {};
  URBAN_COMPANY_SERVICES.forEach((service) => {
    counts[service.category] = (counts[service.category] || 0) + 1;
  });
  return counts;
};

