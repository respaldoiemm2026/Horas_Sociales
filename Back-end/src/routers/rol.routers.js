import {Router} from "express";
import { createRol, deleteRol, readRol, updateRol } from "../controllers/rol.controller.js";
import { authenticate, authorizeRoles } from "../middleware/auth.middleware.js";

const router= Router();
router.use(authenticate);

router.get("/", readRol);

router.post("/", authorizeRoles(1), createRol);

router.put("/:id", authorizeRoles(1), updateRol);

router.delete("/:id", authorizeRoles(1), deleteRol);   

export default router;