import { useState } from 'react';
import type { ChangeEvent, FocusEvent } from 'react';
import { User, Lock, Eye, EyeOff, AlertCircle, MapPin, Mail } from 'lucide-react';
import { AuthService } from '../../service/authService'; // Make sure this import path is correct

interface FormData {
  email: string;
  lastName: string;
  firstName: string;
  middleInitial: string;
  username: string;
  age: string;
  houseNumber: string;
  street: string;
  barangay: string;
  cityMunicipality: string;
  province: string;
  password: string;
  confirmPassword: string;
}

interface FormErrors {
  email?: string;
  lastName?: string;
  firstName?: string;
  middleInitial?: string;
  username?: string;
  age?: string;
  houseNumber?: string;
  street?: string;
  barangay?: string;
  cityMunicipality?: string;
  province?: string;
  password?: string;
  confirmPassword?: string;
}

interface FormTouched {
  email?: boolean;
  lastName?: boolean;
  firstName?: boolean;
  middleInitial?: boolean;
  username?: boolean;
  age?: boolean;
  houseNumber?: boolean;
  street?: boolean;
  barangay?: boolean;
  cityMunicipality?: boolean;
  province?: boolean;
  password?: boolean;
  confirmPassword?: boolean;
}

export default function Register() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [formData, setFormData] = useState<FormData>({
    email: '',
    lastName: '',
    firstName: '',
    middleInitial: '',
    username: '',
    age: '',
    houseNumber: '',
    street: '',
    barangay: '',
    cityMunicipality: '',
    province: '',
    password: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<FormTouched>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const validateField = (name: keyof FormData, value: string): string => {
    switch (name) {
      case 'email':
        if (!value) return 'Email is required';
        if (!value.includes('@')) return 'Email must contain @';
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) return 'Please enter a valid email format';
        return '';
      case 'lastName':
        return !value ? 'Last name is required' : '';
      case 'firstName':
        return !value ? 'First name is required' : '';
      case 'middleInitial':
        return value && value.length > 1 ? 'Middle initial should be 1 character' : '';
      case 'username':
        if (!value) return 'Username is required';
        if (value.length < 3) return 'Username must be at least 3 characters';
        return '';
      case 'age':
        if (!value) return 'Age is required';
        if (!/^\d+$/.test(value)) return 'Age must be a number';
        const ageNum = parseInt(value);
        if (ageNum < 15) return 'Age must be at least 15 years old';
        if (ageNum > 30) return 'Age must be 30 years old or younger';
        return '';
      case 'houseNumber':
        return !value ? 'House number is required' : '';
      case 'street':
        return !value ? 'Street is required' : '';
      case 'barangay':
        return !value ? 'Barangay is required' : '';
      case 'cityMunicipality':
        return !value ? 'City/Municipality is required' : '';
      case 'province':
        return !value ? 'Province is required' : '';
      case 'password':
        if (!value) return 'Password is required';
        if (value.length < 6) return 'Password must be at least 6 characters';
        return '';
      case 'confirmPassword':
        if (!value) return 'Please confirm your password';
        if (value !== formData.password) return 'Passwords do not match';
        return '';
      default:
        return '';
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (touched[name as keyof FormTouched]) {
      setErrors(prev => ({ 
        ...prev, 
        [name]: validateField(name as keyof FormData, value) 
      }));
    }
  };

  const handleBlur = (e: FocusEvent<HTMLInputElement>) => {
    const { name } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    setErrors(prev => ({ 
      ...prev, 
      [name]: validateField(name as keyof FormData, formData[name as keyof FormData]) 
    }));
  };

  const handleSubmit = async () => {
    const newErrors: FormErrors = {};
    const newTouched: FormTouched = {};
    
    (Object.keys(formData) as Array<keyof FormData>).forEach(key => {
      newTouched[key] = true;
      const error = validateField(key, formData[key]);
      if (error) newErrors[key] = error;
    });

    setTouched(newTouched);
    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      setLoading(true);
      setError('');
      
      try {
        const result = await AuthService.registerUser(
          formData.email, 
          formData.password, 
          {
            firstName: formData.firstName,
            lastName: formData.lastName,
            middleInitial: formData.middleInitial,
            username: formData.username,
            age: parseInt(formData.age),
            houseNumber: formData.houseNumber,
            street: formData.street,
            barangay: formData.barangay,
            cityMunicipality: formData.cityMunicipality,
            province: formData.province
          }
        );
        
        if (result.success) {
          console.log('User registered successfully:', result.user);
          window.location.href = '/pending-approval';
        } else {
          setError(result.error || 'Registration failed. Please try again.');
        }
      } catch (err: any) {
        setError(err.message || 'An unexpected error occurred.');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header - Same as login screen */}
      <div className="bg-[#0136A6] text-white py-4 px-4 shadow-lg">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-xl md:text-2xl font-bold">SK POLVORISTA KK PROFILING SYSTEM</h1>
          <p className="text-sm md:text-base mt-1 opacity-90">M.Santos St., Barangay Polvorista, Sorsogon City</p>
        </div>
      </div>

      {/* Register Content */}
      <div className="flex items-center justify-center px-4 py-8 min-h-[calc(100vh-88px)]">
        <div className="w-full max-w-2xl">

          {/* Register Card */}
          <div className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-gray-100">
            <div className="space-y-6">
              {/* Email Field */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`w-full pl-11 pr-4 py-3 border rounded-xl focus:ring-2 focus:border-transparent outline-none transition bg-gray-50 focus:bg-white ${
                      errors.email && touched.email
                        ? 'border-red-300 focus:ring-red-500'
                        : 'border-gray-200 focus:ring-blue-500'
                    }`}
                    placeholder="your.email@example.com"
                  />
                </div>
                {errors.email && touched.email && (
                  <div className="flex items-center gap-1 mt-2 text-red-600 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    <span>{errors.email}</span>
                  </div>
                )}
              </div>

              {/* Full Name Section */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Personal Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:border-transparent outline-none transition bg-gray-50 focus:bg-white ${
                        errors.lastName && touched.lastName
                          ? 'border-red-300 focus:ring-red-500'
                          : 'border-gray-200 focus:ring-blue-500'
                      }`}
                      placeholder="Dela Cruz"
                    />
                    {errors.lastName && touched.lastName && (
                      <div className="flex items-center gap-1 mt-1 text-red-600 text-sm">
                        <AlertCircle className="w-4 h-4" />
                        <span>{errors.lastName}</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      First Name *
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:border-transparent outline-none transition bg-gray-50 focus:bg-white ${
                        errors.firstName && touched.firstName
                          ? 'border-red-300 focus:ring-red-500'
                          : 'border-gray-200 focus:ring-blue-500'
                      }`}
                      placeholder="Juan"
                    />
                    {errors.firstName && touched.firstName && (
                      <div className="flex items-center gap-1 mt-1 text-red-600 text-sm">
                        <AlertCircle className="w-4 h-4" />
                        <span>{errors.firstName}</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Middle Initial
                    </label>
                    <input
                      type="text"
                      name="middleInitial"
                      value={formData.middleInitial}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      maxLength={1}
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:border-transparent outline-none transition bg-gray-50 focus:bg-white ${
                        errors.middleInitial && touched.middleInitial
                          ? 'border-red-300 focus:ring-red-500'
                          : 'border-gray-200 focus:ring-blue-500'
                      }`}
                      placeholder="A"
                    />
                    {errors.middleInitial && touched.middleInitial && (
                      <div className="flex items-center gap-1 mt-1 text-red-600 text-sm">
                        <AlertCircle className="w-4 h-4" />
                        <span>{errors.middleInitial}</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Age *
                    </label>
                    <input
                      type="number"
                      name="age"
                      value={formData.age}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      min="15"
                      max="30"
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:border-transparent outline-none transition bg-gray-50 focus:bg-white ${
                        errors.age && touched.age
                          ? 'border-red-300 focus:ring-red-500'
                          : 'border-gray-200 focus:ring-blue-500'
                      }`}
                      placeholder="18"
                    />
                    {errors.age && touched.age && (
                      <div className="flex items-center gap-1 mt-1 text-red-600 text-sm">
                        <AlertCircle className="w-4 h-4" />
                        <span>{errors.age}</span>
                      </div>
                    )}
                    <div className="text-xs text-gray-500 mt-1">
                      Must be between 15-30 years old
                    </div>
                  </div>
                </div>
              </div>

              {/* Username */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Username *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`w-full pl-11 pr-4 py-3 border rounded-xl focus:ring-2 focus:border-transparent outline-none transition bg-gray-50 focus:bg-white ${
                      errors.username && touched.username
                        ? 'border-red-300 focus:ring-red-500'
                        : 'border-gray-200 focus:ring-blue-500'
                    }`}
                    placeholder="juandelacruz"
                  />
                </div>
                {errors.username && touched.username && (
                  <div className="flex items-center gap-1 mt-2 text-red-600 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    <span>{errors.username}</span>
                  </div>
                )}
              </div>

              {/* Complete Address Section */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Complete Address
                </h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        House Number
                      </label>
                      <input
                        type="text"
                        name="houseNumber"
                        value={formData.houseNumber}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:border-transparent outline-none transition bg-gray-50 focus:bg-white ${
                          errors.houseNumber && touched.houseNumber
                            ? 'border-red-300 focus:ring-red-500'
                            : 'border-gray-200 focus:ring-blue-500'
                        }`}
                        placeholder="123"
                      />
                      {errors.houseNumber && touched.houseNumber && (
                        <div className="flex items-center gap-1 mt-1 text-red-600 text-sm">
                          <AlertCircle className="w-4 h-4" />
                          <span>{errors.houseNumber}</span>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Street *
                      </label>
                      <input
                        type="text"
                        name="street"
                        value={formData.street}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:border-transparent outline-none transition bg-gray-50 focus:bg-white ${
                          errors.street && touched.street
                            ? 'border-red-300 focus:ring-red-500'
                            : 'border-gray-200 focus:ring-blue-500'
                        }`}
                        placeholder="Rizal Street"
                      />
                      {errors.street && touched.street && (
                        <div className="flex items-center gap-1 mt-1 text-red-600 text-sm">
                          <AlertCircle className="w-4 h-4" />
                          <span>{errors.street}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Barangay *
                    </label>
                    <input
                      type="text"
                      name="barangay"
                      value={formData.barangay}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:border-transparent outline-none transition bg-gray-50 focus:bg-white ${
                        errors.barangay && touched.barangay
                          ? 'border-red-300 focus:ring-red-500'
                          : 'border-gray-200 focus:ring-blue-500'
                      }`}
                      placeholder="Barangay San Antonio"
                    />
                    {errors.barangay && touched.barangay && (
                      <div className="flex items-center gap-1 mt-2 text-red-600 text-sm">
                        <AlertCircle className="w-4 h-4" />
                        <span>{errors.barangay}</span>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        City/Municipality *
                      </label>
                      <input
                        type="text"
                        name="cityMunicipality"
                        value={formData.cityMunicipality}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:border-transparent outline-none transition bg-gray-50 focus:bg-white ${
                          errors.cityMunicipality && touched.cityMunicipality
                            ? 'border-red-300 focus:ring-red-500'
                            : 'border-gray-200 focus:ring-blue-500'
                        }`}
                        placeholder="Manila"
                      />
                      {errors.cityMunicipality && touched.cityMunicipality && (
                        <div className="flex items-center gap-1 mt-1 text-red-600 text-sm">
                          <AlertCircle className="w-4 h-4" />
                          <span>{errors.cityMunicipality}</span>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Province *
                      </label>
                      <input
                        type="text"
                        name="province"
                        value={formData.province}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:border-transparent outline-none transition bg-gray-50 focus:bg-white ${
                          errors.province && touched.province
                            ? 'border-red-300 focus:ring-red-500'
                            : 'border-gray-200 focus:ring-blue-500'
                        }`}
                        placeholder="Metro Manila"
                      />
                      {errors.province && touched.province && (
                        <div className="flex items-center gap-1 mt-1 text-red-600 text-sm">
                          <AlertCircle className="w-4 h-4" />
                          <span>{errors.province}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Password Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Password *
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={`w-full pl-11 pr-12 py-3 border rounded-xl focus:ring-2 focus:border-transparent outline-none transition bg-gray-50 focus:bg-white ${
                        errors.password && touched.password
                          ? 'border-red-300 focus:ring-red-500'
                          : 'border-gray-200 focus:ring-blue-500'
                      }`}
                      placeholder="Enter your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  {errors.password && touched.password && (
                    <div className="flex items-center gap-1 mt-2 text-red-600 text-sm">
                      <AlertCircle className="w-4 h-4" />
                      <span>{errors.password}</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Confirm Password *
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={`w-full pl-11 pr-12 py-3 border rounded-xl focus:ring-2 focus:border-transparent outline-none transition bg-gray-50 focus:bg-white ${
                        errors.confirmPassword && touched.confirmPassword
                          ? 'border-red-300 focus:ring-red-500'
                          : 'border-gray-200 focus:ring-blue-500'
                      }`}
                      placeholder="Confirm your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  {errors.confirmPassword && touched.confirmPassword && (
                    <div className="flex items-center gap-1 mt-2 text-red-600 text-sm">
                      <AlertCircle className="w-4 h-4" />
                      <span>{errors.confirmPassword}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Error Display */}
              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                  <span className="text-red-700 text-sm">{error}</span>
                </div>
              )}

              {/* Register Button */}
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:hover:shadow-lg"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Creating Account...
                  </div>
                ) : (
                  'Create Account'
                )}
              </button>
            </div>
          </div>

          {/* Login Link */}
          <p className="text-center text-sm mt-6 text-gray-600">
            Already have an account?{' '}
            <a
              href="/login"
              className="text-blue-600 font-semibold hover:text-blue-700 transition"
            >
              Sign in
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}