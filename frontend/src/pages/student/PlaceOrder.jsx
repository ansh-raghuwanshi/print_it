import { useState, useRef, useEffect } from "react"
import { useParams, Link, useNavigate } from "react-router-dom"
import { ArrowLeft, Upload, X, FileText, Minus, Plus, Loader2 } from "lucide-react"
import { getShopItems } from "../../api/stationery.api"
import { calculateOrder, initiatePayment, confirmOrder } from "../../api/order.api"
import TopNav from "../../components/shared/TopNav"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Label } from "../../components/ui/label"

const MAX_FILES = 5

let nextId = 0
const makeId = () => `job_${nextId++}`

const createPrintJob = (file) => ({
  id: makeId(),
  file,
  color: false,
  doubleSided: false,
  copies: 1,
  notes: "",
})

const PrintJobRow = ({ job, onChange, onRemove }) => {
  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
          <span className="text-sm font-medium text-foreground truncate">
            {job.file.name}
          </span>
        </div>
        <button
          type="button"
          onClick={() => onRemove(job.id)}
          className="text-muted-foreground hover:text-destructive shrink-0"
          aria-label={`Remove ${job.file.name}`}
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
          <input
            type="checkbox"
            checked={job.color}
            onChange={(e) => onChange(job.id, { color: e.target.checked })}
            className="accent-primary"
          />
          Color
        </label>

        <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
          <input
            type="checkbox"
            checked={job.doubleSided}
            onChange={(e) => onChange(job.id, { doubleSided: e.target.checked })}
            className="accent-primary"
          />
          Double-sided
        </label>
      </div>

      <div>
        <Label htmlFor={`copies-${job.id}`} className="text-xs">
          Copies
        </Label>
        <Input
          id={`copies-${job.id}`}
          type="number"
          min={1}
          max={20}
          value={job.copies}
          onChange={(e) =>
            onChange(job.id, { copies: Math.max(1, parseInt(e.target.value) || 1) })
          }
          className="mt-1 w-24"
        />
      </div>

      <div>
        <Label htmlFor={`notes-${job.id}`} className="text-xs">
          Notes for the shop (optional)
        </Label>
        <Input
          id={`notes-${job.id}`}
          value={job.notes}
          onChange={(e) => onChange(job.id, { notes: e.target.value })}
          placeholder="e.g. staple, spiral bind"
          className="mt-1"
        />
      </div>
    </div>
  )
}

const StationeryRow = ({ item, quantity, onQuantityChange }) => {
  const increment = () => {
    if (quantity < item.visibleStock) onQuantityChange(item._id, quantity + 1)
  }
  const decrement = () => {
    if (quantity > 0) onQuantityChange(item._id, quantity - 1)
  }

  return (
    <div className="flex items-center justify-between bg-card border border-border rounded-lg p-3">
      <div>
        <p className="text-sm font-medium text-foreground">{item.name}</p>
        <p className="text-xs text-muted-foreground">
          ₹{item.price} · {item.visibleStock} in stock
        </p>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={decrement}
          disabled={quantity === 0}
          className="w-7 h-7 flex items-center justify-center rounded-full border border-border text-foreground disabled:opacity-30"
          aria-label={`Decrease ${item.name} quantity`}
        >
          <Minus className="w-3 h-3" />
        </button>
        <span className="w-6 text-center text-sm font-medium text-foreground">
          {quantity}
        </span>
        <button
          type="button"
          onClick={increment}
          disabled={quantity >= item.visibleStock}
          className="w-7 h-7 flex items-center justify-center rounded-full border border-border text-foreground disabled:opacity-30"
          aria-label={`Increase ${item.name} quantity`}
        >
          <Plus className="w-3 h-3" />
        </button>
      </div>
    </div>
  )
}

