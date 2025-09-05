const role = localStorage.getItem('role');

if (role !== 'admin') {
    alert("No tienes permiso para acceder aquí.");
    window.location.href = '/';
}



document.addEventListener("DOMContentLoaded", () => {
    const logoutBtn = document.getElementById("logoutBtn");
    const loadUsersBtn = document.getElementById("loadUsersBtn");
    const usersTableBody = document.getElementById("usersTableBody");
    const addUserForm = document.getElementById("addUserForm");

    // 🔹 Cerrar sesión correctamente
    logoutBtn.addEventListener("click", () => {
        localStorage.clear();  // 🔥 Borra toda la información almacenada
        window.location.href = "login.html";  // Redirige al login
    });

    // 🔹 Cargar usuarios dinámicamente
    loadUsersBtn.addEventListener("click", async () => {
        const token = localStorage.getItem("token");
        if (!token) {
            alert("No estás autenticado.");
            return;
        }

        try {
            const response = await fetch("http://localhost:5000/api/auth/admin/users", {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            });

            if (!response.ok) {
                throw new Error("Error al obtener usuarios");
            }

            const data = await response.json();
            usersTableBody.innerHTML = ""; // Limpia la tabla

            data.users.forEach(user => {
                const row = document.createElement("tr");
                row.innerHTML = `
                    <td>${user.name}</td>
                    <td>${user.usuario}</td>
                    <td>${user.role}</td>
                    <td>
                        <button class="btn btn-warning btn-sm" onclick="abrirModalEditar('${user.id}', '${user.name}', '${user.usuario}', '${user.role}')">Editar</button>
                        <button class="btn btn-danger btn-sm" onclick="eliminarUsuario('${user.id}')">Eliminar</button>
                    </td>
                `;
                usersTableBody.appendChild(row);
            });
            
        } catch (error) {
            alert("Error al cargar los usuarios");
            console.error(error);
        }
    });

    // 🔹 Agregar un usuario
    addUserForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const name = document.getElementById("newName").value;
        const usuario = document.getElementById("newUser").value;
        const password = document.getElementById("newPassword").value;
        const role = document.getElementById("newRole").value;
        const token = localStorage.getItem("token");

        try {
            const response = await fetch("http://localhost:5000/api/auth/register", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ name, usuario, password, role })
            });

            if (!response.ok) {
                throw new Error("Error al agregar usuario");
            }

            alert("Usuario agregado correctamente");
            loadUsersBtn.click(); // Recargar la lista de usuarios
        } catch (error) {
            alert("Error al agregar usuario");
            console.error(error);
        }
    });
});

// 🔹 Unificar función para eliminar usuario
// 🔹 Función mejorada para eliminar un usuario con SweetAlert2
async function eliminarUsuario(id) {
    const token = localStorage.getItem("token");
    if (!token) {
        Swal.fire({
            icon: "warning",
            title: "⚠️ No tienes permisos",
            text: "No puedes realizar esta acción.",
            confirmButtonColor: "#3085d6",
            confirmButtonText: "Entendido",
        });
        return;
    }

    // 🛠️ Alerta de confirmación antes de eliminar
    const result = await Swal.fire({
        title: "¿Estás seguro?",
        text: "⚠️ Esto eliminará permanentemente al usuario.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        cancelButtonColor: "#3085d6",
        confirmButtonText: "Sí, eliminar",
        cancelButtonText: "Cancelar",
    });

    if (!result.isConfirmed) return;

    try {
        const response = await fetch(`http://localhost:5000/api/auth/admin/users/${id}`, {
            method: "DELETE",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json",
            }
        });

        if (!response.ok) {
            throw new Error("Error al eliminar usuario");
        }

        // ✅ Alerta de éxito tras la eliminación
        Swal.fire({
            icon: "success",
            title: "✅ Usuario eliminado",
            text: "El usuario ha sido eliminado correctamente.",
            confirmButtonColor: "#3085d6",
        });

        // 🔄 Recargar la lista de usuarios
        document.getElementById("loadUsersBtn").click();
    } catch (error) {
        console.error("❌ Error al eliminar usuario:", error);

        Swal.fire({
            icon: "error",
            title: "❌ Error",
            text: "Hubo un problema al eliminar el usuario.",
            confirmButtonColor: "#d33",
        });
    }
}


// 🔹 Abrir el modal de edición con los datos del usuario
function abrirModalEditar(id, name, usuario, role) {
    document.getElementById("editUserId").value = id;
    document.getElementById("editUserName").value = name;
    document.getElementById("editUserUsername").value = usuario;
    document.getElementById("editUserRole").value = role;
    document.getElementById("editUserPassword").value = ""; // Vaciar campo de contraseña
    new bootstrap.Modal(document.getElementById("editUserModal")).show();
}

// 🔹 Guardar edición de usuario
function guardarEdicion() {
    const id = document.getElementById("editUserId").value;
    const name = document.getElementById("editUserName").value;
    const usuario = document.getElementById("editUserUsername").value;
    const password = document.getElementById("editUserPassword").value;
    const role = document.getElementById("editUserRole").value;

    const token = localStorage.getItem("token");
    if (!token) {
        alert("No tienes permisos para realizar esta acción");
        return;
    }

    fetch(`http://localhost:5000/api/auth/admin/users/${id}`, {
        method: "PUT",
        headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ name, usuario, password, role })
    })
    .then(response => response.json())
    .then(data => {
        alert(data.message);
        document.getElementById("loadUsersBtn").click(); // Recargar usuarios
    })
    .catch(error => console.error("Error editando usuario:", error));
}
