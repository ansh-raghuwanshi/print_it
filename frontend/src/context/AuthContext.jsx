import { createContext, useContext, useState, useEffect } from "react"
import { getMe } from "../api/auth.api"

const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [accessToken, setAccessToken] = useState(localStorage.getItem("accessToken"))
  const [loading, setLoading] = useState(true)
  const [shop, setShop] = useState(null)

  // on app load, check if token exists and restore user
  useEffect(() => {
    const restoreUser = async () => {
      const token = localStorage.getItem("accessToken")

      if (!token) {
        setLoading(false)
        return
      }

      try {
        const response = await getMe()
        setUser(response.data.user)
        setShop(response.data.shop)
        setAccessToken(token)
      } catch (error) {
        // token invalid or expired
        localStorage.removeItem("accessToken")
        setUser(null)
        setAccessToken(null)
      } finally {
        setLoading(false)
      }
    }

    restoreUser()
  }, [])

  const login = (userData, token, shopData = null) => {
  setUser(userData)
  setAccessToken(token)
  setShop(shopData)
  localStorage.setItem("accessToken", token)
}

  const logout = () => {
    setUser(null)
    setAccessToken(null)
    setShop(null)
    localStorage.removeItem("accessToken")
  }

  return (
    <AuthContext.Provider value={{ user, accessToken, shop, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  return useContext(AuthContext)
}