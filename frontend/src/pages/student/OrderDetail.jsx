import { useEffect, useState } from "react"
import { useParams, Link, useNavigate } from "react-router-dom"
import { ArrowLeft, Check, Store, Phone, MapPin } from "lucide-react"
import { getOrderById, cancelOrder } from "../../api/order.api"
import TopNav from "../../components/shared/TopNav"
import OrderStatusBadge from "../../components/shared/OrderStatusBadge"
import { Button } from "../../components/ui/button"

// Linear progress steps for the "happy path" lifecycle.
// REJECTED/CANCELLED are shown separately since they break out of this line.
const PROGRESS_STEPS = [
  { key: "PENDING", label: "Placed" },
  { key: "ACCEPTED", label: "In Progress" },
  { key: "READY", label: "Ready" },
  { key: "COMPLETED", label: "Picked Up" },
]

const ProgressTracker = ({ status }) => {
  if (status === "REJECTED" || status === "CANCELLED") {
    return (
      <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 text-center">
        <p className="text-destructive font-medium">
          {status === "REJECTED" ? "Order was rejected" : "Order was cancelled"}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          A full refund has been initiated.
        </p>
      </div>
    )
  }

  const currentIndex = PROGRESS_STEPS.findIndex((s) => s.key === status)

  return (
    <div className="flex items-center">
      {PROGRESS_STEPS.map((step, idx) => {
        const isComplete = idx < currentIndex
        const isCurrent = idx === currentIndex

        return (
          <div key={step.key} className="flex items-center flex-1 last:flex-initial">
            <div className="flex flex-col items-center">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium border-2 ${
                  isComplete
                    ? "bg-primary border-primary text-primary-foreground"
                    : isCurrent
                    ? "border-primary text-primary"
                    : "border-border text-muted-foreground"
                }`}
              >
                {isComplete ? <Check className="w-3.5 h-3.5" /> : idx + 1}
              </div>
              <span
                className={`text-xs mt-1 whitespace-nowrap ${
                  isCurrent ? "text-foreground font-medium" : "text-muted-foreground"
                }`}
              >
                {step.label}
              </span>
            </div>
            {idx < PROGRESS_STEPS.length - 1 && (
              <div
                className={`h-0.5 flex-1 mx-1 ${idx < currentIndex ? "bg-primary" : "bg-border"}`}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

const OrderDetail = () => {
  const { orderId } = useParams()
  const navigate = useNavigate()

  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const [cancelling, setCancelling] = useState(false)
  const [cancelError, setCancelError] = useState("")

  useEffect(() => {
    const fetchOrder = async (isBackgroundRefresh = false) => {
      try {
        const response = await getOrderById(orderId)
        setOrder(response.data.order)
      } catch (err) {
        if (!isBackgroundRefresh) {
          setError(err.response?.data?.message || "Couldn't load this order.")
        }
      } finally {
        if (!isBackgroundRefresh) setLoading(false)
      }
    }

    fetchOrder()

    // Poll only while the order can still change — no point polling
    // forever once it's hit a terminal status.
    const interval = setInterval(() => {
      setOrder((current) => {
        if (current && !["PENDING", "ACCEPTED", "READY"].includes(current.status)) {
          clearInterval(interval)
        }
        return current
      })
      fetchOrder(true)
    }, 10000)

    return () => clearInterval(interval)
  }, [orderId])

  const handleCancel = async () => {
    if (!window.confirm("Cancel this order? You'll receive a full refund.")) return

    setCancelling(true)
    setCancelError("")

    try {
      await cancelOrder(orderId)
      // Re-fetch rather than locally mutate, so the displayed status always
      // reflects what the backend actually committed.
      const response = await getOrderById(orderId)
      setOrder(response.data.order)
    } catch (err) {
      setCancelError(err.response?.data?.message || "Couldn't cancel this order.")
    } finally {
      setCancelling(false)
    }
  }

  if (loading) {
    return (
      <>
        <TopNav />
        <div className="max-w-2xl mx-auto p-4 sm:p-6 space-y-3">
          <div className="h-24 bg-secondary rounded-xl animate-pulse" />
          <div className="h-32 bg-secondary rounded-xl animate-pulse" />
        </div>
      </>
    )
  }

  if (error || !order) {
    return (
      <>
        <TopNav />
        <div className="max-w-2xl mx-auto p-4 sm:p-6">
          <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg border border-destructive/20">
            {error || "This order couldn't be found."}
          </div>
          <Link to="/student/dashboard" className="inline-block mt-4">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </>
    )
  }

  return (
    <>
      <TopNav />
      <div className="max-w-2xl mx-auto p-4 sm:p-6">
        <Link
          to="/student/dashboard"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>

        <div className="flex items-start justify-between gap-3 mb-6">
          <div>
            <h1 className="font-heading text-2xl font-bold text-foreground">
              Order #{order.orderNumber}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">{order.shopId?.name}</p>
          </div>
          <OrderStatusBadge status={order.status} />
        </div>

        <div className="bg-card border border-border rounded-xl p-4 mb-6">
          <ProgressTracker status={order.status} />
        </div>

        {order.status === "READY" && (
          <div className="bg-success/10 border border-success/30 rounded-xl p-4 mb-6 text-center">
            <p className="text-success font-semibold">Your order is ready!</p>
            <p className="text-sm text-muted-foreground mt-1">
              Head to the shop to pick it up.
            </p>
          </div>
        )}

        {order.status === "REJECTED" && order.rejectionReason && (
          <div className="bg-card border border-border rounded-xl p-4 mb-6">
            <p className="text-sm font-medium text-foreground mb-1">Reason</p>
            <p className="text-sm text-muted-foreground">{order.rejectionReason}</p>
            {order.rejectionNote && (
              <p className="text-sm text-muted-foreground mt-1">{order.rejectionNote}</p>
            )}
          </div>
        )}

        <div className="bg-card border border-border rounded-xl p-4 mb-4 space-y-3">
          <h2 className="font-heading font-semibold text-foreground text-sm">Print Jobs</h2>
          {order.printJobs.map((job, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between text-sm border-b border-border pb-2 last:border-0 last:pb-0"
            >
              <div>
                <p className="text-foreground">{job.originalFileName}</p>
                <p className="text-xs text-muted-foreground">
                  {job.printOptions.color ? "Color" : "B&W"} ·{" "}
                  {job.printOptions.doubleSided ? "Double-sided" : "Single-sided"} ·{" "}
                  {job.printOptions.copies}{" "}
                  {job.printOptions.copies > 1 ? "copies" : "copy"}
                  {job.notes && ` · "${job.notes}"`}
                </p>
              </div>
            </div>
          ))}
        </div>

        {order.stationeryItems?.length > 0 && (
          <div className="bg-card border border-border rounded-xl p-4 mb-4 space-y-2">
            <h2 className="font-heading font-semibold text-foreground text-sm mb-1">
              Stationery
            </h2>
            {order.stationeryItems.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {item.itemName} × {item.quantity}
                </span>
                <span className="text-foreground">
                  ₹{item.priceAtOrderTime * item.quantity}
                </span>
              </div>
            ))}
          </div>
        )}

        <div className="bg-card border border-border rounded-xl p-4 mb-6 flex justify-between items-center">
          <span className="text-sm font-medium text-muted-foreground">Total Paid</span>
          <span className="text-lg font-semibold text-foreground">₹{order.totalAmount}</span>
        </div>

        {order.shopId && (
          <div className="bg-card border border-border rounded-xl p-4 mb-6 space-y-2">
            <h2 className="flex items-center gap-2 font-heading font-semibold text-foreground text-sm mb-1">
              <Store className="w-4 h-4" />
              {order.shopId.name}
            </h2>
            {order.shopId.address && (
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="w-3.5 h-3.5" />
                {order.shopId.address}
              </p>
            )}
            {order.shopId.phone && (
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="w-3.5 h-3.5" />
                {order.shopId.phone}
              </p>
            )}
          </div>
        )}

        {cancelError && (
          <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg mb-4 border border-destructive/20">
            {cancelError}
          </div>
        )}

        {order.status === "PENDING" && (
          <Button
            variant="outline"
            className="w-full text-destructive hover:bg-destructive/10"
            onClick={handleCancel}
            disabled={cancelling}
          >
            {cancelling ? "Cancelling..." : "Cancel Order"}
          </Button>
        )}
      </div>
    </>
  )
}

export default OrderDetail