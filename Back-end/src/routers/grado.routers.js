import {Router} from "express";
import { createGrado, updateGrado, deleteGrado, readGrado } from "../controllers/grado.controller.js";
import { authenticate, authorizeRoles } from "../middleware/auth.middleware.js";
const router = Router();
router.use(authenticate);
router.get("/", readGrado);
router.post("/", authorizeRoles(1), createGrado);
router.put("/:id", authorizeRoles(1), updateGrado);
router.delete("/:id", authorizeRoles(1), deleteGrado);

export default router; 
