import { useEffect, useState } from "react"
import { XCircle, LogOut, User, Mail, MapPin, AlertCircle } from "lucide-react"
import { AuthService, type UserData } from "../../service/authService"
import { onAuthStateChanged } from "firebase/auth"
import { doc, onSnapshot } from "firebase/firestore"
import { auth, db } from "../../service/firebaseConfig"

export default function RejectedUser() {
  const [userData, setUserData] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        // Listen for real-time updates on user status
        const userDocRef = doc(db, "users", currentUser.uid)
        const unsubscribeUser = onSnapshot(userDocRef, (doc) => {
          if (doc.exists()) {
            const data = doc.data() as UserData
            setUserData(data)
            setLoading(false)
          } else {
            setLoading(false)
          }
        })

        return () => unsubscribeUser()
      } else {
        window.location.href = "/login"
      }
    })

    return () => unsubscribe()
  }, [])

  const handleLogout = async () => {
    try {
      await AuthService.logout()
      window.location.href = "/login"
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-rose-50 to-pink-50 px-4 py-8">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-500 rounded-full mb-6 animate-pulse">
            <AlertCircle className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Loading...</h1>
          <p className="text-gray-600">Please wait while we load your information.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-rose-50 to-pink-50 px-4 py-8">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-red-500 rounded-full mb-6 shadow-lg">
            <XCircle className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Application Rejected</h1>
          <p className="text-gray-600 text-lg">
            We're sorry, but your account registration was not approved by our administrators.
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
                  <User className="w-5 h-5 text-red-500" />
                  Personal Information
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Full Name</label>
                    <p className="text-gray-900 font-semibold">
                      {userData.firstName} {userData.middleInitial && `${userData.middleInitial}. `}
                      {userData.lastName}
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
                  <MapPin className="w-5 h-5 text-red-500" />
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

        {/* Rejection Information */}
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 mb-6">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mb-4">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-red-800 mb-3">Why was my application rejected?</h3>
            <p className="text-red-700 mb-4">
              Your application did not meet our verification requirements. This could be due to incomplete information,
              invalid documentation, or other compliance concerns.
            </p>
            <div className="bg-white/70 rounded-lg p-4 text-sm text-gray-700">
              <p className="font-medium mb-2">If you believe this is a mistake:</p>
              <ul className="list-disc list-inside space-y-1 text-left">
                <li>Contact our support team with additional information</li>
                <li>You may reapply after addressing the concerns</li>
                <li>Our team will review your appeal within 5 business days</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Support Information */}
        <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-gray-100 mb-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Need Help?</h3>
            <p className="text-gray-600 mb-4">
              If you have questions about your rejection or would like to appeal, please contact our support team.
            </p>
            <div className="flex items-center justify-center gap-2 mb-4">
              <Mail className="w-5 h-5 text-red-500" />
              <span className="font-semibold text-gray-800">sk.support@gmail.com</span>
            </div>
            <p className="text-sm text-gray-500">We typically respond within 24-48 hours during business days.</p>
          </div>
        </div>

        {/* Action Button */}
        <div className="text-center">
          <button
            onClick={handleLogout}
            className="inline-flex items-center justify-center gap-2 w-full bg-red-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-red-700 transition shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            <LogOut className="w-5 h-5" />
            Return to Login
          </button>
          <p className="text-sm text-gray-600 mt-4">
            You can always contact support for assistance or to appeal this decision.
          </p>
        </div>
      </div>
    </div>
  )
}