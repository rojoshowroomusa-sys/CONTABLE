-- ============================================================
-- MIGRACIÓN: Sistema Contable Multiempresa
-- PostgreSQL / Supabase
-- ============================================================

-- 1. TIPOS PERSONALIZADOS
-- ============================================================
CREATE TYPE user_role AS ENUM ('admin', 'contador', 'cliente');
CREATE TYPE tipo_cuenta AS ENUM ('activo', 'pasivo', 'patrimonio', 'ingreso', 'egreso');
CREATE TYPE estado_asiento AS ENUM ('borrador', 'asentado');

-- 2. TABLA: estudios_contables
-- ============================================================
CREATE TABLE estudios_contables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(255) NOT NULL,
    cuit_tax_id VARCHAR(50) UNIQUE NOT NULL,
    fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. TABLA: usuarios
-- ============================================================
CREATE TABLE usuarios (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    estudio_id UUID NOT NULL REFERENCES estudios_contables(id) ON DELETE RESTRICT,
    rol user_role NOT NULL DEFAULT 'cliente',
    nombre VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. TABLA: empresas
-- ============================================================
CREATE TABLE empresas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    estudio_id UUID NOT NULL REFERENCES estudios_contables(id) ON DELETE RESTRICT,
    razon_social VARCHAR(255) NOT NULL,
    identificacion_fiscal VARCHAR(50) UNIQUE NOT NULL,
    regimen_fiscal VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. TABLA: plan_cuentas
-- ============================================================
CREATE TABLE plan_cuentas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    codigo_cuenta VARCHAR(20) NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    tipo tipo_cuenta NOT NULL,
    nivel INTEGER NOT NULL DEFAULT 1,
    padre_id UUID REFERENCES plan_cuentas(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(empresa_id, codigo_cuenta)
);

-- 6. TABLA: asientos_contables
-- ============================================================
CREATE TABLE asientos_contables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    fecha DATE NOT NULL DEFAULT CURRENT_DATE,
    concepto TEXT NOT NULL,
    estado estado_asiento NOT NULL DEFAULT 'borrador',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. TABLA: lineas_asiento
-- ============================================================
CREATE TABLE lineas_asiento (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asiento_id UUID NOT NULL REFERENCES asientos_contables(id) ON DELETE CASCADE,
    cuenta_id UUID NOT NULL REFERENCES plan_cuentas(id) ON DELETE RESTRICT,
    debe NUMERIC(15,2) NOT NULL DEFAULT 0 CHECK (debe >= 0),
    haber NUMERIC(15,2) NOT NULL DEFAULT 0 CHECK (haber >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_debe_haber CHECK (debe = 0 OR haber = 0)
);

-- ============================================================
-- FUNCIONES AUXILIARES
-- ============================================================

-- Función para obtener el estudio_id del usuario autenticado
CREATE OR REPLACE FUNCTION public.get_user_estudio_id()
RETURNS UUID AS $$
    SELECT estudio_id FROM public.usuarios WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Función para obtener el rol del usuario autenticado
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS user_role AS $$
    SELECT rol FROM public.usuarios WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- TRIGGERS: updated_at
-- ============================================================
CREATE TRIGGER set_usuarios_updated_at
    BEFORE UPDATE ON usuarios
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_empresas_updated_at
    BEFORE UPDATE ON empresas
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_plan_cuentas_updated_at
    BEFORE UPDATE ON plan_cuentas
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_asientos_contables_updated_at
    BEFORE UPDATE ON asientos_contables
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- ÍNDICES
-- ============================================================
CREATE INDEX idx_usuarios_estudio_id ON usuarios(estudio_id);
CREATE INDEX idx_empresas_estudio_id ON empresas(estudio_id);
CREATE INDEX idx_plan_cuentas_empresa_id ON plan_cuentas(empresa_id);
CREATE INDEX idx_plan_cuentas_padre_id ON plan_cuentas(padre_id);
CREATE INDEX idx_asientos_contables_empresa_id ON asientos_contables(empresa_id);
CREATE INDEX idx_asientos_contables_fecha ON asientos_contables(fecha);
CREATE INDEX idx_asientos_contables_estado ON asientos_contables(estado);
CREATE INDEX idx_lineas_asiento_asiento_id ON lineas_asiento(asiento_id);
CREATE INDEX idx_lineas_asiento_cuenta_id ON lineas_asiento(cuenta_id);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE estudios_contables ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_cuentas ENABLE ROW LEVEL SECURITY;
ALTER TABLE asientos_contables ENABLE ROW LEVEL SECURITY;
ALTER TABLE lineas_asiento ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- POLÍTICAS RLS: estudios_contables
-- ============================================================
CREATE POLICY "Usuarios ven su estudio"
    ON estudios_contables FOR SELECT
    USING (id = public.get_user_estudio_id());

CREATE POLICY "Solo admins pueden modificar estudio"
    ON estudios_contables FOR ALL
    USING (
        id = public.get_user_estudio_id()
        AND public.get_user_role() = 'admin'
    );

-- ============================================================
-- POLÍTICAS RLS: usuarios
-- ============================================================
CREATE POLICY "Usuarios ven miembros de su estudio"
    ON usuarios FOR SELECT
    USING (estudio_id = public.get_user_estudio_id());

CREATE POLICY "Solo admins pueden gestionar usuarios"
    ON usuarios FOR ALL
    USING (
        estudio_id = public.get_user_estudio_id()
        AND public.get_user_role() = 'admin'
    );

CREATE POLICY "Usuarios pueden actualizar su propio perfil"
    ON usuarios FOR UPDATE
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

-- ============================================================
-- POLÍTICAS RLS: empresas
-- ============================================================
CREATE POLICY "Usuarios ven empresas de su estudio"
    ON empresas FOR SELECT
    USING (estudio_id = public.get_user_estudio_id());

CREATE POLICY "Admins y contadores pueden crear empresas"
    ON empresas FOR INSERT
    WITH CHECK (
        estudio_id = public.get_user_estudio_id()
        AND public.get_user_role() IN ('admin', 'contador')
    );

CREATE POLICY "Admins y contadores pueden modificar empresas"
    ON empresas FOR UPDATE
    USING (
        estudio_id = public.get_user_estudio_id()
        AND public.get_user_role() IN ('admin', 'contador')
    );

CREATE POLICY "Solo admins pueden eliminar empresas"
    ON empresas FOR DELETE
    USING (
        estudio_id = public.get_user_estudio_id()
        AND public.get_user_role() = 'admin'
    );

-- ============================================================
-- POLÍTICAS RLS: plan_cuentas
-- ============================================================
CREATE POLICY "Usuarios ven plan de cuentas de empresas de su estudio"
    ON plan_cuentas FOR SELECT
    USING (
        empresa_id IN (
            SELECT id FROM empresas WHERE estudio_id = public.get_user_estudio_id()
        )
    );

CREATE POLICY "Admins y contadores pueden gestionar plan de cuentas"
    ON plan_cuentas FOR ALL
    USING (
        empresa_id IN (
            SELECT id FROM empresas WHERE estudio_id = public.get_user_estudio_id()
        )
        AND public.get_user_role() IN ('admin', 'contador')
    );

-- ============================================================
-- POLÍTICAS RLS: asientos_contables
-- ============================================================
CREATE POLICY "Usuarios ven asientos de empresas de su estudio"
    ON asientos_contables FOR SELECT
    USING (
        empresa_id IN (
            SELECT id FROM empresas WHERE estudio_id = public.get_user_estudio_id()
        )
    );

CREATE POLICY "Admins y contadores pueden gestionar asientos"
    ON asientos_contables FOR ALL
    USING (
        empresa_id IN (
            SELECT id FROM empresas WHERE estudio_id = public.get_user_estudio_id()
        )
        AND public.get_user_role() IN ('admin', 'contador')
    );

-- ============================================================
-- POLÍTICAS RLS: lineas_asiento
-- ============================================================
CREATE POLICY "Usuarios ven líneas de asientos de empresas de su estudio"
    ON lineas_asiento FOR SELECT
    USING (
        asiento_id IN (
            SELECT a.id FROM asientos_contables a
            JOIN empresas e ON a.empresa_id = e.id
            WHERE e.estudio_id = public.get_user_estudio_id()
        )
    );

CREATE POLICY "Admins y contables pueden gestionar líneas de asiento"
    ON lineas_asiento FOR ALL
    USING (
        asiento_id IN (
            SELECT a.id FROM asientos_contables a
            JOIN empresas e ON a.empresa_id = e.id
            WHERE e.estudio_id = public.get_user_estudio_id()
        )
        AND public.get_user_role() IN ('admin', 'contador')
    );

-- ============================================================
-- FUNCIÓN: validar balance de asiento
-- ============================================================
CREATE OR REPLACE FUNCTION public.validar_balance_asiento()
RETURNS TRIGGER AS $$
DECLARE
    total_debe NUMERIC;
    total_haber NUMERIC;
BEGIN
    SELECT
        COALESCE(SUM(debe), 0),
        COALESCE(SUM(haber), 0)
    INTO total_debe, total_haber
    FROM lineas_asiento
    WHERE asiento_id = NEW.asiento_id;

    IF total_debe != total_haber THEN
        RAISE EXCEPTION 'El asiento no está balanceado. Debe: %, Haber: %', total_debe, total_haber;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para validar balance al modificar líneas
CREATE TRIGGER trg_validar_balance
    AFTER INSERT OR UPDATE OR DELETE ON lineas_asiento
    FOR EACH ROW EXECUTE FUNCTION validar_balance_asiento();
