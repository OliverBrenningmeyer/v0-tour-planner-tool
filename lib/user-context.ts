"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

export interface UserData {
  userId: string
  userorgId: string
  email: string
  roles: string[]
}

interface UserContextType {
  userData: UserData | null
  isLoading: boolean
  isManualEntry: boolean
  setUserDataManually: (data: UserData) => void
}

const defaultUserData: UserData = {
  userId: "user123",
  userorgId: "org456",
  email: "user@bexapp.de",
  roles: ["admin", "user"],
}

const UserContext = createContext<UserContextType>({
  userData: null,
  isLoading: true,
  isManualEntry: false,
  setUserDataManually: () => {},
})

export const useUser = () => useContext(UserContext)

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [userData, setUserData] = useState<UserData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isManualEntry, setIsManualEntry] = useState(false)
  const [messageReceived, setMessageReceived] = useState(false)

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // In production, validate the origin
      // if (event.origin !== "https://angular.bexapp.de") return;

      // For development, we might want to accept all origins
      const receivedData = event.data

      // Validate the received data has the expected structure
      if (receivedData && typeof receivedData === "object" && "userId" in receivedData && "userorgId" in receivedData) {
        console.log("Received user data:", receivedData)
        setUserData(receivedData as UserData)
        setIsLoading(false)
        setMessageReceived(true)
      }
    }

    window.addEventListener("message", handleMessage)

    // For development/testing: if no message is received after 3 seconds, mark as ready for manual entry
    const timer = setTimeout(() => {
      if (isLoading && !messageReceived) {
        console.log("No message received, ready for manual entry")
        setIsLoading(false)
      }
    }, 3000)

    return () => {
      window.removeEventListener("message", handleMessage)
      clearTimeout(timer)
    }
  }, [isLoading, messageReceived])

  const setUserDataManually = (data: UserData) => {
    setUserData(data)
    setIsManualEntry(true)

    // Store in sessionStorage for persistence during the session
    try {
      sessionStorage.setItem("bexapp_user_data", JSON.stringify(data))
    } catch (error) {
      console.error("Failed to store user data in sessionStorage:", error)
    }
  }

  // Check sessionStorage on initial load
  useEffect(() => {
    try {
      const storedData = sessionStorage.getItem("bexapp_user_data")
      if (storedData && !userData) {
        const parsedData = JSON.parse(storedData) as UserData
        setUserData(parsedData)
        setIsManualEntry(true)
        setIsLoading(false)
      }
    } catch (error) {
      console.error("Failed to retrieve user data from sessionStorage:", error)
    }
  }, [userData])

  return (
    <UserContext.Provider value={{ userData, isLoading, isManualEntry, setUserDataManually }}>
      {children}
    </UserContext.Provider>
  )
}
