/**
 * Maps Firebase Auth error codes to user-friendly messages.
 * 
 * @param error The error object returned from Firebase
 * @returns A user-friendly error message string
 */
export const getAuthErrorMessage = (error: any): string => {
  if (!error) return 'An unknown error occurred. Please try again.';

  // Log the full error structure to debug why it's hitting default
  console.log('🚨 Auth Error Debug:', JSON.stringify(error, null, 2));
  console.log('🚨 Error Code:', error.code);
  console.log('🚨 Error Message:', error.message);

  // Handle cases where error might be wrapped or have different structure
  let errorCode = error.code || error.userInfo?.code;
  const errorMessage = error.message || error.userInfo?.message;

  // Fallback: Extract code from message if missing (e.g. "Firebase: Error (auth/invalid-credential).")
  if (!errorCode && errorMessage) {
    const match = errorMessage.match(/\(auth\/[^)]+\)/);
    if (match) {
      errorCode = match[0].replace(/[()]/g, '');
      console.log('🚨 Extracted Code from Message:', errorCode);
    }
  }

  if (!errorCode) {
    return errorMessage || 'An unknown error occurred. Please try again.';
  }

  // Handle specific Firebase Auth error codes
  switch (errorCode) {
    // Email/Password Sign In Errors
    case 'auth/invalid-email':
    case 'auth/invalid-value':
      return 'The email address is not valid. Please check and try again.';
      
    case 'auth/user-disabled':
      return 'This account has been disabled. Please contact support.';
      
    case 'auth/user-not-found':
      return 'No account found with this email. Please sign up first.';
      
    case 'auth/wrong-password':
      return 'Incorrect password. Please try again or reset your password.';
      
    case 'auth/invalid-credential':
    case 'auth/invalid-login-credentials': // New variation
      return 'Invalid credentials. Please check your email and password.';
    
    // Sign Up Errors
    case 'auth/email-already-in-use':
    case 'auth/credential-already-in-use':
      return 'This email is already registered. Please sign in instead.';
      
    case 'auth/weak-password':
      return 'The password is too weak. Please use a stronger password.';
      
    case 'auth/operation-not-allowed':
      return 'Email/password accounts are not enabled. Please contact support.';
    
    // Network/General Errors
    case 'auth/network-request-failed':
      return 'Network error. Please check your internet connection.';
      
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please try again later.';
      
    case 'auth/internal-error':
      return 'An internal error occurred. Please try again later.';
      
    case 'auth/requires-recent-login':
      return 'Please sign in again to continue.';

    default:
      // Fallback to the raw message if it exists and looks readable
      if (errorMessage && !errorMessage.includes('Firebase') && !errorMessage.includes('auth/')) {
        return errorMessage;
      }
      return 'Authentication failed. Please check your details and try again.';
  }
};
