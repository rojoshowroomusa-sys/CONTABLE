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
