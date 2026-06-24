import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { PackagePlus, Printer } from "lucide-react"
import { getMyOrders } from "../../api/order.api"
import { Button } from "../../components/ui/button"
import OrderStatusBadge from "../../components/shared/OrderStatusBadge"
import TopNav from "../../components/shared/TopNav"

const ACTIVE_STATUSES = ["PENDING", "ACCEPTED", "READY"]

const formatDate = (isoString) =>
  new Date(isoString).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  })

const OrderCard = ({ order }) => (
  <Link
    to={`/student/orders/${order._id}`}
    className="block bg-card border border-border rounded-xl p-4 hover:border-primary/40 transition-colors"
  >
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="font-heading font-semibold text-foreground">
          #{order.orderNumber}
        </p>
        <p className="text-sm text-muted-foreground">{order.shopId?.name}</p>
      </div>
      <OrderStatusBadge status={order.status} />
    </div>
    <div className="flex items-center justify-between mt-3 text-sm">
      <span className="text-muted-foreground">{formatDate(order.timeline?.placedAt)}</span>
      <span className="font-medium text-foreground">₹{order.totalAmount}</span>
    </div>
  </Link>
)

const StudentDashboard = () => {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await getMyOrders()
        setOrders(response.data.orders)
      } catch (err) {
        setError("Couldn't load your orders right now.")
      } finally {
        setLoading(false)
      }
    }
    fetchOrders()
  }, [])

  const activeOrders = orders.filter((o) => ACTIVE_STATUSES.includes(o.status))
  const recentOrders = orders.filter((o) => !ACTIVE_STATUSES.includes(o.status)).slice(0, 5)

  return (
    <>
    <TopNav />
    <div className="max-w-2xl mx-auto p-4 sm:p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">
            Your Orders
          </h1>
          <p className="text-sm text-muted-foreground">
            Skip the queue, track it here instead.
          </p>
        </div>
        <Link to="/student/shops">
          <Button>
            <PackagePlus className="w-4 h-4 mr-2" />
            New Order
          </Button>
        </Link>
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
      ) : orders.length === 0 ? (
        <div className="text-center py-16 bg-card border border-dashed border-border rounded-xl">
          <Printer className="w-10 h-10 text-muted-foreground mx-auto" />
          <p className="text-foreground font-medium mt-3">No orders yet</p>
          <p className="text-sm text-muted-foreground mt-1 mb-4">
            Place your first print order in under a minute.
          </p>
          <Link to="/student/shops">
            <Button>Find a Print Shop</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {activeOrders.length > 0 && (
            <section>
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-2">
                Active
              </h2>
              <div className="space-y-2">
                {activeOrders.map((order) => (
                  <OrderCard key={order._id} order={order} />
                ))}
              </div>
            </section>
          )}

          {recentOrders.length > 0 && (
            <section>
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-2">
                Recent
              </h2>
              <div className="space-y-2">
                {recentOrders.map((order) => (
                  <OrderCard key={order._id} order={order} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
    </>
  )
}

export default StudentDashboard