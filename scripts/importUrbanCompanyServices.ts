/**
 * Script to import Urban Company services into Firestore
 * Run this once to populate your database with all services
 * 
 * Usage:
 * 1. Make sure you're logged in as admin
 * 2. Go to Admin Panel → Services
 * 3. Use this data to create services via UI
 * 
 * OR
 * 
 * Run this script directly (requires Firebase Admin SDK setup)
 */

import { URBAN_COMPANY_SERVICES } from '../constants/UrbanCompanyServices';
import serviceService from '../services/serviceService';

export const importAllUrbanCompanyServices = async () => {
  console.log(`Starting import of ${URBAN_COMPANY_SERVICES.length} Urban Company services...`);
  
  let successCount = 0;
  let failCount = 0;
  
  for (const service of URBAN_COMPANY_SERVICES) {
    try {
      await serviceService.createService(service);
      successCount++;
      console.log(`✅ Created: ${service.name}`);
    } catch (error) {
      failCount++;
      console.error(`❌ Failed to create: ${service.name}`, error);
    }
  }
  
  console.log(`\n✨ Import complete!`);
  console.log(`✅ Success: ${successCount}`);
  console.log(`❌ Failed: ${failCount}`);
  console.log(`📊 Total: ${URBAN_COMPANY_SERVICES.length}`);
};

// Uncomment to run
// importAllUrbanCompanyServices();

