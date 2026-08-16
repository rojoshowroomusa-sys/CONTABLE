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
