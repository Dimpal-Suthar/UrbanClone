import { db } from '@/config/firebase';
import { CreateServiceInput, Service, UpdateServiceInput } from '@/types';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';

class ServiceService {
  private servicesCollection = collection(db, 'services');

  /**
   * Get all services
   */
  async getAllServices(): Promise<Service[]> {
    try {
      const q = query(this.servicesCollection, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Service[];
    } catch (error) {
      console.error('Get all services error:', error);
      throw new Error('Failed to fetch services');
    }
  }

  /**
   * Get active services only
   */
  async getActiveServices(): Promise<Service[]> {
    try {
      const q = query(
        this.servicesCollection,
        where('isActive', '==', true),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Service[];
    } catch (error) {
      console.error('Get active services error:', error);
      throw new Error('Failed to fetch active services');
    }
  }

  /**
   * Get services by category
   */
  async getServicesByCategory(category: string): Promise<Service[]> {
    try {
      const q = query(
        this.servicesCollection,
        where('category', '==', category),
        where('isActive', '==', true)
      );
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Service[];
    } catch (error) {
      console.error('Get services by category error:', error);
      throw new Error('Failed to fetch services by category');
    }
  }

  /**
   * Get service by ID
   */
  async getServiceById(serviceId: string): Promise<Service | null> {
    try {
      const docRef = doc(db, 'services', serviceId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data(),
        } as Service;
      }
      
      return null;
    } catch (error) {
      console.error('Get service by ID error:', error);
      throw new Error('Failed to fetch service');
    }
  }

  /**
   * Create new service (Admin only)
   */
  async createService(serviceData: CreateServiceInput): Promise<Service> {
    try {
      const newService = {
        ...serviceData,
        whatsIncluded: serviceData.whatsIncluded ?? [],
        isActive: serviceData.isActive ?? true,
        rating: 0,
        reviewCount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      
      const docRef = await addDoc(this.servicesCollection, newService);
      
      return {
        id: docRef.id,
        ...newService,
      } as Service;
    } catch (error) {
      console.error('Create service error:', error);
      throw new Error('Failed to create service');
    }
  }

  /**
   * Update service (Admin only)
   */
  async updateService(serviceId: string, updates: UpdateServiceInput): Promise<void> {
    try {
      const docRef = doc(db, 'services', serviceId);
      
      await updateDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Update service error:', error);
      throw new Error('Failed to update service');
    }
  }

  /**
   * Delete service (Admin only)
   */
  async deleteService(serviceId: string): Promise<void> {
    try {
      const docRef = doc(db, 'services', serviceId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Delete service error:', error);
      throw new Error('Failed to delete service');
    }
  }

  /**
   * Toggle service active status
   */
  async toggleServiceStatus(serviceId: string, isActive: boolean): Promise<void> {
    try {
      const docRef = doc(db, 'services', serviceId);
      
      await updateDoc(docRef, {
        isActive,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Toggle service status error:', error);
      throw new Error('Failed to toggle service status');
    }
  }
}

export default new ServiceService();

