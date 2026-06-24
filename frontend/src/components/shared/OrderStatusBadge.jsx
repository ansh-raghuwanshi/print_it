// Centralized status -> visual treatment mapping for orders.
// Used by both student-facing (dashboard, my-orders) and shopkeeper-facing
// (shop orders list) views, so a status always looks the same everywhere.

const STATUS_CONFIG = {
  PENDING: {
    label: "Pending",
    className: "bg-accent/15 text-accent border-accent/30",
  },
  ACCEPTED: {
    label: "In Progress",
    className: "bg-primary/15 text-primary border-primary/30",
  },
  READY: {
    label: "Ready for Pickup",
    className: "bg-success/15 text-success border-success/30 font-semibold",
  },
  COMPLETED: {
    label: "Completed",
    className: "bg-muted text-muted-foreground border-border",
  },
  REJECTED: {
    label: "Rejected",
    className: "bg-destructive/15 text-destructive border-destructive/30",
  },
  CANCELLED: {
    label: "Cancelled",
    className: "bg-destructive/15 text-destructive border-destructive/30",
  },
}

const OrderStatusBadge = ({ status }) => {
  const config = STATUS_CONFIG[status] || {
    label: status,
    className: "bg-muted text-muted-foreground border-border",
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs border ${config.className}`}
    >
      {config.label}
    </span>
  )
}

export default OrderStatusBadge