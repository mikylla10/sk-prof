import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut,
  updateProfile 
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebaseConfig';

export interface UserData {
  uid: string;
  email: string;
  firstName: string;
  lastName: string;
  middleInitial?: string;
  username: string;
  age?: number;
  houseNumber: string;
  street: string;
  barangay: string;
  cityMunicipality: string;
  province: string;
  userType: 'admin' | 'user';
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
  // Add the missing properties
  surveyCompleted?: boolean;
  birthDate?: Date;
  contactNumber?: string;
  updatedAt?: Date;
}

export interface UserRegistrationData {
  firstName: string;
  lastName: string;
  middleInitial?: string;
  username: string;
  age: number;
  houseNumber: string;
  street: string;
  barangay: string;
  cityMunicipality: string;
  province: string;
  // Add optional fields for registration
  birthDate?: Date;
  contactNumber?: string;
}

export const AuthService = {
  // Register user account - With age for users
  async registerUser(email: string, password: string, userData: UserRegistrationData) {
    try {
      // Validate age for users (15-30 years old)
      const age = userData.age;
      if (age < 15 || age > 30) {
        return { 
          success: false, 
          error: 'Age must be between 15 and 30 years old for user registration' 
        };
      }

      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const userAccountData: UserData = {
        uid: user.uid,
        email: email,
        ...userData,
        userType: 'user',
        status: 'pending',
        createdAt: new Date(),
        // Initialize the new properties
        surveyCompleted: false,
        updatedAt: new Date()
      };

      await setDoc(doc(db, 'users', user.uid), userAccountData);
      await updateProfile(user, {
        displayName: `${userData.firstName} ${userData.lastName}`
      });

      return { success: true, user: userAccountData };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  // Login
  async login(email: string, password: string) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Get user data from Firestore
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (!userDoc.exists()) {
        throw new Error('User data not found');
      }

      const userData = userDoc.data() as UserData;
      return { success: true, user: userData };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  // Logout
  async logout() {
    try {
      await signOut(auth);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  // Check if any admin exists
  async checkAdminExists(): Promise<boolean> {
    try {
      const usersQuery = await getDoc(doc(db, 'settings', 'adminCheck'));
      // Or you can check if any user has userType = 'admin'
      return usersQuery.exists(); // For now, we'll assume admins exist if this doc exists
    } catch (error) {
      return false;
    }
  },

  // Get current user
  getCurrentUser() {
    return auth.currentUser;
  }
};