const validarWhatsApp = (numero) => {
  // Formato: +258XXXXXXXXX (9 dígitos depois do código)
  const regex = /^\+258[0-9]{9}$/;
  return regex.test(numero);
};

const validarEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

module.exports = { validarWhatsApp, validarEmail };