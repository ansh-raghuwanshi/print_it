import { useEffect, useState } from "react"
import { useParams, Link } from "react-router-dom"
import { ArrowLeft, Printer, Package } from "lucide-react"
import { useAuth } from "../../context/AuthContext"
import { getShopsByCollege } from "../../api/college.api"
import { getShopItems } from "../../api/stationery.api"
import TopNav from "../../components/shared/TopNav"
import { Button } from "../../components/ui/button"

const PRICING_LABELS = {
  bwSingleSided: "B&W · Single-sided",
  bwDoubleSided: "B&W · Double-sided",
  colorSingleSided: "Color · Single-sided",
  colorDoubleSided: "Color · Double-sided",
}

const ShopDetail = () => {
  const { shopId } = useParams()
  const { user } = useAuth()

  const [shop, setShop] = useState(null)
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [shopsRes, itemsRes] = await Promise.all([
          getShopsByCollege(user.collegeId),
          getShopItems(shopId),
        ])

        const matchedShop = shopsRes.data.shops.find((s) => s._id === shopId)
        if (!matchedShop) {
          setError("This shop couldn't be found.")
        } else {
          setShop(matchedShop)
        }
        setItems(itemsRes.data.items)
      } catch (err) {
        setError("Couldn't load shop details right now.")
      } finally {
        setLoading(false)
      }
    }

    if (user?.collegeId) fetchData()
  }, [user, shopId])

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

  if (error || !shop) {
    return (
      <>
        <TopNav />
        <div className="max-w-2xl mx-auto p-4 sm:p-6">
          <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg border border-destructive/20">
            {error || "This shop couldn't be found."}
          </div>
          <Link to="/student/shops" className="inline-block mt-4">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Shops
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
          to="/student/shops"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Shops
        </Link>

        <div className="flex items-start justify-between gap-3 mb-6">
          <div>
            <h1 className="font-heading text-2xl font-bold text-foreground">{shop.name}</h1>
            <p className="text-sm text-muted-foreground mt-1">{shop.address}</p>
          </div>
          <span
            className={`text-xs px-2.5 py-1 rounded-full border whitespace-nowrap ${
              shop.isOpen
                ? "bg-success/15 text-success border-success/30"
                : "bg-muted text-muted-foreground border-border"
            }`}
          >
            {shop.isOpen ? "Open" : "Closed"}
          </span>
        </div>

        {/* Print pricing reference */}
        {shop.printPricing && (
          <section className="bg-card border border-border rounded-xl p-4 mb-6">
            <h2 className="flex items-center gap-2 font-heading font-semibold text-foreground mb-3">
              <Printer className="w-4 h-4" />
              Print Pricing
            </h2>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {Object.entries(PRICING_LABELS).map(([key, label]) => (
                <div key={key} className="flex justify-between border-b border-border pb-2">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="font-medium text-foreground">
                    ₹{shop.printPricing[key]}/pg
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Stationery items */}
        <section className="mb-6">
          <h2 className="flex items-center gap-2 font-heading font-semibold text-foreground mb-3">
            <Package className="w-4 h-4" />
            Stationery Available
          </h2>

          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              This shop hasn't listed any stationery items yet.
            </p>
          ) : (
            <div className="space-y-2">
              {items.map((item) => (
                <div
                  key={item._id}
                  className="flex items-center justify-between bg-card border border-border rounded-lg p-3"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{item.category}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-foreground">₹{item.price}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.visibleStock} in stock
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <Button
          className="w-full"
          disabled={!shop.isOpen}
          asChild={shop.isOpen}
        >
          {shop.isOpen ? (
            <Link to={`/student/shops/${shop._id}/order`}>Start Order</Link>
          ) : (
            <span>Shop is Closed</span>
          )}
        </Button>
      </div>
    </>
  )
}

export default ShopDetail