const PlaceOrder = () => {
  const { shopId } = useParams()
  const navigate = useNavigate()

  const [step, setStep] = useState("files") // files | stationery | review

  const [printJobs, setPrintJobs] = useState([])
  const [fileError, setFileError] = useState("")
  const fileInputRef = useRef(null)

  const [stationeryItems, setStationeryItems] = useState([])
  const [stationeryLoading, setStationeryLoading] = useState(true)
  const [stationeryError, setStationeryError] = useState("")
  const [quantities, setQuantities] = useState({}) // { itemId: quantity }

  // Fetch shop's stationery once, on mount — needed before the
  // stationery step renders, so we fetch early rather than on step change.
  useEffect(() => {
    const fetchItems = async () => {
      try {
        const response = await getShopItems(shopId)
        setStationeryItems(response.data.items)
      } catch (err) {
        setStationeryError("Couldn't load stationery items.")
      } finally {
        setStationeryLoading(false)
      }
    }
    fetchItems()
  }, [shopId])

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files)
    setFileError("")

    const nonPdf = selectedFiles.filter((f) => f.type !== "application/pdf")
    if (nonPdf.length > 0) {
      setFileError("Only PDF files are supported.")
      e.target.value = ""
      return
    }

    if (printJobs.length + selectedFiles.length > MAX_FILES) {
      setFileError(`You can upload up to ${MAX_FILES} files per order.`)
      e.target.value = ""
      return
    }

    setPrintJobs((prev) => [...prev, ...selectedFiles.map(createPrintJob)])
    e.target.value = "" // allow re-selecting the same file again later if removed
  }

  const handleJobChange = (id, updates) => {
    setPrintJobs((prev) =>
      prev.map((job) => (job.id === id ? { ...job, ...updates } : job))
    )
  }

  const handleRemoveJob = (id) => {
    setPrintJobs((prev) => prev.filter((job) => job.id !== id))
  }

  const handleQuantityChange = (itemId, quantity) => {
    setQuantities((prev) => ({ ...prev, [itemId]: quantity }))
  }

  const [calculating, setCalculating] = useState(false)
  const [calculateError, setCalculateError] = useState("")
  const [orderSummary, setOrderSummary] = useState(null) // backend's calculate response

  const handleCalculate = async () => {
    setCalculating(true)
    setCalculateError("")

    try {
      const response = await calculateOrder({ shopId, printJobs, quantities })
      setOrderSummary(response.data)
      setStep("review")
    } catch (err) {
      setCalculateError(
        err.response?.data?.message || "Couldn't calculate your order. Please try again."
      )
    } finally {
      setCalculating(false)
    }
  }

  const [paying, setPaying] = useState(false)
  const [paymentError, setPaymentError] = useState("")

  const handlePayment = async () => {
    setPaying(true)
    setPaymentError("")

    try {
      const { data } = await initiatePayment(orderSummary.totalAmount)

      const razorpay = new window.Razorpay({
        key: data.razorpayKeyId,
        amount: data.amount,
        currency: data.currency,
        order_id: data.razorpayOrderId,
        name: "PrintIt",
        description: `Order at ${orderSummary.shopName}`,
        handler: async (razorpayResponse) => {
          // Runs only after the student successfully pays in the popup.
          try {
            const confirmRes = await confirmOrder({
              tempOrderData: orderSummary.tempOrderData,
              razorpayOrderId: razorpayResponse.razorpay_order_id,
              razorpayPaymentId: razorpayResponse.razorpay_payment_id,
              razorpaySignature: razorpayResponse.razorpay_signature,
            })
            navigate(`/student/orders/${confirmRes.data.order._id}`)
          } catch (err) {
            setPaymentError(
              err.response?.data?.message ||
                "Payment succeeded but we couldn't confirm your order. Please contact support."
            )
          } finally {
            setPaying(false)
          }
        },
        modal: {
          // Runs if the student closes the popup without paying.
          ondismiss: () => setPaying(false),
        },
        theme: { color: "#2E4374" },
      })

      razorpay.open()
    } catch (err) {
      setPaymentError(err.response?.data?.message || "Couldn't start payment. Please try again.")
      setPaying(false)
    }
  }

  return (
    <>
      <TopNav />
      <div className="max-w-2xl mx-auto p-4 sm:p-6">
        <Link
          to={step === "files" ? `/student/shops/${shopId}` : undefined}
          onClick={(e) => {
            if (step === "stationery") {
              e.preventDefault()
              setStep("files")
            } else if (step === "review") {
              e.preventDefault()
              setStep("stationery")
            }
          }}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          {step === "files" ? "Back to Shop" : step === "stationery" ? "Back to Files" : "Back to Stationery"}
        </Link>

        {step === "files" && (
          <>
            <h1 className="font-heading text-2xl font-bold text-foreground mb-1">
              Upload Files
            </h1>
            <p className="text-sm text-muted-foreground mb-6">
              Add up to {MAX_FILES} PDFs and set print options for each.
            </p>

            {fileError && (
              <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg mb-4 border border-destructive/20">
                {fileError}
              </div>
            )}

            <div className="space-y-3 mb-4">
              {printJobs.map((job) => (
                <PrintJobRow
                  key={job.id}
                  job={job}
                  onChange={handleJobChange}
                  onRemove={handleRemoveJob}
                />
              ))}
            </div>

            {printJobs.length < MAX_FILES && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-primary/40 transition-colors"
              >
                <Upload className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  Click to add a PDF ({printJobs.length}/{MAX_FILES})
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={handleFileSelect}
                  multiple
                  className="hidden"
                />
              </button>
            )}

            <Button
              className="w-full mt-6"
              disabled={printJobs.length === 0}
              onClick={() => setStep("stationery")}
            >
              Continue to Stationery
            </Button>
          </>
        )}

        {step === "stationery" && (
          <>
            <h1 className="font-heading text-2xl font-bold text-foreground mb-1">
              Add Stationery
            </h1>
            <p className="text-sm text-muted-foreground mb-6">
              Optional — add notebooks, pens, or anything else you need.
            </p>

            {stationeryError && (
              <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg mb-4 border border-destructive/20">
                {stationeryError}
              </div>
            )}

            {stationeryLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 bg-secondary rounded-lg animate-pulse" />
                ))}
              </div>
            ) : stationeryItems.length === 0 ? (
              <p className="text-sm text-muted-foreground mb-6">
                This shop hasn't listed any stationery items.
              </p>
            ) : (
              <div className="space-y-2 mb-6">
                {stationeryItems.map((item) => (
                  <StationeryRow
                    key={item._id}
                    item={item}
                    quantity={quantities[item._id] || 0}
                    onQuantityChange={handleQuantityChange}
                  />
                ))}
              </div>
            )}

            {calculateError && (
              <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg mb-4 border border-destructive/20">
                {calculateError}
              </div>
            )}

            <Button className="w-full" onClick={handleCalculate} disabled={calculating}>
              {calculating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploading &amp; calculating...
                </>
              ) : (
                "Continue to Review"
              )}
            </Button>
          </>
        )}

        {step === "review" && orderSummary && (
          <>
            <h1 className="font-heading text-2xl font-bold text-foreground mb-1">
              Review Your Order
            </h1>
            <p className="text-sm text-muted-foreground mb-6">
              {orderSummary.shopName}
            </p>

            <div className="bg-card border border-border rounded-xl p-4 mb-4 space-y-3">
              <h2 className="font-heading font-semibold text-foreground text-sm">
                Print Jobs
              </h2>
              {orderSummary.files.map((file, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between text-sm border-b border-border pb-2 last:border-0 last:pb-0"
                >
                  <div>
                    <p className="text-foreground">{file.originalFileName}</p>
                    <p className="text-xs text-muted-foreground">
                      {file.pages} pages · {file.printOptions.color ? "Color" : "B&W"} ·{" "}
                      {file.printOptions.doubleSided ? "Double-sided" : "Single-sided"} ·{" "}
                      {file.printOptions.copies}{" "}
                      {file.printOptions.copies > 1 ? "copies" : "copy"}
                    </p>
                  </div>
                  <span className="font-medium text-foreground">₹{file.cost}</span>
                </div>
              ))}
            </div>

            {orderSummary.stationeryItems.length > 0 && (
              <div className="bg-card border border-border rounded-xl p-4 mb-4 space-y-2">
                <h2 className="font-heading font-semibold text-foreground text-sm mb-1">
                  Stationery
                </h2>
                {orderSummary.stationeryItems.map((item) => (
                  <div
                    key={item.itemId}
                    className="flex items-center justify-between text-sm"
                  >
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

            <div className="bg-card border border-border rounded-xl p-4 mb-6 space-y-2">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Print Total</span>
                <span>₹{orderSummary.printTotal}</span>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Stationery Total</span>
                <span>₹{orderSummary.stationeryTotal}</span>
              </div>
              <div className="flex justify-between text-base font-semibold text-foreground border-t border-border pt-2">
                <span>Total</span>
                <span>₹{orderSummary.totalAmount}</span>
              </div>
            </div>

            {paymentError && (
              <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg mb-4 border border-destructive/20">
                {paymentError}
              </div>
            )}

            <Button className="w-full" onClick={handlePayment} disabled={paying}>
              {paying ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                `Pay ₹${orderSummary.totalAmount}`
              )}
            </Button>
          </>
        )}
      </div>
    </>
  )
}

export default PlaceOrder