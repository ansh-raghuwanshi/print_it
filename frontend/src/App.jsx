import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { AuthProvider } from "./context/AuthContext"
import ProtectedRoute from "./components/shared/ProtectedRoute"
import VerifyEmail from "./pages/public/VerifyEmail.jsx"
import VerifyPending from "./pages/public/VerifyPending.jsx"

import Login from "./pages/public/Login.jsx"
import RegisterStudent from "./pages/public/RegisterStudent.jsx"
import RegisterShopkeeper from "./pages/public/RegisterShopkeeper.jsx"

import Landing from "./pages/public/Landing.jsx"
import StudentDashboard from "./pages/student/Dashboard.jsx"
import ShopkeeperDashboard from "./pages/shopkeeper/Dashboard.jsx"
import AdminDashboard from "./pages/admin/Dashboard.jsx"
import ShopBrowsing from "./pages/student/ShopBrowsing.jsx"
import ShopDetail from "./pages/student/ShopDetail.jsx"
import PlaceOrder from "./pages/student/PlaceOrder.jsx"
import OrderDetail from "./pages/student/OrderDetail.jsx"
import ShopOrderDetail from "./pages/shopkeeper/OrderDetail.jsx"
import Inventory from "./pages/shopkeeper/Inventory.jsx"
import Settings from "./pages/shopkeeper/Settings.jsx"

const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register/student" element={<RegisterStudent />} />
          <Route path="/register/shopkeeper" element={<RegisterShopkeeper />} />
          <Route path="/verify-email/:token" element={<VerifyEmail />} />
          <Route path="/verify-pending" element={<VerifyPending />} />

          <Route
            path="/student/dashboard"
            element={
              <ProtectedRoute allowedRoles={["student"]}>
                <StudentDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/shopkeeper/dashboard"
            element={
              <ProtectedRoute allowedRoles={["shopkeeper"]}>
                <ShopkeeperDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/student/shops"
            element={
              <ProtectedRoute allowedRoles={["student"]}>
                <ShopBrowsing />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/shops/:shopId"
            element={
              <ProtectedRoute allowedRoles={["student"]}>
                <ShopDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/shops/:shopId/order"
            element={
              <ProtectedRoute allowedRoles={["student"]}>
                <PlaceOrder />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/orders/:orderId"
            element={
              <ProtectedRoute allowedRoles={["student"]}>
                <OrderDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/shopkeeper/orders/:orderId"
            element={
              <ProtectedRoute allowedRoles={["shopkeeper"]}>
                <ShopOrderDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/shopkeeper/inventory"
            element={
              <ProtectedRoute allowedRoles={["shopkeeper"]}>
                <Inventory />
              </ProtectedRoute>
            }
          />

          <Route
            path="/shopkeeper/settings"
            element={
              <ProtectedRoute allowedRoles={["shopkeeper"]}>
                <Settings />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App