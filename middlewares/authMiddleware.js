const jwt = require('jsonwebtoken');

function authMiddleware(req, res, next) {
  const token = req.cookies.token;
  if (!token) return res.redirect('/');

  try {
    const decoded = jwt.verify(token, 'supersecret');
    req.user = decoded;
    console.log(decoded)
    next();
  } catch (err) {
    console.error('JWT Error:', err);
    res.clearCookie('token');
    res.redirect('/');
  }
}

module.exports = {
  authMiddleware
}
