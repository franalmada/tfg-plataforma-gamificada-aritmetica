const role = localStorage.getItem('role');

if (role !== 'docente') {
    alert("No tienes permiso para acceder aquí.");
    window.location.href = '/';
}



document.addEventListener("DOMContentLoaded", async () => {
    const token = localStorage.getItem("token");

    if (!token) {
        alert("No estás autenticado. Redirigiendo al login...");
        window.location.href = "login.html";
        return;
    }

    await loadStudents();
});

async function loadStudents() {
    const studentSelect = document.getElementById("studentSelect");

    try {
        const response = await fetch("http://localhost:5000/api/docente/students", {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${localStorage.getItem("token")}`,
                "Content-Type": "application/json"
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP Error: ${response.status}`);
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
            throw new Error("Respuesta de estudiantes no es un array válido.");
        }

        studentSelect.innerHTML = data.map(student =>
            `<option value="${student.id}">${student.name}</option>`
        ).join("");

    } catch (error) {
        console.error("❌ Error al cargar estudiantes:", error);
        studentSelect.innerHTML = "<option>Error al cargar</option>";
    }
}


async function loadStudentStats() {
    const studentId = document.getElementById("studentSelect").value;
    const game = document.getElementById("gameSelect").value;
    
    if (!studentId) {
        alert("Selecciona un estudiante.");
        return;
    }

    try {
        const response = await fetch(`http://localhost:5000/api/docente/stats/${studentId}?game=${game}`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${localStorage.getItem("token")}`,
                "Content-Type": "application/json"
            }
        });

        const scores = await response.json();
        const tableBody = document.getElementById("statsTableBody");

        tableBody.innerHTML = scores.length > 0 ? scores.map(score => `
            <tr>
                <td>${score.juego}</td>
                <td>${score.puntaje}</td>
                <td>${score.nivel}</td>
                <td>${score.tiempo} seg</td>
                <td>${new Date(score.fecha).toLocaleDateString()}</td>
            </tr>
        `).join("") : `<tr><td colspan="5">No hay datos disponibles.</td></tr>`;

    } catch (error) {
        console.error("Error al obtener estadísticas:", error);
    }
}

async function setDifficulty() {
    const juego = document.getElementById("gameSelect").value; // Obtener el juego seleccionado
    const minNumber = document.getElementById("minNumber").value;
    const maxNumber = document.getElementById("maxNumber").value;

    if (!juego) {
        alert("Selecciona un juego antes de ajustar la dificultad.");
        return;
    }

    if (minNumber >= maxNumber) {
        alert("El número mínimo debe ser menor que el máximo.");
        return;
    }

    try {
        const response = await fetch("http://localhost:5000/api/docente/setDifficulty", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${localStorage.getItem("token")}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ juego, minNumber, maxNumber })
        });

        const data = await response.json();
        console.log("Respuesta de la API:", data);

        if (response.ok) {
            alert(`Dificultad de "${juego}" actualizada correctamente.`);
        } else {
            alert("Error al actualizar dificultad: " + data.message);
        }
    } catch (error) {
        console.error("Error en la actualización de dificultad:", error);
    }
}


async function deleteStudentData() {
    const studentId = document.getElementById("studentSelect").value;

    if (!studentId) {
        Swal.fire({
            icon: "warning",
            title: "⚠️ Atención",
            text: "Selecciona un estudiante antes de eliminar los datos.",
            confirmButtonColor: "#3085d6",
            confirmButtonText: "Entendido",
        });
        return;
    }

    // Mostrar alerta de confirmación con SweetAlert2
    const result = await Swal.fire({
        title: "¿Estás seguro?",
        text: "⚠️ Esto eliminará todos los datos del estudiante (pero no su cuenta).",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        cancelButtonColor: "#3085d6",
        confirmButtonText: "Sí, eliminar",
        cancelButtonText: "Cancelar",
    });

    if (!result.isConfirmed) return;

    try {
        const response = await fetch(`http://localhost:5000/api/docente/deleteStudentData/${studentId}`, {
            method: "DELETE",
            headers: {
                "Authorization": `Bearer ${localStorage.getItem("token")}`,
                "Content-Type": "application/json",
            },
        });

        const data = await response.json();
        
        // Mostrar confirmación de eliminación
        Swal.fire({
            icon: "success",
            title: "✅ Eliminado",
            text: data.message,
            confirmButtonColor: "#3085d6",
        });

        // Recargar la tabla de estadísticas después de eliminar
        await loadStudentStats();
    } catch (error) {
        console.error("❌ Error al eliminar datos del estudiante:", error);

        Swal.fire({
            icon: "error",
            title: "❌ Error",
            text: "Hubo un problema al eliminar los datos. Inténtalo de nuevo.",
            confirmButtonColor: "#d33",
        });
    }
}















async function loadDifficulty() {
    const juego = document.getElementById("gameSelect").value;
    if (!juego) return;

    try {
        const response = await fetch(`http://localhost:5000/api/docente/getDifficulty?juego=${encodeURIComponent(juego)}`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${localStorage.getItem("token")}`,
                "Content-Type": "application/json"
            }
        });

        const data = await response.json();
        console.log("Configuración de dificultad recibida:", data);

        if (response.ok && data) {
            document.getElementById("minNumber").value = data.minNumber;
            document.getElementById("maxNumber").value = data.maxNumber;
        }
    } catch (error) {
        console.error("Error al cargar la configuración de dificultad:", error);
    }
}

document.getElementById("gameSelect").addEventListener("change", loadDifficulty);




async function downloadReport() {
    const studentId = document.getElementById("studentSelect").value;
    
    if (!studentId) {
        alert("Selecciona un estudiante.");
        return;
    }

    window.open(`http://localhost:5000/api/docente/report/${studentId}`, "_blank");
}

function logout() {
    localStorage.removeItem("token");
    window.location.href = "login.html";
}
