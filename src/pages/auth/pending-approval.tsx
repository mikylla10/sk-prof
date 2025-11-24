import { useEffect, useState } from 'react';
import { Clock, CheckCircle, LogOut, User, Mail, MapPin, ArrowLeft } from 'lucide-react';
import { AuthService, type UserData } from '../../service/authService';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../../service/firebaseConfig';

export default function PendingApproval() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        // Listen for real-time updates on user status
        const userDocRef = doc(db, 'users', currentUser.uid);
        const unsubscribeUser = onSnapshot(userDocRef, (doc) => {
          if (doc.exists()) {
            const data = doc.data() as UserData;
            setUserData(data);
            setLoading(false);
            
            // Removed auto-redirect to dashboard when approved
            // User will see the approval message and need to login again
          } else {
            setLoading(false);
          }
        });

        return () => unsubscribeUser();
      } else {
        window.location.href = '/login';
      }
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await AuthService.logout();
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 px-4 py-8">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-500 rounded-full mb-6 animate-pulse">
            <Clock className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Loading...</h1>
          <p className="text-gray-600">Please wait while we load your information.</p>
        </div>
      </div>
    );
  }

  if (userData?.status === 'approved') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 px-4 py-8">
        <div className="w-full max-w-md text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-500 rounded-full mb-6 animate-bounce">
            <CheckCircle className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Account Approved!</h1>
          <p className="text-gray-600 mb-6">
            Your account has been approved by our administrators. Please log in again to access your dashboard.
          </p>
          <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-green-200 mb-6">
            <div className="flex items-center justify-center gap-2 mb-4">
              <User className="w-5 h-5 text-green-600" />
              <h3 className="text-lg font-semibold text-gray-800">Welcome, {userData.firstName}!</h3>
            </div>
            <p className="text-gray-600 text-sm">
              You're all set to start using the application. Click the button below to log in and access your dashboard.
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 transition shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 mb-4"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (userData?.status === 'rejected') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-rose-50 to-pink-50 px-4 py-8">
        <div className="w-full max-w-md text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-red-500 rounded-full mb-6">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Account Not Approved</h1>
          <p className="text-gray-600 mb-6">
            We're sorry, but your account registration was not approved by our administrators.
          </p>
          <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-red-200 mb-6">
            <p className="text-gray-700 mb-4">
              If you believe this was a mistake, please contact our support team for assistance.
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
              <Mail className="w-4 h-4" />
              <span>support@yourapp.com</span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 w-full bg-gray-600 text-white py-3 rounded-xl font-semibold hover:bg-gray-700 transition shadow-lg"
          >
            <LogOut className="w-5 h-5" />
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 px-4 py-8">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-500 rounded-full mb-6">
            <Clock className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Pending Approval</h1>
          <p className="text-gray-600 text-lg">
            Thank you for registering! Your account is currently under review.
          </p>
        </div>

        {/* User Information Card */}
        {userData && (
          <div className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-gray-100 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-6 text-center">Your Registration Details</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Personal Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-700 flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-500" />
                  Personal Information
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Full Name</label>
                    <p className="text-gray-900 font-semibold">
                      {userData.firstName} {userData.middleInitial && `${userData.middleInitial}. `}{userData.lastName}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Username</label>
                    <p className="text-gray-900 font-semibold">{userData.username}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Email</label>
                    <p className="text-gray-900 font-semibold flex items-center gap-1">
                      <Mail className="w-4 h-4" />
                      {userData.email}
                    </p>
                  </div>
                  {userData.age && (
                    <div>
                      <label className="block text-sm font-medium text-gray-600">Age</label>
                      <p className="text-gray-900 font-semibold">{userData.age} years old</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Address Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-700 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-blue-500" />
                  Address Information
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-600">House Number & Street</label>
                    <p className="text-gray-900 font-semibold">
                      {userData.houseNumber} {userData.street}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Barangay</label>
                    <p className="text-gray-900 font-semibold">{userData.barangay}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600">City/Municipality</label>
                    <p className="text-gray-900 font-semibold">{userData.cityMunicipality}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Province</label>
                    <p className="text-gray-900 font-semibold">{userData.province}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Status Information */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 mb-6">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-4">
              <Clock className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-blue-800 mb-2">What happens next?</h3>
            <div className="space-y-3 text-sm text-blue-700">
              <p>✓ Your registration has been received successfully</p>
              <p>✓ Our administrators are reviewing your information</p>
              <p>✓ You'll receive a notification once approved</p>
              <p>✓ You'll need to log in again after approval</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="text-center space-y-4">
          <button
            onClick={handleLogout}
            className="inline-flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition shadow-lg"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Login
          </button>
          
          <p className="text-sm text-gray-500">
            You will see a notification here once your account is approved.
            <br />
            Please log in again after approval to access your dashboard.
          </p>
        </div>
      </div>
    </div>
  );
}