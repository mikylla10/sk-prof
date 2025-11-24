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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
      <div className="w-full max-w-2xl">
        {/* Simple Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4">
            <User className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Create Account</h1>
          <p className="text-gray-600 mt-2">Join us today! Fill in your details to get started.</p>
        </div>

        {/* Simple Register Card */}
        <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-200">
          <div className="space-y-6">
            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
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
                  className={`w-full pl-11 pr-4 py-3 border rounded-lg focus:ring-2 focus:border-transparent outline-none transition ${
                    errors.email && touched.email
                      ? 'border-red-300 focus:ring-red-200'
                      : 'border-gray-300 focus:ring-blue-200 focus:border-blue-400'
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:border-transparent outline-none transition ${
                      errors.lastName && touched.lastName
                        ? 'border-red-300 focus:ring-red-200'
                        : 'border-gray-300 focus:ring-blue-200 focus:border-blue-400'
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Name *
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:border-transparent outline-none transition ${
                      errors.firstName && touched.firstName
                        ? 'border-red-300 focus:ring-red-200'
                        : 'border-gray-300 focus:ring-blue-200 focus:border-blue-400'
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Middle Initial
                  </label>
                  <input
                    type="text"
                    name="middleInitial"
                    value={formData.middleInitial}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    maxLength={1}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:border-transparent outline-none transition ${
                      errors.middleInitial && touched.middleInitial
                        ? 'border-red-300 focus:ring-red-200'
                        : 'border-gray-300 focus:ring-blue-200 focus:border-blue-400'
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
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
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:border-transparent outline-none transition ${
                      errors.age && touched.age
                        ? 'border-red-300 focus:ring-red-200'
                        : 'border-gray-300 focus:ring-blue-200 focus:border-blue-400'
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
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
                  className={`w-full pl-11 pr-4 py-3 border rounded-lg focus:ring-2 focus:border-transparent outline-none transition ${
                    errors.username && touched.username
                      ? 'border-red-300 focus:ring-red-200'
                      : 'border-gray-300 focus:ring-blue-200 focus:border-blue-400'
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      House Number
                    </label>
                    <input
                      type="text"
                      name="houseNumber"
                      value={formData.houseNumber}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:border-transparent outline-none transition ${
                        errors.houseNumber && touched.houseNumber
                          ? 'border-red-300 focus:ring-red-200'
                          : 'border-gray-300 focus:ring-blue-200 focus:border-blue-400'
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Street *
                    </label>
                    <input
                      type="text"
                      name="street"
                      value={formData.street}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:border-transparent outline-none transition ${
                        errors.street && touched.street
                          ? 'border-red-300 focus:ring-red-200'
                          : 'border-gray-300 focus:ring-blue-200 focus:border-blue-400'
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Barangay *
                  </label>
                  <input
                    type="text"
                    name="barangay"
                    value={formData.barangay}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:border-transparent outline-none transition ${
                      errors.barangay && touched.barangay
                        ? 'border-red-300 focus:ring-red-200'
                        : 'border-gray-300 focus:ring-blue-200 focus:border-blue-400'
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      City/Municipality *
                    </label>
                    <input
                      type="text"
                      name="cityMunicipality"
                      value={formData.cityMunicipality}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:border-transparent outline-none transition ${
                        errors.cityMunicipality && touched.cityMunicipality
                          ? 'border-red-300 focus:ring-red-200'
                          : 'border-gray-300 focus:ring-blue-200 focus:border-blue-400'
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Province *
                    </label>
                    <input
                      type="text"
                      name="province"
                      value={formData.province}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:border-transparent outline-none transition ${
                        errors.province && touched.province
                          ? 'border-red-300 focus:ring-red-200'
                          : 'border-gray-300 focus:ring-blue-200 focus:border-blue-400'
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
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
                    className={`w-full pl-11 pr-12 py-3 border rounded-lg focus:ring-2 focus:border-transparent outline-none transition ${
                      errors.password && touched.password
                        ? 'border-red-300 focus:ring-red-200'
                        : 'border-gray-300 focus:ring-blue-200 focus:border-blue-400'
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
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
                    className={`w-full pl-11 pr-12 py-3 border rounded-lg focus:ring-2 focus:border-transparent outline-none transition ${
                      errors.confirmPassword && touched.confirmPassword
                        ? 'border-red-300 focus:ring-red-200'
                        : 'border-gray-300 focus:ring-blue-200 focus:border-blue-400'
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
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-500" />
                <span className="text-red-700 text-sm">{error}</span>
              </div>
            )}

            {/* Register Button */}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
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
  );
}