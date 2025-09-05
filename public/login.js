document.getElementById("loginForm").addEventListener("submit", async function(event) {
    event.preventDefault();

    const usuario = document.getElementById("usuario").value;
    const password = document.getElementById("password").value;
    const errorMsg = document.getElementById("errorMsg");

    try {
        const response = await fetch("http://localhost:5000/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ usuario, password }),
            credentials: "include" // Asegura que las cookies sean enviadas
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem("token", data.token);
            localStorage.setItem("role", data.user.role);
            localStorage.setItem("username", data.user.usuario);
            localStorage.setItem("userId", data.user.id);

            // Redireccionar según el rol
            if (data.user.role === "admin") {
                window.location.href = "/admin";
            } else if (data.user.role === "docente") {
                window.location.href = "/docente";
            } else if (data.user.role === "alumno") {
                window.location.href = "/perfil";
            } else {
                window.location.href = "/login";
            }
        } else {
            if (errorMsg) errorMsg.innerText = data.message;
        }
    } catch (error) {
        console.error("Error en el login:", error);
        if (errorMsg) errorMsg.innerText = "Error de conexión con el servidor.";
    }
});
