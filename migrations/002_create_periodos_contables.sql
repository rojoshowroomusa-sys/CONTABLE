-- ============================================================
-- MIGRACIÓN: Períodos Contables
-- ============================================================

-- 1. TIPO: estado del período
CREATE TYPE estado_periodo AS ENUM ('abierto', 'cerrado');

-- 2. TABLA: periodos_contables
CREATE TABLE periodos_contables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    nombre VARCHAR(50) NOT NULL,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    estado estado_periodo NOT NULL DEFAULT 'abierto',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(empresa_id, nombre)
);

-- 3. ÍNDICES
CREATE INDEX idx_periodos_contables_empresa_id ON periodos_contables(empresa_id);
CREATE INDEX idx_periodos_contables_estado ON periodos_contables(estado);

-- 4. RLS
ALTER TABLE periodos_contables ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios ven períodos de empresas de su estudio"
    ON periodos_contables FOR SELECT
    USING (
        empresa_id IN (
            SELECT id FROM empresas WHERE estudio_id = public.get_user_estudio_id()
        )
    );

CREATE POLICY "Admins y contadores pueden gestionar períodos"
    ON periodos_contables FOR ALL
    USING (
        empresa_id IN (
            SELECT id FROM empresas WHERE estudio_id = public.get_user_estudio_id()
        )
        AND public.get_user_role() IN ('admin', 'contador')
    );

-- 5. TRIGGER updated_at
CREATE TRIGGER set_periodos_contables_updated_at
    BEFORE UPDATE ON periodos_contables
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 6. Función para cerrar período
CREATE OR REPLACE FUNCTION public.cerrar_periodo(periodo_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    total_debe NUMERIC;
    total_haber NUMERIC;
BEGIN
    -- Verificar que el período exista y esté abierto
    IF NOT EXISTS (
        SELECT 1 FROM periodos_contables
        WHERE id = periodo_id AND estado = 'abierto'
    ) THEN
        RAISE EXCEPTION 'El período no existe o ya está cerrado';
    END IF;

    -- Verificar que todos los asientos estén asentados
    IF EXISTS (
        SELECT 1 FROM asientos_contables a
        JOIN periodos_contables p ON p.empresa_id = a.empresa_id
        WHERE p.id = periodo_id
        AND a.fecha BETWEEN p.fecha_inicio AND p.fecha_fin
        AND a.estado = 'borrador'
    ) THEN
        RAISE EXCEPTION 'Hay asientos en borrador dentro del período';
    END IF;

    -- Verificar que el balance esté cuadrado
    SELECT
        COALESCE(SUM(l.debe), 0),
        COALESCE(SUM(l.haber), 0)
    INTO total_debe, total_haber
    FROM lineas_asiento l
    JOIN asientos_contables a ON l.asiento_id = a.id
    JOIN periodos_contables p ON p.empresa_id = a.empresa_id
    WHERE p.id = periodo_id
    AND a.fecha BETWEEN p.fecha_inicio AND p.fecha_fin;

    IF total_debe != total_haber THEN
        RAISE EXCEPTION 'El período no está balanceado. Debe: %, Haber: %', total_debe, total_haber;
    END IF;

    -- Cerrar el período
    UPDATE periodos_contables SET estado = 'cerrado' WHERE id = periodo_id;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
