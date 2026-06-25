import { useEffect, useState } from "react"
import { useParams, Link, useNavigate } from "react-router-dom"
import { ArrowLeft, User, Phone, Check, X, Printer, PackageCheck } from "lucide-react"
import { getOrderById, acceptOrder, rejectOrder, markReady, markCompleted } from "../../api/order.api"
import TopNav from "../../components/shared/TopNav"
import OrderStatusBadge from "../../components/shared/OrderStatusBadge"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Label } from "../../components/ui/label"

const REJECTION_REASONS = [
  "Shop is too busy right now",
  "Out of stationery stock",
  "File could not be opened",
  "Closing soon / closed",
  "Other",
]

const OrderContents = ({ order }) => (
  <>
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
              {job.printOptions.copies} {job.printOptions.copies > 1 ? "copies" : "copy"}
              {job.notes && ` · "${job.notes}"`}
            </p>
          </div>
        </div>
      ))}
    </div>

    {order.stationeryItems?.length > 0 && (
      <div className="bg-card border border-border rounded-xl p-4 mb-4 space-y-2">
        <h2 className="font-heading font-semibold text-foreground text-sm mb-1">
          Stationery to Pack
        </h2>
        {order.stationeryItems.map((item, idx) => (
          <div key={idx} className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{item.itemName}</span>
            <span className="text-foreground font-medium">× {item.quantity}</span>
          </div>
        ))}
      </div>
    )}
  </>
)

const RejectModal = ({ onConfirm, onCancel, submitting }) => {
  const [reason, setReason] = useState(REJECTION_REASONS[0])
  const [note, setNote] = useState("")

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <div className="bg-card border border-border rounded-xl p-5 w-full max-w-sm">
        <h2 className="font-heading font-semibold text-foreground mb-4">Reject Order</h2>

        <Label htmlFor="reason">Reason</Label>
        <select
          id="reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="mt-1 mb-3 w-full border border-input rounded-lg px-3 py-2 text-sm bg-card text-foreground"
        >
          {REJECTION_REASONS.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>

        <Label htmlFor="note">Note (optional)</Label>
        <Input
          id="note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Anything else the student should know"
          className="mt-1 mb-4"
        />

        <p className="text-xs text-muted-foreground mb-4">
          The student will be fully refunded automatically.
        </p>

        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={onCancel} disabled={submitting}>
            Cancel
          </Button>
          <Button
            className="flex-1 bg-destructive hover:bg-destructive/90"
            onClick={() => onConfirm(reason, note)}
            disabled={submitting}
          >
            {submitting ? "Rejecting..." : "Confirm Reject"}
          </Button>
        </div>
      </div>
    </div>
  )
}

