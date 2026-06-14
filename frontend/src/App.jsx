import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import Login from "./pages/public/Login.jsx"
import RegisterStudent from "./pages/public/RegisterStudent.jsx"
import RegisterShopkeeper from "./pages/public/RegisterShopkeeper.jsx"
import VerifyEmail from "./pages/public/VerifyEmail.jsx"
import Landing from "./pages/public/Landing.jsx"

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register/student" element={<RegisterStudent />} />
        <Route path="/register/shopkeeper" element={<RegisterShopkeeper />} />
        <Route path="/verify-email/:token" element={<VerifyEmail />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App