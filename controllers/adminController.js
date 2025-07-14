const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcrypt');
const userRepo = require('../repositories/userRepositoryPrisma');
const { createOrUpdateJob } = require('../utils/jobManager');



//crear un usuario
exports.register = async (req, res) => {
  const { email, password, userName, nombre, rol } = req.body; // ✅ agregar nombre y rol

  // Validar que todos los datos estén presentes
    if (!email || !password || !userName || !nombre || !rol) {
      return res.status(400).json({ error: 'Faltan datos obligatorios' });
    }

  try {
    const exists = await userRepo.findByEmail(email);
    if (exists) {
      return res.status(409).json({ error: 'El correo ya está registrado' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await userRepo.createUser({
      email,
      password: hashedPassword,
      userName,
      nombre,  // ✅ ahora definido
      rol      // ✅ ahora definido
    });

    createOrUpdateJob(user.id, 'morning', 8);
    createOrUpdateJob(user.id, 'afternoon', 13);
    createOrUpdateJob(user.id, 'night', 21);

    // Registrar la acción en logs
    await prisma.log.create({
      data: {
        usuarioId: req.usuario.id,  // Usuario que hizo la acción
        accion: 'crear',
        entidad: 'Usuario',
        detalle: `Creó usuario ${email}`
      }
    });

    // Responder con datos básicos del usuario creado (sin password)
    res.status(201).json({
      id: usuario.id,
      nombre: usuario.nombre,
      userName: usuario.userName,
      email: usuario.email,
      rol: usuario.rol
    });
  } catch (error) {
    console.error('Error crearUsuario:', error);
    res.status(500).json({ error: 'Error al crear usuario' });
  }
};

// Listar todos los usuarios sin mostrar contraseñas
exports.listarUsuarios = async (req, res) => {
  try {
    const usuarios = await prisma.usuario.findMany({
      select: {
        id: true,
        nombre: true,
        email: true,
        rol: true,
        createdAt: true,
      },
    });
    res.json(usuarios);
  } catch (error) {
    console.error('Error listarUsuarios:', error);
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
};

// Crear un usuario nuevo con contraseña hasheada
exports.crearUsuario = async (req, res) => {
  try {
    const { nombre, email, password, rol } = req.body;

    // Validar que todos los datos estén presentes
    if (!nombre || !email || !password || !rol) {
      return res.status(400).json({ error: 'Faltan datos obligatorios' });
    }

    // Verificar si el email ya está registrado
    const existeUsuario = await prisma.usuario.findUnique({ where: { email } });
    if (existeUsuario) {
      return res.status(409).json({ error: 'El correo ya está registrado' });
    }

    // Hashear la contraseña para seguridad
    const passwordHasheado = await bcrypt.hash(password, 10);

    // Crear el usuario en BD
    const usuario = await prisma.usuario.create({
      data: { nombre, email, password: passwordHasheado, rol }
    });

    // Registrar la acción en logs
    await prisma.log.create({
      data: {
        usuarioId: req.usuario.id,  // Usuario que hizo la acción
        accion: 'crear',
        entidad: 'Usuario',
        detalle: `Creó usuario ${email}`
      }
    });

    // Responder con datos básicos del usuario creado (sin password)
    res.status(201).json({
      id: usuario.id,
      nombre: usuario.nombre,
      email: usuario.email,
      rol: usuario.rol
    });
  } catch (error) {
    console.error('Error crearUsuario:', error);
    res.status(500).json({ error: 'Error al crear usuario' });
  }
};

// Actualizar datos de usuario existente (sin cambiar contraseña)
exports.actualizarUsuario = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { nombre, email, rol } = req.body;

    // Validar campos obligatorios
    if (!nombre || !email || !rol) {
      return res.status(400).json({ error: 'Faltan datos obligatorios' });
    }

    // Verificar si el usuario existe
    const usuarioExistente = await prisma.usuario.findUnique({ where: { id } });
    if (!usuarioExistente) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Verificar que el email no esté registrado en otro usuario
    const emailEnUso = await prisma.usuario.findFirst({
      where: { email, NOT: { id } }
    });
    if (emailEnUso) {
      return res.status(409).json({ error: 'El email ya está registrado por otro usuario' });
    }

    // Actualizar usuario en BD
    const usuarioActualizado = await prisma.usuario.update({
      where: { id },
      data: { nombre, email, rol }
    });

    // Registrar acción en logs
    await prisma.log.create({
      data: {
        usuarioId: req.usuario.id,
        accion: 'editar',
        entidad: 'Usuario',
        detalle: `Actualizó usuario ID ${id}`
      }
    });

    // Responder con datos actualizados
    res.json({
      id: usuarioActualizado.id,
      nombre: usuarioActualizado.nombre,
      email: usuarioActualizado.email,
      rol: usuarioActualizado.rol
    });
  } catch (error) {
    console.error('Error actualizarUsuario:', error);
    res.status(500).json({ error: 'Error actualizando usuario' });
  }
};

// Eliminar usuario por ID
exports.eliminarUsuario = async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    // Validar que el id sea número
    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID inválido' });
    }

    // Verificar que el usuario exista
    const usuarioExistente = await prisma.usuario.findUnique({ where: { id } });
    if (!usuarioExistente) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Eliminar usuario
    const usuarioEliminado = await prisma.usuario.delete({ where: { id } });

    // Registrar acción en logs
    await prisma.log.create({
      data: {
        usuarioId: req.usuario.id,
        accion: 'eliminar',
        entidad: 'Usuario',
        detalle: `Eliminó usuario ID ${id}`
      }
    });

    // Responder con confirmación
    res.json({ mensaje: 'Usuario eliminado correctamente', usuario: { id: usuarioEliminado.id, email: usuarioEliminado.email } });
  } catch (error) {
    console.error('Error eliminarUsuario:', error);
    res.status(500).json({ error: 'Error al eliminar usuario' });
  }
};

