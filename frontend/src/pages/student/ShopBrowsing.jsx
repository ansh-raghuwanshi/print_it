import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { Store, MapPin } from "lucide-react"
import { useAuth } from "../../context/AuthContext"
import { getShopsByCollege } from "../../api/college.api"
import TopNav from "../../components/shared/TopNav"

const ShopCard = ({ shop }) => {
  const isOpen = shop.isOpen

  return (
    <Link
      to={isOpen ? `/student/shops/${shop._id}` : "#"}
      onClick={(e) => !isOpen && e.preventDefault()}
      className={`block bg-card border border-border rounded-xl p-4 transition-colors ${
        isOpen ? "hover:border-primary/40 cursor-pointer" : "opacity-60 cursor-not-allowed"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="bg-secondary rounded-lg p-2 mt-0.5">
            <Store className="w-4 h-4 text-foreground" />
          </div>
          <div>
            <p className="font-heading font-semibold text-foreground">{shop.name}</p>
            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
              <MapPin className="w-3 h-3" />
              {shop.address}
            </p>
          </div>
        </div>
        <span
          className={`text-xs px-2.5 py-1 rounded-full border whitespace-nowrap ${
            isOpen
              ? "bg-success/15 text-success border-success/30"
              : "bg-muted text-muted-foreground border-border"
          }`}
        >
          {isOpen ? "Open" : "Closed"}
        </span>
      </div>
    </Link>
  )
}

const ShopBrowsing = () => {
  const { user } = useAuth()
  const [shops, setShops] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const fetchShops = async () => {
      try {
        const response = await getShopsByCollege(user.collegeId)
        setShops(response.data.shops)
      } catch (err) {
        setError("Couldn't load shops right now. Please try again.")
      } finally {
        setLoading(false)
      }
    }

    if (user?.collegeId) fetchShops()
  }, [user])

  return (
    <>
      <TopNav />
      <div className="max-w-2xl mx-auto p-4 sm:p-6">
        <h1 className="font-heading text-2xl font-bold text-foreground mb-1">
          Print Shops
        </h1>
        <p className="text-sm text-muted-foreground mb-6">
          Pick a shop near your campus to place an order.
        </p>

        {error && (
          <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg mb-4 border border-destructive/20">
            {error}
          </div>
        )}

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-secondary rounded-xl animate-pulse" />
            ))}
          </div>
        ) : shops.length === 0 ? (
          <div className="text-center py-16 bg-card border border-dashed border-border rounded-xl">
            <Store className="w-10 h-10 text-muted-foreground mx-auto" />
            <p className="text-foreground font-medium mt-3">No shops available yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              No approved print shops at your college yet. Check back soon.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {shops.map((shop) => (
              <ShopCard key={shop._id} shop={shop} />
            ))}
          </div>
        )}
      </div>
    </>
  )
}

export default ShopBrowsing