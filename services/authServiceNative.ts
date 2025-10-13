import { db } from '@/config/firebase';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';

export interface UserProfile {
  uid: string;
  phoneNumber?: string;
  email?: string;
  displayName?: string;
  photoURL?: string;
  city?: string;
  address?: string;
  authMethod: 'phone' | 'email' | 'google';
  createdAt: any;
  updatedAt: any;
}

class AuthServiceNative {
  private confirmationResult: FirebaseAuthTypes.ConfirmationResult | null = null;

  /**
   * Send OTP to phone number using React Native Firebase (Native)
   * No reCAPTCHA needed!
   */
  async sendOTP(phoneNumber: string): Promise<void> {
    try {
      // Validate phone number format (E.164 format: +919328077374)
      if (!phoneNumber.startsWith('+')) {
        throw new Error('Phone number must be in E.164 format (e.g., +919328077374)');
      }
      
      // Send verification code - NO RECAPTCHA NEEDED!
      this.confirmationResult = await auth().signInWithPhoneNumber(phoneNumber);
    } catch (error: any) {
      console.error('SendOTP error:', error.code, error.message);
      throw this.handleAuthError(error);
    }
  }

  /**
   * Verify OTP code
   */
  async verifyOTP(code: string): Promise<UserProfile> {
    try {
      if (!this.confirmationResult) {
        throw new Error('No confirmation result. Please request OTP first.');
      }
      
      // Confirm the verification code
      const userCredential = await this.confirmationResult.confirm(code);
      const user = userCredential.user;
      
      // Check if user exists in Firestore (using JS SDK for Firestore)
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      if (userDoc.exists()) {
        return userDoc.data() as UserProfile;
      } else {
        // Create new user profile
        const newUser: UserProfile = {
          uid: user.uid,
          phoneNumber: user.phoneNumber || '',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };
        
        await setDoc(doc(db, 'users', user.uid), newUser);
        return newUser;
      }
    } catch (error: any) {
      console.error('VerifyOTP error:', error.code, error.message);
      throw this.handleAuthError(error);
    }
  }

  /**
   * Update user profile (using JS SDK for Firestore)
   */
  async updateProfile(uid: string, data: Partial<UserProfile>): Promise<void> {
    try {
      const userRef = doc(db, 'users', uid);
      await setDoc(userRef, {
        ...data,
        updatedAt: serverTimestamp(),
      }, { merge: true });
    } catch (error: any) {
      console.error('UpdateProfile error:', error.message);
      throw this.handleAuthError(error);
    }
  }

  /**
   * Get user profile (using JS SDK for Firestore)
   */
  async getUserProfile(uid: string): Promise<UserProfile | null> {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      return userDoc.exists() ? (userDoc.data() as UserProfile) : null;
    } catch (error: any) {
      console.error('GetProfile error:', error.message);
      throw this.handleAuthError(error);
    }
  }

  /**
   * Sign out
   */
  async signOut(): Promise<void> {
    try {
      await auth().signOut();
      this.confirmationResult = null;
    } catch (error: any) {
      console.error('SignOut error:', error.message);
      throw this.handleAuthError(error);
    }
  }

  /**
   * Get current user
   */
  getCurrentUser(): FirebaseAuthTypes.User | null {
    return auth().currentUser;
  }

  /**
   * Listen to auth state changes
   */
  onAuthStateChanged(callback: (user: FirebaseAuthTypes.User | null) => void) {
    return auth().onAuthStateChanged(callback);
  }

  /**
   * Handle Firebase auth errors
   */
  private handleAuthError(error: any): Error {
    const errorMessages: { [key: string]: string } = {
      'auth/invalid-phone-number': 'Invalid phone number format',
      'auth/invalid-verification-code': 'Invalid OTP code. Please check and try again.',
      'auth/code-expired': 'OTP code has expired. Please request a new one.',
      'auth/too-many-requests': 'Too many attempts. Please try again later.',
      'auth/network-request-failed': 'Network error. Please check your connection.',
      'auth/session-expired': 'Session expired. Please request a new OTP.',
      'auth/quota-exceeded': 'SMS quota exceeded. Please try again later.',
    };

    const message = errorMessages[error.code] || error.message || 'Authentication failed';
    return new Error(message);
  }
}

export default new AuthServiceNative();

