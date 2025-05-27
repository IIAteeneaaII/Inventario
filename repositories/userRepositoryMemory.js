const users = [];

exports.findByEmail = (email) => {
  return users.find(user => user.email === email);
};

exports.createUser = (user) => {
  users.push(user);
};

exports.getAll = () => users; // útil si quieres ver todos los usuarios
