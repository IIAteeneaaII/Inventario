-- Función para validar transiciones de estado
CREATE OR REPLACE FUNCTION validar_transicion_estado()
RETURNS TRIGGER AS $$
DECLARE
    v_transicion_valida INTEGER;
    v_roles_permitidos TEXT;
    v_rol_usuario TEXT;
BEGIN
    -- Verificar si la transición está permitida
    SELECT COUNT(*), te."rolesPermitidos"
    INTO v_transicion_valida, v_roles_permitidos
    FROM "TransicionEstado" te
    WHERE te."estadoDesdeId" = OLD."estadoActualId" 
    AND te."estadoHaciaId" = NEW."estadoActualId"
    AND te."nombreEvento" = TG_ARGV[0]::TEXT
    GROUP BY te."rolesPermitidos";
    
    IF v_transicion_valida = 0 THEN
        RAISE EXCEPTION 'Transición de estado no permitida de % a %', 
                        OLD."estadoActualId", NEW."estadoActualId";
    END IF;
    
    -- Verificar si el usuario tiene el rol permitido
    SELECT u.rol::TEXT INTO v_rol_usuario
    FROM "User" u 
    WHERE u.id = NEW."responsableId";
    
    IF v_roles_permitidos IS NOT NULL AND v_rol_usuario !~ v_roles_permitidos THEN
        RAISE EXCEPTION 'El usuario con rol % no tiene permiso para esta transición (roles permitidos: %)', 
                        v_rol_usuario, v_roles_permitidos;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para validar transiciones cuando se actualiza un modem
CREATE TRIGGER validar_transicion_modem
BEFORE UPDATE OF "estadoActualId" ON "Modem"
FOR EACH ROW
WHEN (OLD."estadoActualId" IS DISTINCT FROM NEW."estadoActualId")
EXECUTE FUNCTION validar_transicion_estado();

-- Función para registrar automáticamente las transiciones de estado
CREATE OR REPLACE FUNCTION registrar_transicion_estado()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO "EstadoTransicion" (
        "modemId", 
        "estadoAnteriorId", 
        "estadoNuevoId", 
        fase, 
        evento,
        "userId",
        "createdAt"
    )
    VALUES (
        NEW.id,
        OLD."estadoActualId",
        NEW."estadoActualId",
        NEW."faseActual",
        TG_ARGV[0]::TEXT, -- evento pasado como argumento
        NEW."responsableId",
        NOW()
    );
    
    -- Actualizar timestamp de última modificación
    NEW."updatedAt" = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para registrar transiciones cuando se actualiza un modem
CREATE TRIGGER registrar_transicion_modem
AFTER UPDATE OF "estadoActualId" ON "Modem"
FOR EACH ROW
EXECUTE FUNCTION registrar_transicion_estado('actualizacion_estado');