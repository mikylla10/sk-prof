import { useState, useEffect, useRef } from "react"
import { db } from "../../service/firebaseConfig"
import { collection, getDocs, updateDoc, deleteDoc, doc, query, where } from "firebase/firestore"
import { AuthService } from "../../service/authService"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import { Button } from "../../components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../components/ui/alert-dialog"
import { Trash2, Check, X, BarChart3, Users, FileText, LogOut, Home, Search, Filter, Eye, ClipboardList } from "lucide-react"

interface User {
  id: string
  name: string
  email: string
  age: number
  location: string
  status: "pending" | "approved" | "rejected"
  createdAt: Date
  userType?: string
  // Additional fields from your register form
  firstName?: string
  lastName?: string
  middleInitial?: string
  username?: string
  houseNumber?: string
  street?: string
  barangay?: string
  cityMunicipality?: string
  province?: string
}

interface SurveyData {
  id: string
  userId: string
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
  createdAt: Date
}

type FilterType = "all" | "pending" | "approved" | "rejected"

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("dashboard")
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [approveConfirm, setApproveConfirm] = useState<string | null>(null)
  const [rejectConfirm, setRejectConfirm] = useState<string | null>(null)
  const [logoutLoading, setLogoutLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<FilterType>("all")
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isUserDetailOpen, setIsUserDetailOpen] = useState(false)
  const [userSurveys, setUserSurveys] = useState<{[key: string]: SurveyData}>({})
  const [loadingSurveys, setLoadingSurveys] = useState<{[key: string]: boolean}>({})
  const [dashboardStats, setDashboardStats] = useState({
    totalSurveys: 0,
    youthAgeGroups: {} as {[key: string]: number},
    educationalBackgrounds: {} as {[key: string]: number},
    workStatuses: {} as {[key: string]: number},
    youthClassifications: {} as {[key: string]: number},
    monthlyDistribution: [] as {month: string, surveys: number}[]
  })
  const filterRef = useRef<HTMLDivElement>(null)

  // Close filter dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setIsFilterOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  // Fetch users from Firestore
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersRef = collection(db, "users")
        const snapshot = await getDocs(usersRef)
        const usersData: User[] = snapshot.docs.map((doc) => {
          const data = doc.data()
          
          // Construct full name from firstName, lastName, and middleInitial
          const firstName = data.firstName || ""
          const lastName = data.lastName || ""
          const middleInitial = data.middleInitial || ""
          const fullName = `${firstName} ${middleInitial ? middleInitial + '.' : ''} ${lastName}`.trim().replace(/\s+/g, ' ')
          
          // Construct location from address fields
          const houseNumber = data.houseNumber || ""
          const street = data.street || ""
          const barangay = data.barangay || ""
          const cityMunicipality = data.cityMunicipality || ""
          const province = data.province || ""
          const fullLocation = `${houseNumber} ${street}, ${barangay}, ${cityMunicipality}, ${province}`
            .trim()
            .replace(/\s+/g, ' ')
            .replace(/, ,/g, ',')
            .replace(/^,\s*|\s*,$/g, '')
          
          return {
            id: doc.id,
            name: fullName || data.name || "Unknown User",
            email: data.email || "No email",
            age: data.age || 0,
            location: fullLocation || data.location || "Unknown Location",
            status: data.status || "pending",
            userType: data.userType || "user",
            createdAt: data.createdAt?.toDate?.() || new Date(),
            // Store individual fields for potential use
            firstName: data.firstName,
            lastName: data.lastName,
            middleInitial: data.middleInitial,
            username: data.username,
            houseNumber: data.houseNumber,
            street: data.street,
            barangay: data.barangay,
            cityMunicipality: data.cityMunicipality,
            province: data.province
          }
        })
        
        // Filter out admin users and only show regular users
        const regularUsers = usersData.filter(user => user.userType !== "admin")
        
        // Sort users: pending first, then by creation date
        const sortedUsers = regularUsers.sort((a, b) => {
          if (a.status === "pending" && b.status !== "pending") return -1
          if (a.status !== "pending" && b.status === "pending") return 1
          return b.createdAt.getTime() - a.createdAt.getTime()
        })
        
        setUsers(sortedUsers)
        setFilteredUsers(sortedUsers)
        console.log("Fetched users:", sortedUsers)
      } catch (error) {
        console.error("Error fetching users:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchUsers()
  }, [])

  // Fetch survey data for dashboard
  useEffect(() => {
    const fetchSurveyData = async () => {
      try {
        const surveysRef = collection(db, "surveys")
        const snapshot = await getDocs(surveysRef)
        const surveys: SurveyData[] = snapshot.docs.map((doc) => {
          const data = doc.data()
          return {
            id: doc.id,
            userId: data.userId || "",
            lastName: data.lastName || "",
            firstName: data.firstName || "",
            middleName: data.middleName || "",
            suffix: data.suffix || "",
            street: data.street || "",
            barangay: data.barangay || "",
            province: data.province || "",
            cityMunicipality: data.cityMunicipality || "",
            sex: data.sex || "",
            age: data.age || "",
            birthday: data.birthday || "",
            emailAddress: data.emailAddress || "",
            contactNumber: data.contactNumber || "",
            facebookAccount: data.facebookAccount || "",
            civilStatus: data.civilStatus || "",
            youthClassification: data.youthClassification || "",
            youthAgeGroup: data.youthAgeGroup || "",
            educationalBackground: data.educationalBackground || "",
            workStatus: data.workStatus || "",
            gender: data.gender || "",
            registeredSKVoter: data.registeredSKVoter || "",
            registeredNationalVoter: data.registeredNationalVoter || "",
            attendedKKAssembly: data.attendedKKAssembly || "",
            timesAttendedKKAssembly: data.timesAttendedKKAssembly || "",
            whyNotAttended: data.whyNotAttended || "",
            votedLastElection: data.votedLastElection || "",
            preferredSports: data.preferredSports || "",
            createdAt: data.createdAt?.toDate?.() || new Date(),
          }
        })

        calculateDashboardStats(surveys)
      } catch (error) {
        console.error("Error fetching survey data:", error)
      }
    }

    fetchSurveyData()
  }, [])

  // Calculate dashboard statistics from survey data
  const calculateDashboardStats = (surveys: SurveyData[]) => {
    // Youth Age Group Distribution
    const youthAgeGroups = surveys.reduce((acc, survey) => {
      const ageGroup = survey.youthAgeGroup || "Not Specified"
      acc[ageGroup] = (acc[ageGroup] || 0) + 1
      return acc
    }, {} as {[key: string]: number})

    // Educational Background Distribution
    const educationalBackgrounds = surveys.reduce((acc, survey) => {
      const education = survey.educationalBackground || "Not Specified"
      acc[education] = (acc[education] || 0) + 1
      return acc
    }, {} as {[key: string]: number})

    // Work Status Distribution
    const workStatuses = surveys.reduce((acc, survey) => {
      const workStatus = survey.workStatus || "Not Specified"
      acc[workStatus] = (acc[workStatus] || 0) + 1
      return acc
    }, {} as {[key: string]: number})

    // Youth Classification Distribution
    const youthClassifications = surveys.reduce((acc, survey) => {
      const classification = survey.youthClassification || "Not Specified"
      acc[classification] = (acc[classification] || 0) + 1
      return acc
    }, {} as {[key: string]: number})

    // Monthly distribution (last 6 months)
    const monthlyDistribution = Array.from({ length: 6 }, (_, i) => {
      const date = new Date()
      date.setMonth(date.getMonth() - i)
      const monthYear = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1)
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0)
      
      const monthSurveys = surveys.filter(survey => {
        const surveyDate = survey.createdAt
        return surveyDate >= monthStart && surveyDate <= monthEnd
      })
      
      return {
        month: monthYear,
        surveys: monthSurveys.length
      }
    }).reverse()

    setDashboardStats({
      totalSurveys: surveys.length,
      youthAgeGroups,
      educationalBackgrounds,
      workStatuses,
      youthClassifications,
      monthlyDistribution
    })
  }

  // Apply search and filter
  useEffect(() => {
    let result = users

    // For Account Records tab, only show approved users by default
    if (activeTab === "records") {
      result = result.filter(user => user.status === "approved")
    }

    // For Youth Data tab, only show approved users
    if (activeTab === "youthData") {
      result = result.filter(user => user.status === "approved")
    }

    // Apply status filter (except for Account Records and Youth Data which only show approved)
    if (statusFilter !== "all" && activeTab !== "records" && activeTab !== "youthData") {
      result = result.filter(user => user.status === statusFilter)
    }

    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter(user =>
        (user.name?.toLowerCase() || '').includes(query) ||
        (user.email?.toLowerCase() || '').includes(query) ||
        (user.location?.toLowerCase() || '').includes(query) ||
        (user.firstName?.toLowerCase() || '').includes(query) ||
        (user.lastName?.toLowerCase() || '').includes(query) ||
        (user.username?.toLowerCase() || '').includes(query) ||
        (user.barangay?.toLowerCase() || '').includes(query) ||
        (user.cityMunicipality?.toLowerCase() || '').includes(query) ||
        (user.province?.toLowerCase() || '').includes(query)
      )
    }

    setFilteredUsers(result)
  }, [users, searchQuery, statusFilter, activeTab])

  const handleLogout = async () => {
    try {
      setLogoutLoading(true)
      await AuthService.logout()
      window.location.href = "/login"
    } catch (error) {
      console.error("Logout error:", error)
      setLogoutLoading(false)
    }
  }

  // Handle approve user
  const handleApprove = async (userId: string) => {
    try {
      const userRef = doc(db, "users", userId)
      await updateDoc(userRef, { status: "approved" })
      setUsers(users.map((u) => (u.id === userId ? { ...u, status: "approved" } : u)))
      setApproveConfirm(null)
    } catch (error) {
      console.error("Error approving user:", error)
    }
  }

  // Handle reject user
  const handleReject = async (userId: string) => {
    try {
      const userRef = doc(db, "users", userId)
      await updateDoc(userRef, { status: "rejected" })
      setUsers(users.map((u) => (u.id === userId ? { ...u, status: "rejected" } : u)))
      setRejectConfirm(null)
    } catch (error) {
      console.error("Error rejecting user:", error)
    }
  }

  // Handle delete user - UPDATED VERSION
  const handleDelete = async (userId: string) => {
    try {
      // Delete user from Firestore
      await deleteDoc(doc(db, "users", userId));
      
      // Also delete the user's survey data if it exists
      try {
        const surveysRef = collection(db, "surveys");
        const q = query(surveysRef, where("userId", "==", userId));
        const snapshot = await getDocs(q);
        
        if (!snapshot.empty) {
          // Delete all surveys associated with this user
          const deletePromises = snapshot.docs.map(surveyDoc => 
            deleteDoc(doc(db, "surveys", surveyDoc.id))
          );
          await Promise.all(deletePromises);
          console.log(`Deleted ${snapshot.docs.length} survey(s) for user ${userId}`);
        }
      } catch (surveyError) {
        console.error("Error deleting user surveys:", surveyError);
        // Continue even if survey deletion fails
      }
      
      // Update local state
      setUsers(users.filter((u) => u.id !== userId));
      setDeleteConfirm(null);
      
      console.log(`Successfully deleted user: ${userId}`);
    } catch (error) {
      console.error("Error deleting user:", error);
      alert("Failed to delete user. Please check the console for details.");
    }
  }

  // Fetch survey data for a specific user
  const fetchUserSurvey = async (userId: string) => {
    try {
      setLoadingSurveys(prev => ({ ...prev, [userId]: true }))
      const surveysRef = collection(db, "surveys")
      const q = query(surveysRef, where("userId", "==", userId))
      const snapshot = await getDocs(q)
      
      if (!snapshot.empty) {
        const surveyDoc = snapshot.docs[0]
        const surveyData = surveyDoc.data()
        const survey: SurveyData = {
          id: surveyDoc.id,
          userId: userId,
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
          createdAt: surveyData.createdAt?.toDate?.() || new Date(),
        }
        setUserSurveys(prev => ({ ...prev, [userId]: survey }))
      } else {
        setUserSurveys(prev => ({ ...prev, [userId]: null as any }))
      }
    } catch (error) {
      console.error("Error fetching user survey:", error)
      setUserSurveys(prev => ({ ...prev, [userId]: null as any }))
    } finally {
      setLoadingSurveys(prev => ({ ...prev, [userId]: false }))
    }
  }

  // Handle view user details
  const handleViewUser = async (user: User) => {
    setSelectedUser(user)
    setIsUserDetailOpen(true)
    
    // Fetch survey data if not already loaded
    if (!userSurveys[user.id] && !loadingSurveys[user.id]) {
      await fetchUserSurvey(user.id)
    }
  }

  // Calculate user stats
  const stats = {
    total: users.length,
    pending: users.filter((u) => u.status === "pending").length,
    approved: users.filter((u) => u.status === "approved").length,
    rejected: users.filter((u) => u.status === "rejected").length,
  }

  // Chart data from survey data
  const youthAgeGroupData = Object.entries(dashboardStats.youthAgeGroups).map(([name, value]) => ({
    name,
    value
  }))

  const educationalBackgroundData = Object.entries(dashboardStats.educationalBackgrounds).map(([name, value]) => ({
    name,
    value
  }))

  const workStatusData = Object.entries(dashboardStats.workStatuses).map(([name, value]) => ({
    name,
    value
  }))

  const youthClassificationData = Object.entries(dashboardStats.youthClassifications).map(([name, value]) => ({
    name,
    value
  }))

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: Home },
    { id: "users", label: "User Management", icon: Users },
    { id: "youthData", label: "Youth Data", icon: Users },
    { id: "records", label: "Account Records", icon: FileText },
  ]

  const filterOptions: { value: FilterType; label: string }[] = [
    { value: "all", label: "All Users" },
    { value: "pending", label: "Pending" },
    { value: "approved", label: "Approved" },
    { value: "rejected", label: "Rejected" },
  ]

  return (
    <div className="flex h-screen bg-gray-900 text-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-gray-800">
        <div className="flex flex-col h-screen">
          {/* Logo Area */}
          <div className="p-6 border-b border-gray-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-linear-to-br from-blue-400 to-indigo-500 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold">Admin Panel</h2>
                <p className="text-xs text-gray-400">Management System</p>
              </div>
            </div>
          </div>

          {/* Navigation Menu */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon
              const isActive = activeTab === item.id

              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                    isActive ? "bg-blue-600 text-white" : "text-gray-300 hover:bg-gray-800 hover:text-white"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </button>
              )
            })}
          </nav>

          {/* Logout Button */}
          <div className="p-4 border-t border-gray-800">
            <button
              onClick={handleLogout}
              disabled={logoutLoading}
              className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white px-4 py-3 rounded-lg font-medium transition"
            >
              <LogOut className="w-5 h-5" />
              {logoutLoading ? "Logging out..." : "Logout"}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          {/* Dashboard Tab */}
          {activeTab === "dashboard" && (
            <div className="space-y-6">
              <h1 className="text-3xl font-bold">Dashboard</h1>

              {/* Stats Cards */}
              <div className="grid grid-cols-4 gap-4">
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-300">Total Users</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.total}</div>
                  </CardContent>
                </Card>
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-300">Total Surveys</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-400">{dashboardStats.totalSurveys}</div>
                  </CardContent>
                </Card>
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-300">Approved Users</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-400">{stats.approved}</div>
                  </CardContent>
                </Card>
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-300">Pending Users</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-yellow-400">{stats.pending}</div>
                  </CardContent>
                </Card>
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Youth Age Group Distribution */}
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle>Youth Age Group Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={youthAgeGroupData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#4b5563" />
                        <XAxis dataKey="name" stroke="#9ca3af" />
                        <YAxis stroke="#9ca3af" />
                        <Tooltip contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #4b5563" }} />
                        <Bar dataKey="value" fill="#3b82f6" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Educational Background Distribution */}
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle>Educational Background</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={educationalBackgroundData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {educationalBackgroundData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={[
                              "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"
                            ][index % 6]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #4b5563" }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* More Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Work Status Distribution */}
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle>Work Status Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={workStatusData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#4b5563" />
                        <XAxis dataKey="name" stroke="#9ca3af" />
                        <YAxis stroke="#9ca3af" />
                        <Tooltip contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #4b5563" }} />
                        <Bar dataKey="value" fill="#10b981" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Youth Classification */}
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle>Youth Classification</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={youthClassificationData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {youthClassificationData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={[
                              "#8b5cf6", "#f59e0b", "#ef4444", "#3b82f6", "#10b981", "#06b6d4"
                            ][index % 6]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #4b5563" }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Survey Growth Over Time */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle>Survey Submissions Over Time</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={dashboardStats.monthlyDistribution}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#4b5563" />
                      <XAxis dataKey="month" stroke="#9ca3af" />
                      <YAxis stroke="#9ca3af" />
                      <Tooltip contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #4b5563" }} />
                      <Line type="monotone" dataKey="surveys" stroke="#8b5cf6" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          )}

          {/* User Management Tab */}
          {activeTab === "users" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <h1 className="text-3xl font-bold">User Management</h1>
                
                {/* Search and Filter Bar */}
                <div className="flex flex-col sm:flex-row gap-3">
                  {/* Search Input */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Search users..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full sm:w-64"
                    />
                  </div>

                  {/* Filter Dropdown */}
                  <div className="relative" ref={filterRef}>
                    <Button
                      variant="outline"
                      onClick={() => setIsFilterOpen(!isFilterOpen)}
                      className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700 hover:text-white flex items-center gap-2"
                    >
                      <Filter className="w-4 h-4" />
                      Filter
                      {statusFilter !== "all" && (
                        <span className="bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                          {filteredUsers.length}
                        </span>
                      )}
                    </Button>

                    {isFilterOpen && (
                      <div className="absolute top-full right-0 mt-2 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-10">
                        {filterOptions.map((option) => (
                          <button
                            key={option.value}
                            onClick={() => {
                              setStatusFilter(option.value)
                              setIsFilterOpen(false)
                            }}
                            className={`w-full text-left px-4 py-2 hover:bg-gray-700 transition ${
                              statusFilter === option.value ? "bg-blue-600 text-white" : "text-gray-300"
                            } ${option.value === "all" ? "rounded-t-lg" : option.value === "rejected" ? "rounded-b-lg" : ""}`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Status Summary Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total Users Card */}
                <div 
                  className={`bg-gray-800 border rounded-lg p-4 cursor-pointer transition ${
                    statusFilter === "all" ? "ring-2 ring-blue-500 border-blue-500" : "border-gray-700"
                  }`}
                  onClick={() => setStatusFilter("all")}
                >
                  <div className="text-sm font-medium text-gray-300">Total Users</div>
                  <div className="text-2xl font-bold mt-1">{stats.total}</div>
                </div>

                {/* Pending Card */}
                <div 
                  className={`bg-gray-800 border rounded-lg p-4 cursor-pointer transition ${
                    statusFilter === "pending" ? "ring-2 ring-yellow-500 border-yellow-500" : "border-gray-700"
                  }`}
                  onClick={() => setStatusFilter("pending")}
                >
                  <div className="text-sm font-medium text-gray-300">Pending</div>
                  <div className="text-2xl font-bold text-yellow-400 mt-1">{stats.pending}</div>
                </div>

                {/* Approved Card */}
                <div 
                  className={`bg-gray-800 border rounded-lg p-4 cursor-pointer transition ${
                    statusFilter === "approved" ? "ring-2 ring-green-500 border-green-500" : "border-gray-700"
                  }`}
                  onClick={() => setStatusFilter("approved")}
                >
                  <div className="text-sm font-medium text-gray-300">Approved</div>
                  <div className="text-2xl font-bold text-green-400 mt-1">{stats.approved}</div>
                </div>

                {/* Rejected Card */}
                <div 
                  className={`bg-gray-800 border rounded-lg p-4 cursor-pointer transition ${
                    statusFilter === "rejected" ? "ring-2 ring-red-500 border-red-500" : "border-gray-700"
                  }`}
                  onClick={() => setStatusFilter("rejected")}
                >
                  <div className="text-sm font-medium text-gray-300">Rejected</div>
                  <div className="text-2xl font-bold text-red-400 mt-1">{stats.rejected}</div>
                </div>
              </div>

              {loading ? (
                <div className="text-center py-12">Loading users...</div>
              ) : filteredUsers.length === 0 ? (
                <Card className="bg-gray-800 border-gray-700">
                  <CardContent className="p-12 text-center">
                    <div className="text-gray-400 text-lg">
                      {searchQuery || statusFilter !== "all" 
                        ? "No users match your search criteria" 
                        : "No users found"}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="bg-gray-800 border-gray-700 overflow-hidden">
                  <CardContent className="p-0">
                    <div className="overflow-x-auto max-h-[500px]">
                      <table className="w-full">
                        <thead className="sticky top-0 bg-gray-700 z-10">
                          <tr className="border-b border-gray-600">
                            <th className="px-6 py-3 text-left text-sm font-semibold">Name</th>
                            <th className="px-6 py-3 text-left text-sm font-semibold">Username</th>
                            <th className="px-6 py-3 text-left text-sm font-semibold">Location</th>
                            <th className="px-6 py-3 text-left text-sm font-semibold">Status</th>
                            <th className="px-6 py-3 text-left text-sm font-semibold">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredUsers.map((user) => (
                            <tr key={user.id} className="border-b border-gray-700 hover:bg-gray-750">
                              <td className="px-6 py-4 font-medium text-sm">{user.name}</td>
                              <td className="px-6 py-4 text-sm text-gray-300">
                                {user.username || "No username"}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-300 max-w-xs truncate" title={user.location}>
                                {user.location}
                              </td>
                              <td className="px-6 py-4">
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                  user.status === "approved"
                                    ? "bg-green-900 text-green-200"
                                    : user.status === "pending"
                                      ? "bg-yellow-900 text-yellow-200"
                                      : "bg-red-900 text-red-200"
                                }`}>
                                  {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                {user.status === "pending" ? (
                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      className="bg-green-600 hover:bg-green-700 text-white"
                                      onClick={() => setApproveConfirm(user.id)}
                                    >
                                      <Check className="w-4 h-4 mr-1" />
                                      Approve
                                    </Button>
                                    <Button
                                      size="sm"
                                      className="bg-red-600 hover:bg-red-700 text-white"
                                      onClick={() => setRejectConfirm(user.id)}
                                    >
                                      <X className="w-4 h-4 mr-1" />
                                      Reject
                                    </Button>
                                  </div>
                                ) : (
                                  <span className="text-gray-400 text-sm">No actions available</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Youth Data Tab */}
          {activeTab === "youthData" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <h1 className="text-3xl font-bold">Youth Data</h1>
                
                {/* Search Bar */}
                <div className="flex flex-col sm:flex-row gap-3">
                  {/* Search Input */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Search approved users..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full sm:w-64"
                    />
                  </div>

                  {/* Filter Info - Show only approved users in Youth Data */}
                  <div className="flex items-center px-4 py-2 bg-green-900/30 border border-green-700 rounded-lg">
                    <span className="text-green-300 text-sm">Showing approved youth users only</span>
                  </div>
                </div>
              </div>

              {loading ? (
                <div className="text-center py-12">Loading youth data...</div>
              ) : filteredUsers.length === 0 ? (
                <Card className="bg-gray-800 border-gray-700">
                  <CardContent className="p-12 text-center">
                    <div className="text-gray-400 text-lg">
                      {searchQuery 
                        ? "No approved youth users match your search criteria" 
                        : "No approved youth users found"}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="bg-gray-800 border-gray-700 overflow-hidden">
                  <CardContent className="p-0">
                    <div className="overflow-x-auto max-h-[500px]">
                      <table className="w-full">
                        <thead className="sticky top-0 bg-gray-700 z-10">
                          <tr className="border-b border-gray-600">
                            <th className="px-6 py-3 text-left text-sm font-semibold">#</th>
                            <th className="px-6 py-3 text-left text-sm font-semibold">Last Name</th>
                            <th className="px-6 py-3 text-left text-sm font-semibold">First Name</th>
                            <th className="px-6 py-3 text-left text-sm font-semibold">Middle Initial</th>
                            <th className="px-6 py-3 text-left text-sm font-semibold">Age</th>
                            <th className="px-6 py-3 text-left text-sm font-semibold">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredUsers.map((user, index) => (
                            <tr key={user.id} className="border-b border-gray-700 hover:bg-gray-750">
                              <td className="px-6 py-4 font-medium">{index + 1}</td>
                              <td className="px-6 py-4 font-medium text-sm">
                                {user.lastName || "N/A"}
                              </td>
                              <td className="px-6 py-4 text-sm">
                                {user.firstName || "N/A"}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-300">
                                {user.middleInitial || "N/A"}
                              </td>
                              <td className="px-6 py-4 text-sm">
                                {user.age || "N/A"}
                              </td>
                              <td className="px-6 py-4">
                                <Button 
                                  size="sm" 
                                  className="bg-blue-600 hover:bg-blue-700 text-white"
                                  onClick={() => handleViewUser(user)}
                                >
                                  <Eye className="w-4 h-4 mr-1" />
                                  View More
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Account Records Tab */}
          {activeTab === "records" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <h1 className="text-3xl font-bold">Account Records</h1>
                
                {/* Search and Filter Bar */}
                <div className="flex flex-col sm:flex-row gap-3">
                  {/* Search Input */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Search approved users..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full sm:w-64"
                    />
                  </div>

                  {/* Filter Info - Show only approved users in Account Records */}
                  <div className="flex items-center px-4 py-2 bg-blue-900/30 border border-blue-700 rounded-lg">
                    <span className="text-blue-300 text-sm">Showing approved users only</span>
                  </div>
                </div>
              </div>

              {loading ? (
                <div className="text-center py-12">Loading records...</div>
              ) : filteredUsers.length === 0 ? (
                <Card className="bg-gray-800 border-gray-700">
                  <CardContent className="p-12 text-center">
                    <div className="text-gray-400 text-lg">
                      {searchQuery 
                        ? "No approved users match your search criteria" 
                        : "No approved users found"}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="bg-gray-800 border-gray-700 overflow-hidden">
                  <CardContent className="p-0">
                    <div className="overflow-x-auto max-h-[500px]">
                      <table className="w-full">
                        <thead className="sticky top-0 bg-gray-700 z-10">
                          <tr className="border-b border-gray-600">
                            <th className="px-6 py-3 text-left text-sm font-semibold">#</th>
                            <th className="px-6 py-3 text-left text-sm font-semibold">Name & Username</th>
                            <th className="px-6 py-3 text-left text-sm font-semibold">Location</th>
                            <th className="px-6 py-3 text-left text-sm font-semibold">Joined</th>
                            <th className="px-6 py-3 text-left text-sm font-semibold">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredUsers.map((user, index) => (
                            <tr key={user.id} className="border-b border-gray-700 hover:bg-gray-750">
                              <td className="px-6 py-4 font-medium">{index + 1}</td>
                              <td className="px-6 py-4">
                                <div>
                                  <p className="font-medium">{user.name}</p>
                                  <p className="text-sm text-gray-400">{user.username || "No username"}</p>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-300 max-w-xs truncate" title={user.location}>
                                {user.location}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-400">{user.createdAt.toLocaleDateString()}</td>
                              <td className="px-6 py-4">
                                <Button 
                                  size="sm" 
                                  variant="destructive" 
                                  onClick={() => setDeleteConfirm(user.id)}
                                  className="bg-red-600 hover:bg-red-700 text-white"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Dialogs */}
      <AlertDialog open={!!approveConfirm} onOpenChange={(open) => !open && setApproveConfirm(null)}>
        <AlertDialogContent className="bg-gray-800 border-gray-700">
          <AlertDialogHeader>
            <AlertDialogTitle>Approve User?</AlertDialogTitle>
            <AlertDialogDescription>This user will be granted access to the platform.</AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel onClick={() => setApproveConfirm(null)} className="bg-gray-700 border-gray-600 hover:bg-gray-600">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => approveConfirm && handleApprove(approveConfirm)}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              Approve
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!rejectConfirm} onOpenChange={(open) => !open && setRejectConfirm(null)}>
        <AlertDialogContent className="bg-gray-800 border-gray-700">
          <AlertDialogHeader>
            <AlertDialogTitle>Reject User?</AlertDialogTitle>
            <AlertDialogDescription>This user will be denied access to the platform.</AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel onClick={() => setRejectConfirm(null)} className="bg-gray-700 border-gray-600 hover:bg-gray-600">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => rejectConfirm && handleReject(rejectConfirm)}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Reject
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
        <AlertDialogContent className="bg-gray-800 border-gray-700">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User Record?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The user record and all associated survey data will be permanently deleted from the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel onClick={() => setDeleteConfirm(null)} className="bg-gray-700 border-gray-600 hover:bg-gray-600">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete User
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* User Detail Modal */}
      {isUserDetailOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsUserDetailOpen(false)
            }
          }}
        >
          <div className="bg-gray-800 border border-gray-700 rounded-xl max-w-7xl w-[95vw] max-h-[90vh] overflow-y-auto flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-700 sticky top-0 bg-gray-800 z-10">
              <div>
                <h2 className="text-2xl font-bold text-white">Youth Survey Details</h2>
                <p className="text-gray-300 text-base mt-1">
                  Complete survey information for {selectedUser?.firstName} {selectedUser?.lastName}
                </p>
              </div>
              <button
                onClick={() => setIsUserDetailOpen(false)}
                className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-700 rounded-lg"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto">
              {selectedUser && (
                <div className="space-y-6 p-6">
                  {loadingSurveys[selectedUser.id] ? (
                    <div className="text-center py-16">
                      <div className="inline-flex items-center justify-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                        <span className="ml-4 text-gray-300 text-lg">Loading survey data...</span>
                      </div>
                    </div>
                  ) : userSurveys[selectedUser.id] ? (
                    <div className="space-y-6">
                      {/* I. PROFILE SECTION - Ultra Wide Layout */}
                      <div className="bg-gray-750 rounded-xl p-6">
                        <h3 className="text-xl font-bold text-white mb-4 pb-2 border-b border-gray-600">I. PROFILE</h3>
                        
                        <div className="space-y-4">
                          {/* Name Section - Full Width */}
                          <div>
                            <h4 className="text-base font-semibold text-gray-300 mb-3">Name of the Youth</h4>
                            <div className="grid grid-cols-5 gap-4">
                              <div className="space-y-1">
                                <p className="text-sm text-gray-400">Last Name</p>
                                <div className="text-white font-medium p-2 bg-gray-700 rounded-lg min-h-11 flex items-center">
                                  {userSurveys[selectedUser.id].lastName || "N/A"}
                                </div>
                              </div>
                              <div className="space-y-1">
                                <p className="text-sm text-gray-400">First Name</p>
                                <div className="text-white font-medium p-2 bg-gray-700 rounded-lg min-h-11 flex items-center">
                                  {userSurveys[selectedUser.id].firstName || "N/A"}
                                </div>
                              </div>
                              <div className="space-y-1">
                                <p className="text-sm text-gray-400">Middle Name</p>
                                <div className="text-white font-medium p-2 bg-gray-700 rounded-lg min-h-11 flex items-center">
                                  {userSurveys[selectedUser.id].middleName || "N/A"}
                                </div>
                              </div>
                              <div className="space-y-1">
                                <p className="text-sm text-gray-400">Suffix</p>
                                <div className="text-white font-medium p-2 bg-gray-700 rounded-lg min-h-11 flex items-center">
                                  {userSurveys[selectedUser.id].suffix || "N/A"}
                                </div>
                              </div>
                              <div className="space-y-1">
                                <p className="text-sm text-gray-400">Age</p>
                                <div className="text-white font-medium p-2 bg-gray-700 rounded-lg min-h-11 flex items-center">
                                  {userSurveys[selectedUser.id].age || "N/A"}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Address Section - Full Width */}
                          <div>
                            <h4 className="text-base font-semibold text-gray-300 mb-3">Complete Address</h4>
                            <div className="grid grid-cols-4 gap-4">
                              <div className="space-y-1">
                                <p className="text-sm text-gray-400">Street</p>
                                <div className="text-white p-2 bg-gray-700 rounded-lg min-h-11 flex items-center">
                                  {userSurveys[selectedUser.id].street || "N/A"}
                                </div>
                              </div>
                              <div className="space-y-1">
                                <p className="text-sm text-gray-400">Barangay</p>
                                <div className="text-white p-2 bg-gray-700 rounded-lg min-h-11 flex items-center">
                                  {userSurveys[selectedUser.id].barangay || "N/A"}
                                </div>
                              </div>
                              <div className="space-y-1">
                                <p className="text-sm text-gray-400">City/Municipality</p>
                                <div className="text-white p-2 bg-gray-700 rounded-lg min-h-11 flex items-center">
                                  {userSurveys[selectedUser.id].cityMunicipality || "N/A"}
                                </div>
                              </div>
                              <div className="space-y-1">
                                <p className="text-sm text-gray-400">Province</p>
                                <div className="text-white p-2 bg-gray-700 rounded-lg min-h-11 flex items-center">
                                  {userSurveys[selectedUser.id].province || "N/A"}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Personal Details - Full Width */}
                          <div className="grid grid-cols-5 gap-4">
                            <div className="space-y-1">
                              <p className="text-sm text-gray-400">Sex</p>
                              <div className="text-white font-medium p-2 bg-gray-700 rounded-lg min-h-11 flex items-center">
                                {userSurveys[selectedUser.id].sex || "N/A"}
                              </div>
                            </div>
                            <div className="space-y-1">
                              <p className="text-sm text-gray-400">Birthday</p>
                              <div className="text-white font-medium p-2 bg-gray-700 rounded-lg min-h-11 flex items-center">
                                {userSurveys[selectedUser.id].birthday || "N/A"}
                              </div>
                            </div>
                            <div className="space-y-1">
                              <p className="text-sm text-gray-400">Civil Status</p>
                              <div className="text-white font-medium p-2 bg-gray-700 rounded-lg min-h-11 flex items-center">
                                {userSurveys[selectedUser.id].civilStatus || "N/A"}
                              </div>
                            </div>
                            <div className="space-y-1">
                              <p className="text-sm text-gray-400">Gender</p>
                              <div className="text-white font-medium p-2 bg-gray-700 rounded-lg min-h-11 flex items-center">
                                {userSurveys[selectedUser.id].gender || "N/A"}
                              </div>
                            </div>
                            <div className="space-y-1">
                              <p className="text-sm text-gray-400">Youth Age Group</p>
                              <div className="text-white font-medium p-2 bg-gray-700 rounded-lg min-h-11 flex items-center">
                                {userSurveys[selectedUser.id].youthAgeGroup || "N/A"}
                              </div>
                            </div>
                          </div>

                          {/* Contact Information - Full Width */}
                          <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-1">
                              <p className="text-sm text-gray-400">Email Address</p>
                              <div className="text-white p-2 bg-gray-700 rounded-lg min-h-11 flex items-center wrap-break-word">
                                {userSurveys[selectedUser.id].emailAddress || "N/A"}
                              </div>
                            </div>
                            <div className="space-y-1">
                              <p className="text-sm text-gray-400">Contact Number</p>
                              <div className="text-white p-2 bg-gray-700 rounded-lg min-h-11 flex items-center">
                                {userSurveys[selectedUser.id].contactNumber || "N/A"}
                              </div>
                            </div>
                            <div className="space-y-1">
                              <p className="text-sm text-gray-400">Facebook Account</p>
                              <div className="text-white p-2 bg-gray-700 rounded-lg min-h-11 flex items-center wrap-break-word">
                                {userSurveys[selectedUser.id].facebookAccount || "N/A"}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* II. DEMOGRAPHIC CHARACTERISTICS SECTION - Ultra Wide Layout */}
                      <div className="bg-gray-750 rounded-xl p-6">
                        <h3 className="text-xl font-bold text-white mb-4 pb-2 border-b border-gray-600">II. DEMOGRAPHIC CHARACTERISTICS</h3>
                        
                        <div className="space-y-4">
                          {/* First Row - 5 columns */}
                          <div className="grid grid-cols-5 gap-4">
                            <div className="space-y-1">
                              <p className="text-sm text-gray-400">Youth Classification</p>
                              <div className="text-white font-medium p-2 bg-gray-700 rounded-lg min-h-11 flex items-center">
                                {userSurveys[selectedUser.id].youthClassification || "N/A"}
                              </div>
                            </div>
                            <div className="space-y-1">
                              <p className="text-sm text-gray-400">Educational Background</p>
                              <div className="text-white font-medium p-2 bg-gray-700 rounded-lg min-h-11 flex items-center">
                                {userSurveys[selectedUser.id].educationalBackground || "N/A"}
                              </div>
                            </div>
                            <div className="space-y-1">
                              <p className="text-sm text-gray-400">Work Status</p>
                              <div className="text-white font-medium p-2 bg-gray-700 rounded-lg min-h-11 flex items-center">
                                {userSurveys[selectedUser.id].workStatus || "N/A"}
                              </div>
                            </div>
                            <div className="space-y-1">
                              <p className="text-sm text-gray-400">Registered SK Voter?</p>
                              <div className="text-white font-medium p-2 bg-gray-700 rounded-lg min-h-11 flex items-center">
                                {userSurveys[selectedUser.id].registeredSKVoter || "N/A"}
                              </div>
                            </div>
                            <div className="space-y-1">
                              <p className="text-sm text-gray-400">Registered National Voter?</p>
                              <div className="text-white font-medium p-2 bg-gray-700 rounded-lg min-h-11 flex items-center">
                                {userSurveys[selectedUser.id].registeredNationalVoter || "N/A"}
                              </div>
                            </div>
                          </div>

                          {/* Second Row - 4 columns */}
                          <div className="grid grid-cols-4 gap-4">
                            <div className="space-y-1">
                              <p className="text-sm text-gray-400">Attended KK Assembly?</p>
                              <div className="text-white font-medium p-2 bg-gray-700 rounded-lg min-h-11 flex items-center">
                                {userSurveys[selectedUser.id].attendedKKAssembly || "N/A"}
                              </div>
                            </div>
                            
                            {userSurveys[selectedUser.id].attendedKKAssembly === "Yes" && (
                              <div className="space-y-1">
                                <p className="text-sm text-gray-400">Times Attended</p>
                                <div className="text-white font-medium p-2 bg-gray-700 rounded-lg min-h-11 flex items-center">
                                  {userSurveys[selectedUser.id].timesAttendedKKAssembly || "N/A"}
                                </div>
                              </div>
                            )}
                            
                            {userSurveys[selectedUser.id].attendedKKAssembly === "No" && (
                              <div className="space-y-1 col-span-2">
                                <p className="text-sm text-gray-400">Why not attended?</p>
                                <div className="text-white p-2 bg-gray-700 rounded-lg min-h-11 flex items-center">
                                  {userSurveys[selectedUser.id].whyNotAttended || "N/A"}
                                </div>
                              </div>
                            )}
                            
                            <div className="space-y-1">
                              <p className="text-sm text-gray-400">Voted in last election?</p>
                              <div className="text-white font-medium p-2 bg-gray-700 rounded-lg min-h-11 flex items-center">
                                {userSurveys[selectedUser.id].votedLastElection || "N/A"}
                              </div>
                            </div>
                          </div>

                          {/* Third Row - Full width for sports */}
                          <div className="space-y-1">
                            <p className="text-sm text-gray-400">Preferred Sports</p>
                            <div className="text-white p-3 bg-gray-700 rounded-lg min-h-16 flex items-center">
                              {userSurveys[selectedUser.id].preferredSports || "N/A"}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Survey Metadata - Full Width */}
                      <div className="bg-gray-750 rounded-xl p-4">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-8">
                            <div>
                              <p className="text-gray-400 text-sm">Survey Submitted</p>
                              <p className="text-white text-base font-medium">
                                {userSurveys[selectedUser.id].createdAt.toLocaleDateString()}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-400 text-sm">User ID</p>
                              <p className="text-white text-sm font-mono">{selectedUser.id}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="text-gray-400">
                        <ClipboardList className="w-16 h-16 mx-auto mb-4 text-gray-500" />
                        <p className="text-xl font-medium">No Survey Data</p>
                        <p className="text-base mt-2">This user has not submitted any survey yet.</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end p-6 border-t border-gray-700 sticky bottom-0 bg-gray-800">
              <button
                onClick={() => setIsUserDetailOpen(false)}
                className="bg-gray-700 border border-gray-600 hover:bg-gray-600 text-white px-6 py-2 rounded-lg font-medium transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
