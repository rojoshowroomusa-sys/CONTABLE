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
