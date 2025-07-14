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
        opcion = input("Elige una opción: ").strip()
        if opcion == "1":
            mostrar_resumen(cur)
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
        else:
            print("Opción inválida.")

    cur.close()
    conn.close()

if __name__ == "__main__":
    main()