// Obtener registros de logs de auditoría
exports.verLogs = async (req, res) => {
  try {
    const logs = await prisma.log.findMany({
      include: { usuario: { select: { id: true, nombre: true, email: true } } },
      orderBy: { timestamp: 'desc' }
    });
    res.json(logs);
  } catch (error) {
    console.error('Error verLogs:', error);
    res.status(500).json({ error: 'Error al obtener logs' });
  }
};

/**
 * Eliminar usuario (soft delete)
 */
exports.eliminarUsuarioSoft = async (req, res) => {
  const userId = parseInt(req.params.id, 10);

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    await prisma.user.update({
      where: { id: userId },
      data: { deletedAt: new Date() }
    });

    return res.status(200).json({ message: 'Cuenta eliminada (soft delete) correctamente' });
  } catch (error) {
    console.error("Error al eliminar usuario (soft delete):", error);
    return res.status(500).json({ message: 'Error interno al eliminar usuario' });
  }
};

/**
 * Desactivar usuario (activo: false)
 */
exports.desactivarUsuario = async (req, res) => {
  const userId = parseInt(req.params.id, 10);

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    await prisma.user.update({
      where: { id: userId },
      data: { activo: false }
    });

    return res.status(200).json({ message: 'Cuenta desactivada correctamente' });
  } catch (error) {
    console.error("Error al desactivar usuario:", error);
    return res.status(500).json({ message: 'Error interno al desactivar usuario' });
  }
};
// Alternar estado activo del usuario
exports.toggleEstadoUsuario = async (req, res) => {
  const userId = parseInt(req.params.id, 10);

  try {
    const usuario = await prisma.usuario.findUnique({ where: { id: userId } });

    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const nuevoEstado = !usuario.activo;

    const actualizado = await prisma.usuario.update({
      where: { id: userId },
      data: { activo: nuevoEstado }
    });

    // Registrar la acción
    await prisma.log.create({
      data: {
        usuarioId: req.usuario.id,
        accion: nuevoEstado ? 'habilitar' : 'deshabilitar',
        entidad: 'Usuario',
        detalle: `${nuevoEstado ? 'Habilitó' : 'Deshabilitó'} usuario ID ${userId}`
      }
    });

    return res.json({
      mensaje: `Usuario ${nuevoEstado ? 'habilitado' : 'deshabilitado'} correctamente`,
      activo: nuevoEstado
    });
  } catch (error) {
    console.error('Error al alternar estado del usuario:', error);
    return res.status(500).json({ error: 'Error interno al cambiar estado del usuario' });
  }
};
