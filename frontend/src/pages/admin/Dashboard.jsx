import { useEffect, useState } from "react"
import { School, Store, Check, X, Clock } from "lucide-react"
import {
  getPendingColleges,
  approveCollege,
  getShops,
  approveShop,
  rejectShop,
  updateSubscription,
} from "../../api/admin.api"
import TopNav from "../../components/shared/TopNav"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Label } from "../../components/ui/label"

const SHOP_TABS = ["PENDING", "ACTIVE", "REJECTED", "INACTIVE"]

const SUBSCRIPTION_BADGE = {
  TRIAL: "bg-accent/15 text-accent border-accent/30",
  ACTIVE: "bg-success/15 text-success border-success/30",
  INACTIVE: "bg-destructive/15 text-destructive border-destructive/30",
}

const RejectShopModal = ({ shop, onConfirm, onCancel, submitting }) => {
  const [reason, setReason] = useState("")

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <div className="bg-card border border-border rounded-xl p-5 w-full max-w-sm">
        <h2 className="font-heading font-semibold text-foreground mb-1">Reject Shop</h2>
        <p className="text-xs text-muted-foreground mb-4">{shop.name}</p>

        <Label htmlFor="rejectReason">Reason</Label>
        <Input
          id="rejectReason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Why is this shop being rejected?"
          className="mt-1 mb-4"
          autoFocus
        />

        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={onCancel} disabled={submitting}>
            Cancel
          </Button>
          <Button
            className="flex-1 bg-destructive hover:bg-destructive/90"
            onClick={() => onConfirm(reason)}
            disabled={submitting || !reason.trim()}
          >
            {submitting ? "Rejecting..." : "Confirm Reject"}
          </Button>
        </div>
      </div>
    </div>
  )
}

const SubscriptionModal = ({ shop, onConfirm, onCancel, submitting }) => {
  const [status, setStatus] = useState(shop.subscription?.status || "TRIAL")
  const [endDate, setEndDate] = useState(
    shop.subscription?.endDate ? shop.subscription.endDate.slice(0, 10) : ""
  )

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <div className="bg-card border border-border rounded-xl p-5 w-full max-w-sm">
        <h2 className="font-heading font-semibold text-foreground mb-1">Subscription</h2>
        <p className="text-xs text-muted-foreground mb-4">{shop.name}</p>

        <Label htmlFor="subStatus">Status</Label>
        <select
          id="subStatus"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="mt-1 mb-3 w-full border border-input rounded-lg px-3 py-2 text-sm bg-card text-foreground"
        >
          <option value="TRIAL">Trial</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>

        <Label htmlFor="subEndDate">End Date</Label>
        <Input
          id="subEndDate"
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="mt-1 mb-4"
        />

        {status === "INACTIVE" && (
          <p className="text-xs text-destructive mb-4">
            Setting Inactive will also deactivate the shop — it disappears from
            student browsing until reactivated.
          </p>
        )}

        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={onCancel} disabled={submitting}>
            Cancel
          </Button>
          <Button
            className="flex-1"
            onClick={() => onConfirm(status, endDate)}
            disabled={submitting}
          >
            {submitting ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>
    </div>
  )
}

