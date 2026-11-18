import { Router } from "express";
import { createUsuarios, updateUsuarios, deleteUsuarios, readUsuarios } from "../controllers/usuarios.controller.js";
import { authenticate, authorizeRoles } from "../middleware/auth.middleware.js";
const router= Router();

router.use(authenticate);
router.post("/", authorizeRoles(1), createUsuarios)
router.get("/", authorizeRoles(1), readUsuarios)
router.put("/:id", authorizeRoles(1), updateUsuarios)
router.delete("/:id", authorizeRoles(1), deleteUsuarios)

export default router;