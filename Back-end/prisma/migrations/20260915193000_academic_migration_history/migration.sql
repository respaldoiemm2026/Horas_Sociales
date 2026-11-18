ALTER TABLE "usuarios" ADD COLUMN "anio_escolar" INTEGER;

CREATE TABLE "migracion_academica" (
    "id" SERIAL NOT NULL,
    "anio_origen" INTEGER NOT NULL,
    "anio_destino" INTEGER NOT NULL,
    "ejecutado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ejecutado_por" INTEGER NOT NULL,
    CONSTRAINT "migracion_academica_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "migracion_detalle" (
    "id" SERIAL NOT NULL,
    "migracion_id" INTEGER NOT NULL,
    "estudiante_id" INTEGER NOT NULL,
    "grado_anterior" VARCHAR(10),
    "grado_nuevo" VARCHAR(10),
    "estado_anterior" VARCHAR(20) NOT NULL,
    "estado_nuevo" VARCHAR(20) NOT NULL,
    "accion" VARCHAR(30) NOT NULL,
    CONSTRAINT "migracion_detalle_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "migracion_academica_anio_origen_anio_destino_idx" ON "migracion_academica"("anio_origen", "anio_destino");
CREATE INDEX "migracion_academica_ejecutado_por_idx" ON "migracion_academica"("ejecutado_por");
CREATE INDEX "migracion_detalle_migracion_id_idx" ON "migracion_detalle"("migracion_id");
CREATE INDEX "migracion_detalle_estudiante_id_idx" ON "migracion_detalle"("estudiante_id");

ALTER TABLE "migracion_academica" ADD CONSTRAINT "migracion_academica_ejecutado_por_fkey"
  FOREIGN KEY ("ejecutado_por") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "migracion_detalle" ADD CONSTRAINT "migracion_detalle_migracion_id_fkey"
  FOREIGN KEY ("migracion_id") REFERENCES "migracion_academica"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "migracion_detalle" ADD CONSTRAINT "migracion_detalle_estudiante_id_fkey"
  FOREIGN KEY ("estudiante_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