const AdminDashboard = () => {
  const [colleges, setColleges] = useState([])
  const [collegesLoading, setCollegesLoading] = useState(true)
  const [collegeActionError, setCollegeActionError] = useState("")

  const [shopTab, setShopTab] = useState("PENDING")
  const [shops, setShops] = useState([])
  const [shopsLoading, setShopsLoading] = useState(true)
  const [shopActionError, setShopActionError] = useState("")

  const [rejectTarget, setRejectTarget] = useState(null)
  const [subscriptionTarget, setSubscriptionTarget] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const fetchColleges = async () => {
    try {
      const response = await getPendingColleges()
      setColleges(response.data.colleges)
    } catch (err) {
      setCollegeActionError("Couldn't load pending colleges.")
    } finally {
      setCollegesLoading(false)
    }
  }

  const fetchShops = async (status) => {
    setShopsLoading(true)
    try {
      const response = await getShops(status)
      setShops(response.data.shops)
    } catch (err) {
      setShopActionError("Couldn't load shops.")
    } finally {
      setShopsLoading(false)
    }
  }

  useEffect(() => {
    fetchColleges()
  }, [])

  useEffect(() => {
    fetchShops(shopTab)
  }, [shopTab])

  const handleApproveCollege = async (collegeId) => {
    setCollegeActionError("")
    try {
      await approveCollege(collegeId)
      fetchColleges()
    } catch (err) {
      setCollegeActionError(err.response?.data?.message || "Couldn't approve this college.")
    }
  }

  const handleApproveShop = async (shopId) => {
    setShopActionError("")
    try {
      await approveShop(shopId)
      fetchShops(shopTab)
    } catch (err) {
      setShopActionError(err.response?.data?.message || "Couldn't approve this shop.")
    }
  }

  const handleRejectShop = async (reason) => {
    setSubmitting(true)
    setShopActionError("")
    try {
      await rejectShop(rejectTarget._id, reason)
      setRejectTarget(null)
      fetchShops(shopTab)
    } catch (err) {
      setShopActionError(err.response?.data?.message || "Couldn't reject this shop.")
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdateSubscription = async (status, endDate) => {
    setSubmitting(true)
    setShopActionError("")
    try {
      await updateSubscription(subscriptionTarget._id, { status, endDate })
      setSubscriptionTarget(null)
      fetchShops(shopTab)
    } catch (err) {
      setShopActionError(err.response?.data?.message || "Couldn't update subscription.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <TopNav />
      <div className="max-w-2xl mx-auto p-4 sm:p-6">
        <h1 className="font-heading text-2xl font-bold text-foreground mb-6">Admin</h1>

        {/* Pending Colleges */}
        <section className="mb-8">
          <h2 className="flex items-center gap-2 font-heading font-semibold text-foreground text-sm mb-3">
            <School className="w-4 h-4" />
            Pending Colleges
          </h2>

          {collegeActionError && (
            <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg mb-3 border border-destructive/20">
              {collegeActionError}
            </div>
          )}

          {collegesLoading ? (
            <div className="h-16 bg-secondary rounded-xl animate-pulse" />
          ) : colleges.length === 0 ? (
            <p className="text-sm text-muted-foreground">No colleges awaiting approval.</p>
          ) : (
            <div className="space-y-2">
              {colleges.map((college) => (
                <div
                  key={college._id}
                  className="bg-card border border-border rounded-xl p-4 flex items-center justify-between gap-3"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">{college.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {college.city}, {college.state} · requested by{" "}
                      {college.createdBy?.name || "unknown"}
                    </p>
                  </div>
                  <Button size="sm" onClick={() => handleApproveCollege(college._id)}>
                    <Check className="w-3.5 h-3.5 mr-1" />
                    Approve
                  </Button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Shops */}
        <section>
          <h2 className="flex items-center gap-2 font-heading font-semibold text-foreground text-sm mb-3">
            <Store className="w-4 h-4" />
            Shops
          </h2>

          <div className="flex gap-2 bg-secondary rounded-lg p-1 mb-4">
            {SHOP_TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setShopTab(tab)}
                className={`flex-1 text-xs py-1.5 rounded-md font-medium transition-colors ${
                  shopTab === tab ? "bg-card shadow text-foreground" : "text-muted-foreground"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {shopActionError && (
            <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg mb-3 border border-destructive/20">
              {shopActionError}
            </div>
          )}

          {shopsLoading ? (
            <div className="space-y-2">
              {[1, 2].map((i) => (
                <div key={i} className="h-20 bg-secondary rounded-xl animate-pulse" />
              ))}
            </div>
          ) : shops.length === 0 ? (
            <p className="text-sm text-muted-foreground">No shops in this category.</p>
          ) : (
            <div className="space-y-2">
              {shops.map((shop) => (
                <div key={shop._id} className="bg-card border border-border rounded-xl p-4">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <p className="text-sm font-medium text-foreground">{shop.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {shop.collegeId?.name} · {shop.ownerId?.name} ({shop.ownerId?.email})
                      </p>
                    </div>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full border whitespace-nowrap ${
                        SUBSCRIPTION_BADGE[shop.subscription?.status] || ""
                      }`}
                    >
                      {shop.subscription?.status}
                    </span>
                  </div>

                  {shop.status === "REJECTED" && shop.rejectionReason && (
                    <p className="text-xs text-destructive mb-2">
                      Rejected: {shop.rejectionReason}
                    </p>
                  )}

                  <div className="flex gap-2 mt-2">
                    {shop.status === "PENDING" && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 text-destructive hover:bg-destructive/10"
                          onClick={() => setRejectTarget(shop)}
                        >
                          <X className="w-3.5 h-3.5 mr-1" />
                          Reject
                        </Button>
                        <Button
                          size="sm"
                          className="flex-1"
                          onClick={() => handleApproveShop(shop._id)}
                        >
                          <Check className="w-3.5 h-3.5 mr-1" />
                          Approve
                        </Button>
                      </>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => setSubscriptionTarget(shop)}
                    >
                      <Clock className="w-3.5 h-3.5 mr-1" />
                      Subscription
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {rejectTarget && (
        <RejectShopModal
          shop={rejectTarget}
          onConfirm={handleRejectShop}
          onCancel={() => setRejectTarget(null)}
          submitting={submitting}
        />
      )}

      {subscriptionTarget && (
        <SubscriptionModal
          shop={subscriptionTarget}
          onConfirm={handleUpdateSubscription}
          onCancel={() => setSubscriptionTarget(null)}
          submitting={submitting}
        />
      )}
    </>
  )
}

export default AdminDashboard