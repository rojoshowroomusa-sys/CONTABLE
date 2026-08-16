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
