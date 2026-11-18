import { createUser, deleteUser, readUser, updateUser } from "../repository/usuarios.repository.js";
import Prisma from "../prisma.js";
export const createUsuariosService = (userData) => {
    return createUser(userData);
}

export const readUsuariosService = () => {
    return readUser();
}

export const updateUsuariosService = (userId, userData) => {
    return updateUser(userId, userData);
}

export const deleteUsuariosService = (userId) => {
    return Prisma.$transaction(async (tx) => {
        await tx.registro.deleteMany({ where: { OR: [{ id_usuario: userId }, { id_profesor: userId }] } });
        return tx.usuarios.delete({ where: { id: userId } });
    });
}