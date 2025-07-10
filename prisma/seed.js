const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcrypt');

async function main() {
  const emailAdmin = 'ramelectronics@proton.me';
  const passwordPlain = 'ñhDTmbP6YkT_ñ';

  // Crear hash seguro para la contraseña
  const passwordHash = await bcrypt.hash(passwordPlain, 10);

  // Buscar usuario existente
  const existing = await prisma.user.findUnique({ where: { email: emailAdmin } });

  if (!existing) {
    // Crear usuario administrador
    await prisma.user.create({
      data: {
        nombre: 'Administrador Principal',
        email: emailAdmin,
        password: passwordHash,
        rol: 'UAI',
        userName: 'admin',
      },
    });
    console.log('Usuario administrador creado');
  } else {
    console.log('Usuario administrador ya existe');
  }

  // Seed de CatalogoSKU
  const skuData = [
    { id: 3, nombre: "4KM36A", skuItem: "81809" },
    { id: 1, nombre: "4KM37", skuItem: "69746" },
    { id: 2, nombre: "4KM36B", skuItem: "69360" },
    { id: 4, nombre: "EXTENDERAP", skuItem: "72608" },
    { id: 5, nombre: "EXTENDERHUAWEI", skuItem: "67278" },
    { id: 6, nombre: "APEH7", skuItem: "80333" },
    { id: 7, nombre: "4KALEXA", skuItem: "73488" },
    { id: 8, nombre: "V5SMALL", skuItem: "72676" },
    { id: 9, nombre: "V5", skuItem: "66262" },
    { id: 10, nombre: "FIBERHOME", skuItem: "69643" },
    { id: 11, nombre: "ZTE", skuItem: "69644" },
    { id: 12, nombre: "X6", skuItem: "76735" },
    { id: 13, nombre: "FIBERhomeEXTENDED", skuItem: "74497" },
    { id: 14, nombre: "SOUNDBOX", skuItem: "69358" },
  ];

  for (const item of skuData) {
    await prisma.catalogoSKU.upsert({
      where: { id: item.id },
      update: {},
      create: item,
    });
  }
  console.log('CatalogoSKU seed completado');

  // Seed de Estados/Fases principales
  const estados = [
    { id: 1, nombre: "TestInicial", codigoInterno: "TI" },
    { id: 2, nombre: "Cosmetica", codigoInterno: "COS" },
    { id: 3, nombre: "Limpieza", codigoInterno: "LIM" },
    { id: 4, nombre: "LiberacionLimpieza", codigoInterno: "LL" },
    { id: 5, nombre: "Retest", codigoInterno: "RET" },
    { id: 6, nombre: "Empaque", codigoInterno: "EMP" },
    { id: 7, nombre: "Scrap", codigoInterno: "SCR" },
    { id: 8, nombre: "Reparacion", codigoInterno: "REP" },
  ];

  for (const estado of estados) {
    await prisma.estado.upsert({
      where: { id: estado.id },
      update: {},
      create: estado,
    });
  }
  console.log('Estados seed completado');

  // Obtener todos los estados y crear un mapa nombre -> id
  const estadosDb = await prisma.estado.findMany();
  const estadoMap = {};
  estadosDb.forEach(e => estadoMap[e.nombre] = e.id);

  // Seed de Transiciones permitidas usando los IDs de estado
  const transiciones = [];
  let idTrans = 1;
  // Flujo principal
  const flow = [
    "TestInicial", "Cosmetica", "Limpieza", "LiberacionLimpieza", "Retest", "Empaque"
  ];
  for (let i = 0; i < flow.length - 1; i++) {
    const from = flow[i];
    const to = flow[i + 1];
    // Completar
    transiciones.push({ id: idTrans++, estadoDesdeId: estadoMap[from], estadoHaciaId: estadoMap[to], nombreEvento: `Completar ${from}`, rolesPermitidos: "U.Reg, UV" });
    // Scrap
    if (from !== "Empaque") {
      transiciones.push({ id: idTrans++, estadoDesdeId: estadoMap[from], estadoHaciaId: estadoMap["Scrap"], nombreEvento: `Rechazar ${from}`, rolesPermitidos: "U.Reg, UV" });
    }
    // Reparar
    if (from !== "Empaque") {
      transiciones.push({ id: idTrans++, estadoDesdeId: estadoMap[from], estadoHaciaId: estadoMap["Reparacion"], nombreEvento: `Reparar ${from}`, rolesPermitidos: "U.Reg, UV" });
    }
    // Reintegrar
    transiciones.push({ id: idTrans++, estadoDesdeId: estadoMap[from], estadoHaciaId: estadoMap[from], nombreEvento: `Reintegrar ${from}`, rolesPermitidos: "U.Reg, UV" });
  }
  // Transiciones desde Reparacion: regresar solo al estado de donde vino y a Scrap
  for (let i = 0; i < flow.length - 1; i++) {
    const from = flow[i];
    // Reparacion -> estado anterior
    transiciones.push({ id: idTrans++, estadoDesdeId: estadoMap["Reparacion"], estadoHaciaId: estadoMap[from], nombreEvento: `Regresar a ${from} desde Reparacion`, rolesPermitidos: "U.Reg, UV" });
  }
  // Reparacion -> Scrap
  transiciones.push({ id: idTrans++, estadoDesdeId: estadoMap["Reparacion"], estadoHaciaId: estadoMap["Scrap"], nombreEvento: `Rechazar desde Reparacion`, rolesPermitidos: "U.Reg, UV" });

  for (const trans of transiciones) {
    await prisma.transicionEstado.upsert({
      where: { id: trans.id },
      update: {},
      create: trans,
    });
  }
  console.log('Transiciones seed completado');

  // Seed de MotivosScrap
  const motivosScrap = [
    { id: 1, nombre: "INFESTADO" },
    { id: 2, nombre: "ELECTRONICA" },
    { id: 3, nombre: "COSMETICA" },
  ];

  for (const motivo of motivosScrap) {
    await prisma.motivoScrap.upsert({
      where: { id: motivo.id },
      update: {},
      create: motivo,
    });
  }
  console.log('MotivosScrap seed completado');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });