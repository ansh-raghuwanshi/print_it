import { useEffect, useState, useCallback, useRef } from "react"
import { Link } from "react-router-dom"
import { RefreshCw, Package, Clock, XCircle } from "lucide-react"
import { useAuth } from "../../context/AuthContext"
import { getShopOrders } from "../../api/order.api"
import TopNav from "../../components/shared/TopNav"
import OrderStatusBadge from "../../components/shared/OrderStatusBadge"

const POLL_INTERVAL_MS = 15000

const TABS = [
  { key: "new", label: "New", statuses: ["PENDING"] },
  { key: "active", label: "In Progress", statuses: ["ACCEPTED", "READY"] },
  { key: "history", label: "History", statuses: ["COMPLETED", "REJECTED", "CANCELLED"] },
]

const formatDate = (isoString) =>
  new Date(isoString).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  })

const ShopOrderCard = ({ order }) => (
  <Link
    to={`/shopkeeper/orders/${order._id}`}
    className="block bg-card border border-border rounded-xl p-4 hover:border-primary/40 transition-colors"
  >
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="font-heading font-semibold text-foreground">
          #{order.orderNumber}
        </p>
        <p className="text-sm text-muted-foreground">{order.studentId?.name}</p>
      </div>
      <OrderStatusBadge status={order.status} />
    </div>
    <div className="flex items-center justify-between mt-3 text-sm">
      <span className="text-muted-foreground">{formatDate(order.timeline?.placedAt)}</span>
      <span className="font-medium text-foreground">₹{order.totalAmount}</span>
    </div>
  </Link>
)

const ShopOrdersPanel = () => {
  const [activeTab, setActiveTab] = useState("new")
  const [ordersByTab, setOrdersByTab] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const isFirstLoad = useRef(true)

  const fetchAllTabs = useCallback(async () => {
    try {
      const results = await Promise.all(
        TABS.map((tab) => getShopOrders().then((res) => [tab.key, res.data.orders]))
      )
      setOrdersByTab(Object.fromEntries(results))
      setError("")
    } catch (err) {
      setError("Couldn't load orders right now.")
    } finally {
      if (isFirstLoad.current) {
        setLoading(false)
        isFirstLoad.current = false
      }
    }
  }, [])

  useEffect(() => {
    fetchAllTabs()
    const interval = setInterval(fetchAllTabs, POLL_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [fetchAllTabs])

  const currentTabConfig = TABS.find((t) => t.key === activeTab)
  const allOrders = ordersByTab[activeTab] || []
  const visibleOrders = allOrders.filter((o) => currentTabConfig.statuses.includes(o.status))

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="font-heading text-2xl font-bold text-foreground">Orders</h1>
        <button
          onClick={fetchAllTabs}
          className="text-muted-foreground hover:text-foreground"
          aria-label="Refresh orders"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="flex gap-2 bg-secondary rounded-lg p-1 mb-6">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 text-sm py-1.5 rounded-md font-medium transition-colors ${
              activeTab === tab.key
                ? "bg-card shadow text-foreground"
                : "text-muted-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg mb-4 border border-destructive/20">
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-20 bg-secondary rounded-xl animate-pulse" />
          ))}
        </div>
      ) : visibleOrders.length === 0 ? (
        <div className="text-center py-16 bg-card border border-dashed border-border rounded-xl">
          <Package className="w-10 h-10 text-muted-foreground mx-auto" />
          <p className="text-foreground font-medium mt-3">No orders here</p>
          <p className="text-sm text-muted-foreground mt-1">
            {activeTab === "new"
              ? "New orders will show up here automatically."
              : "Nothing in this category right now."}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {visibleOrders.map((order) => (
            <ShopOrderCard key={order._id} order={order} />
          ))}
        </div>
      )}
    </div>
  )
}

const ShopkeeperDashboard = () => {
  const { shop } = useAuth()

  if (shop?.status === "PENDING") {
    return (
      <>
        <TopNav 
                links={[
            { label: "Orders", to: "/shopkeeper/dashboard" },
            { label: "Inventory", to: "/shopkeeper/inventory" },
            { label: "Settings", to: "/shopkeeper/settings" },
          ]}
        />
        <div className="flex items-center justify-center p-4 mt-12">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 bg-accent/15 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="w-7 h-7 text-accent" />
            </div>
            <h1 className="font-heading text-xl font-bold text-foreground">
              Your shop is under review
            </h1>
            <p className="text-muted-foreground mt-2">
              We're reviewing your shop details. You'll be notified by email once
              approved. This usually takes 24 hours.
            </p>
          </div>
        </div>
      </>
    )
  }

  if (shop?.status === "REJECTED") {
    return (
      <>
        <TopNav 
                links={[
            { label: "Orders", to: "/shopkeeper/dashboard" },
            { label: "Inventory", to: "/shopkeeper/inventory" },
            { label: "Settings", to: "/shopkeeper/settings" },
          ]}
        />
        <div className="flex items-center justify-center p-4 mt-12">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 bg-destructive/15 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-7 h-7 text-destructive" />
            </div>
            <h1 className="font-heading text-xl font-bold text-destructive">
              Application Rejected
            </h1>
            <p className="text-muted-foreground mt-2">{shop?.rejectionReason}</p>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <TopNav 
                links={[
            { label: "Orders", to: "/shopkeeper/dashboard" },
            { label: "Inventory", to: "/shopkeeper/inventory" },
            { label: "Settings", to: "/shopkeeper/settings" },
          ]}
        />
      <ShopOrdersPanel />
    </>
  )
}

export default ShopkeeperDashboard