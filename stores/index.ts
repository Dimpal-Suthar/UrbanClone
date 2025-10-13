import { createContext, useContext } from 'react';
import { authStore, AuthStore } from './AuthStore';

// Root store containing all stores
class RootStore {
  authStore: AuthStore;

  constructor() {
    this.authStore = authStore;
  }
}

const rootStore = new RootStore();

// Create context
const StoreContext = createContext(rootStore);

// Custom hook to use stores
export const useStores = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStores must be used within StoreProvider');
  }
  return context;
};

export { rootStore, StoreContext };
export default rootStore;

