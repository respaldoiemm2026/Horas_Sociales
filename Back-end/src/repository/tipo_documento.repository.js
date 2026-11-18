import Prisma from"../prisma.js"

export const createTipo_documento =  (Tipo_documentoData) => {
    return Prisma.tipo_documento.create({ data: Tipo_documentoData })

}

export const readTipo_documento = () => {
    return Prisma.tipo_documento.findMany();

}
export const updateTipo_documento = (Tipo_documentoId, Tipo_documentoData) => {
    return Prisma.tipo_documento.update({
        where: {id: Tipo_documentoId}, 
        data: Tipo_documentoData})

}
export const deleteTipo_documento = (Tipo_documentoId) => {
    return Prisma.tipo_documento.delete({
        where: {id: Tipo_documentoId}
    })
}