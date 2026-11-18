import {Router} from "express";
import { createLugar, deleteLugar, readLugar, updateLugar } from "../controllers/lugar.controller.js";
import { authenticate, authorizeRoles } from "../middleware/auth.middleware.js";
const router= Router();
router.use(authenticate);
router.get("/", readLugar);

router.post("/", authorizeRoles(1, 3), createLugar);

router.put("/:id", authorizeRoles(1, 3), updateLugar);

router.delete("/:id", authorizeRoles(1), deleteLugar);   

export default router;