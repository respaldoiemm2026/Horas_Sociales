import {Router} from "express";
import { createRegistros, deleteRegistros, readRegistros, updateRegistros } from "../controllers/registros.controller.js";
import { authenticate, authorizeRoles } from "../middleware/auth.middleware.js";
const router= Router();

router.use(authenticate);
router.get("/", authorizeRoles(1, 3), readRegistros);

router.post("/", authorizeRoles(1, 3), createRegistros);

router.put("/:id", authorizeRoles(1, 3), updateRegistros);

router.delete("/:id", authorizeRoles(1, 3), deleteRegistros);   

export default router;
