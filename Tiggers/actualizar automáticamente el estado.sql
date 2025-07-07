-- Función para actualizar automáticamente el estado de un lote
-- basado en el estado de sus modems
CREATE OR REPLACE FUNCTION actualizar_estado_lote()
RETURNS TRIGGER AS $$
DECLARE
    v_total_modems INTEGER;
    v_modems_completados INTEGER;
    v_modems_cancelados INTEGER;
    v_modems_pausados INTEGER;
    v_lote_id INTEGER;
BEGIN
    -- Determinar el loteId según la operación
    IF TG_OP = 'UPDATE' OR TG_OP = 'INSERT' THEN
        v_lote_id := NEW."loteId";
    ELSE -- DELETE
        v_lote_id := OLD."loteId";
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
        m."loteId" = v_lote_id
        AND m."deletedAt" IS NULL;
    
    -- Actualizar estado del lote según los conteos
    IF v_total_modems = 0 THEN
        -- No actualizar si no hay modems (podría ser un lote nuevo)
        RETURN NEW;
    ELSIF v_modems_completados + v_modems_cancelados = v_total_modems THEN
        -- Si todos los modems están completados o cancelados
        UPDATE "Lote" SET 
            estado = 'COMPLETADO',
            "updatedAt" = NOW()
        WHERE id = v_lote_id;
    ELSIF v_modems_pausados > 0 THEN
        -- Si al menos un modem está pausado
        UPDATE "Lote" SET 
            estado = 'PAUSADO',
            "updatedAt" = NOW()
        WHERE id = v_lote_id;
    ELSE
        -- En cualquier otro caso, el lote está en proceso
        UPDATE "Lote" SET 
            estado = 'EN_PROCESO',
            "updatedAt" = NOW()
        WHERE id = v_lote_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar el estado del lote cuando se modifica un modem
CREATE TRIGGER actualizar_lote_desde_modem
AFTER INSERT OR UPDATE OF "estadoActualId" OR DELETE ON "Modem"
FOR EACH ROW
EXECUTE FUNCTION actualizar_estado_lote();