const ShopOrderDetail = () => {
  const { orderId } = useParams()
  const navigate = useNavigate()

  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const [accepting, setAccepting] = useState(false)
  const [actionError, setActionError] = useState("")
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejecting, setRejecting] = useState(false)

  const [printFiles, setPrintFiles] = useState([])
  const [printedFileNames, setPrintedFileNames] = useState(new Set())
  const [markingReady, setMarkingReady] = useState(false)

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const response = await getOrderById(orderId)
        setOrder(response.data.order)
      } catch (err) {
        setError(err.response?.data?.message || "Couldn't load this order.")
      } finally {
        setLoading(false)
      }
    }
    fetchOrder()
  }, [orderId])

  const handleAccept = async () => {
    setAccepting(true)
    setActionError("")

    try {
      const response = await acceptOrder(orderId)
      setOrder(response.data.order)
      setPrintFiles(response.data.printFiles || [])
    } catch (err) {
      setActionError(err.response?.data?.message || "Couldn't accept this order.")
    } finally {
      setAccepting(false)
    }
  }

  const handlePrintFile = (file) => {
    // Open the merged PDF (separator page + student's file) in a new tab.
    // The browser's own PDF viewer renders it; the shopkeeper triggers
    // print from there, setting copies manually in the native dialog.
    window.open(file.mergedFileUrl, "_blank")
    setPrintedFileNames((prev) => new Set(prev).add(file.fileName))
  }

  const handleMarkReady = async () => {
    setMarkingReady(true)
    setActionError("")

    try {
      await markReady(orderId)
      const response = await getOrderById(orderId)
      setOrder(response.data.order)
    } catch (err) {
      setActionError(err.response?.data?.message || "Couldn't mark this order ready.")
    } finally {
      setMarkingReady(false)
    }
  }

  const [markingComplete, setMarkingComplete] = useState(false)

  const handleMarkCompleted = async () => {
    setMarkingComplete(true)
    setActionError("")

    try {
      await markCompleted(orderId)
      const response = await getOrderById(orderId)
      setOrder(response.data.order)
    } catch (err) {
      setActionError(err.response?.data?.message || "Couldn't complete this order.")
    } finally {
      setMarkingComplete(false)
    }
  }

  const handleReject = async (reason, note) => {
    setRejecting(true)
    setActionError("")

    try {
      await rejectOrder(orderId, { rejectionReason: reason, rejectionNote: note })
      const response = await getOrderById(orderId)
      setOrder(response.data.order)
      setShowRejectModal(false)
    } catch (err) {
      setActionError(err.response?.data?.message || "Couldn't reject this order.")
    } finally {
      setRejecting(false)
    }
  }

  if (loading) {
    return (
      <>
        <TopNav 
                links={[
            { label: "Orders", to: "/shopkeeper/dashboard" },
            { label: "Inventory", to: "/shopkeeper/inventory" },
            { label: "Settings", to: "/shopkeeper/settings" },
          ]}
        />
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
        <TopNav 
                links={[
            { label: "Orders", to: "/shopkeeper/dashboard" },
            { label: "Inventory", to: "/shopkeeper/inventory" },
            { label: "Settings", to: "/shopkeeper/settings" },
          ]}
        />
        <div className="max-w-2xl mx-auto p-4 sm:p-6">
          <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg border border-destructive/20">
            {error || "This order couldn't be found."}
          </div>
          <Link to="/shopkeeper/dashboard" className="inline-block mt-4">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Orders
            </Button>
          </Link>
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
      <div className="max-w-2xl mx-auto p-4 sm:p-6">
        <Link
          to="/shopkeeper/dashboard"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Orders
        </Link>

        <div className="flex items-start justify-between gap-3 mb-2">
          <h1 className="font-heading text-2xl font-bold text-foreground">
            Order #{order.orderNumber}
          </h1>
          <OrderStatusBadge status={order.status} />
        </div>

        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-6">
          <span className="flex items-center gap-1">
            <User className="w-3.5 h-3.5" />
            {order.studentId?.name}
          </span>
          <span className="flex items-center gap-1">
            <Phone className="w-3.5 h-3.5" />
            {order.studentId?.phone}
          </span>
        </div>

        <OrderContents order={order} />

        <div className="bg-card border border-border rounded-xl p-4 mb-6 flex justify-between items-center">
          <span className="text-sm font-medium text-muted-foreground">Total</span>
          <span className="text-lg font-semibold text-foreground">₹{order.totalAmount}</span>
        </div>

        {actionError && (
          <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg mb-4 border border-destructive/20">
            {actionError}
          </div>
        )}

        {order.status === "PENDING" && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1 text-destructive hover:bg-destructive/10"
              onClick={() => setShowRejectModal(true)}
              disabled={accepting}
            >
              <X className="w-4 h-4 mr-2" />
              Reject
            </Button>
            <Button className="flex-1" onClick={handleAccept} disabled={accepting}>
              <Check className="w-4 h-4 mr-2" />
              {accepting ? "Accepting..." : "Accept"}
            </Button>
          </div>
        )}

        {order.status === "ACCEPTED" && (
          <div className="space-y-4">
            <div className="bg-card border border-border rounded-xl p-4 space-y-2">
              <h2 className="flex items-center gap-2 font-heading font-semibold text-foreground text-sm mb-1">
                <Printer className="w-4 h-4" />
                Print Files
              </h2>
              {(printFiles.length > 0
                ? printFiles
                : order.printJobs.map((j) => ({
                    fileName: j.originalFileName,
                    mergedFileUrl: j.mergedFileUrl,
                    copies: j.printOptions.copies,
                  }))
              ).map((file, idx) => {
                const isPrinted = printedFileNames.has(file.fileName)
                return (
                  <div
                    key={idx}
                    className="flex items-center justify-between gap-3 text-sm border-b border-border pb-2 last:border-0 last:pb-0"
                  >
                    <div>
                      <p className="text-foreground">{file.fileName}</p>
                      <p className="text-xs text-muted-foreground">
                        Set {file.copies} {file.copies > 1 ? "copies" : "copy"} in the
                        print dialog
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant={isPrinted ? "outline" : "default"}
                      onClick={() => handlePrintFile(file)}
                    >
                      {isPrinted ? <Check className="w-3.5 h-3.5 mr-1" /> : null}
                      {isPrinted ? "Printed" : "Print"}
                    </Button>
                  </div>
                )
              })}
            </div>

            {order.stationeryItems?.length > 0 && (
              <div className="bg-card border border-border rounded-xl p-4 space-y-2">
                <h2 className="font-heading font-semibold text-foreground text-sm mb-1">
                  Stationery to Pack
                </h2>
                {order.stationeryItems.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{item.itemName}</span>
                    <span className="text-foreground font-medium">× {item.quantity}</span>
                  </div>
                ))}
              </div>
            )}

            <Button className="w-full" onClick={handleMarkReady} disabled={markingReady}>
              <PackageCheck className="w-4 h-4 mr-2" />
              {markingReady ? "Marking Ready..." : "Done — Mark Ready"}
            </Button>
          </div>
        )}

        {order.status === "READY" && (
          <div className="space-y-4">
            <div className="bg-success/10 border border-success/30 rounded-xl p-4 text-center">
              <p className="text-success font-semibold">Waiting for pickup</p>
              <p className="text-sm text-muted-foreground mt-1">
                The student has been notified that this order is ready.
              </p>
            </div>

            <Button className="w-full" onClick={handleMarkCompleted} disabled={markingComplete}>
              <Check className="w-4 h-4 mr-2" />
              {markingComplete ? "Completing..." : "Student Picked Up — Mark Complete"}
            </Button>
          </div>
        )}
      </div>

      {showRejectModal && (
        <RejectModal
          onConfirm={handleReject}
          onCancel={() => setShowRejectModal(false)}
          submitting={rejecting}
        />
      )}
    </>
  )
}

export default ShopOrderDetail