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
-- ============================================================
-- MIGRACIÓN: Facturación
-- ============================================================

-- 1. TIPOS
CREATE TYPE tipo_comprobante AS ENUM ('factura_a', 'factura_b', 'factura_c', 'nota_credito', 'nota_debito', 'presupuesto');
CREATE TYPE tipo_operacion AS ENUM ('venta', 'compra');
CREATE TYPE estado_comprobante AS ENUM ('borrador', 'emitido', 'cancelado', 'anulado');

-- 2. TABLA: puntos_venta
CREATE TABLE puntos_venta (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    numero INTEGER NOT NULL,
    tipo_comprobante tipo_comprobante NOT NULL,
    ultimo_numero INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(empresa_id, numero, tipo_comprobante)
);

-- 3. TABLA: comprobantes_fiscales
CREATE TABLE comprobantes_fiscales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    tipo tipo_comprobante NOT NULL,
    operacion tipo_operacion NOT NULL,
    punto_venta_id UUID NOT NULL REFERENCES puntos_venta(id),
    numero INTEGER NOT NULL,
    fecha DATE NOT NULL DEFAULT CURRENT_DATE,
    cliente_proveedor_id UUID,
    razon_social VARCHAR(255) NOT NULL,
    identificacion_fiscal VARCHAR(50) NOT NULL,
    tipo_iva VARCHAR(20) NOT NULL DEFAULT 'responsable_inscripto',
    neto_gravado NUMERIC(15,2) NOT NULL DEFAULT 0,
    iva NUMERIC(15,2) NOT NULL DEFAULT 0,
    exento NUMERIC(15,2) NOT NULL DEFAULT 0,
    no_gravado NUMERIC(15,2) NOT NULL DEFAULT 0,
    total NUMERIC(15,2) NOT NULL DEFAULT 0,
    estado estado_comprobante NOT NULL DEFAULT 'borrador',
    cae VARCHAR(20),
    fecha_vto_cae DATE,
    comprobante_original_id UUID REFERENCES comprobantes_fiscales(id),
    asiento_id UUID REFERENCES asientos_contables(id),
    notas TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(empresa_id, punto_venta_id, numero)
);

