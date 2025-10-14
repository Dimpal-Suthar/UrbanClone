import serviceService from '@/services/serviceService';
import { Service, ServiceCategory } from '@/types';
import { makeAutoObservable, runInAction } from 'mobx';

export class ServiceStore {
  // State
  services: Service[] = [];
  selectedService: Service | null = null;
  selectedCategory: ServiceCategory | null = null;
  loading = false;
  error: string | null = null;

  constructor() {
    makeAutoObservable(this);
  }

  /**
   * Get all services
   */
  async fetchServices() {
    try {
      runInAction(() => {
        this.loading = true;
        this.error = null;
      });

      const services = await serviceService.getAllServices();
      
      runInAction(() => {
        this.services = services;
        this.loading = false;
      });
    } catch (error: any) {
      runInAction(() => {
        this.error = error.message;
        this.loading = false;
      });
    }
  }

  /**
   * Get active services only
   */
  async fetchActiveServices() {
    try {
      runInAction(() => {
        this.loading = true;
        this.error = null;
      });

      const services = await serviceService.getActiveServices();
      
      runInAction(() => {
        this.services = services;
        this.loading = false;
      });
    } catch (error: any) {
      runInAction(() => {
        this.error = error.message;
        this.loading = false;
      });
    }
  }

  /**
   * Get services by category
   */
  async fetchServicesByCategory(category: ServiceCategory) {
    try {
      runInAction(() => {
        this.loading = true;
        this.error = null;
        this.selectedCategory = category;
      });

      const services = await serviceService.getServicesByCategory(category);
      
      runInAction(() => {
        this.services = services;
        this.loading = false;
      });
    } catch (error: any) {
      runInAction(() => {
        this.error = error.message;
        this.loading = false;
      });
    }
  }

  /**
   * Select a service
   */
  setSelectedService(service: Service | null) {
    this.selectedService = service;
  }

  /**
   * Set selected category
   */
  setSelectedCategory(category: ServiceCategory | null) {
    this.selectedCategory = category;
  }

  /**
   * Get services by category (from cache)
   */
  get servicesByCategory() {
    if (!this.selectedCategory) return this.services;
    return this.services.filter((s) => s.category === this.selectedCategory);
  }

  /**
   * Get active services count
   */
  get activeServicesCount() {
    return this.services.filter((s) => s.isActive).length;
  }

  /**
   * Get inactive services count
   */
  get inactiveServicesCount() {
    return this.services.filter((s) => !s.isActive).length;
  }

  /**
   * Clear error
   */
  clearError() {
    this.error = null;
  }

  /**
   * Reset store
   */
  reset() {
    this.services = [];
    this.selectedService = null;
    this.selectedCategory = null;
    this.loading = false;
    this.error = null;
  }
}

export const serviceStore = new ServiceStore();

