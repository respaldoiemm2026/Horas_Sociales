-- Indexes for the most frequent filters, joins, and ordering operations.
CREATE INDEX "usuarios_email_idx" ON "usuarios"("email");
CREATE INDEX "usuarios_id_rol_apellido_nombre_idx" ON "usuarios"("id_rol", "apellido", "nombre");
CREATE INDEX "usuarios_id_curso_idx" ON "usuarios"("id_curso");
CREATE INDEX "usuarios_id_lugar_idx" ON "usuarios"("id_lugar");
CREATE INDEX "usuarios_id_tipo_documento_idx" ON "usuarios"("id_tipo_documento");
CREATE INDEX "curso_id_grado_id_jornada_idx" ON "curso"("id_grado", "id_jornada");
CREATE INDEX "registro_id_usuario_idx" ON "registro"("id_usuario");
CREATE INDEX "registro_id_profesor_idx" ON "registro"("id_profesor");
CREATE INDEX "registro_id_lugar_idx" ON "registro"("id_lugar");
