import { useEffect, useState } from "react"
import { Plus, Package, X, RotateCw, Pencil } from "lucide-react"
import {
  getMyItems,
  addItem,
  updateItem,
  restockItem,
  toggleItemAvailability,
  deleteItem,
} from "../../api/stationery.api"
import TopNav from "../../components/shared/TopNav"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Label } from "../../components/ui/label"

const CATEGORIES = [
  "Pens & Pencils",
  "Files & Folders",
  "Paper",
  "Notebooks",
  "Lab Items",
  "Other",
]

const EMPTY_FORM = {
  name: "",
  category: CATEGORIES[0],
  price: "",
  realStock: "",
  bufferPercent: "20",
  lowStockAlert: "5",
}

const RestockModal = ({ item, onDone, onCancel }) => {
  const [amount, setAmount] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!amount || Number(amount) < 0) {
      setError("Enter a valid stock quantity")
      return
    }

    setSubmitting(true)
    setError("")
    try {
      await restockItem(item._id, Number(amount))
      onDone()
    } catch (err) {
      setError(err.response?.data?.message || "Couldn't restock this item.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <form
        onSubmit={handleSubmit}
        className="bg-card border border-border rounded-xl p-5 w-full max-w-sm"
      >
        <h2 className="font-heading font-semibold text-foreground mb-1">
          Restock {item.name}
        </h2>
        <p className="text-xs text-muted-foreground mb-4">
          Currently {item.realStock} in stock. Enter the new total count.
        </p>

        {error && (
          <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg mb-3 border border-destructive/20">
            {error}
          </div>
        )}

        <Label htmlFor="restockAmount">New Stock Count</Label>
        <Input
          id="restockAmount"
          type="number"
          min="0"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          autoFocus
          className="mt-1"
        />

        <div className="flex gap-2 mt-5">
          <Button type="button" variant="outline" className="flex-1" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" className="flex-1" disabled={submitting}>
            {submitting ? "Updating..." : "Update Stock"}
          </Button>
        </div>
      </form>
    </div>
  )
}

const EditItemModal = ({ item, onDone, onCancel }) => {
  const [form, setForm] = useState({
    name: item.name,
    category: item.category,
    price: item.price,
    bufferPercent: item.bufferPercent,
    lowStockAlert: item.lowStockAlert,
  })
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState("")

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setSubmitting(true)
    try {
      await updateItem(item._id, {
        name: form.name.trim(),
        category: form.category,
        price: Number(form.price),
        bufferPercent: Number(form.bufferPercent),
        lowStockAlert: Number(form.lowStockAlert),
      })
      onDone()
    } catch (err) {
      setError(err.response?.data?.message || "Couldn't update this item.")
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm(`Delete "${item.name}"? This can't be undone.`)) return
    setDeleting(true)
    setError("")
    try {
      await deleteItem(item._id)
      onDone()
    } catch (err) {
      setError(err.response?.data?.message || "Couldn't delete this item.")
      setDeleting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <form
        onSubmit={handleSubmit}
        className="bg-card border border-border rounded-xl p-5 w-full max-w-sm max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading font-semibold text-foreground">Edit Item</h2>
          <button type="button" onClick={onCancel} className="text-muted-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg mb-3 border border-destructive/20">
            {error}
          </div>
        )}

        <div className="space-y-3">
          <div>
            <Label htmlFor="editName">Item Name</Label>
            <Input id="editName" name="name" value={form.name} onChange={handleChange} className="mt-1" />
          </div>

          <div>
            <Label htmlFor="editCategory">Category</Label>
            <select
              id="editCategory"
              name="category"
              value={form.category}
              onChange={handleChange}
              className="mt-1 w-full border border-input rounded-lg px-3 py-2 text-sm bg-card text-foreground"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="editPrice">Price (₹)</Label>
            <Input
              id="editPrice"
              name="price"
              type="number"
              min="0"
              value={form.price}
              onChange={handleChange}
              className="mt-1"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="editBuffer">Buffer %</Label>
              <Input
                id="editBuffer"
                name="bufferPercent"
                type="number"
                min="0"
                max="50"
                value={form.bufferPercent}
                onChange={handleChange}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="editAlert">Low Stock Alert</Label>
              <Input
                id="editAlert"
                name="lowStockAlert"
                type="number"
                min="0"
                value={form.lowStockAlert}
                onChange={handleChange}
                className="mt-1"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-2 mt-5">
          <Button type="submit" className="flex-1" disabled={submitting}>
            {submitting ? "Saving..." : "Save Changes"}
          </Button>
        </div>

        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          className="w-full text-center text-sm text-destructive mt-4 hover:underline"
        >
          {deleting ? "Deleting..." : "Delete this item"}
        </button>
      </form>
    </div>
  )
}

