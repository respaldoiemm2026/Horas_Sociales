import {Router} from "express";
import { readTipoDocumento, createTipoDocumento, updateTipoDocumento, deleteTipoDocumento } from "../controllers/tipo_documento.controller.js";
import { authenticate, authorizeRoles } from "../middleware/auth.middleware.js";
const router = Router();
router.use(authenticate);

router.get("/", readTipoDocumento);

router.post("/", authorizeRoles(1), createTipoDocumento);

router.put("/:id", authorizeRoles(1), updateTipoDocumento);

router.delete("/:id", authorizeRoles(1), deleteTipoDocumento);

export default router;