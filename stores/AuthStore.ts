import { auth, db } from '@/config/firebase';
import authService, { UserProfile } from '@/services/authService';
import { getAuthErrorMessage } from '@/utils/authErrors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, onSnapshot, setDoc, Unsubscribe } from 'firebase/firestore';
import { makeAutoObservable, runInAction } from 'mobx';

export class AuthStore {
  // State
  user: User | null = null;
  userProfile: UserProfile | null = null;
  loading = true;
  error: string | null = null;
  
  // Onboarding state
  hasSeenOnboarding = false;

  // Profile listener
  private profileUnsubscribe: Unsubscribe | null = null;

  constructor() {
    makeAutoObservable(this);
    this.initAuth();
  }

  /**
   * Initialize authentication listener
   */
  private async initAuth() {
    try {
      await this.checkOnboardingStatus();
    } catch (error) {
      console.error('Onboarding check error:', error);
    }
    
    // Listen to auth state changes
    onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('🔄 Auth state changed:', firebaseUser?.uid ? 'User logged in' : 'User logged out');
      
      runInAction(() => {
        this.user = firebaseUser;
        // CRITICAL: Keep loading = true if user exists (wait for profile)
        // Only set loading = false if user is null (logged out)
        this.loading = firebaseUser !== null;
      });

      if (firebaseUser) {
        // Set up real-time profile listener (will set loading = false when profile loads)
        this.setupProfileListener(firebaseUser.uid);
      } else {
        // Clean up listener and clear profile
        if (this.profileUnsubscribe) {
          this.profileUnsubscribe();
          this.profileUnsubscribe = null;
        }
        runInAction(() => {
          this.userProfile = null;
          this.loading = false; // User logged out - stop loading
        });
      }
    });
  }

  /**
   * Setup real-time listener for user profile changes
   */
  private setupProfileListener(uid: string) {
    // Clean up existing listener
    if (this.profileUnsubscribe) {
      this.profileUnsubscribe();
    }

    console.log('👂 Setting up real-time profile listener for UID:', uid);
    
    // FAILSAFE: Set timeout to stop loading after 5 seconds (prevents infinite loop)
    // Reduced from 10s to 5s for faster recovery
    const timeoutId = setTimeout(() => {
      console.warn('⚠️ Profile listener timeout after 5s - stopping loading');
      runInAction(() => {
        if (this.loading) {
          // CRITICAL: Always stop loading after timeout, even if profile exists
          this.loading = false;
          if (!this.userProfile) {
            console.warn('⚠️ Profile loading timeout - continuing without profile');
          } else {
            console.log('✅ Profile loaded but loading state was still true - fixed');
          }
        }
      });
    }, 5000); // Reduced to 5 seconds for faster recovery
    
    this.profileUnsubscribe = onSnapshot(
      doc(db, 'users', uid),
      (snapshot) => {
        clearTimeout(timeoutId); // Clear timeout on success
        
        if (snapshot.exists()) {
          const profile = snapshot.data() as UserProfile;
          
          // Validate profile has required fields
          if (!profile.role) {
            console.warn('⚠️ Profile missing role field, defaulting to customer');
            profile.role = 'customer';
          }
          
          // Only log if role actually changed or first load
          if (!this.userProfile || this.userProfile.role !== profile.role) {
            console.log('🔄 Profile updated. Role:', profile.role);
          }
          
          // CRITICAL: Use runInAction to ensure both updates happen atomically
          // This single atomic update ensures MobX notifies all observers correctly
          runInAction(() => {
            this.userProfile = profile;
            this.loading = false; // CRITICAL: Stop loading when profile is loaded
          });
          
          console.log('✅ Profile loaded successfully - Role:', profile.role);
        } else {
          clearTimeout(timeoutId); // Clear timeout before creating profile
          console.warn('⚠️ User profile document does not exist');
          
          // CRITICAL: Stop loading immediately, then try to create profile
          // This prevents infinite loading loop
          runInAction(() => {
            this.loading = false;
          });
          
          // Try to create default profile in background (non-blocking)
          this.createDefaultProfile(uid).catch((error) => {
            console.error('❌ Profile creation failed:', error);
            // Loading already stopped above
          });
        }
      },
      (error: any) => {
        clearTimeout(timeoutId); // Clear timeout on error
        
        console.error('❌ Profile listener error:', error);
        
        // CRITICAL: ALWAYS stop loading on error to prevent infinite loop
        runInAction(() => {
          this.loading = false;
        });
        
        // Handle offline errors gracefully
        if (error.code === 'unavailable' || error.code === 'failed-precondition') {
          console.warn('⚠️ Firestore is offline. App will work in offline mode.');
        }
      }
    );
  }

  /**
   * Create default profile if it doesn't exist
   * CRITICAL: Uses merge: true to never overwrite existing data
   */
  private async createDefaultProfile(uid: string): Promise<void> {
    try {
      console.log('📝 Creating default profile for UID:', uid);
      const user = this.user;
      
      if (!user) {
        console.warn('⚠️ Cannot create profile: No user found');
        runInAction(() => {
          this.loading = false; // Stop loading if no user
        });
        return;
      }
      
      // CRITICAL: Check if document already exists before creating
      const userRef = doc(db, 'users', uid);
      const docSnap = await getDoc(userRef);
      
      // If document exists, don't overwrite it - just update missing fields
      if (docSnap.exists()) {
        const existingData = docSnap.data() as UserProfile;
        console.log('⚠️ User document already exists, using merge to preserve existing data');
        console.log('📋 Existing role:', existingData.role);
        
        // Only set default role if it doesn't exist
        const defaultProfile: Partial<UserProfile> = {
          uid,
          email: existingData.email || user.email || '',
          displayName: existingData.displayName || user.displayName || '',
          authMethod: existingData.authMethod || (user.phoneNumber ? 'phone' : 'email'),
          emailVerified: existingData.emailVerified ?? user.emailVerified ?? false,
          updatedAt: new Date(),
        };
        
        // CRITICAL: Only set role if it doesn't exist in existing document
        if (!existingData.role) {
          defaultProfile.role = 'customer';
          console.log('⚠️ WARNING: Setting default role to customer (role was missing)');
        } else {
          console.log('✅ Preserving existing role:', existingData.role);
        }
        
        // Use merge: true to preserve all existing fields
        await setDoc(userRef, defaultProfile, { merge: true });
        
        runInAction(() => {
          this.userProfile = { ...existingData, ...defaultProfile } as UserProfile;
          this.loading = false;
        });
      } else {
        // Document doesn't exist - create new one
        const defaultProfile: UserProfile = {
          uid,
          role: 'customer', // Only set default role for new users
          email: user.email || '',
          displayName: user.displayName || '',
          authMethod: user.phoneNumber ? 'phone' : 'email',
          emailVerified: user.emailVerified || false,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        
        // Use merge: true even for new documents to be safe
        await setDoc(userRef, defaultProfile, { merge: true });
        
        runInAction(() => {
          this.userProfile = defaultProfile;
          this.loading = false;
        });
        
        console.log('✅ New default profile created - Role:', defaultProfile.role);
      }
    } catch (error: any) {
      console.error('❌ Error creating default profile:', error);
      
      // CRITICAL: ALWAYS stop loading, even if creation fails
      runInAction(() => {
        this.loading = false;
      });
      
      // If offline or permission denied, that's OK - user can complete profile later
      if (error.code === 'unavailable' || error.code === 'permission-denied') {
        console.warn('⚠️ Cannot create profile (offline or permission denied). User will complete profile later.');
      }
    }
  }

  /**
   * Load user profile from Firestore
   */
  async loadUserProfile(uid: string) {
    try {
      console.log('🔄 Loading user profile for UID:', uid);
      const profile = await authService.getUserProfile(uid);
      runInAction(() => {
        this.userProfile = profile;
      });
      console.log('✅ User profile loaded successfully');
    } catch (error) {
      console.error('Error loading user profile:', error);
      // Don't set userProfile to null on error, keep existing value
      // This prevents unnecessary redirects to auth screens
    }
  }

  /**
   * Refresh current user's profile (public method for external use)
   */
  async refreshUserProfile() {
    if (!this.user?.uid) {
      console.warn('⚠️ Cannot refresh profile: No user logged in');
      return;
    }
    await this.loadUserProfile(this.user.uid);
  }

  // ========== EMAIL AUTHENTICATION ==========

  /**
   * Sign up with email
   */
  async signUpWithEmail(
    email: string, 
    password: string, 
    displayName?: string, 
    wantsToBecomeProvider?: boolean
  ): Promise<void> {
    try {
      runInAction(() => {
        this.loading = true;
        this.error = null;
      });

      await authService.signUpWithEmail(email, password, displayName, wantsToBecomeProvider);
      
      runInAction(() => {
        this.loading = false;
      });
    } catch (error: any) {
      console.error('SignUp error:', error.message);
      runInAction(() => {
        this.error = getAuthErrorMessage(error);
        this.loading = false;
      });
      throw error;
    }
  }

  /**
   * Sign in with email
   */
  async signInWithEmail(email: string, password: string): Promise<UserProfile> {
    try {
      runInAction(() => {
        this.loading = true;
        this.error = null;
      });

      const profile = await authService.signInWithEmail(email, password);
      
      // Set profile immediately so routing can use it
      runInAction(() => {
        this.userProfile = profile;
        this.loading = false;
      });

      return profile;
    } catch (error: any) {
      console.error('SignIn error:', error.message);
      runInAction(() => {
        this.error = getAuthErrorMessage(error);
        this.loading = false;
      });
      throw error;
    }
  }

  /**
   * Reset password
   */
  async resetPassword(email: string): Promise<void> {
    try {
      runInAction(() => {
        this.loading = true;
        this.error = null;
      });

      await authService.resetPassword(email);
      
      runInAction(() => {
        this.loading = false;
      });
    } catch (error: any) {
      console.error('ResetPassword error:', error.message);
      runInAction(() => {
        this.error = getAuthErrorMessage(error);
        this.loading = false;
      });
      throw error;
    }
  }

  // ========== COMMON METHODS ==========

  /**
   * Update user profile
   */
  async updateProfile(data: Partial<UserProfile>): Promise<void> {
    if (!this.user) throw new Error('No user logged in');

    try {
      runInAction(() => {
        this.loading = true;
        this.error = null;
      });

      await authService.updateProfile(this.user.uid, data);
      
      // Reload profile
      await this.loadUserProfile(this.user.uid);
      
      runInAction(() => {
        this.loading = false;
      });
    } catch (error: any) {
      runInAction(() => {
        this.error = getAuthErrorMessage(error);
        this.loading = false;
      });
      throw error;
    }
  }

  /**
   * Delete account
   */
  async deleteAccount(): Promise<void> {
    try {
      runInAction(() => {
        this.loading = true;
        this.error = null;
      });

      // CRITICAL: Unsubscribe from profile listener FIRST
      // This prevents the listener from creating a new default profile
      // when the Cloud Function deletes the user document
      if (this.profileUnsubscribe) {
        this.profileUnsubscribe();
        this.profileUnsubscribe = null;
      }

      await authService.deleteAccount();
      
      // Clear all stores and local storage
      await this.clearAllData();

      runInAction(() => {
        this.user = null;
        this.userProfile = null;
        this.loading = false;
      });
    } catch (error: any) {
      runInAction(() => {
        this.error = getAuthErrorMessage(error);
        this.loading = false;
      });
      throw error;
    }
  }

  /**
   * Clear all app data on logout/delete
   */
  private async clearAllData() {
    try {
      // 1. Clear AsyncStorage (except onboarding)
      const keys = await AsyncStorage.getAllKeys();
      const keysToRemove = keys.filter(key => key !== 'hasSeenOnboarding');
      await AsyncStorage.multiRemove(keysToRemove);
      
      // 2. Clear React Query Cache (if accessible here, otherwise handle in hook)
      // Note: React Query cache clearing is best done in the hook or a global reset function
      
      // 3. Reset other stores if needed
      // Example: chatStore.reset(), bookingStore.reset()
      // Since we don't have direct access to other stores here, we rely on them reacting to auth state or manual reset
      
      console.log('✅ App data cleared successfully');
    } catch (error) {
      console.error('Error clearing app data:', error);
    }
  }

  /**
   * Sign out
   */
  async signOut(): Promise<void> {
    try {
      await authService.signOut();
      await this.clearAllData();
      
      runInAction(() => {
        this.user = null;
        this.userProfile = null;
        this.error = null;
      });
    } catch (error: any) {
      runInAction(() => {
        this.error = getAuthErrorMessage(error);
      });
      throw error;
    }
  }

  /**
   * Check if profile is complete
   */
  isProfileComplete(): boolean {
    return !!(
      this.userProfile?.displayName &&
      (this.userProfile?.phoneNumber || this.userProfile?.email)
    );
  }

  /**
   * Check if user is authenticated
   */
  get isAuthenticated(): boolean {
    return !!this.user;
  }

  /**
   * Mark onboarding as seen
   */
  async markOnboardingSeen() {
    try {
      await AsyncStorage.setItem('hasSeenOnboarding', 'true');
      runInAction(() => {
        this.hasSeenOnboarding = true;
      });
    } catch (error) {
      console.error('Error saving onboarding status:', error);
    }
  }

  /**
   * Check onboarding status
   */
  private async checkOnboardingStatus() {
    try {
      const value = await AsyncStorage.getItem('hasSeenOnboarding');
      runInAction(() => {
        this.hasSeenOnboarding = value === 'true';
      });
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      runInAction(() => {
        this.hasSeenOnboarding = false;
      });
    }
  }

  /**
   * Clear error
   */
  clearError() {
    runInAction(() => {
      this.error = null;
    });
  }
}

export const authStore = new AuthStore();