const ItemRow = ({ item, onToggle, onRestockClick, onEditClick }) => (
  <div className="bg-card border border-border rounded-xl p-4 flex items-center justify-between gap-3">
    <button
      type="button"
      onClick={() => onEditClick(item)}
      className="flex-1 text-left min-w-0"
    >
      <p className="text-sm font-medium text-foreground flex items-center gap-1">
        {item.name}
        <Pencil className="w-3 h-3 text-muted-foreground" />
      </p>
      <p className="text-xs text-muted-foreground">
        ₹{item.price} · {item.realStock} in stock
        {!item.isAvailable && (
          <span className="text-destructive font-medium"> · Unavailable</span>
        )}
        {item.isAvailable && item.realStock <= item.lowStockAlert && (
          <span className="text-accent font-medium"> · Low stock</span>
        )}
      </p>
    </button>

    <div className="flex items-center gap-2 shrink-0">
      <Button size="sm" variant="outline" onClick={() => onRestockClick(item)}>
        <RotateCw className="w-3.5 h-3.5 mr-1" />
        Restock
      </Button>
      <button
        type="button"
        onClick={() => onToggle(item)}
        role="switch"
        aria-checked={item.isAvailable}
        aria-label={`Toggle availability for ${item.name}`}
        className={`w-10 h-6 rounded-full relative transition-colors ${
          item.isAvailable ? "bg-success" : "bg-border"
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-card transition-transform ${
            item.isAvailable ? "translate-x-4" : ""
          }`}
        />
      </button>
    </div>
  </div>
)

const AddItemForm = ({ onAdded, onCancel }) => {
  const [form, setForm] = useState(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")

    if (!form.name.trim()) {
      setError("Item name is required")
      return
    }
    if (!form.price || Number(form.price) < 0) {
      setError("Enter a valid price")
      return
    }

    setSubmitting(true)
    try {
      await addItem({
        name: form.name.trim(),
        category: form.category,
        price: Number(form.price),
        realStock: Number(form.realStock) || 0,
        bufferPercent: Number(form.bufferPercent) || 20,
        lowStockAlert: Number(form.lowStockAlert) || 5,
      })
      onAdded()
    } catch (err) {
      setError(err.response?.data?.message || "Couldn't add this item.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <form
        onSubmit={handleSubmit}
        className="bg-card border border-border rounded-xl p-5 w-full max-w-sm max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading font-semibold text-foreground">Add Item</h2>
          <button type="button" onClick={onCancel} className="text-muted-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg mb-3 border border-destructive/20">
            {error}
          </div>
        )}

        <div className="space-y-3">
          <div>
            <Label htmlFor="name">Item Name</Label>
            <Input id="name" name="name" value={form.name} onChange={handleChange} className="mt-1" />
          </div>

          <div>
            <Label htmlFor="category">Category</Label>
            <select
              id="category"
              name="category"
              value={form.category}
              onChange={handleChange}
              className="mt-1 w-full border border-input rounded-lg px-3 py-2 text-sm bg-card text-foreground"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="price">Price (₹)</Label>
              <Input
                id="price"
                name="price"
                type="number"
                min="0"
                value={form.price}
                onChange={handleChange}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="realStock">Starting Stock</Label>
              <Input
                id="realStock"
                name="realStock"
                type="number"
                min="0"
                value={form.realStock}
                onChange={handleChange}
                className="mt-1"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="bufferPercent">Buffer %</Label>
              <Input
                id="bufferPercent"
                name="bufferPercent"
                type="number"
                min="0"
                max="50"
                value={form.bufferPercent}
                onChange={handleChange}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="lowStockAlert">Low Stock Alert</Label>
              <Input
                id="lowStockAlert"
                name="lowStockAlert"
                type="number"
                min="0"
                value={form.lowStockAlert}
                onChange={handleChange}
                className="mt-1"
              />
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            Buffer % is reserved for walk-in customers and hidden from online orders.
          </p>
        </div>

        <div className="flex gap-2 mt-5">
          <Button type="button" variant="outline" className="flex-1" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" className="flex-1" disabled={submitting}>
            {submitting ? "Adding..." : "Add Item"}
          </Button>
        </div>
      </form>
    </div>
  )
}

