import jwt from "jsonwebtoken";

const secret = process.env.JWT_SECRET;
const expiresIn = process.env.JWT_EXPIRES_IN || "1h";

if (!secret) {
    throw new Error("JWT_SECRET no está configurado");
}

export const generatetoken = (user) => {
    const payload = {
        sub: user.id,
        email: user.email,
        role: user.id_rol,
    };

    return jwt.sign(payload, secret, { expiresIn });
};

export const verifyToken = (token) => {
    return jwt.verify(token, secret);
};