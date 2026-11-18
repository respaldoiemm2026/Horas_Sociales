import { Router } from "express";
import { register, login, logout, me, updatePassword, registerManagedUser, registerStudentUser, deleteStudentUser, getStudents, transferStudentUser, migrateStudentGrades, previewStudentGradesMigration, getStudentMigrationHistory } from "../controllers/auth.controller.js";
import { authenticate, authorizeRoles } from "../middleware/auth.middleware.js";

const router = Router();

router.post("/register", authenticate, authorizeRoles(1), register);
router.post("/login", login);
router.post("/logout", logout);
router.get("/me", authenticate, me);
router.put("/password", authenticate, updatePassword);
router.post("/users", authenticate, registerManagedUser);
router.post("/students", authenticate, registerStudentUser);
router.get("/students", authenticate, authorizeRoles(1, 3), getStudents);
router.put("/students/:id/transfer", authenticate, transferStudentUser);
router.get("/students/migrate/preview", authenticate, previewStudentGradesMigration);
router.get("/students/migrate/history", authenticate, getStudentMigrationHistory);
router.post("/students/migrate", authenticate, migrateStudentGrades);
router.delete("/students/:id", authenticate, deleteStudentUser);

export default router;