const Inventory = () => {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [showAddForm, setShowAddForm] = useState(false)
  const [restockTarget, setRestockTarget] = useState(null)
  const [editTarget, setEditTarget] = useState(null)
  const [toggleError, setToggleError] = useState("")

  const fetchItems = async () => {
    try {
      const response = await getMyItems()
      setItems(response.data.items)
    } catch (err) {
      setError("Couldn't load your inventory.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchItems()
  }, [])

  const handleAdded = () => {
    setShowAddForm(false)
    fetchItems()
  }

  const handleRestockDone = () => {
    setRestockTarget(null)
    fetchItems()
  }

  const handleEditDone = () => {
    setEditTarget(null)
    fetchItems()
  }

  const handleToggle = async (item) => {
    setToggleError("")
    try {
      await toggleItemAvailability(item._id)
      fetchItems()
    } catch (err) {
      setToggleError(err.response?.data?.message || `Couldn't update ${item.name}.`)
    }
  }

  // group by category for display, preserving the schema's category order
  const grouped = CATEGORIES.map((cat) => ({
    category: cat,
    items: items.filter((i) => i.category === cat),
  })).filter((group) => group.items.length > 0)

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
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-heading text-2xl font-bold text-foreground">Inventory</h1>
          <Button onClick={() => setShowAddForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Item
          </Button>
        </div>

        {error && (
          <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg mb-4 border border-destructive/20">
            {error}
          </div>
        )}

        {toggleError && (
          <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg mb-4 border border-destructive/20">
            {toggleError}
          </div>
        )}

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-secondary rounded-xl animate-pulse" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-16 bg-card border border-dashed border-border rounded-xl">
            <Package className="w-10 h-10 text-muted-foreground mx-auto" />
            <p className="text-foreground font-medium mt-3">No items yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Add stationery items students can order alongside prints.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {grouped.map((group) => (
              <section key={group.category}>
                <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-2">
                  {group.category}
                </h2>
                <div className="space-y-2">
                  {group.items.map((item) => (
                    <ItemRow
                      key={item._id}
                      item={item}
                      onToggle={handleToggle}
                      onRestockClick={setRestockTarget}
                      onEditClick={setEditTarget}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>

      {showAddForm && (
        <AddItemForm onAdded={handleAdded} onCancel={() => setShowAddForm(false)} />
      )}

      {restockTarget && (
        <RestockModal
          item={restockTarget}
          onDone={handleRestockDone}
          onCancel={() => setRestockTarget(null)}
        />
      )}

      {editTarget && (
        <EditItemModal
          item={editTarget}
          onDone={handleEditDone}
          onCancel={() => setEditTarget(null)}
        />
      )}
    </>
  )
}

export default Inventory