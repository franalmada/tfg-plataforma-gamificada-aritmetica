const role = localStorage.getItem('role');

if (role !== 'alumno') {
    alert("No tienes permiso para acceder aquí.");
    window.location.href = '/';
}

document.addEventListener("DOMContentLoaded", async () => {
    const token = localStorage.getItem("token");

    if (!token || token === "undefined") {
        alert("Tu sesión ha expirado. Inicia sesión nuevamente.");
        window.location.href = "login.html";
        return;
    }

    try {
        // ✅ Obtener los datos del usuario
        const profileResponse = await fetch("http://localhost:5000/api/auth/profile", {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });

        const profileData = await profileResponse.json();
        if (!profileResponse.ok) throw new Error(profileData.message);

        const userId = profileData.user?.id;
        console.log("User ID obtenido:", userId);

        if (!userId) throw new Error("No se encontró el ID del usuario");

        localStorage.setItem("userId", userId);

        document.getElementById("studentName").textContent = profileData.user.name;
        document.getElementById("studentUsername").textContent = profileData.user.usuario;

        // ✅ Cambiar avatar según nombre (opcional: mejor si hay campo género)
        const avatarImg = document.getElementById("avatarImg");
        const nombre = profileData.user.name.toLowerCase();
        const esNombreDeNiña = nombre.endsWith("a") || nombre.includes("maría") || nombre.includes("sofia");
        avatarImg.src = esNombreDeNiña ? "assets/avatar_girl.png" : "assets/avatar_boy.png";

        // ✅ Cargar los puntajes del usuario
        await loadScores(userId);

    } catch (error) {
        console.error("Error al obtener los datos del usuario:", error);
        alert("Hubo un error cargando el perfil.");
    }
});

// Variables para la paginación
let scoresData = [];
let currentIndex = 0;
const recordsPerPage = 5;

async function loadScores(userId) {
    const token = localStorage.getItem("token");

    try {
        const scoresResponse = await fetch(`http://localhost:5000/api/scores/${userId}`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });

        scoresData = await scoresResponse.json();
        if (!scoresResponse.ok) throw new Error(scoresData.message);

        console.log("Puntajes obtenidos:", scoresData);

        currentIndex = 0;
        renderScores();

    } catch (error) {
        console.error("Error al obtener puntajes:", error);
        alert("No se pudieron cargar los puntajes.");
    }
}

function renderScores() {
    const scoresTable = document.getElementById("scoresTableBody");

    if (!scoresTable) {
        console.error("❌ Error: No se encontró el elemento scoresTableBody en el HTML.");
        return;
    }

    scoresTable.innerHTML = ""; // Limpiar tabla antes de agregar datos

    const nextRecords = scoresData.slice(currentIndex, currentIndex + recordsPerPage);

    if (nextRecords.length === 0) {
        scoresTable.innerHTML = "<tr><td colspan='5'>No hay más puntajes registrados.</td></tr>";
    } else {
        nextRecords.forEach(score => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${score.juego}</td>
                <td>${score.puntaje}</td>
                <td>${score.nivel}</td>
                <td>${score.tiempo} seg</td>
                <td>${new Date(score.fecha).toLocaleDateString()}</td>
            `;
            scoresTable.appendChild(row);
        });
    }

    currentIndex += recordsPerPage;

    // Ocultar el botón si ya se mostraron todos los registros
    if (currentIndex >= scoresData.length) {
        document.getElementById("loadMoreBtn").style.display = "none";
    }
}

// ✅ Evento para cargar más registros
document.getElementById("loadMoreBtn").addEventListener("click", renderScores);

// ✅ Cerrar sesión
document.getElementById("logoutBtn").addEventListener("click", () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    window.location.href = "login.html";
});
