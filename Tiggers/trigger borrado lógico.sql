-- Función para manejar borrado lógico de modems
CREATE OR REPLACE FUNCTION borrado_logico_modem()
RETURNS TRIGGER AS $$
BEGIN
    -- En lugar de eliminar, marcar como eliminado
    IF TG_OP = 'DELETE' THEN
        UPDATE "Modem"
        SET "deletedAt" = NOW(),
            "updatedAt" = NOW()
        WHERE id = OLD.id;
        
        -- Registrar la acción en el log
        INSERT INTO "Log" (
            accion,
            entidad,
            detalle,
            "userId",
            "createdAt"
        )
        VALUES (
            'ELIMINAR_LOGICO',
            'Modem',
            'Eliminación lógica del modem con SN: ' || OLD.sn,
            -- Aquí necesitamos el ID del usuario que realiza la acción
            -- Como no lo tenemos en el contexto del trigger, usamos un valor por defecto
            1, -- Usuario sistema o se podría usar una variable de sesión
            NOW()
        );
        
        RETURN NULL; -- No elimina realmente el registro
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para manejar borrado lógico de modems
CREATE TRIGGER borrado_logico_modem_trigger
BEFORE DELETE ON "Modem"
FOR EACH ROW
EXECUTE FUNCTION borrado_logico_modem();

-- Función similar para Lote
CREATE OR REPLACE FUNCTION borrado_logico_lote()
RETURNS TRIGGER AS $$
BEGIN
    -- En lugar de eliminar, marcar como eliminado
    IF TG_OP = 'DELETE' THEN
        UPDATE "Lote"
        SET "deletedAt" = NOW(),
            "updatedAt" = NOW()
        WHERE id = OLD.id;
        
        -- Registrar la acción en el log
        INSERT INTO "Log" (
            accion,
            entidad,
            detalle,
            "userId",
            "createdAt"
        )
        VALUES (
            'ELIMINAR_LOGICO',
            'Lote',
            'Eliminación lógica del lote: ' || OLD.numero,
            1, -- Usuario sistema o variable de sesión
            NOW()
        );
        
        RETURN NULL; -- No elimina realmente el registro
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para manejar borrado lógico de lotes
CREATE TRIGGER borrado_logico_lote_trigger
BEFORE DELETE ON "Lote"
FOR EACH ROW
EXECUTE FUNCTION borrado_logico_lote();