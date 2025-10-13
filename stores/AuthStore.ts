import { auth } from '@/config/firebase';
import authService, { UserProfile } from '@/services/authService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { onAuthStateChanged, User } from 'firebase/auth';
import { makeAutoObservable, runInAction } from 'mobx';

export class AuthStore {
  // State
  user: User | null = null;
  userProfile: UserProfile | null = null;
  loading = true;
  error: string | null = null;
  
  // Phone auth state
  verificationId: string | null = null;
  phoneNumber: string = '';
  
  // Onboarding state
  hasSeenOnboarding = false;

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
      try {
        if (firebaseUser) {
          await this.loadUserProfile(firebaseUser.uid);
        }
      } catch (error) {
        console.error('Load profile error:', error);
      } finally {
        runInAction(() => {
          this.user = firebaseUser;
          this.userProfile = firebaseUser ? this.userProfile : null;
          this.loading = false;
        });
      }
    });
  }

  /**
   * Load user profile from Firestore
   */
  private async loadUserProfile(uid: string) {
    const profile = await authService.getUserProfile(uid);
    runInAction(() => {
      this.userProfile = profile;
    });
  }

  // ========== EMAIL AUTHENTICATION ==========

  /**
   * Sign up with email
   */
  async signUpWithEmail(email: string, password: string, displayName?: string): Promise<void> {
    try {
      runInAction(() => {
        this.loading = true;
        this.error = null;
      });

      await authService.signUpWithEmail(email, password, displayName);
      
      runInAction(() => {
        this.loading = false;
      });
    } catch (error: any) {
      console.error('SignUp error:', error.message);
      runInAction(() => {
        this.error = error.message;
        this.loading = false;
      });
      throw error;
    }
  }

  /**
   * Sign in with email
   */
  async signInWithEmail(email: string, password: string): Promise<void> {
    try {
      runInAction(() => {
        this.loading = true;
        this.error = null;
      });

      await authService.signInWithEmail(email, password);
      
      runInAction(() => {
        this.loading = false;
      });
    } catch (error: any) {
      console.error('SignIn error:', error.message);
      runInAction(() => {
        this.error = error.message;
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
        this.error = error.message;
        this.loading = false;
      });
      throw error;
    }
  }

  // ========== PHONE AUTHENTICATION ==========

  /**
   * Send OTP to phone number
   */
  async sendOTP(phoneNumber: string, recaptchaVerifier: any): Promise<void> {
    try {
      runInAction(() => {
        this.loading = true;
        this.error = null;
        this.phoneNumber = phoneNumber;
      });

      const verificationId = await authService.sendOTP(phoneNumber, recaptchaVerifier);
      
      runInAction(() => {
        this.verificationId = verificationId;
        this.loading = false;
      });
    } catch (error: any) {
      console.error('SendOTP error:', error.message);
      runInAction(() => {
        this.error = error.message;
        this.loading = false;
      });
      throw error;
    }
  }

  /**
   * Verify OTP code
   */
  async verifyOTP(code: string): Promise<boolean> {
    if (!this.verificationId) {
      throw new Error('No verification ID found');
    }

    try {
      runInAction(() => {
        this.loading = true;
        this.error = null;
      });

      const profile = await authService.verifyOTP(this.verificationId, code);
      
      runInAction(() => {
        this.userProfile = profile;
        this.loading = false;
        this.verificationId = null;
      });
      
      return this.isProfileComplete();
    } catch (error: any) {
      console.error('VerifyOTP error:', error.message);
      runInAction(() => {
        this.error = error.message;
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
        this.error = error.message;
        this.loading = false;
      });
      throw error;
    }
  }

  /**
   * Sign out
   */
  async signOut(): Promise<void> {
    try {
      await authService.signOut();
      runInAction(() => {
        this.user = null;
        this.userProfile = null;
        this.error = null;
      });
    } catch (error: any) {
      runInAction(() => {
        this.error = error.message;
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
