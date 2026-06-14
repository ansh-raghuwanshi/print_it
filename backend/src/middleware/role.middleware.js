import ApiError from "../utils/ApiError.js"

const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      throw new ApiError(
        403,
        `Access denied. Required role: ${roles.join(" or ")}`
      )
    }
    next()
  }
}

const requireAdmin = (req, res, next) => {
  if (req.user.role !== "admin") {
    throw new ApiError(403, "Access denied. Admins only.")
  }
  next()
}

export { requireRole, requireAdmin }