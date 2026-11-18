import {Router} from "express";
import { createJornada, updateJornada, deleteJornada, readJornada } from "../controllers/jornada.controller.js";
import { authenticate, authorizeRoles } from "../middleware/auth.middleware.js";
const router = Router();
router.use(authenticate);
router.get("/", readJornada);
router.post("/", authorizeRoles(1), createJornada);
router.put("/:id", authorizeRoles(1), updateJornada);
router.delete("/:id", authorizeRoles(1), deleteJornada);

export default router;