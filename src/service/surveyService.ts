import { collection, addDoc, Timestamp } from "firebase/firestore"
import { db } from "./firebaseConfig"

export interface SurveyData {
  // Profile Section
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

  // Demographic Characteristics
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

export const SurveyService = {
  async saveSurvey(userId: string, surveyData: SurveyData) {
    try {
      const surveysCollection = collection(db, "surveys")
      const docRef = await addDoc(surveysCollection, {
        userId,
        ...surveyData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      })
      return { success: true, surveyId: docRef.id }
    } catch (error: any) {
      console.error("Error saving survey:", error)
      return { success: false, error: error.message }
    }
  },
}
