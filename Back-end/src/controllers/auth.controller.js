import { changePassword, loginUser, registerUser, registerUserByAdmin, registerStudent, listStudents, transferStudent, previewStudentMigration, migrateStudents } from "../services/auth.server.js";
import { deleteUsuariosService } from "../services/usuarios.service.js";
import { findUserById } from "../repository/usuarios.repository.js";
import Prisma from "../prisma.js";

export const register = async (req, res) => {
    try {
       const {
           email,
           password,
           nombre,
           apellido,
           id_curso,
           id_tipo_documento,
           numero_documento,
           id_rol,
       } = req.body;

       const user = await registerUser({
           email,
           password,
           nombre,
           apellido,
           id_curso,
           id_tipo_documento,
           numero_documento,
           id_rol,
       });

       const { contraseña, ...safeUser } = user;
       res.status(201).json({ message: "User registered successfully", user: safeUser });
   } catch (error) {
       res.status(400).json({ error: error.message });
   }
};

export const login = async (req, res) => {
   try {
       const { email, password, id_rol } = req.body;
       const { user, token } = await loginUser({ email, password, id_rol });

       res.cookie("token", token, {
           httpOnly: true,
           secure: process.env.NODE_ENV === "production",
           sameSite: "lax",
           maxAge: 60 * 60 * 1000,
       });

       const { contraseña, ...safeUser } = user;
       res.status(200).json({ token, user: safeUser });
   } catch (error) {
       res.status(401).json({ error: error.message });
   }
};

export const logout = (_req, res) => {
   res.clearCookie("token", {
       httpOnly: true,
       secure: process.env.NODE_ENV === "production",
       sameSite: "lax",
   });
   res.status(204).send();
};

export const me = async (req, res) => {
   try {
       const userId = req.user?.sub ?? req.user?.id;
       const user = await findUserById(userId);

       if (!user) {
           return res.status(404).json({ error: "User not found" });
       }

       const { contraseña, ...safeUser } = user;
       res.status(200).json({ user: safeUser });
   } catch (error) {
       res.status(500).json({ error: error.message });
   }
};

export const updatePassword = async (req, res) => {
    try {
        const userId = req.user?.sub;
        await changePassword(userId, req.body);
        res.status(200).json({ message: "Contraseña actualizada correctamente" });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

export const registerManagedUser = async (req, res) => {
    try {
        const requester = await findUserById(Number(req.user?.sub));
        if (!requester || requester.id_rol !== 1) {
            return res.status(403).json({ error: "Solo los administradores pueden agregar usuarios" });
        }

        const user = await registerUserByAdmin(req.body);
        const { contraseña, ...safeUser } = user;
        res.status(201).json({ message: "Usuario agregado correctamente", user: safeUser });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

export const registerStudentUser = async (req, res) => {
    try {
        const requester = await findUserById(Number(req.user?.sub));
        if (!requester || ![1, 3].includes(requester.id_rol)) {
            return res.status(403).json({ error: "No tienes permisos para registrar estudiantes" });
        }
        const user = await registerStudent(req.body);
        const { contraseña, ...safeUser } = user;
        res.status(201).json({ user: safeUser });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

export const deleteStudentUser = async (req, res) => {
    try {
        const requester = await findUserById(Number(req.user?.sub));
        if (!requester || ![1, 3].includes(requester.id_rol)) {
            return res.status(403).json({ error: "No tienes permisos para eliminar estudiantes" });
        }
        const studentId = Number(req.params.id);
        if (!Number.isInteger(studentId)) {
            return res.status(400).json({ error: "Identificador de estudiante inválido" });
        }
        const student = await findUserById(studentId);
        if (!student || student.id_rol !== 2) {
            return res.status(404).json({ error: "Estudiante no encontrado" });
        }
        await deleteUsuariosService(studentId);
        res.status(200).json({ message: "Estudiante eliminado completamente" });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

export const getStudents = async (req, res) => {
    try {
        const students = await listStudents(req.query);
        res.status(200).json({ students, page: Number(req.query.page) || 1, limit: Number(req.query.limit) || 100 });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const transferStudentUser = async (req, res) => {
    try {
        const requester = await findUserById(Number(req.user?.sub));
        if (!requester || ![1, 3].includes(requester.id_rol)) {
            return res.status(403).json({ error: "No tienes permisos para trasladar estudiantes" });
        }
        const result = await transferStudent({
            studentId: req.params.id,
            grado: req.body?.grado,
            grupo: req.body?.grupo,
        });
        res.status(200).json({
            message: "Estudiante trasladado correctamente",
            student: result,
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

export const migrateStudentGrades = async (req, res) => {
    try {
        const requester = await findUserById(Number(req.user?.sub));
        if (!requester || ![1, 3].includes(requester.id_rol)) {
            return res.status(403).json({ error: "No tienes permisos para migrar estudiantes" });
        }
        const result = await migrateStudents({
            ...req.body,
            ejecutadoPor: requester.id,
        });
        res.status(200).json({
            message: "Migración académica ejecutada correctamente",
            ...result,
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

export const previewStudentGradesMigration = async (req, res) => {
    try {
        const requester = await findUserById(Number(req.user?.sub));
        if (!requester || ![1, 3].includes(requester.id_rol)) {
            return res.status(403).json({ error: "No tienes permisos para consultar la migración" });
        }
        const students = await previewStudentMigration();
        res.status(200).json({ students });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

export const getStudentMigrationHistory = async (req, res) => {
    try {
        const requester = await findUserById(Number(req.user?.sub));
        if (!requester || ![1, 3].includes(requester.id_rol)) {
            return res.status(403).json({ error: "No tienes permisos para consultar el historial" });
        }
        const history = await Prisma.migracion_academica.findMany({
            include: {
                ejecutor: { select: { nombre: true, apellido: true } },
                detalles: {
                    include: { estudiante: { select: { nombre: true, apellido: true, numero_documento: true } } },
                },
            },
            orderBy: { ejecutado_en: "desc" },
        });
        res.status(200).json({ history });
    } catch (error) {
        res.status(500).json({ error: "No fue posible cargar el historial de migraciones" });
    }
};