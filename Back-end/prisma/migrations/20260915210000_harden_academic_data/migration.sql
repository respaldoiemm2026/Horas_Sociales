ALTER TABLE "usuarios"
  ADD CONSTRAINT "usuarios_estado_check"
  CHECK ("estado" IN ('activo', 'retirado', 'egresado', 'trasladado', 'no_promovido'));

ALTER TABLE "usuarios"
  ADD CONSTRAINT "usuarios_student_year_check"
  CHECK ("id_rol" <> 2 OR "anio_escolar" IS NOT NULL);

ALTER TABLE "usuarios"
  ADD CONSTRAINT "usuarios_active_course_check"
  CHECK ("id_rol" <> 2 OR "estado" <> 'activo' OR "id_curso" IS NOT NULL);

CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

ALTER TABLE "migracion_academica"
  ADD COLUMN "estado" VARCHAR(20) NOT NULL DEFAULT 'confirmada';

CREATE UNIQUE INDEX "migracion_academica_anio_origen_anio_destino_key"
  ON "migracion_academica"("anio_origen", "anio_destino");
