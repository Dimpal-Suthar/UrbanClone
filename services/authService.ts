import { auth, db } from '@/config/firebase';
import {
  ApplicationVerifier,
  createUserWithEmailAndPassword,
  PhoneAuthProvider,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithCredential,
  signInWithEmailAndPassword,
  updateProfile as updateFirebaseProfile
} from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { parsePhoneNumber } from 'libphonenumber-js';

export type UserRole = 'customer' | 'provider' | 'admin';

export interface UserProfile {
  uid: string;
  role: UserRole;
  phoneNumber?: string;
  email?: string;
  displayName?: string;
  photoURL?: string;
  city?: string;
  address?: string;
  authMethod: 'phone' | 'email' | 'google';
  emailVerified?: boolean;
  createdAt: any;
  updatedAt: any;
}

class AuthService {
  // ========== EMAIL AUTHENTICATION ==========
  
  /**
   * Sign up with email and password
   */
  async signUpWithEmail(
    email: string, 
    password: string, 
    displayName?: string, 
    wantsToBecomeProvider?: boolean
  ): Promise<UserProfile> {
    try {
      // Create user account
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Update display name if provided
      if (displayName) {
        await updateFirebaseProfile(user, { displayName });
      }
      
      // Send email verification
      await sendEmailVerification(user);
      
      // Create user profile in Firestore
      const newUser: UserProfile = {
        uid: user.uid,
        role: 'customer',  // Default role
        email: user.email || '',
        displayName: displayName || '',
        authMethod: 'email',
        emailVerified: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      
      await setDoc(doc(db, 'users', user.uid), newUser);
      
      // If wants to become provider, create provider application
      if (wantsToBecomeProvider) {
        await setDoc(doc(db, 'providers', user.uid), {
          userId: user.uid,
          approvalStatus: 'pending',
          services: [],  // Will add later
          experience: 0,
          bio: '',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      
      return newUser;
    } catch (error: any) {
      console.error('SignUp error:', error.code, error.message);
      throw this.handleAuthError(error);
    }
  }

  /**
   * Sign in with email and password
   */
  async signInWithEmail(email: string, password: string): Promise<UserProfile> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Get user profile from Firestore
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      if (userDoc.exists()) {
        return userDoc.data() as UserProfile;
      } else {
        // Create profile if doesn't exist
        const newUser: UserProfile = {
          uid: user.uid,
          role: 'customer',  // Default role
          email: user.email || '',
          displayName: user.displayName || '',
          authMethod: 'email',
          emailVerified: user.emailVerified,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };
        
        await setDoc(doc(db, 'users', user.uid), newUser);
        return newUser;
      }
    } catch (error: any) {
      console.error('SignIn error:', error.code, error.message);
      throw this.handleAuthError(error);
    }
  }

  /**
   * Send password reset email
   */
  async resetPassword(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error: any) {
      console.error('ResetPassword error:', error.code, error.message);
      throw this.handleAuthError(error);
    }
  }

  // ========== PHONE AUTHENTICATION ==========
  
  /**
   * Send OTP to phone number
   */
  async sendOTP(
    phoneNumber: string, 
    recaptchaVerifier: ApplicationVerifier
  ): Promise<string> {
    try {
      // Format phone number to E.164 format
      const formattedPhone = this.formatPhoneNumber(phoneNumber);
      
      // Create phone auth provider
      const phoneProvider = new PhoneAuthProvider(auth);
      
      // Send verification code
      const verificationId = await phoneProvider.verifyPhoneNumber(
        formattedPhone,
        recaptchaVerifier
      );
      
      return verificationId;
    } catch (error: any) {
      console.error('SendOTP error:', error.code, error.message);
      throw this.handleAuthError(error);
    }
  }

  /**
   * Verify OTP code
   */
  async verifyOTP(verificationId: string, code: string): Promise<UserProfile> {
    try {
      // Create credential
      const credential = PhoneAuthProvider.credential(verificationId, code);
      
      // Sign in with credential
      const userCredential = await signInWithCredential(auth, credential);
      const user = userCredential.user;
      
      // Check if user exists in Firestore
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      if (userDoc.exists()) {
        return userDoc.data() as UserProfile;
      } else {
        // Create new user profile
        const newUser: UserProfile = {
          uid: user.uid,
          role: 'customer',  // Default role
          phoneNumber: user.phoneNumber || '',
          authMethod: 'phone',
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

  // ========== COMMON METHODS ==========

  /**
   * Update user profile
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
   * Get user profile
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
      await auth.signOut();
    } catch (error: any) {
      console.error('SignOut error:', error.message);
      throw this.handleAuthError(error);
    }
  }

  /**
   * Format phone number to E.164 format
   */
  private formatPhoneNumber(phoneNumber: string, countryCode: string = 'IN'): string {
    try {
      const parsed = parsePhoneNumber(phoneNumber, countryCode as any);
      if (parsed && parsed.isValid()) {
        return parsed.number;
      }
      throw new Error('Invalid phone number');
    } catch (error) {
      throw new Error('Invalid phone number format');
    }
  }

  /**
   * Handle Firebase auth errors
   */
  private handleAuthError(error: any): Error {
    const errorMessages: { [key: string]: string } = {
      // Email errors
      'auth/email-already-in-use': 'This email is already registered',
      'auth/invalid-email': 'Invalid email address',
      'auth/user-not-found': 'No account found with this email',
      'auth/wrong-password': 'Incorrect password',
      'auth/weak-password': 'Password should be at least 6 characters',
      'auth/too-many-requests': 'Too many attempts. Please try again later',
      
      // Phone errors
      'auth/invalid-phone-number': 'Invalid phone number',
      'auth/invalid-verification-code': 'Invalid OTP code',
      'auth/code-expired': 'OTP code has expired',
      
      // Common errors
      'auth/network-request-failed': 'Network error. Please check your connection',
    };

    return new Error(errorMessages[error.code] || error.message || 'Authentication failed');
  }
}

export default new AuthService();

