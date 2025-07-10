-- Función para actualizar automáticamente el estado de un LoteSku
-- basado en el estado de sus modems
CREATE OR REPLACE FUNCTION actualizar_estado_lotesku()
RETURNS TRIGGER AS $$
DECLARE
    v_total_modems INTEGER;
    v_modems_completados INTEGER;
    v_modems_cancelados INTEGER;
    v_modems_pausados INTEGER;
    v_lotesku_id INTEGER;
BEGIN
    -- Determinar el loteSkuId según la operación
    IF TG_OP = 'UPDATE' OR TG_OP = 'INSERT' THEN
        v_lotesku_id := NEW."loteSkuId";
    ELSE -- DELETE
        v_lotesku_id := OLD."loteSkuId";
    END IF;
    
    -- Contar modems en cada estado
    SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN e."codigoInterno" = 'COMPLETADO' THEN 1 ELSE 0 END) as completados,
        SUM(CASE WHEN e."codigoInterno" = 'SCRAP' THEN 1 ELSE 0 END) as cancelados,
        SUM(CASE WHEN e."codigoInterno" = 'PAUSADO' THEN 1 ELSE 0 END) as pausados
    INTO 
        v_total_modems, v_modems_completados, v_modems_cancelados, v_modems_pausados
    FROM 
        "Modem" m
        JOIN "Estado" e ON m."estadoActualId" = e.id
    WHERE 
        m."loteSkuId" = v_lotesku_id
        AND m."deletedAt" IS NULL;
    
    -- Actualizar estado del LoteSku según los conteos
    IF v_total_modems = 0 THEN
        RETURN NEW;
    ELSIF v_modems_completados + v_modems_cancelados = v_total_modems THEN
        UPDATE "LoteSku" SET 
            estado = 'COMPLETADO',
            "updatedAt" = NOW()
        WHERE id = v_lotesku_id;
    ELSIF v_modems_pausados > 0 THEN
        UPDATE "LoteSku" SET 
            estado = 'PAUSADO',
            "updatedAt" = NOW()
        WHERE id = v_lotesku_id;
    ELSE
        UPDATE "LoteSku" SET 
            estado = 'EN_PROCESO',
            "updatedAt" = NOW()
        WHERE id = v_lotesku_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar el estado del LoteSku cuando se modifica un modem
DROP TRIGGER IF EXISTS actualizar_lotesku_desde_modem ON "Modem";
CREATE TRIGGER actualizar_lotesku_desde_modem
AFTER INSERT OR UPDATE OF "estadoActualId" OR DELETE ON "Modem"
FOR EACH ROW
EXECUTE FUNCTION actualizar_estado_lotesku();