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