-- 4. TABLA: items_comprobante
CREATE TABLE items_comprobante (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    comprobante_id UUID NOT NULL REFERENCES comprobantes_fiscales(id) ON DELETE CASCADE,
    orden INTEGER NOT NULL DEFAULT 1,
    descripcion VARCHAR(500) NOT NULL,
    cantidad NUMERIC(10,2) NOT NULL DEFAULT 1,
    precio_unitario NUMERIC(15,2) NOT NULL DEFAULT 0,
    alicuota_iva NUMERIC(5,2) NOT NULL DEFAULT 21.00,
    subtotal NUMERIC(15,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. TABLA: alicuotas_iva
CREATE TABLE alicuotas_iva (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    porcentaje NUMERIC(5,2) NOT NULL,
    descripcion VARCHAR(100) NOT NULL,
    activa BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. ÍNDICES
CREATE INDEX idx_puntos_venta_empresa_id ON puntos_venta(empresa_id);
CREATE INDEX idx_comprobantes_empresa_id ON comprobantes_fiscales(empresa_id);
CREATE INDEX idx_comprobantes_fecha ON comprobantes_fiscales(fecha);
CREATE INDEX idx_comprobantes_estado ON comprobantes_fiscales(estado);
CREATE INDEX idx_comprobantes_tipo ON comprobantes_fiscales(tipo);
CREATE INDEX idx_items_comprobante_comprobante_id ON items_comprobante(comprobante_id);
CREATE INDEX idx_alicuotas_iva_empresa_id ON alicuotas_iva(empresa_id);

-- 7. RLS
ALTER TABLE puntos_venta ENABLE ROW LEVEL SECURITY;
ALTER TABLE comprobantes_fiscales ENABLE ROW LEVEL SECURITY;
ALTER TABLE items_comprobante ENABLE ROW LEVEL SECURITY;
ALTER TABLE alicuotas_iva ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios ven puntos de venta de empresas de su estudio"
    ON puntos_venta FOR ALL
    USING (
        empresa_id IN (SELECT id FROM empresas WHERE estudio_id = public.get_user_estudio_id())
        AND public.get_user_role() IN ('admin', 'contador')
    );

CREATE POLICY "Usuarios ven comprobantes de empresas de su estudio"
    ON comprobantes_fiscales FOR ALL
    USING (
        empresa_id IN (SELECT id FROM empresas WHERE estudio_id = public.get_user_estudio_id())
        AND public.get_user_role() IN ('admin', 'contador')
    );

CREATE POLICY "Usuarios ven items de comprobantes de su estudio"
    ON items_comprobante FOR ALL
    USING (
        comprobante_id IN (
            SELECT id FROM comprobantes_fiscales
            WHERE empresa_id IN (SELECT id FROM empresas WHERE estudio_id = public.get_user_estudio_id())
        )
        AND public.get_user_role() IN ('admin', 'contador')
    );

CREATE POLICY "Usuarios ven alícuotas de empresas de su estudio"
    ON alicuotas_iva FOR ALL
    USING (
        empresa_id IN (SELECT id FROM empresas WHERE estudio_id = public.get_user_estudio_id())
        AND public.get_user_role() IN ('admin', 'contador')
    );

-- 8. TRIGGERS
CREATE TRIGGER set_comprobantes_fiscales_updated_at
    BEFORE UPDATE ON comprobantes_fiscales
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
-- ============================================================
-- MIGRACIÓN: Impuestos
-- ============================================================

-- 1. TIPOS
CREATE TYPE tipo_retencion AS ENUM ('iva', 'ganancias', 'iibb', 'suss', 'honorarios', 'otros');
CREATE TYPE tipo_percepcion AS ENUM ('iva', 'ganancias', 'iibb', 'suss', 'otros');

-- 2. TABLA: retenciones
CREATE TABLE retenciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    tipo tipo_retencion NOT NULL,
    fecha DATE NOT NULL DEFAULT CURRENT_DATE,
    numero VARCHAR(50) NOT NULL,
    tercero_tipo VARCHAR(20) NOT NULL DEFAULT 'proveedor',
    tercero_id UUID,
    razon_social VARCHAR(255) NOT NULL,
    identificacion_fiscal VARCHAR(50) NOT NULL,
    base_imponible NUMERIC(15,2) NOT NULL DEFAULT 0,
    alicuota NUMERIC(5,2) NOT NULL DEFAULT 0,
    monto NUMERIC(15,2) NOT NULL DEFAULT 0,
    constancia VARCHAR(100),
    comprobante_original_id UUID REFERENCES comprobantes_fiscales(id),
    asiento_id UUID REFERENCES asientos_contables(id),
    notas TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. TABLA: percepciones
CREATE TABLE percepciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    tipo tipo_percepcion NOT NULL,
    fecha DATE NOT NULL DEFAULT CURRENT_DATE,
    numero VARCHAR(50) NOT NULL,
    tercero_tipo VARCHAR(20) NOT NULL DEFAULT 'cliente',
    tercero_id UUID,
    razon_social VARCHAR(255) NOT NULL,
    identificacion_fiscal VARCHAR(50) NOT NULL,
    base_imponible NUMERIC(15,2) NOT NULL DEFAULT 0,
    alicuota NUMERIC(5,2) NOT NULL DEFAULT 0,
    monto NUMERIC(15,2) NOT NULL DEFAULT 0,
    comprobante_original_id UUID REFERENCES comprobantes_fiscales(id),
    asiento_id UUID REFERENCES asientos_contables(id),
    notas TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. TABLA: libro_iva_ventas
CREATE TABLE libro_iva_ventas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    comprobante_id UUID NOT NULL REFERENCES comprobantes_fiscales(id),
    fecha DATE NOT NULL,
    tipo_comprobante VARCHAR(50) NOT NULL,
    punto_venta INTEGER NOT NULL,
    numero_comprobante INTEGER NOT NULL,
    identificacion_fiscal VARCHAR(50) NOT NULL,
    razon_social VARCHAR(255) NOT NULL,
    neto_gravado NUMERIC(15,2) NOT NULL DEFAULT 0,
    iva NUMERIC(15,2) NOT NULL DEFAULT 0,
    exento NUMERIC(15,2) NOT NULL DEFAULT 0,
    total NUMERIC(15,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. TABLA: libro_iva_compras
CREATE TABLE libro_iva_compras (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    comprobante_id UUID NOT NULL REFERENCES comprobantes_fiscales(id),
    fecha DATE NOT NULL,
    tipo_comprobante VARCHAR(50) NOT NULL,
    punto_venta INTEGER NOT NULL,
    numero_comprobante INTEGER NOT NULL,
    identificacion_fiscal VARCHAR(50) NOT NULL,
    razon_social VARCHAR(255) NOT NULL,
    neto_gravado NUMERIC(15,2) NOT NULL DEFAULT 0,
    iva NUMERIC(15,2) NOT NULL DEFAULT 0,
    exento NUMERIC(15,2) NOT NULL DEFAULT 0,
    total NUMERIC(15,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. ÍNDICES
CREATE INDEX idx_retenciones_empresa_id ON retenciones(empresa_id);
CREATE INDEX idx_retenciones_fecha ON retenciones(fecha);
CREATE INDEX idx_retenciones_tipo ON retenciones(tipo);
CREATE INDEX idx_percepciones_empresa_id ON percepciones(empresa_id);
CREATE INDEX idx_percepciones_fecha ON percepciones(fecha);
CREATE INDEX idx_percepciones_tipo ON percepciones(tipo);
CREATE INDEX idx_libro_iva_ventas_empresa_id ON libro_iva_ventas(empresa_id);
CREATE INDEX idx_libro_iva_ventas_fecha ON libro_iva_ventas(fecha);
CREATE INDEX idx_libro_iva_compras_empresa_id ON libro_iva_compras(empresa_id);
CREATE INDEX idx_libro_iva_compras_fecha ON libro_iva_compras(fecha);

-- 7. RLS
ALTER TABLE retenciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE percepciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE libro_iva_ventas ENABLE ROW LEVEL SECURITY;
ALTER TABLE libro_iva_compras ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios ven retenciones de empresas de su estudio"
    ON retenciones FOR ALL
    USING (
        empresa_id IN (SELECT id FROM empresas WHERE estudio_id = public.get_user_estudio_id())
        AND public.get_user_role() IN ('admin', 'contador')
    );

CREATE POLICY "Usuarios ven percepciones de empresas de su estudio"
    ON percepciones FOR ALL
    USING (
        empresa_id IN (SELECT id FROM empresas WHERE estudio_id = public.get_user_estudio_id())
        AND public.get_user_role() IN ('admin', 'contador')
    );

CREATE POLICY "Usuarios ven libro IVA ventas de su estudio"
    ON libro_iva_ventas FOR ALL
    USING (
        empresa_id IN (SELECT id FROM empresas WHERE estudio_id = public.get_user_estudio_id())
        AND public.get_user_role() IN ('admin', 'contador')
    );

CREATE POLICY "Usuarios ven libro IVA compras de su estudio"
    ON libro_iva_compras FOR ALL
    USING (
        empresa_id IN (SELECT id FROM empresas WHERE estudio_id = public.get_user_estudio_id())
        AND public.get_user_role() IN ('admin', 'contador')
    );

-- 8. TRIGGERS
CREATE TRIGGER set_retenciones_updated_at
    BEFORE UPDATE ON retenciones
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_percepciones_updated_at
    BEFORE UPDATE ON percepciones
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
-- ============================================================
-- MIGRACIÓN: Cuentas Corrientes
-- ============================================================

-- 1. TIPOS
CREATE TYPE tercero_tipo AS ENUM ('cliente', 'proveedor');
CREATE TYPE estado_letra AS ENUM ('pendiente', 'aceptada', 'vencida', 'pagada', 'protestada');
CREATE TYPE estado_cheque AS ENUM ('pendiente', 'cobrado', 'rechazado', 'depositado', 'endosado');

-- 2. TABLA: terceros (clientes/proveedores unificados)
CREATE TABLE terceros (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    tipo tercero_tipo NOT NULL,
    razon_social VARCHAR(255) NOT NULL,
    identificacion_fiscal VARCHAR(50) NOT NULL,
    domicilio VARCHAR(500),
    telefono VARCHAR(50),
    email VARCHAR(255),
    condicion_iva VARCHAR(50) DEFAULT 'responsable_inscripto',
    saldo NUMERIC(15,2) NOT NULL DEFAULT 0,
    activo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(empresa_id, identificacion_fiscal)
);

-- 3. TABLA: cuenta_corriente
CREATE TABLE cuenta_corriente (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    tercero_id UUID NOT NULL REFERENCES terceros(id) ON DELETE CASCADE,
    saldo NUMERIC(15,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(empresa_id, tercero_id)
);

-- 4. TABLA: movimiento_cc
CREATE TABLE movimiento_cc (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cuenta_corriente_id UUID NOT NULL REFERENCES cuenta_corriente(id) ON DELETE CASCADE,
    fecha DATE NOT NULL DEFAULT CURRENT_DATE,
    tipo VARCHAR(50) NOT NULL,
    descripcion VARCHAR(500) NOT NULL,
    comprobante_id UUID REFERENCES comprobantes_fiscales(id),
    debito NUMERIC(15,2) NOT NULL DEFAULT 0,
    credito NUMERIC(15,2) NOT NULL DEFAULT 0,
    saldo NUMERIC(15,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. TABLA: letras
CREATE TABLE letras (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    tercero_id UUID NOT NULL REFERENCES terceros(id),
    numero VARCHAR(50) NOT NULL,
    fecha_emision DATE NOT NULL DEFAULT CURRENT_DATE,
    fecha_vencimiento DATE NOT NULL,
    monto NUMERIC(15,2) NOT NULL,
    moneda VARCHAR(3) DEFAULT 'ARS',
    estado estado_letra NOT NULL DEFAULT 'pendiente',
    tercero_tipo tercero_tipo NOT NULL,
    notas TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. TABLA: cheques
CREATE TABLE cheques (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    numero VARCHAR(50) NOT NULL,
    banco VARCHAR(100) NOT NULL,
    sucursal VARCHAR(100),
    fecha_emision DATE NOT NULL,
    fecha_vencimiento DATE NOT NULL,
    monto NUMERIC(15,2) NOT NULL,
    tercero_tipo tercero_tipo NOT NULL,
    tercero_id UUID NOT NULL REFERENCES terceros(id),
    estado estado_cheque NOT NULL DEFAULT 'pendiente',
    cuenta_corriente_id UUID REFERENCES cuenta_corriente(id),
    notas TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. ÍNDICES
CREATE INDEX idx_terceros_empresa_id ON terceros(empresa_id);
CREATE INDEX idx_terceros_tipo ON terceros(tipo);
CREATE INDEX idx_cuenta_corriente_empresa_id ON cuenta_corriente(empresa_id);
CREATE INDEX idx_cuenta_corriente_tercero_id ON cuenta_corriente(tercero_id);
CREATE INDEX idx_movimiento_cc_cuenta_id ON movimiento_cc(cuenta_corriente_id);
CREATE INDEX idx_movimiento_cc_fecha ON movimiento_cc(fecha);
CREATE INDEX idx_letras_empresa_id ON letras(empresa_id);
CREATE INDEX idx_letras_estado ON letras(estado);
CREATE INDEX idx_letras_tercero_id ON letras(tercero_id);
CREATE INDEX idx_cheques_empresa_id ON cheques(empresa_id);
CREATE INDEX idx_cheques_estado ON cheques(estado);
CREATE INDEX idx_cheques_tercero_id ON cheques(tercero_id);

-- 8. RLS
ALTER TABLE terceros ENABLE ROW LEVEL SECURITY;
ALTER TABLE cuenta_corriente ENABLE ROW LEVEL SECURITY;
ALTER TABLE movimiento_cc ENABLE ROW LEVEL SECURITY;
ALTER TABLE letras ENABLE ROW LEVEL SECURITY;
ALTER TABLE cheques ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios ven terceros de empresas de su estudio"
    ON terceros FOR ALL
    USING (
        empresa_id IN (SELECT id FROM empresas WHERE estudio_id = public.get_user_estudio_id())
        AND public.get_user_role() IN ('admin', 'contador')
    );

CREATE POLICY "Usuarios ven cuentas corrientes de empresas de su estudio"
    ON cuenta_corriente FOR ALL
    USING (
        empresa_id IN (SELECT id FROM empresas WHERE estudio_id = public.get_user_estudio_id())
        AND public.get_user_role() IN ('admin', 'contador')
    );

CREATE POLICY "Usuarios ven movimientos de cc de su estudio"
    ON movimiento_cc FOR ALL
    USING (
        cuenta_corriente_id IN (
            SELECT id FROM cuenta_corriente
            WHERE empresa_id IN (SELECT id FROM empresas WHERE estudio_id = public.get_user_estudio_id())
        )
        AND public.get_user_role() IN ('admin', 'contador')
    );

CREATE POLICY "Usuarios ven letras de empresas de su estudio"
    ON letras FOR ALL
    USING (
        empresa_id IN (SELECT id FROM empresas WHERE estudio_id = public.get_user_estudio_id())
        AND public.get_user_role() IN ('admin', 'contador')
    );

CREATE POLICY "Usuarios ven cheques de empresas de su estudio"
    ON cheques FOR ALL
    USING (
        empresa_id IN (SELECT id FROM empresas WHERE estudio_id = public.get_user_estudio_id())
        AND public.get_user_role() IN ('admin', 'contador')
    );

-- 9. TRIGGERS
CREATE TRIGGER set_terceros_updated_at
    BEFORE UPDATE ON terceros
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_cuenta_corriente_updated_at
    BEFORE UPDATE ON cuenta_corriente
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_letras_updated_at
    BEFORE UPDATE ON letras
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_cheques_updated_at
    BEFORE UPDATE ON cheques
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
-- ============================================================
-- MIGRACIÓN: Tesorería
-- ============================================================

-- 1. TIPOS
CREATE TYPE estado_movimiento_caja AS ENUM ('pendiente', 'confirmado', 'anulado');
CREATE TYPE estado_movimiento_banco AS ENUM ('pendiente', 'reconciliado', 'en_banco');
CREATE TYPE tipo_conciliacion AS ENUM ('deposito', 'retiro', 'transferencia', 'cheque', 'intereses', 'comision', 'otro');

-- 2. TABLA: cajas
CREATE TABLE cajas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    nombre VARCHAR(255) NOT NULL,
    moneda VARCHAR(3) DEFAULT 'ARS',
    saldo_inicial NUMERIC(15,2) NOT NULL DEFAULT 0,
    saldo_actual NUMERIC(15,2) NOT NULL DEFAULT 0,
    activa BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. TABLA: movimientos_caja
CREATE TABLE movimientos_caja (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    caja_id UUID NOT NULL REFERENCES cajas(id) ON DELETE CASCADE,
    fecha DATE NOT NULL DEFAULT CURRENT_DATE,
    tipo VARCHAR(50) NOT NULL,
    descripcion VARCHAR(500) NOT NULL,
    comprobante_id UUID REFERENCES comprobantes_fiscales(id),
    monto NUMERIC(15,2) NOT NULL,
    saldo_anterior NUMERIC(15,2) NOT NULL,
    saldo_posterior NUMERIC(15,2) NOT NULL,
    estado estado_movimiento_caja NOT NULL DEFAULT 'pendiente',
    tercero_id UUID REFERENCES terceros(id),
    notas TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. TABLA: cuentas_bancarias
CREATE TABLE cuentas_bancarias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    banco VARCHAR(255) NOT NULL,
    numero_cuenta VARCHAR(100) NOT NULL,
    tipo_cuenta VARCHAR(50) DEFAULT 'cuenta_corriente',
    moneda VARCHAR(3) DEFAULT 'ARS',
    saldo_inicial NUMERIC(15,2) NOT NULL DEFAULT 0,
    saldo_actual NUMERIC(15,2) NOT NULL DEFAULT 0,
    titular VARCHAR(255),
    cbu VARCHAR(22),
    activa BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. TABLA: movimientos_banco
CREATE TABLE movimientos_banco (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cuenta_bancaria_id UUID NOT NULL REFERENCES cuentas_bancarias(id) ON DELETE CASCADE,
    fecha DATE NOT NULL DEFAULT CURRENT_DATE,
    tipo tipo_conciliacion NOT NULL,
    descripcion VARCHAR(500) NOT NULL,
    comprobante_id UUID REFERENCES comprobantes_fiscales(id),
    monto NUMERIC(15,2) NOT NULL,
    saldo_anterior NUMERIC(15,2) NOT NULL,
    saldo_posterior NUMERIC(15,2) NOT NULL,
    estado estado_movimiento_banco NOT NULL DEFAULT 'pendiente',
    cheque_id UUID REFERENCES cheques(id),
    tercero_id UUID REFERENCES terceros(id),
    notas TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. TABLA: conciliacion_bancaria
CREATE TABLE conciliacion_bancaria (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    cuenta_bancaria_id UUID NOT NULL REFERENCES cuentas_bancarias(id),
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    saldo_contable NUMERIC(15,2) NOT NULL,
    saldo_bancario NUMERIC(15,2) NOT NULL,
    diferencias NUMERIC(15,2) NOT NULL DEFAULT 0,
    estado VARCHAR(20) NOT NULL DEFAULT 'borrador',
    notas TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. TABLA: items_conciliacion
CREATE TABLE items_conciliacion (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conciliacion_id UUID NOT NULL REFERENCES conciliacion_bancaria(id) ON DELETE CASCADE,
    movimientoid UUID NOT NULL REFERENCES movimientos_banco(id),
    conciliado BOOLEAN NOT NULL DEFAULT false,
    notas TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. ÍNDICES
CREATE INDEX idx_cajas_empresa_id ON cajas(empresa_id);
CREATE INDEX idx_movimientos_caja_caja_id ON movimientos_caja(caja_id);
CREATE INDEX idx_movimientos_caja_fecha ON movimientos_caja(fecha);
CREATE INDEX idx_movimientos_caja_estado ON movimientos_caja(estado);
CREATE INDEX idx_cuentas_bancarias_empresa_id ON cuentas_bancarias(empresa_id);
CREATE INDEX idx_movimientos_banco_cuenta_id ON movimientos_banco(cuenta_bancaria_id);
CREATE INDEX idx_movimientos_banco_fecha ON movimientos_banco(fecha);
CREATE INDEX idx_movimientos_banco_estado ON movimientos_banco(estado);
CREATE INDEX idx_conciliacion_empresa_id ON conciliacion_bancaria(empresa_id);
CREATE INDEX idx_items_conciliacion_conciliacion_id ON items_conciliacion(conciliacion_id);

-- 9. RLS
ALTER TABLE cajas ENABLE ROW LEVEL SECURITY;
ALTER TABLE movimientos_caja ENABLE ROW LEVEL SECURITY;
ALTER TABLE cuentas_bancarias ENABLE ROW LEVEL SECURITY;
ALTER TABLE movimientos_banco ENABLE ROW LEVEL SECURITY;
ALTER TABLE conciliacion_bancaria ENABLE ROW LEVEL SECURITY;
ALTER TABLE items_conciliacion ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios ven cajas de empresas de su estudio"
    ON cajas FOR ALL
    USING (
        empresa_id IN (SELECT id FROM empresas WHERE estudio_id = public.get_user_estudio_id())
        AND public.get_user_role() IN ('admin', 'contador')
    );

CREATE POLICY "Usuarios ven movimientos de caja de su estudio"
    ON movimientos_caja FOR ALL
    USING (
        caja_id IN (SELECT id FROM cajas WHERE empresa_id IN (SELECT id FROM empresas WHERE estudio_id = public.get_user_estudio_id()))
        AND public.get_user_role() IN ('admin', 'contador')
    );

CREATE POLICY "Usuarios ven cuentas bancarias de empresas de su estudio"
    ON cuentas_bancarias FOR ALL
    USING (
        empresa_id IN (SELECT id FROM empresas WHERE estudio_id = public.get_user_estudio_id())
        AND public.get_user_role() IN ('admin', 'contador')
    );

CREATE POLICY "Usuarios ven movimientos bancarios de su estudio"
    ON movimientos_banco FOR ALL
    USING (
        cuenta_bancaria_id IN (
            SELECT id FROM cuentas_bancarias WHERE empresa_id IN (SELECT id FROM empresas WHERE estudio_id = public.get_user_estudio_id())
        )
        AND public.get_user_role() IN ('admin', 'contador')
    );

CREATE POLICY "Usuarios ven conciliaciones de su estudio"
    ON conciliacion_bancaria FOR ALL
    USING (
        empresa_id IN (SELECT id FROM empresas WHERE estudio_id = public.get_user_estudio_id())
        AND public.get_user_role() IN ('admin', 'contador')
    );

CREATE POLICY "Usuarios ven items conciliacion de su estudio"
    ON items_conciliacion FOR ALL
    USING (
        conciliacion_id IN (
            SELECT id FROM conciliacion_bancaria WHERE empresa_id IN (SELECT id FROM empresas WHERE estudio_id = public.get_user_estudio_id())
        )
        AND public.get_user_role() IN ('admin', 'contador')
    );

-- 10. TRIGGERS
CREATE TRIGGER set_cajas_updated_at
    BEFORE UPDATE ON cajas
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_cuentas_bancarias_updated_at
    BEFORE UPDATE ON cuentas_bancarias
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_conciliacion_bancaria_updated_at
    BEFORE UPDATE ON conciliacion_bancaria
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
-- ============================================================
-- MIGRACIÓN: Módulos Avanzados
-- ============================================================

-- 1. TIPOS
CREATE TYPE estado_convenio AS ENUM ('vigente', 'vencido', 'suspendido');
CREATE TYPE tipo_producto AS ENUM ('producto', 'servicio', 'materia_prima');
CREATE TYPE tipo_movimiento_stock AS ENUM ('ingreso', 'egreso', 'transferencia', 'ajuste');

-- 2. TABLA: convenios_multilaterales
CREATE TABLE convenios_multilaterales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    numero VARCHAR(50) NOT NULL,
    descripcion VARCHAR(500) NOT NULL,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    estado estado_convenio NOT NULL DEFAULT 'vigente',
    porcentaje_retencion NUMERIC(5,2) NOT NULL DEFAULT 0,
    jurisdiccion VARCHAR(100),
    notas TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. TABLA: retenciones_multilaterales
CREATE TABLE retenciones_multilaterales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    convenio_id UUID NOT NULL REFERENCES convenios_multilaterales(id) ON DELETE CASCADE,
    comprobante_id UUID REFERENCES comprobantes_fiscales(id),
    fecha DATE NOT NULL DEFAULT CURRENT_DATE,
    base_imponible NUMERIC(15,2) NOT NULL,
    porcentaje NUMERIC(5,2) NOT NULL,
    monto_retenido NUMERIC(15,2) NOT NULL,
    certificado VARCHAR(100),
    notas TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. TABLA: productos
CREATE TABLE productos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    codigo VARCHAR(50) NOT NULL,
    descripcion VARCHAR(255) NOT NULL,
    tipo tipo_producto NOT NULL DEFAULT 'producto',
    precio_compra NUMERIC(15,2) NOT NULL DEFAULT 0,
    precio_venta NUMERIC(15,2) NOT NULL DEFAULT 0,
    stock_actual NUMERIC(15,3) NOT NULL DEFAULT 0,
    stock_minimo NUMERIC(15,3) NOT NULL DEFAULT 0,
    unidad_medida VARCHAR(20) DEFAULT 'un',
    alicuota_iva NUMERIC(5,2) DEFAULT 21.00,
    activo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(empresa_id, codigo)
);

-- 5. TABLA: movimientos_stock
CREATE TABLE movimientos_stock (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    producto_id UUID NOT NULL REFERENCES productos(id),
    fecha DATE NOT NULL DEFAULT CURRENT_DATE,
    tipo tipo_movimiento_stock NOT NULL,
    cantidad NUMERIC(15,3) NOT NULL,
    precio_unitario NUMERIC(15,2) NOT NULL,
    total NUMERIC(15,2) NOT NULL,
    comprobante_id UUID REFERENCES comprobantes_fiscales(id),
    notas TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. TABLA: empleados
CREATE TABLE empleados (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    legajo VARCHAR(50) NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    cuil VARCHAR(20) NOT NULL,
    fecha_ingreso DATE NOT NULL,
    fecha_egreso DATE,
    puesto VARCHAR(100),
    sector VARCHAR(100),
    salario_base NUMERIC(15,2) NOT NULL DEFAULT 0,
    activo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(empresa_id, legajo)
);

-- 7. TABLA: conceptos_rrhh
CREATE TABLE conceptos_rrhh (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    codigo VARCHAR(50) NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    tipo VARCHAR(50) NOT NULL,
    remunerativo BOOLEAN NOT NULL DEFAULT true,
    porcentaje NUMERIC(5,2),
    monto_fijo NUMERIC(15,2),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. TABLA: legajo_empleado
CREATE TABLE legajo_empleado (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empleado_id UUID NOT NULL REFERENCES empleados(id) ON DELETE CASCADE,
    concepto_id UUID NOT NULL REFERENCES conceptos_rrhh(id),
    fecha_desde DATE NOT NULL,
    fecha_hasta DATE,
    monto NUMERIC(15,2) NOT NULL,
    porcentaje NUMERIC(5,2),
    activo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 9. ÍNDICES
CREATE INDEX idx_convenios_empresa_id ON convenios_multilaterales(empresa_id);
CREATE INDEX idx_retenciones_multilaterales_convenio_id ON retenciones_multilaterales(convenio_id);
CREATE INDEX idx_productos_empresa_id ON productos(empresa_id);
CREATE INDEX idx_movimientos_stock_producto_id ON movimientos_stock(producto_id);
CREATE INDEX idx_movimientos_stock_fecha ON movimientos_stock(fecha);
CREATE INDEX idx_empleados_empresa_id ON empleados(empresa_id);
CREATE INDEX idx_conceptos_rrhh_empresa_id ON conceptos_rrhh(empresa_id);
CREATE INDEX idx_legajo_empleado_empleado_id ON legajo_empleado(empleado_id);

-- 10. RLS
ALTER TABLE convenios_multilaterales ENABLE ROW LEVEL SECURITY;
ALTER TABLE retenciones_multilaterales ENABLE ROW LEVEL SECURITY;
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE movimientos_stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE empleados ENABLE ROW LEVEL SECURITY;
ALTER TABLE conceptos_rrhh ENABLE ROW LEVEL SECURITY;
ALTER TABLE legajo_empleado ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios ven convenios de empresas de su estudio"
    ON convenios_multilaterales FOR ALL
    USING (
        empresa_id IN (SELECT id FROM empresas WHERE estudio_id = public.get_user_estudio_id())
        AND public.get_user_role() IN ('admin', 'contador')
    );

CREATE POLICY "Usuarios ven retenciones multilaterales de su estudio"
    ON retenciones_multilaterales FOR ALL
    USING (
        convenio_id IN (
            SELECT id FROM convenios_multilaterales
            WHERE empresa_id IN (SELECT id FROM empresas WHERE estudio_id = public.get_user_estudio_id())
        )
        AND public.get_user_role() IN ('admin', 'contador')
    );

CREATE POLICY "Usuarios ven productos de empresas de su estudio"
    ON productos FOR ALL
    USING (
        empresa_id IN (SELECT id FROM empresas WHERE estudio_id = public.get_user_estudio_id())
        AND public.get_user_role() IN ('admin', 'contador')
    );

CREATE POLICY "Usuarios ven movimientos stock de su estudio"
    ON movimientos_stock FOR ALL
    USING (
        empresa_id IN (SELECT id FROM empresas WHERE estudio_id = public.get_user_estudio_id())
        AND public.get_user_role() IN ('admin', 'contador')
    );

CREATE POLICY "Usuarios ven empleados de empresas de su estudio"
    ON empleados FOR ALL
    USING (
        empresa_id IN (SELECT id FROM empresas WHERE estudio_id = public.get_user_estudio_id())
        AND public.get_user_role() IN ('admin', 'contador')
    );

CREATE POLICY "Usuarios ven conceptos rrhh de su estudio"
    ON conceptos_rrhh FOR ALL
    USING (
        empresa_id IN (SELECT id FROM empresas WHERE estudio_id = public.get_user_estudio_id())
        AND public.get_user_role() IN ('admin', 'contador')
    );

CREATE POLICY "Usuarios ven legajo empleado de su estudio"
    ON legajo_empleado FOR ALL
    USING (
        empleado_id IN (
            SELECT id FROM empleados
            WHERE empresa_id IN (SELECT id FROM empresas WHERE estudio_id = public.get_user_estudio_id())
        )
        AND public.get_user_role() IN ('admin', 'contador')
    );

-- 11. TRIGGERS
CREATE TRIGGER set_convenios_updated_at
    BEFORE UPDATE ON convenios_multilaterales
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_productos_updated_at
    BEFORE UPDATE ON productos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_empleados_updated_at
    BEFORE UPDATE ON empleados
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
