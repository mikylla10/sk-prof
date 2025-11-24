import { useState, useEffect } from "react"
import { User, LogOut, ClipboardList, AlertCircle, Mail, MapPin } from "lucide-react"
import { onAuthStateChanged } from "firebase/auth"
import { auth, db } from "../../service/firebaseConfig"
import { doc, getDoc, collection, query, where, getDocs, updateDoc } from "firebase/firestore"
import { AuthService, type UserData } from "../../service/authService"
import { SurveyService, type SurveyData } from "../../service/surveyService"
import type React from "react"

type TabType = "survey" | "profile"

interface SurveyFormData {
  lastName: string
  firstName: string
  middleName: string
  suffix: string
  street: string
  barangay: string
  province: string
  cityMunicipality: string
  sex: string
  age: string
  birthday: string
  emailAddress: string
  contactNumber: string
  facebookAccount: string
  civilStatus: string
  youthClassification: string
  youthAgeGroup: string
  educationalBackground: string
  workStatus: string
  gender: string
  registeredSKVoter: string
  registeredNationalVoter: string
  attendedKKAssembly: string
  timesAttendedKKAssembly: string
  whyNotAttended: string
  votedLastElection: string
  preferredSports: string
}

interface SurveyFormErrors {
  [key: string]: string
}

// Sidebar Component
function Sidebar({
  userData,
  onLogout,
  activeTab,
  onTabChange,
}: {
  userData: UserData | null
  onLogout: () => void
  activeTab: TabType
  onTabChange: (tab: TabType) => void
}) {
  return (
    <div className="w-64 bg-white border-r border-gray-200 p-6 flex flex-col">
      <div className="mb-8">
        <div className="flex items-center justify-center w-12 h-12 bg-blue-500 rounded-full mb-4 mx-auto">
          <User className="w-6 h-6 text-white" />
        </div>
        <h2 className="text-lg font-semibold text-gray-900 text-center truncate">
          {userData?.firstName} {userData?.lastName}
        </h2>
        <p className="text-sm text-gray-600 text-center truncate mt-1">{userData?.email}</p>
      </div>

      <nav className="space-y-2 flex-1">
        <button
          onClick={() => onTabChange("survey")}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition font-medium ${
            activeTab === "survey"
              ? "bg-blue-50 text-blue-600 border-l-4 border-blue-600"
              : "text-gray-700 hover:bg-gray-50"
          }`}
        >
          <ClipboardList className="w-5 h-5" />
          KK Survey Questionnaires
        </button>

        <button
          onClick={() => onTabChange("profile")}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition font-medium ${
            activeTab === "profile"
              ? "bg-blue-50 text-blue-600 border-l-4 border-blue-600"
              : "text-gray-700 hover:bg-gray-50"
          }`}
        >
          <User className="w-5 h-5" />
          User Account
        </button>
      </nav>

      <button
        onClick={onLogout}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition font-semibold border border-red-200"
      >
        <LogOut className="w-5 h-5" />
        Logout
      </button>
    </div>
  )
}

