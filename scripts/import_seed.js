import { PrismaClient } from '@prisma/client';
import fs from 'fs';

const prisma = new PrismaClient();

async function main() {
  const data = JSON.parse(fs.readFileSync('./datasets/Inventario Fiberhome_filtrado.json', 'utf-8'));

  // Buscar SKU Fiberhome X-10 directamente por nombre o crearlo si no existe
  let sku = await prisma.catalogoSKU.findUnique({
    where: { nombre: "Fiberhome X-10" }
  });

  if (!sku) {
    sku = await prisma.catalogoSKU.create({
      data: {
        nombre: "Fiberhome X-10",
        descripcion: "SKU temporal creado por import_seed.js"
      }
    });
    console.log(`⚠️ SKU 'Fiberhome X-10' no existía. Se creó temporalmente con ID ${sku.id}.`);
  }

  // Mapeo de usuarios a estados
  const MAPA_USUARIO_ESTADO = {
    'Registro': 'REGISTRO',
    'Testini': 'TEST_INICIAL',
    'Cosmetica': 'COSMETICA',
    'Liberacion': 'LIBERACION_LIMPIEZA',
    'Retest': 'RETEST',
    'Empaque': 'EMPAQUE'
  };

  const fasesOrdenadas = [
    "REGISTRO",
    "TEST_INICIAL",
    "COSMETICA",
    "LIBERACION_LIMPIEZA",
    "RETEST",
    "EMPAQUE"
  ];

  for (let registro of data) {
    try {
      // Validar o crear usuario temporal
      let user = await prisma.user.findUnique({
        where: { userName: registro.usuario }
      });

      if (!user) {
        user = await prisma.user.create({
          data: {
            nombre: `TEMP ${registro.usuario}`,
            userName: registro.usuario,
            email: `${registro.usuario.toLowerCase()}@temp.com`,
            password: 'temporal123',
            rol: 'UReg',
            activo: true
          }
        });
        console.log(`⚠️ Usuario ${registro.usuario} no existía. Creado temporalmente.`);
      }

      // Obtener nombre de estado según usuario o crear temporal
      const estadoNombre = MAPA_USUARIO_ESTADO[registro.usuario] || `TEMP_${registro.usuario.toUpperCase()}`;

      let estado = await prisma.estado.findUnique({
        where: { nombre: estadoNombre }
      });

      if (!estado) {
        estado = await prisma.estado.create({
          data: {
            nombre: estadoNombre,
            descripcion: `Estado temporal creado por import_seed.js para ${estadoNombre}`,
            codigoInterno: estadoNombre.slice(0,3).toUpperCase(),
            esFinal: false,
            requiereObservacion: false,
            ordenDisplay: 0
          }
        });
        console.log(`⚠️ Estado '${estadoNombre}' no existía. Creado temporalmente con ID ${estado.id}.`);
      }

      // Validar o crear lote temporal si no existe
      let lote;

      if (registro.loteId) {
        lote = await prisma.lote.findUnique({
          where: { id: registro.loteId }
        });
      }

      if (!lote) {
        lote = await prisma.lote.create({
          data: {
            numero: `TEMP-LOTE-${registro.sn}`,
            skuId: sku.id,
            estado: 'EN_PROCESO',
            prioridad: 5,
            responsableId: user.id
          }
        });
        console.log(`⚠️ Lote temporal creado con ID ${lote.id} para SN ${registro.sn}.`);
      }

      // Si fase es null, asignar fase temporal REGISTRO
      if (!registro.fase) {
        registro.fase = "REGISTRO";
        console.log(`⚠️ SN ${registro.sn} no tenía fase. Se asignó 'REGISTRO' como temporal.`);
      }

      // Crea o actualiza Modem
      const modem = await prisma.modem.upsert({
        where: { sn: registro.sn },
        update: {
          estadoActualId: estado.id,
          faseActual: registro.fase,
          responsableId: user.id,
          skuId: sku.id,
          loteId: lote.id
        },
        create: {
          sn: registro.sn,
          estadoActualId: estado.id,
          faseActual: registro.fase,
          responsableId: user.id,
          skuId: sku.id,
          loteId: lote.id
        }
      });

      // Validar e insertar fases previas si faltan
      const faseIndex = fasesOrdenadas.indexOf(registro.fase);

      for (let i = 0; i < faseIndex; i++) {
        const fasePrev = fasesOrdenadas[i];

        const registroPrev = await prisma.registro.findFirst({
          where: {
            sn: registro.sn,
            fase: fasePrev
          }
        });

        if (!registroPrev) {
          await prisma.registro.create({
            data: {
              sn: registro.sn,
              fase: fasePrev,
              estado: 'SN_OK',
              userId: user.id,
              loteId: lote.id,
              modemId: modem.id,
              createdAt: new Date()
            }
          });
          console.log(`⚠️ Registro previo creado: SN ${registro.sn}, fase ${fasePrev}`);
        }
      }

      // Crea Registro actual
      await prisma.registro.create({
        data: {
          sn: registro.sn,
          fase: registro.fase,
          estado: registro.rechazo === 'False' ? 'SN_OK' : 'SCRAP_ELECTRONICO',
          userId: user.id,
          loteId: lote.id,
          modemId: modem.id,
          motivoScrapId: registro.motivoScrapId || null,
          reparacion: registro.reparacion || null,
          createdAt: registro.fecha ? new Date(registro.fecha) : new Date()
        }
      });

      console.log(`✅ Insertado: SN ${registro.sn}`);

    } catch (error) {
      console.error(`❌ Error en SN ${registro.sn}:`, error);
    }
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
