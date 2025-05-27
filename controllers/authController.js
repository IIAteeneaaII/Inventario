const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config(); // cargar variables .env
const { v4: uuidv4 } = require('uuid');
const userRepo = require('../repositories/userRepositoryPrisma');
const { setFlashMessage } = require('../utils/flashMessage');
const redis = require('../redisClient');
const { sendRecoveryEmail } = require('../emailSender');
const { createOrUpdateJob } = require('../utils/jobManager');
const { createResetCode } = userRepo;
const { findValidResetCode, deleteResetCodeById, saveMood, findMoodByUserAndDate, getMoodsByUser } = userRepo;

exports.register = async (req, res) => {
  const { email, password, userName } = req.body;

  try {
    const exists = await userRepo.findByEmail(email);
    if (exists){
      setFlashMessage(res, 'El usuario ya existe', 'error');
      return res.redirect('/Registro');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await userRepo.createUser({
      email,
      password: hashedPassword,
      userName,
    });

    createOrUpdateJob(user.id, 'morning', 8);
    createOrUpdateJob(user.id, 'afternoon', 13);
    createOrUpdateJob(user.id, 'night', 21);

    setFlashMessage(res, '¡Registro exitoso! Ya puedes iniciar sesión.', 'success');
    res.redirect('/');
  } catch (err) {
    console.error(err);
    setFlashMessage(res, 'Hubo un error en el servidor. Intenta más tarde', 'error');
    res.redirect('/Registro');
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  console.log(email, password)

  try {
    const user = await userRepo.findByEmail(email);
    if (!user) {
      setFlashMessage(res, 'Correo o contraseña incorrectos', 'error');
      res.redirect('/');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      setFlashMessage(res, 'Correo o contraseña incorrectos', 'error');
      res.redirect('/');
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, userName: user.userName },
      'supersecret',
      { expiresIn: '1h' }
    );

    res.cookie('token', token, {
      httpOnly: true,
      secure: false,
      maxAge: 60 * 60 * 1000,
    });
    setFlashMessage(res, '¡Inicio de sesión éxitoso.', 'success');
    res.redirect('/Preferencias');
  } catch (err) {
    console.error(err);
    setFlashMessage(res, 'Hubo un error en el servidor. Intenta más tarde', 'error');
    res.redirect('/');
  }
};

exports.deleteAccount = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await userRepo.findByEmail(email);
    if (!user) return res.status(404).json({ msg: 'User not found' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ msg: 'Invalid credentials' });

    await userRepo.deleteUserByEmail(email);

    // Eliminar cookie del token
    res.clearCookie('token', {
      httpOnly: true,
      secure: true,       // usa esto solo si estás en HTTPS
      sameSite: 'Strict'  // o 'Lax', según tu frontend
    });

    res.status(200).json({ msg: 'Account deleted successfully and cookie cleared' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
};


exports.recoverPassword = async (req, res) => {
  const { email } = req.body;

  const user = await userRepo.findByEmail(email);
  if (!user) return res.status(404).json({ message: 'Email not found' });

  const code = Math.floor(100000 + Math.random() * 900000).toString(); // Código de 6 dígitos

  await createResetCode(email, code);
  // Enviar el código por correo
  await sendRecoveryEmail(email, code);

  res.status(200).json({ message: 'Verification code sent to your email' });
};

exports.validateResetToken = async (req, res) => {
  const { token } = req.query;

  const email = await redis.get(`reset-token:${token}`);
  if (!email) {
    return res.status(400).json({ message: 'Invalid or expired token' });
  }

  res.status(200).json({ message: 'Token is valid', email });
};

exports.resetPassword = async (req, res) => {
  const { code, newPassword, confirmPassword } = req.body;

  if (newPassword !== confirmPassword) {
    return res.status(400).json({ message: 'Passwords do not match' });
  }

const codeEntry = await findValidResetCode(code);

  if (!codeEntry) {
    return res.status(400).json({ message: 'Invalid or expired code' });
  }

  const user = await userRepo.findByEmail(codeEntry.email);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await userRepo.updatePassword(user.email, hashedPassword);

  // Eliminar el código usado
await deleteResetCodeById(codeEntry.id);

  res.status(200).json({ message: 'Password updated successfully' });
};

exports.logout = async (req, res) => {
  res.clearCookie('token');
  res.redirect('/');
};
