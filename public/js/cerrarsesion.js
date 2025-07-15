document.getElementById("confirmarLogout").addEventListener("click", () => {
  // 1. Borra cookies
  document.cookie.split(";").forEach((cookie) => {
    const name = cookie.split("=")[0].trim();
    document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
  });

  // 2. Borra token del localStorage
  localStorage.removeItem("token");

  // 3. Marca que se mostró el logout (posiblemente para mostrar un mensaje en inicio)
  localStorage.setItem("showLogoutModal", 1);

  // 4. Redirige al inicio
  window.location.href = "/";
});
