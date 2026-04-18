import jwt from "jsonwebtoken";
import ApiError from "../utils/ApiError.js";

const authMiddleware = (req, res, next) => {
try {
       console.log("👉 HEADERS:", req.headers);
       const authHeader = req.headers.authorization;
    console.log("👉 AUTH HEADER:", authHeader)

if (!authHeader || !authHeader.startsWith("Bearer ")) {
return next(new ApiError(401, "Unauthorized: Token missing"));
}

const token = authHeader.replace("Bearer", "").trim();
 console.log("👉 TOKEN:", token);
const decoded = jwt.verify(token, process.env.JWT_SECRET);
const normalizedUserId = decoded?.id || decoded?._id;
req.user = {
...decoded,
id: normalizedUserId,
_id: normalizedUserId,
}
console.log("USER:", req.user);

next();
} catch (error) {
console.log("❌ JWT ERROR:", error.message);
return next(new ApiError(401, "Unauthorized: Invalid or expired token"));
}
};

export default authMiddleware;
