import { createContext, startTransition, useContext, useEffect, useState } from 'react'
import { observeAuth, signInAdmin, signOutAdmin } from '../lib/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = observeAuth((nextUser) => {
      startTransition(() => {
        setUser(nextUser)
        setLoading(false)
      })
    })

    return unsubscribe
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login: signInAdmin,
        logout: signOutAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider')
  }

  return context
}
