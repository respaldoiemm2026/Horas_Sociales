import { verifyToken } from "../utils/jwt.js";

export const authenticate = (req, res, next) => {
    const token = req.cookies?.token || req.headers.authorization?.split(" ")[1];

    if (!token) {
        return res.status(401).json({ error: "Not authenticated" });
    }

    try {
        req.user = verifyToken(token);
        next();
    } catch (error) {
        return res.status(401).json({ error: "Invalid or expired token" });
    }
};

export const authorizeRoles = (...roles) => (req, res, next) => {
    const allowedRoles = roles.map(Number);
    if (!req.user?.role || !allowedRoles.includes(Number(req.user.role))) {
        return res.status(403).json({ error: "No tienes permisos para realizar esta acción" });
    }
    next();
};