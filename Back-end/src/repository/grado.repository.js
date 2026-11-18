import Prisma from "../prisma.js";

export const createGrado = (gradoData) => {
    return Prisma.grado.create({ data: gradoData });

}

export const readGrado = () => {
    return Prisma.grado.findMany();

}
export const updateGrado = (GradoId, GradoData) => {
    return Prisma.grado.update({
        where: {id: GradoId}, 
        data: GradoData})

}
export const deleteGrado = (GradoId) => { 
    return Prisma.grado.delete({
        where: {id: GradoId}
    })

}