import  ApiError from("../utils/ApiError");

const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return next(
        new ApiError(403, "Forbidden: You do not have permission")
      );
    }
    next();
  };
};

export default authorizeRoles;