// Survey Form Component
function SurveyForm({ userId }: { userId: string }) {
  const [loading, setLoading] = useState(false)
  const [loadingSurvey, setLoadingSurvey] = useState(true)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")
  const [isEditing, setIsEditing] = useState(false)
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const [surveyId, setSurveyId] = useState<string | null>(null)
  const [formData, setFormData] = useState<SurveyFormData>({
    lastName: "",
    firstName: "",
    middleName: "",
    suffix: "",
    street: "",
    barangay: "",
    province: "",
    cityMunicipality: "",
    sex: "",
    age: "",
    birthday: "",
    emailAddress: "",
    contactNumber: "",
    facebookAccount: "",
    civilStatus: "",
    youthClassification: "",
    youthAgeGroup: "",
    educationalBackground: "",
    workStatus: "",
    gender: "",
    registeredSKVoter: "",
    registeredNationalVoter: "",
    attendedKKAssembly: "",
    timesAttendedKKAssembly: "",
    whyNotAttended: "",
    votedLastElection: "",
    preferredSports: "",
  })
  const [errors, setErrors] = useState<SurveyFormErrors>({})

  // Load existing survey data
  useEffect(() => {
    const loadExistingSurvey = async () => {
      try {
        setLoadingSurvey(true)
        const surveysCollection = collection(db, "surveys")
        const q = query(surveysCollection, where("userId", "==", userId))
        const querySnapshot = await getDocs(q)

        if (!querySnapshot.empty) {
          // User has existing survey data
          const surveyDoc = querySnapshot.docs[0]
          const surveyData = surveyDoc.data() as SurveyData
          
          setSurveyId(surveyDoc.id)
          setHasSubmitted(true)
          setIsEditing(false)
          
          // Populate form with existing data
          setFormData({
            lastName: surveyData.lastName || "",
            firstName: surveyData.firstName || "",
            middleName: surveyData.middleName || "",
            suffix: surveyData.suffix || "",
            street: surveyData.street || "",
            barangay: surveyData.barangay || "",
            province: surveyData.province || "",
            cityMunicipality: surveyData.cityMunicipality || "",
            sex: surveyData.sex || "",
            age: surveyData.age || "",
            birthday: surveyData.birthday || "",
            emailAddress: surveyData.emailAddress || "",
            contactNumber: surveyData.contactNumber || "",
            facebookAccount: surveyData.facebookAccount || "",
            civilStatus: surveyData.civilStatus || "",
            youthClassification: surveyData.youthClassification || "",
            youthAgeGroup: surveyData.youthAgeGroup || "",
            educationalBackground: surveyData.educationalBackground || "",
            workStatus: surveyData.workStatus || "",
            gender: surveyData.gender || "",
            registeredSKVoter: surveyData.registeredSKVoter || "",
            registeredNationalVoter: surveyData.registeredNationalVoter || "",
            attendedKKAssembly: surveyData.attendedKKAssembly || "",
            timesAttendedKKAssembly: surveyData.timesAttendedKKAssembly || "",
            whyNotAttended: surveyData.whyNotAttended || "",
            votedLastElection: surveyData.votedLastElection || "",
            preferredSports: surveyData.preferredSports || "",
          })
        }
      } catch (err) {
        console.error("Error loading existing survey:", err)
        setError("Failed to load existing survey data")
      } finally {
        setLoadingSurvey(false)
      }
    }

    if (userId) {
      loadExistingSurvey()
    }
  }, [userId])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  const validateForm = (): boolean => {
    const newErrors: SurveyFormErrors = {}

    if (!formData.lastName.trim()) newErrors.lastName = "Last name is required"
    if (!formData.firstName.trim()) newErrors.firstName = "First name is required"
    if (!formData.sex) newErrors.sex = "Sex is required"
    if (!formData.age.trim()) newErrors.age = "Age is required"
    if (!formData.birthday) newErrors.birthday = "Birthday is required"
    if (!formData.emailAddress.trim()) newErrors.emailAddress = "Email is required"
    if (!formData.street.trim()) newErrors.street = "Street is required"
    if (!formData.barangay.trim()) newErrors.barangay = "Barangay is required"
    if (!formData.province.trim()) newErrors.province = "Province is required"
    if (!formData.cityMunicipality.trim()) newErrors.cityMunicipality = "City/Municipality is required"
    if (!formData.civilStatus) newErrors.civilStatus = "Civil status is required"
    if (!formData.youthClassification) newErrors.youthClassification = "Youth classification is required"
    if (!formData.youthAgeGroup) newErrors.youthAgeGroup = "Youth age group is required"
    if (!formData.educationalBackground) newErrors.educationalBackground = "Educational background is required"
    if (!formData.workStatus) newErrors.workStatus = "Work status is required"
    if (!formData.gender) newErrors.gender = "Gender is required"

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      setError("Please fill in all required fields")
      return
    }

    setLoading(true)
    setError("")
    setSuccess(false)

    try {
      if (hasSubmitted && surveyId) {
        // Update existing survey
        // Note: You'll need to implement an update function in SurveyService
        await SurveyService.saveSurvey(userId, formData)
        setSuccess(true)
        setIsEditing(false)
      } else {
        // Create new survey
        const result = await SurveyService.saveSurvey(userId, formData)
        if (result.success) {
          setSurveyId(result.surveyId || null)
          setHasSubmitted(true)
          setIsEditing(false)
          setSuccess(true)
        } else {
          throw new Error(result.error || "Failed to save survey")
        }
      }
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) {
      setError(err.message || "Failed to save survey")
    } finally {
      setLoading(false)
    }
  }

  const handleEditClick = () => {
    setIsEditing(true)
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
  }

  // Check if form is editable
  const isFormDisabled = (hasSubmitted && !isEditing) || loadingSurvey

  if (loadingSurvey) {
    return (
      <div className="max-w-5xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">KK Survey Questionnaires</h1>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="flex justify-center items-center py-12">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-500 rounded-full mb-4 animate-pulse">
                <ClipboardList className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Loading survey data...</h2>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-5xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">KK Survey Questionnaires</h1>
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
          <p className="text-sm font-semibold text-blue-900">TO THE RESPONDENT:</p>
          <p className="text-sm text-blue-800 mt-2">
            Good day! We are currently conducting a survey that focuses on assessing the demographic information of the
            Katipunan ng Kabataan. We would like to ask your participation by taking your time to answer this
            questionnaire. Please read the questions carefully and answer them accurately.
          </p>
          <p className="text-sm font-semibold text-blue-900 mt-3">
            REST ASSURED THAT ALL INFORMATION GATHERED FROM THIS SURVEY WILL BE TREATED WITH UTMOST CONFIDENTIALITY.
          </p>
        </div>
      </div>

      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-700 font-semibold">
            {hasSubmitted && !isEditing ? "Survey updated successfully!" : "Survey submitted successfully!"}
          </p>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-2">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {hasSubmitted && !isEditing && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-blue-700 font-semibold">
            Survey submitted! You can edit your responses by clicking the "Edit Survey" button.
          </p>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 space-y-8">
        {/* I. PROFILE */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-6 pb-2 border-b-2 border-blue-500">I. PROFILE</h2>

          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-3">Name of the Youth:</label>
            <div className="grid grid-cols-4 gap-3">
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                placeholder="Last Name"
                disabled={isFormDisabled}
                className={`px-4 py-2 border rounded-lg focus:ring-2 focus:border-transparent outline-none transition ${
                  errors.lastName
                    ? "border-red-300 focus:ring-red-200"
                    : "border-gray-300 focus:ring-blue-200 focus:border-blue-400"
                } ${isFormDisabled ? "bg-gray-100 cursor-not-allowed" : ""}`}
              />
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                placeholder="First Name"
                disabled={isFormDisabled}
                className={`px-4 py-2 border rounded-lg focus:ring-2 focus:border-transparent outline-none transition ${
                  errors.firstName
                    ? "border-red-300 focus:ring-red-200"
                    : "border-gray-300 focus:ring-blue-200 focus:border-blue-400"
                } ${isFormDisabled ? "bg-gray-100 cursor-not-allowed" : ""}`}
              />
              <input
                type="text"
                name="middleName"
                value={formData.middleName}
                onChange={handleChange}
                placeholder="Middle Name"
                disabled={isFormDisabled}
                className={`px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-400 outline-none transition ${
                  isFormDisabled ? "bg-gray-100 cursor-not-allowed" : ""
                }`}
              />
              <input
                type="text"
                name="suffix"
                value={formData.suffix}
                onChange={handleChange}
                placeholder="Suffix"
                disabled={isFormDisabled}
                className={`px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-400 outline-none transition ${
                  isFormDisabled ? "bg-gray-100 cursor-not-allowed" : ""
                }`}
              />
            </div>
            {(errors.lastName || errors.firstName) && (
              <p className="text-red-600 text-sm mt-2 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.lastName || errors.firstName}
              </p>
            )}
          </div>

          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-3">Complete Address:</label>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <input
                type="text"
                name="street"
                value={formData.street}
                onChange={handleChange}
                placeholder="Street"
                disabled={isFormDisabled}
                className={`px-4 py-2 border rounded-lg focus:ring-2 focus:border-transparent outline-none transition ${
                  errors.street
                    ? "border-red-300 focus:ring-red-200"
                    : "border-gray-300 focus:ring-blue-200 focus:border-blue-400"
                } ${isFormDisabled ? "bg-gray-100 cursor-not-allowed" : ""}`}
              />
              <input
                type="text"
                name="barangay"
                value={formData.barangay}
                onChange={handleChange}
                placeholder="Barangay"
                disabled={isFormDisabled}
                className={`px-4 py-2 border rounded-lg focus:ring-2 focus:border-transparent outline-none transition ${
                  errors.barangay
                    ? "border-red-300 focus:ring-red-200"
                    : "border-gray-300 focus:ring-blue-200 focus:border-blue-400"
                } ${isFormDisabled ? "bg-gray-100 cursor-not-allowed" : ""}`}
              />
              <input
                type="text"
                name="province"
                value={formData.province}
                onChange={handleChange}
                placeholder="Province"
                disabled={isFormDisabled}
                className={`px-4 py-2 border rounded-lg focus:ring-2 focus:border-transparent outline-none transition ${
                  errors.province
                    ? "border-red-300 focus:ring-red-200"
                    : "border-gray-300 focus:ring-blue-200 focus:border-blue-400"
                } ${isFormDisabled ? "bg-gray-100 cursor-not-allowed" : ""}`}
              />
              <input
                type="text"
                name="cityMunicipality"
                value={formData.cityMunicipality}
                onChange={handleChange}
                placeholder="City/Municipality"
                disabled={isFormDisabled}
                className={`px-4 py-2 border rounded-lg focus:ring-2 focus:border-transparent outline-none transition ${
                  errors.cityMunicipality
                    ? "border-red-300 focus:ring-red-200"
                    : "border-gray-300 focus:ring-blue-200 focus:border-blue-400"
                } ${isFormDisabled ? "bg-gray-100 cursor-not-allowed" : ""}`}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Sex:</label>
              <select
                name="sex"
                value={formData.sex}
                onChange={handleChange}
                disabled={isFormDisabled}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:border-transparent outline-none transition ${
                  errors.sex
                    ? "border-red-300 focus:ring-red-200"
                    : "border-gray-300 focus:ring-blue-200 focus:border-blue-400"
                } ${isFormDisabled ? "bg-gray-100 cursor-not-allowed" : ""}`}
              >
                <option value="">Select</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Age:</label>
              <input
                type="number"
                name="age"
                value={formData.age}
                onChange={handleChange}
                placeholder="Age"
                disabled={isFormDisabled}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:border-transparent outline-none transition ${
                  errors.age
                    ? "border-red-300 focus:ring-red-200"
                    : "border-gray-300 focus:ring-blue-200 focus:border-blue-400"
                } ${isFormDisabled ? "bg-gray-100 cursor-not-allowed" : ""}`}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Birthday:</label>
              <input
                type="date"
                name="birthday"
                value={formData.birthday}
                onChange={handleChange}
                disabled={isFormDisabled}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:border-transparent outline-none transition ${
                  errors.birthday
                    ? "border-red-300 focus:ring-red-200"
                    : "border-gray-300 focus:ring-blue-200 focus:border-blue-400"
                } ${isFormDisabled ? "bg-gray-100 cursor-not-allowed" : ""}`}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address:</label>
              <input
                type="email"
                name="emailAddress"
                value={formData.emailAddress}
                onChange={handleChange}
                placeholder="Email"
                disabled={isFormDisabled}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:border-transparent outline-none transition ${
                  errors.emailAddress
                    ? "border-red-300 focus:ring-red-200"
                    : "border-gray-300 focus:ring-blue-200 focus:border-blue-400"
                } ${isFormDisabled ? "bg-gray-100 cursor-not-allowed" : ""}`}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Contact Number:</label>
              <input
                type="text"
                name="contactNumber"
                value={formData.contactNumber}
                onChange={handleChange}
                placeholder="Phone"
                disabled={isFormDisabled}
                className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-400 outline-none transition ${
                  isFormDisabled ? "bg-gray-100 cursor-not-allowed" : ""
                }`}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Facebook Account:</label>
              <input
                type="text"
                name="facebookAccount"
                value={formData.facebookAccount}
                onChange={handleChange}
                placeholder="Facebook"
                disabled={isFormDisabled}
                className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-400 outline-none transition ${
                  isFormDisabled ? "bg-gray-100 cursor-not-allowed" : ""
                }`}
              />
            </div>
          </div>
        </div>

        {/* II. DEMOGRAPHIC CHARACTERISTICS */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-6 pb-2 border-b-2 border-blue-500">
            II. DEMOGRAPHIC CHARACTERISTICS
          </h2>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Civil Status:</label>
              <select
                name="civilStatus"
                value={formData.civilStatus}
                onChange={handleChange}
                disabled={isFormDisabled}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:border-transparent outline-none transition ${
                  errors.civilStatus
                    ? "border-red-300 focus:ring-red-200"
                    : "border-gray-300 focus:ring-blue-200 focus:border-blue-400"
                } ${isFormDisabled ? "bg-gray-100 cursor-not-allowed" : ""}`}
              >
                <option value="">Choose here...</option>
                <option value="Single">Single</option>
                <option value="Separated">Separated</option>
                <option value="Married">Married</option>
                <option value="Annulled">Annulled</option>
                <option value="Divorced">Divorced</option>
                <option value="Widowed">Widowed</option>
                <option value="Live-in">Live-in</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Youth Classification:</label>
              <select
                name="youthClassification"
                value={formData.youthClassification}
                onChange={handleChange}
                disabled={isFormDisabled}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:border-transparent outline-none transition ${
                  errors.youthClassification
                    ? "border-red-300 focus:ring-red-200"
                    : "border-gray-300 focus:ring-blue-200 focus:border-blue-400"
                } ${isFormDisabled ? "bg-gray-100 cursor-not-allowed" : ""}`}
              >
                <option value="">Choose here...</option>
                <option value="In School Youth">In School Youth</option>
                <option value="Person with Disability">Person with Disability</option>
                <option value="Out of School Youth">Out of School Youth</option>
                <option value="Children in Conflict with Law">Children in Conflict with Law</option>
                <option value="Working Youth">Working Youth</option>
                <option value="Indigenous Youth">Indigenous Youth</option>
                <option value="Youth with Specific Needs">Youth with Specific Needs</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Youth Age Group:</label>
              <select
                name="youthAgeGroup"
                value={formData.youthAgeGroup}
                onChange={handleChange}
                disabled={isFormDisabled}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:border-transparent outline-none transition ${
                  errors.youthAgeGroup
                    ? "border-red-300 focus:ring-red-200"
                    : "border-gray-300 focus:ring-blue-200 focus:border-blue-400"
                } ${isFormDisabled ? "bg-gray-100 cursor-not-allowed" : ""}`}
              >
                <option value="">Choose here...</option>
                <option value="Child Youth (15-17 yrs.old)">Child Youth (15-17 yrs.old)</option>
                <option value="Core Youth (18-24 yrs.old)">Core Youth (18-24 yrs.old)</option>
                <option value="Young Adult (25-30 yrs.old)">Young Adult (25-30 yrs.old)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Educational Background:</label>
              <select
                name="educationalBackground"
                value={formData.educationalBackground}
                onChange={handleChange}
                disabled={isFormDisabled}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:border-transparent outline-none transition ${
                  errors.educationalBackground
                    ? "border-red-300 focus:ring-red-200"
                    : "border-gray-300 focus:ring-blue-200 focus:border-blue-400"
                } ${isFormDisabled ? "bg-gray-100 cursor-not-allowed" : ""}`}
              >
                <option value="">Choose here...</option>
                <option value="Elementary Level">Elementary Level</option>
                <option value="Elementary Graduate">Elementary Graduate</option>
                <option value="High School Level">High School Level</option>
                <option value="High School Graduate">High School Graduate</option>
                <option value="Vocational Graduate">Vocational Graduate</option>
                <option value="College Level">College Level</option>
                <option value="College Graduate">College Graduate</option>
                <option value="Masters Level">Masters Level</option>
                <option value="Masters Graduate">Masters Graduate</option>
                <option value="Doctorate Level">Doctorate Level</option>
                <option value="Doctorate Graduate">Doctorate Graduate</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Work Status:</label>
              <select
                name="workStatus"
                value={formData.workStatus}
                onChange={handleChange}
                disabled={isFormDisabled}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:border-transparent outline-none transition ${
                  errors.workStatus
                    ? "border-red-300 focus:ring-red-200"
                    : "border-gray-300 focus:ring-blue-200 focus:border-blue-400"
                } ${isFormDisabled ? "bg-gray-100 cursor-not-allowed" : ""}`}
              >
                <option value="">Choose here...</option>
                <option value="Employed">Employed</option>
                <option value="Unemployed">Unemployed</option>
                <option value="Self-employed">Self-employed</option>
                <option value="Currently looking for a job">Currently looking for a job</option>
                <option value="Not interested in looking for a job">Not interested in looking for a job</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Gender:</label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                disabled={isFormDisabled}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:border-transparent outline-none transition ${
                  errors.gender
                    ? "border-red-300 focus:ring-red-200"
                    : "border-gray-300 focus:ring-blue-200 focus:border-blue-400"
                } ${isFormDisabled ? "bg-gray-100 cursor-not-allowed" : ""}`}
              >
                <option value="">Choose here...</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="LGBTQIA+">LGBTQIA+</option>
                <option value="Others">Others</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Registered SK Voter?</label>
              <select
                name="registeredSKVoter"
                value={formData.registeredSKVoter}
                onChange={handleChange}
                disabled={isFormDisabled}
                className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-400 outline-none transition ${
                  isFormDisabled ? "bg-gray-100 cursor-not-allowed" : ""
                }`}
              >
                <option value="">Choose here...</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Registered National Voter?</label>
              <select
                name="registeredNationalVoter"
                value={formData.registeredNationalVoter}
                onChange={handleChange}
                disabled={isFormDisabled}
                className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-400 outline-none transition ${
                  isFormDisabled ? "bg-gray-100 cursor-not-allowed" : ""
                }`}
              >
                <option value="">Choose here...</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Attended KK Assembly?</label>
              <select
                name="attendedKKAssembly"
                value={formData.attendedKKAssembly}
                onChange={handleChange}
                disabled={isFormDisabled}
                className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-400 outline-none transition ${
                  isFormDisabled ? "bg-gray-100 cursor-not-allowed" : ""
                }`}
              >
                <option value="">Choose here...</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Times Attended:</label>
              <select
                name="timesAttendedKKAssembly"
                value={formData.timesAttendedKKAssembly}
                onChange={handleChange}
                disabled={isFormDisabled}
                className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-400 outline-none transition ${
                  isFormDisabled ? "bg-gray-100 cursor-not-allowed" : ""
                }`}
              >
                <option value="">Choose here...</option>
                <option value="1-2 times">1-2 times</option>
                <option value="3-4 times">3-4 times</option>
                <option value="5 and above">5 and above</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Why not attended?</label>
              <select
                name="whyNotAttended"
                value={formData.whyNotAttended}
                onChange={handleChange}
                disabled={isFormDisabled}
                className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-400 outline-none transition ${
                  isFormDisabled ? "bg-gray-100 cursor-not-allowed" : ""
                }`}
              >
                <option value="">Choose here...</option>
                <option value="There was no KK Assembly">There was no KK Assembly</option>
                <option value="Not interested to attend">Not interested to attend</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Voted in last election?</label>
              <select
                name="votedLastElection"
                value={formData.votedLastElection}
                onChange={handleChange}
                disabled={isFormDisabled}
                className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-400 outline-none transition ${
                  isFormDisabled ? "bg-gray-100 cursor-not-allowed" : ""
                }`}
              >
                <option value="">Choose here...</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Preferred Sports:</label>
            <textarea
              name="preferredSports"
              value={formData.preferredSports}
              onChange={handleChange}
              placeholder="Enter your preferred sports"
              disabled={isFormDisabled}
              className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-400 outline-none transition ${
                isFormDisabled ? "bg-gray-100 cursor-not-allowed" : ""
              }`}
              rows={3}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          {!hasSubmitted ? (
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Submitting..." : "Submit Survey"}
            </button>
          ) : (
            <>
              {!isEditing ? (
                <button
                  type="button"
                  onClick={handleEditClick}
                  className="flex-1 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition"
                >
                  Edit Survey
                </button>
              ) : (
                <>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? "Updating..." : "Update Survey"}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="flex-1 bg-gray-600 text-white py-3 rounded-lg font-semibold hover:bg-gray-700 transition"
                  >
                    Cancel
                  </button>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </form>
  )
}

// User Profile Component
function UserProfile({ userData }: { userData: UserData }) {
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")
  const [formData, setFormData] = useState({
    firstName: userData.firstName || "",
    lastName: userData.lastName || "",
    middleInitial: userData.middleInitial || "",
    username: userData.username || "",
    age: userData.age?.toString() || "",
    street: userData.street || "",
    barangay: userData.barangay || "",
    cityMunicipality: userData.cityMunicipality || "",
    province: userData.province || "",
    houseNumber: userData.houseNumber || "",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSave = async () => {
    if (!userData?.uid) {
      setError("User not authenticated")
      return
    }

    setLoading(true)
    setError("")
    setSuccess(false)

    try {
      // Update user document in Firestore
      const userDocRef = doc(db, "users", userData.uid)
      await updateDoc(userDocRef, {
        firstName: formData.firstName,
        lastName: formData.lastName,
        middleInitial: formData.middleInitial,
        username: formData.username,
        age: Number(formData.age) || 0,
        street: formData.street,
        barangay: formData.barangay,
        cityMunicipality: formData.cityMunicipality,
        province: formData.province,
        houseNumber: formData.houseNumber,
        updatedAt: new Date(),
      })

      setSuccess(true)
      setIsEditing(false)
      setTimeout(() => setSuccess(false), 3000)

      // Refresh the page to show updated data
      window.location.reload()
    } catch (err: any) {
      console.error("Error updating user data:", err)
      setError(err.message || "Failed to update profile")
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setFormData({
      firstName: userData.firstName || "",
      lastName: userData.lastName || "",
      middleInitial: userData.middleInitial || "",
      username: userData.username || "",
      age: userData.age?.toString() || "",
      street: userData.street || "",
      barangay: userData.barangay || "",
      cityMunicipality: userData.cityMunicipality || "",
      province: userData.province || "",
      houseNumber: userData.houseNumber || "",
    })
    setIsEditing(false)
    setError("")
  }

  return (
    <div className="max-w-5xl">
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">User Account</h1>
            <p className="text-gray-600">View and manage your profile information</p>
          </div>
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition"
            >
              Edit Profile
            </button>
          ) : (
            <div className="flex gap-3">
              <button
                onClick={handleCancel}
                className="bg-gray-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-gray-700 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={loading}
                className="bg-green-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Saving..." : "Save Changes"}
              </button>
            </div>
          )}
        </div>
      </div>

      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-700 font-semibold">Profile updated successfully!</p>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <div className="flex items-center gap-6 mb-8 pb-8 border-b border-gray-200">
          <div className="flex items-center justify-center w-20 h-20 bg-blue-500 rounded-full">
            <User className="w-10 h-10 text-white" />
          </div>
          <div className="flex-1">
            {isEditing ? (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">First Name</label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-400 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Last Name</label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-400 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Middle Initial</label>
                  <input
                    type="text"
                    name="middleInitial"
                    value={formData.middleInitial}
                    onChange={handleChange}
                    maxLength={1}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-400 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Username</label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-400 outline-none"
                  />
                </div>
              </div>
            ) : (
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {userData.firstName} {userData.middleInitial && `${userData.middleInitial}. `}
                  {userData.lastName}
                </h2>
                <p className="text-gray-600 flex items-center gap-2 mt-1">
                  <Mail className="w-4 h-4" />
                  {userData.email}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-blue-500" />
              Personal Information
            </h3>
            <div className="space-y-4">
              {isEditing ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Age</label>
                    <input
                      type="number"
                      name="age"
                      value={formData.age}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-400 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">House Number</label>
                    <input
                      type="text"
                      name="houseNumber"
                      value={formData.houseNumber}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-400 outline-none"
                    />
                  </div>
                </>
              ) : (
                <>
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
                    <label className="block text-sm font-medium text-gray-600">Age</label>
                    <p className="text-gray-900 font-semibold">{userData.age || "N/A"} years old</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600">House Number</label>
                    <p className="text-gray-900 font-semibold">{userData.houseNumber || "N/A"}</p>
                  </div>
                </>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-600">Account Status</label>
                <div className="flex items-center gap-2 mt-1">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      userData.status === "approved"
                        ? "bg-green-500"
                        : userData.status === "pending"
                          ? "bg-yellow-500"
                          : "bg-red-500"
                    }`}
                  />
                  <p className="text-gray-900 font-semibold capitalize">{userData.status}</p>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-blue-500" />
              Address Information
            </h3>
            <div className="space-y-4">
              {isEditing ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Street</label>
                    <input
                      type="text"
                      name="street"
                      value={formData.street}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-400 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Barangay</label>
                    <input
                      type="text"
                      name="barangay"
                      value={formData.barangay}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-400 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">City/Municipality</label>
                    <input
                      type="text"
                      name="cityMunicipality"
                      value={formData.cityMunicipality}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-400 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Province</label>
                    <input
                      type="text"
                      name="province"
                      value={formData.province}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-400 outline-none"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Street</label>
                    <p className="text-gray-900 font-semibold">{userData.street || "N/A"}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Barangay</label>
                    <p className="text-gray-900 font-semibold">{userData.barangay || "N/A"}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600">City/Municipality</label>
                    <p className="text-gray-900 font-semibold">{userData.cityMunicipality || "N/A"}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Province</label>
                    <p className="text-gray-900 font-semibold">{userData.province || "N/A"}</p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {!isEditing && (
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> To update your profile information, click the "Edit Profile" button above. 
              Some fields like email and account status cannot be changed by users.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

// Main Dashboard
export default function UserDashboard() {
  const [activeTab, setActiveTab] = useState<TabType>("survey")
  const [userData, setUserData] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        try {
          const userDocRef = doc(db, "users", currentUser.uid)
          const userDocSnap = await getDoc(userDocRef)

          if (userDocSnap.exists()) {
            const data = userDocSnap.data()
            setUserData({
              uid: currentUser.uid,
              email: currentUser.email || "",
              firstName: data.firstName || "",
              lastName: data.lastName || "",
              middleInitial: data.middleInitial || "",
              username: data.username || "",
              age: Number(data.age) || 0,
              houseNumber: data.houseNumber || "",
              status: data.status || "pending",
              street: data.street || "",
              barangay: data.barangay || "",
              cityMunicipality: data.cityMunicipality || "",
              province: data.province || "",
              userType: data.userType || "user",
              createdAt: data.createdAt?.toDate?.() || new Date(),
            })
          } else {
            console.log("[v0] User document not found in Firestore")
            setUserData({
              uid: currentUser.uid,
              email: currentUser.email || "",
              firstName: "",
              lastName: "",
              middleInitial: "",
              username: "",
              age: 0,
              houseNumber: "",
              status: "pending",
              street: "",
              barangay: "",
              cityMunicipality: "",
              province: "",
              userType: "user",
              createdAt: new Date(),
            })
          }
        } catch (err) {
          console.error("[v0] Error fetching user data:", err)
          setError("Failed to load user data")
        } finally {
          setLoading(false)
        }
      } else {
        setUserData(null)
        setLoading(false)
      }
    })

    return () => unsubscribe()
  }, [])

  const handleLogout = async () => {
    try {
      await AuthService.logout()
      window.location.href = "/login"
    } catch (err) {
      console.error("Logout error:", err)
      setError("Failed to logout")
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-500 rounded-full mb-6 animate-pulse">
            <User className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Loading...</h1>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar userData={userData} onLogout={handleLogout} activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="flex-1 overflow-auto">
        <div className="p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {activeTab === "survey" && userData && <SurveyForm userId={userData.uid} />}

          {activeTab === "profile" && userData && <UserProfile userData={userData} />}
        </div>
      </div>
    </div>
  )
}