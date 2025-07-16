import psycopg2
from datetime import datetime

DB_CONFIG = {
    "dbname": "simod_db",
    "user": "simod_user",
    "password": "simod_pass",
    "host": "localhost",
    "port": 5432
}

def get_modems_por_etapa(cur):
    cur.execute("""
        SELECT e.nombre AS etapa, COUNT(m.id) AS cantidad
        FROM "Modem" m
        JOIN "Estado" e ON m."estadoActualId" = e.id
        GROUP BY e.nombre
        ORDER BY cantidad DESC;
    """)
    return cur.fetchall()

def get_modems_por_sku(cur):
    cur.execute("""
        SELECT s.nombre AS sku, COUNT(m.id) AS cantidad
        FROM "Modem" m
        JOIN "CatalogoSKU" s ON m."skuId" = s.id
        GROUP BY s.nombre
        ORDER BY cantidad DESC;
    """)
    return cur.fetchall()

def get_usuarios(cur):
    cur.execute("""
        SELECT id, nombre, "userName", rol FROM "User";
    """)
    return cur.fetchall()

def get_estados(cur):
    cur.execute('SELECT nombre FROM "Estado" ORDER BY id;')
    return [row[0] for row in cur.fetchall()]

def test_transicion(cur, conn, estado_origen, estado_destino, user_id):
    # Busca los IDs de los estados
    cur.execute('SELECT id FROM "Estado" WHERE nombre=%s', (estado_origen,))
    origen = cur.fetchone()
    cur.execute('SELECT id FROM "Estado" WHERE nombre=%s', (estado_destino,))
    destino = cur.fetchone()
    if not origen or not destino:
        print(f"❌ Estado no encontrado: {estado_origen} o {estado_destino}")
        return

    # Busca un módem en el estado origen
    cur.execute('SELECT id FROM "Modem" WHERE "estadoActualId"=%s LIMIT 1', (origen[0],))
    modem_row = cur.fetchone()
    if modem_row:
        modem_id = modem_row[0]
        cur.execute("""
            SELECT nombre_evento FROM obtener_transiciones_disponibles(%s, %s)
        """, (modem_id, user_id))
        transiciones = [row[0] for row in cur.fetchall()]
        print("Transiciones válidas para este usuario y módem:", transiciones)
    else:
        print("No hay módems en el estado origen para consultar transiciones.")
        return

    # Busca módems en el estado origen
    cur.execute('SELECT id, sn FROM "Modem" WHERE "estadoActualId"=%s', (origen[0],))
    modems = cur.fetchall()
    if not modems:
        print(f"ℹ️  No hay módems en estado {estado_origen}")
        return

    errores = 0
    for modem_id, sn in modems:
        try:
            cur.execute("""
                UPDATE "Modem"
                SET "estadoActualId"=%s, "responsableId"=%s
                WHERE id=%s
                RETURNING id
            """, (destino[0], user_id, modem_id))
        except Exception as e:
            print(f"❌ Error al mover SN {sn}: {e}")
            errores += 1
            conn.rollback()  # Ahora sí está definido
    print(f"▶️  Intento de transición {estado_origen} → {estado_destino} por usuario ID {user_id} a las {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"   Total módems procesados: {len(modems)} | Errores: {errores}")

def mostrar_resumen(cur):
    print("\n=== Cantidad de módems por etapa ===")
    for etapa, cantidad in get_modems_por_etapa(cur):
        print(f"{etapa}: {cantidad}")
    print("\n=== Cantidad de módems por SKU ===")
    for sku, cantidad in get_modems_por_sku(cur):
        print(f"{sku}: {cantidad}")

def crear_lote(cur, sku_id, responsable_id, estado='REGISTRO'):
    from time import time
    numero = f"L{int(time())}-{sku_id}"
    cur.execute("""
        INSERT INTO "Lote" (numero, "skuId", estado, "responsableId", "createdAt", "updatedAt")
        VALUES (%s, %s, %s, %s, NOW(), NOW())
        RETURNING id, numero, estado
    """, (numero, sku_id, estado, responsable_id))
    return cur.fetchone()

def asignar_modem_a_lote(cur, sn, sku_id, lote_id, responsable_id, estado='REGISTRO'):
    cur.execute('SELECT id FROM "Estado" WHERE nombre=%s', (estado,))
    estado_row = cur.fetchone()
    if not estado_row:
        print(f"No existe el estado {estado}.")
        return
    cur.execute("""
        UPDATE "Modem"
        SET "loteId"=%s, "responsableId"=%s, "estadoActualId"=%s, "updatedAt"=NOW()
        WHERE sn=%s AND "skuId"=%s
        RETURNING id, sn
    """, (lote_id, responsable_id, estado_row[0], sn, sku_id))
    return cur.fetchone()

def mostrar_lotes(cur, estado):
    cur.execute("""
        SELECT l.id, l.numero, s.nombre AS sku, l.estado, COUNT(m.id) AS modems
        FROM "Lote" l
        JOIN "CatalogoSKU" s ON l."skuId" = s.id
        LEFT JOIN "Modem" m ON m."loteId" = l.id
        WHERE l.estado=%s
        GROUP BY l.id, s.nombre, l.estado
        ORDER BY l.id DESC
    """, (estado,))
    return cur.fetchall()

def unir_lotes_ensamble(cur, lote_ids, responsable_id):
    # Crea un lote de ensamble y asocia los módems de los lotes seleccionados
    from time import time
    numero = f"ENS-{int(time())}"
    cur.execute("""
        INSERT INTO "Lote" (numero, estado, "responsableId", "createdAt", "updatedAt")
        VALUES (%s, %s, %s, NOW(), NOW())
        RETURNING id, numero
    """, (numero, 'ENSAMBLE', responsable_id))
    ensamble = cur.fetchone()
    ensamble_id = ensamble[0]
    # Asocia los módems de los lotes seleccionados al nuevo lote de ensamble
    cur.execute("""
        UPDATE "Modem"
        SET "loteId"=%s, "updatedAt"=NOW()
        WHERE "loteId" = ANY(%s)
    """, (ensamble_id, lote_ids))
    return ensamble

def mostrar_resumen_por_etapa_y_lote(cur):
    cur.execute("""
        SELECT e.nombre AS etapa, l.numero AS lote, COUNT(m.id) AS cantidad
        FROM "Modem" m
        JOIN "Estado" e ON m."estadoActualId" = e.id
        JOIN "Lote" l ON m."loteId" = l.id
        GROUP BY e.nombre, l.numero
        ORDER BY e.nombre, cantidad DESC;
    """)
    resultados = cur.fetchall()
    resumen = {}
    for etapa, lote, cantidad in resultados:
        if etapa not in resumen:
            resumen[etapa] = []
        resumen[etapa].append((lote, cantidad))
    for etapa, lotes in resumen.items():
        total = sum(c for _, c in lotes)
        print(f"\nEtapa: {etapa} | Total módems: {total}")
        for lote, cantidad in lotes:
            print(f"  Lote: {lote} | Cantidad: {cantidad}")

def main():
    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor()

    usuarios = get_usuarios(cur)
    estados = get_estados(cur)

    print("=== Usuarios en el sistema ===")
    for u in usuarios:
        print(f"ID: {u[0]}, Nombre: {u[1]}, UserName: {u[2]}, Rol: {u[3]}")

    while True:
        print("\n--- Menú de pruebas ---")
        print("1. Mostrar resumen de módems")
        print("2. Hacer transición de estado")
        print("3. Salir")
        print("4. Crear lote en REGISTRO")
        print("5. Crear lote en EMPAQUE")
        print("6. Asignar módem a lote")
        print("7. Mostrar lotes por estado")
        print("8. Mover módems de un lote a otro")
        opcion = input("Elige una opción: ").strip()
        if opcion == "1":
            mostrar_resumen_por_etapa_y_lote(cur)
        elif opcion == "2":
            print("\nEstados disponibles:")
            for idx, est in enumerate(estados):
                print(f"{idx+1}. {est}")
            try:
                idx_origen = int(input("Selecciona estado ORIGEN (número): ")) - 1
                idx_destino = int(input("Selecciona estado DESTINO (número): ")) - 1
                if idx_origen not in range(len(estados)) or idx_destino not in range(len(estados)):
                    print("Selección inválida.")
                    continue
                estado_origen = estados[idx_origen]
                estado_destino = estados[idx_destino]
                print("\nUsuarios disponibles:")
                for u in usuarios:
                    print(f"ID: {u[0]}, Nombre: {u[1]}, UserName: {u[2]}, Rol: {u[3]}")
                user_id = int(input("Ingresa el ID del usuario que realiza la transición: "))
                # Busca un módem en el estado origen
                cur.execute('SELECT id FROM "Estado" WHERE nombre=%s', (estado_origen,))
                origen = cur.fetchone()
                if origen:
                    cur.execute('SELECT id FROM "Modem" WHERE "estadoActualId"=%s LIMIT 1', (origen[0],))
                    modem_row = cur.fetchone()
                    if modem_row:
                        modem_id = modem_row[0]
                        cur.execute("""
                            SELECT nombre_evento FROM obtener_transiciones_disponibles(%s, %s)
                        """, (modem_id, user_id))
                        transiciones = [row[0] for row in cur.fetchall()]
                        print("Transiciones válidas para este usuario y módem:", transiciones)
                    else:
                        print("No hay módems en el estado origen para consultar transiciones.")
                        continue
                else:
                    print("No se encontró el estado origen en la base de datos.")
                    continue
                # Mostrar solo las transiciones válidas al usuario
                test_transicion(cur, conn, estado_origen, estado_destino, user_id)
                conn.commit()
            except Exception as e:
                print("Error en la selección o transición:", e)
        elif opcion == "3":
            break
        elif opcion == "4":
            sku_id = input("SKU ID: ").strip()
            responsable_id = int(input("Responsable ID: "))
            lote = crear_lote(cur, sku_id, responsable_id, estado='EN_PROCESO')
            print("Lote creado:", lote)
            conn.commit()
        elif opcion == "5":
            sku_id = input("SKU ID: ").strip()
            responsable_id = int(input("Responsable ID: "))
            lote = crear_lote(cur, sku_id, responsable_id, estado='EN_PROCESO')
            print("Lote creado:", lote)
            conn.commit()
        elif opcion == "6":
            sku_id = input("SKU ID: ").strip()
            lote_id = int(input("Lote ID: "))
            responsable_id = int(input("Responsable ID: "))
            estado = input("Estado (REGISTRO/EMPAQUE): ").strip().upper()
            cur.execute("""
                SELECT id, sn FROM "Modem"
                WHERE "skuId"=%s AND "estadoActualId"=(SELECT id FROM "Estado" WHERE nombre=%s)
            """, (sku_id, estado))
            modems = cur.fetchall()
            print(f"Se encontraron {len(modems)} módems para asignar.")
            for modem_id, sn in modems:
                cur.execute("""
                    UPDATE "Modem"
                    SET "loteId"=%s, "responsableId"=%s, "updatedAt"=NOW()
                    WHERE id=%s
                """, (lote_id, responsable_id, modem_id))
            conn.commit()
            print(f"{len(modems)} módems asignados al lote {lote_id}.")
        elif opcion == "7":
            estado = input("Estado de lote a mostrar (EN_PROCESO/PAUSADO/COMPLETADO/CANCELADO): ").strip().upper()
            lotes = mostrar_lotes(cur, estado)
            for l in lotes:
                print(f"Lote {l[1]} (SKU: {l[2]}) Estado: {l[3]} | Modems: {l[4]}")
        elif opcion == "8":
            lote_origen = int(input("ID del lote origen: "))
            lote_destino = int(input("ID del lote destino: "))
            cur.execute("""
                UPDATE "Modem"
                SET "loteId"=%s, "updatedAt"=NOW()
                WHERE "loteId"=%s
                RETURNING id, sn
            """, (lote_destino, lote_origen))
            modems_actualizados = cur.fetchall()
            conn.commit()
            print(f"{len(modems_actualizados)} módems movidos del lote {lote_origen} al lote {lote_destino}.")
        else:
            print("Opción inválida.")

    cur.close()
    conn.close()

if __name__ == "__main__":
    main()