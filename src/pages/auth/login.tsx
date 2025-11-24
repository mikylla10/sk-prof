import type React from "react"
import { useState } from "react"
import { Mail, Lock, Eye, EyeOff, AlertCircle } from "lucide-react"
import { AuthService, type UserData } from "../../service/authService"
import { signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth"
import { auth, db } from "../../service/firebaseConfig"
import { doc, getDoc } from "firebase/firestore"
import { useNavigate } from "react-router-dom"
import logo from "../../assets/logo.png"

export default function Login() {
  const [showPassword, setShowPassword] = useState<boolean>(false)
  const [email, setEmail] = useState<string>("")
  const [password, setPassword] = useState<string>("")
  const [errors, setErrors] = useState<{ email: string; password: string }>({ email: "", password: "" })
  const [touched, setTouched] = useState<{ email: boolean; password: boolean }>({ email: false, password: false })
  const [loading, setLoading] = useState<boolean>(false)
  const [authError, setAuthError] = useState<string>("")
  const [showForgotPassword, setShowForgotPassword] = useState<boolean>(false)
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState<string>("")
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState<boolean>(false)
  const [forgotPasswordSuccess, setForgotPasswordSuccess] = useState<boolean>(false)
  const [forgotPasswordError, setForgotPasswordError] = useState<string>("")

  const navigate = useNavigate()

  const validateEmail = (value: string): string => {
    if (!value) {
      return "Email is required"
    }
    if (!value.includes("@")) {
      return "Email must contain @"
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(value)) {
      return "Please enter a valid email format"
    }
    return ""
  }

  const validatePassword = (value: string): string => {
    if (!value) {
      return "Password cannot be empty"
    }
    return ""
  }

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const value = e.target.value
    setEmail(value)
    if (touched.email) {
      setErrors((prev) => ({ ...prev, email: validateEmail(value) }))
    }
    // Clear auth error when user starts typing
    if (authError) setAuthError("")
  }

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const value = e.target.value
    setPassword(value)
    if (touched.password) {
      setErrors((prev) => ({ ...prev, password: validatePassword(value) }))
    }
    // Clear auth error when user starts typing
    if (authError) setAuthError("")
  }

  const handleEmailBlur = (): void => {
    setTouched((prev) => ({ ...prev, email: true }))
    setErrors((prev) => ({ ...prev, email: validateEmail(email) }))
  }

  const handlePasswordBlur = (): void => {
    setTouched((prev) => ({ ...prev, password: true }))
    setErrors((prev) => ({ ...prev, password: validatePassword(password) }))
  }

  const handleSubmit = async (e: React.MouseEvent<HTMLButtonElement>): Promise<void> => {
    e.preventDefault()

    const emailError = validateEmail(email)
    const passwordError = validatePassword(password)

    setTouched({ email: true, password: true })
    setErrors({ email: emailError, password: passwordError })
    setAuthError("")

    if (!emailError && !passwordError) {
      setLoading(true)

      try {
        // Sign in with Firebase Auth
        const userCredential = await signInWithEmailAndPassword(auth, email, password)
        const user = userCredential.user

        // Get user data from Firestore
        const userDoc = await getDoc(doc(db, "users", user.uid))

        if (userDoc.exists()) {
          const userData = userDoc.data() as UserData

          // Check user status and redirect accordingly
          if (userData.status === "pending") {
            navigate("/pending-approval")
          } else if (userData.status === "approved") {
            // Check user type and redirect to appropriate dashboard
            if (userData.userType === "admin") {
              navigate("/admin/dashboard")
            } else {
              navigate("/dashboard") // Redirect to UserDashboard for approved regular users
            }
          } else if (userData.status === "rejected") {
            navigate("/rejected-user")
          }
        } else {
          setAuthError("User data not found. Please contact support.")
          await AuthService.logout() // Log them out since no user data
        }
      } catch (error: any) {
        console.error("Login error:", error)

        // Handle specific Firebase auth errors
        switch (error.code) {
          case "auth/invalid-credential":
          case "auth/wrong-password":
          case "auth/user-not-found":
            setAuthError("Invalid email or password")
            break
          case "auth/too-many-requests":
            setAuthError("Too many failed attempts. Please try again later.")
            break
          case "auth/user-disabled":
            setAuthError("This account has been disabled. Please contact support.")
            break
          default:
            setAuthError("Login failed. Please try again.")
        }
      } finally {
        setLoading(false)
      }
    }
  }

  const handleForgotPassword = async (): Promise<void> => {
    const emailError = validateEmail(forgotPasswordEmail)
    
    if (emailError) {
      setForgotPasswordError("Please enter a valid email address")
      return
    }

    setForgotPasswordLoading(true)
    setForgotPasswordError("")
    setForgotPasswordSuccess(false)

    try {
      console.log("Sending password reset email to:", forgotPasswordEmail)
      
      // Send password reset email directly - Firebase Auth will handle user verification
      await sendPasswordResetEmail(auth, forgotPasswordEmail)
      console.log("Password reset email sent successfully")
      
      // Always show success message (for security - don't reveal if email exists or not)
      setForgotPasswordSuccess(true)
      setForgotPasswordEmail("")
      
      // Update success message to be more generic
      setTimeout(() => {
        setShowForgotPassword(false)
        setForgotPasswordSuccess(false)
      }, 5000)
      
    } catch (error: any) {
      console.error("Password reset error:", error)
      
      // For security reasons, show the same success message regardless of the error
      // This prevents email enumeration attacks
      setForgotPasswordSuccess(true)
      setForgotPasswordEmail("")
      
      // Still log the actual error for debugging
      console.log("Actual error (hidden from user):", error.code, error.message)
      
      setTimeout(() => {
        setShowForgotPassword(false)
        setForgotPasswordSuccess(false)
      }, 5000)
    } finally {
      setForgotPasswordLoading(false)
    }
  }

  const openForgotPassword = (): void => {
    setForgotPasswordEmail(email) // Pre-fill with the email from login form
    setShowForgotPassword(true)
    setForgotPasswordError("")
    setForgotPasswordSuccess(false)
  }

  const closeForgotPassword = (): void => {
    setShowForgotPassword(false)
    setForgotPasswordEmail("")
    setForgotPasswordError("")
    setForgotPasswordSuccess(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <div className="bg-[#0136A6] text-white py-4 px-4 shadow-lg">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-xl md:text-2xl font-bold">SK POLVORISTA KK PROFILING SYSTEM</h1>
          <p className="text-sm md:text-base mt-1 opacity-90">M.Santos St., Barangay Polvorista, Sorsogon City</p>
        </div>
      </div>

      {/* Login Content */}
      <div className="flex items-center justify-center px-4 py-8 min-h-[calc(100vh-88px)]">
        <div className="w-full max-w-md">
          {/* Logo/Brand Area */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-35 h-35 mb-1">
              <img src={logo} alt="SK Polvorista Logo" className="w-full h-full object-contain" />
            </div>
            <p className="text-black font-bold mt-2">Empowering Youth Data for Better Governance</p>
          </div>

          {/* Login Card */}
          <div className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-gray-100">
            {/* Auth Error Display */}
            {authError && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                <div className="flex items-center gap-2 text-red-700">
                  <AlertCircle className="w-5 h-5" />
                  <span className="text-sm font-medium">{authError}</span>
                </div>
              </div>
            )}

            <div className="space-y-5">
              {/* Email Input */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={handleEmailChange}
                    onBlur={handleEmailBlur}
                    disabled={loading}
                    className={`w-full pl-11 pr-4 py-3 border rounded-xl focus:ring-2 focus:border-transparent outline-none transition bg-gray-50 focus:bg-white disabled:opacity-50 disabled:cursor-not-allowed ${
                      errors.email && touched.email
                        ? "border-red-300 focus:ring-red-500"
                        : "border-gray-200 focus:ring-blue-500"
                    }`}
                    placeholder="you@example.com"
                  />
                </div>
                {errors.email && touched.email && (
                  <div className="flex items-center gap-1 mt-2 text-red-600 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    <span>{errors.email}</span>
                  </div>
                )}
              </div>

              {/* Password Input */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={handlePasswordChange}
                    onBlur={handlePasswordBlur}
                    disabled={loading}
                    className={`w-full pl-11 pr-12 py-3 border rounded-xl focus:ring-2 focus:border-transparent outline-none transition bg-gray-50 focus:bg-white disabled:opacity-50 disabled:cursor-not-allowed ${
                      errors.password && touched.password
                        ? "border-red-300 focus:ring-red-500"
                        : "border-gray-200 focus:ring-blue-500"
                    }`}
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition disabled:opacity-50"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.password && touched.password && (
                  <div className="flex items-center gap-1 mt-2 text-red-600 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    <span>{errors.password}</span>
                  </div>
                )}
              </div>

              {/* Forgot Password Link */}
              <div className="text-right">
                <button
                  type="button"
                  onClick={openForgotPassword}
                  disabled={loading}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium transition disabled:opacity-50"
                >
                  Forgot your password?
                </button>
              </div>

              {/* Login Button */}
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:hover:shadow-lg"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Signing In...
                  </div>
                ) : (
                  "Sign In"
                )}
              </button>
            </div>
          </div>

          {/* Register Link */}
          <p className="text-center text-sm mt-6 text-gray-600">
            Don't have an account?{" "}
            <a href="/register" className="text-blue-600 font-semibold hover:text-blue-700 transition">
              Create account
            </a>
          </p>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Reset Your Password</h2>
              <p className="text-gray-600 mt-2">
                Enter your email address and we'll send you a link to reset your password.
              </p>
            </div>

            {forgotPasswordSuccess ? (
              <div className="p-4 bg-green-50 border border-green-200 rounded-xl mb-4">
                <div className="flex items-center gap-2 text-green-700">
                  <AlertCircle className="w-5 h-5" />
                  <span className="text-sm font-medium">
                    Password reset email sent! Check your inbox or spam folder for further instructions.
                  </span>
                </div>
              </div>
            ) : (
              <>
                {forgotPasswordError && (
                  <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl">
                    <div className="flex items-center gap-2 text-red-700">
                      <AlertCircle className="w-5 h-5" />
                      <span className="text-sm font-medium">{forgotPasswordError}</span>
                    </div>
                  </div>
                )}

                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      value={forgotPasswordEmail}
                      onChange={(e) => setForgotPasswordEmail(e.target.value)}
                      disabled={forgotPasswordLoading}
                      className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition bg-gray-50 focus:bg-white disabled:opacity-50"
                      placeholder="you@example.com"
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={closeForgotPassword}
                    disabled={forgotPasswordLoading}
                    className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    disabled={forgotPasswordLoading}
                    className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {forgotPasswordLoading ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Sending...
                      </div>
                    ) : (
                      "Send Reset Link"
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}