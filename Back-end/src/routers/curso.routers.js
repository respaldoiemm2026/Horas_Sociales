import {Router} from "express";
import { createCurso, updateCurso, deleteCurso, readCurso } from "../controllers/curso.controller.js";
import { authenticate, authorizeRoles } from "../middleware/auth.middleware.js";
const router= Router();
router.use(authenticate);
router.get("/",  readCurso);

router.post("/", authorizeRoles(1), createCurso);

router.put("/:id", authorizeRoles(1), updateCurso);

router.delete("/:id", authorizeRoles(1), deleteCurso);

export default router;