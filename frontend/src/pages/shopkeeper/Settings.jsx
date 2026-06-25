import { useEffect, useState } from "react"
import { Store, Printer, Power } from "lucide-react"
import { getMyShop, updateShop, toggleShopStatus, updatePricing } from "../../api/shop.api"
import TopNav from "../../components/shared/TopNav"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Label } from "../../components/ui/label"

const PRICING_FIELDS = [
  { key: "bwSingleSided", label: "B&W · Single-sided" },
  { key: "bwDoubleSided", label: "B&W · Double-sided" },
  { key: "colorSingleSided", label: "Color · Single-sided" },
  { key: "colorDoubleSided", label: "Color · Double-sided" },
]

const Settings = () => {
  const [shop, setShop] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const [togglingOpen, setTogglingOpen] = useState(false)

  const [detailsForm, setDetailsForm] = useState({ name: "", address: "", phone: "" })
  const [savingDetails, setSavingDetails] = useState(false)
  const [detailsSaved, setDetailsSaved] = useState(false)
  const [detailsError, setDetailsError] = useState("")

  const [pricingForm, setPricingForm] = useState({
    bwSingleSided: "",
    bwDoubleSided: "",
    colorSingleSided: "",
    colorDoubleSided: "",
  })
  const [savingPricing, setSavingPricing] = useState(false)
  const [pricingSaved, setPricingSaved] = useState(false)
  const [pricingError, setPricingError] = useState("")

  useEffect(() => {
    const fetchShop = async () => {
      try {
        const response = await getMyShop()
        const fetchedShop = response.data.shop
        setShop(fetchedShop)
        setDetailsForm({
          name: fetchedShop.name || "",
          address: fetchedShop.address || "",
          phone: fetchedShop.phone || "",
        })
        setPricingForm({
          bwSingleSided: fetchedShop.printPricing?.bwSingleSided ?? "",
          bwDoubleSided: fetchedShop.printPricing?.bwDoubleSided ?? "",
          colorSingleSided: fetchedShop.printPricing?.colorSingleSided ?? "",
          colorDoubleSided: fetchedShop.printPricing?.colorDoubleSided ?? "",
        })
      } catch (err) {
        setError(err.response?.data?.message || "Couldn't load shop settings.")
      } finally {
        setLoading(false)
      }
    }
    fetchShop()
  }, [])

  const handleToggleOpen = async () => {
    setTogglingOpen(true)
    try {
      const response = await toggleShopStatus()
      setShop((prev) => ({ ...prev, isOpen: response.data.isOpen }))
    } catch (err) {
      setError(err.response?.data?.message || "Couldn't update shop status.")
    } finally {
      setTogglingOpen(false)
    }
  }

  const handleDetailsSubmit = async (e) => {
    e.preventDefault()
    setDetailsError("")
    setDetailsSaved(false)
    setSavingDetails(true)

    try {
      const response = await updateShop(detailsForm)
      setShop((prev) => ({ ...prev, ...response.data.shop }))
      setDetailsSaved(true)
    } catch (err) {
      setDetailsError(err.response?.data?.message || "Couldn't save shop details.")
    } finally {
      setSavingDetails(false)
    }
  }

  const handlePricingSubmit = async (e) => {
    e.preventDefault()
    setPricingError("")
    setPricingSaved(false)

    const hasInvalid = Object.values(pricingForm).some((v) => v === "" || Number(v) < 0)
    if (hasInvalid) {
      setPricingError("Enter a valid price for every option.")
      return
    }

    setSavingPricing(true)
    try {
      const numericPricing = Object.fromEntries(
        Object.entries(pricingForm).map(([k, v]) => [k, Number(v)])
      )
      const response = await updatePricing(numericPricing)
      setShop((prev) => ({ ...prev, printPricing: response.data.shop.printPricing }))
      setPricingSaved(true)
    } catch (err) {
      setPricingError(err.response?.data?.message || "Couldn't save pricing.")
    } finally {
      setSavingPricing(false)
    }
  }

  if (loading) {
    return (
      <>
        <TopNav />
        <div className="max-w-2xl mx-auto p-4 sm:p-6 space-y-3">
          <div className="h-20 bg-secondary rounded-xl animate-pulse" />
          <div className="h-40 bg-secondary rounded-xl animate-pulse" />
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
        <h1 className="font-heading text-2xl font-bold text-foreground mb-6">Shop Settings</h1>

        {error && (
          <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg mb-4 border border-destructive/20">
            {error}
          </div>
        )}

        {/* Open/Closed — the single most-used control, kept front and center */}
        <div className="bg-card border border-border rounded-xl p-4 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center ${
                shop?.isOpen ? "bg-success/15" : "bg-muted"
              }`}
            >
              <Power
                className={`w-5 h-5 ${shop?.isOpen ? "text-success" : "text-muted-foreground"}`}
              />
            </div>
            <div>
              <p className="font-medium text-foreground">
                {shop?.isOpen ? "Shop is Open" : "Shop is Closed"}
              </p>
              <p className="text-xs text-muted-foreground">
                {shop?.isOpen
                  ? "Students can place orders right now."
                  : "Orders are paused until you reopen."}
              </p>
            </div>
          </div>
          <Button
            variant={shop?.isOpen ? "outline" : "default"}
            onClick={handleToggleOpen}
            disabled={togglingOpen}
          >
            {togglingOpen ? "..." : shop?.isOpen ? "Close Shop" : "Open Shop"}
          </Button>
        </div>

        {/* Shop details */}
        <form
          onSubmit={handleDetailsSubmit}
          className="bg-card border border-border rounded-xl p-4 mb-6 space-y-3"
        >
          <h2 className="flex items-center gap-2 font-heading font-semibold text-foreground text-sm mb-1">
            <Store className="w-4 h-4" />
            Shop Details
          </h2>

          {detailsError && (
            <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg border border-destructive/20">
              {detailsError}
            </div>
          )}

          <div>
            <Label htmlFor="shopName">Shop Name</Label>
            <Input
              id="shopName"
              value={detailsForm.name}
              onChange={(e) => {
                setDetailsForm({ ...detailsForm, name: e.target.value })
                setDetailsSaved(false)
              }}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="shopAddress">Address</Label>
            <Input
              id="shopAddress"
              value={detailsForm.address}
              onChange={(e) => {
                setDetailsForm({ ...detailsForm, address: e.target.value })
                setDetailsSaved(false)
              }}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="shopPhone">Phone</Label>
            <Input
              id="shopPhone"
              value={detailsForm.phone}
              onChange={(e) => {
                setDetailsForm({ ...detailsForm, phone: e.target.value })
                setDetailsSaved(false)
              }}
              className="mt-1"
            />
          </div>

          <Button type="submit" disabled={savingDetails}>
            {savingDetails ? "Saving..." : detailsSaved ? "Saved ✓" : "Save Details"}
          </Button>
        </form>

        {/* Print pricing */}
        <form
          onSubmit={handlePricingSubmit}
          className="bg-card border border-border rounded-xl p-4 mb-6 space-y-3"
        >
          <h2 className="flex items-center gap-2 font-heading font-semibold text-foreground text-sm mb-1">
            <Printer className="w-4 h-4" />
            Print Pricing (per page, ₹)
          </h2>

          {pricingError && (
            <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg border border-destructive/20">
              {pricingError}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            {PRICING_FIELDS.map((field) => (
              <div key={field.key}>
                <Label htmlFor={field.key} className="text-xs">
                  {field.label}
                </Label>
                <Input
                  id={field.key}
                  type="number"
                  min="0"
                  step="0.5"
                  value={pricingForm[field.key]}
                  onChange={(e) => {
                    setPricingForm({ ...pricingForm, [field.key]: e.target.value })
                    setPricingSaved(false)
                  }}
                  className="mt-1"
                />
              </div>
            ))}
          </div>

          <Button type="submit" disabled={savingPricing}>
            {savingPricing ? "Saving..." : pricingSaved ? "Saved ✓" : "Save Pricing"}
          </Button>
        </form>
      </div>
    </>
  )
}

export default Settings