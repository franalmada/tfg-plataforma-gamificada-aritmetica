import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Score from '../models/Score.js';

// Registro de usuarios (solo puede ser ejecutado por el administrador)
export const register = async (req, res) => {
    try {
        const { name, usuario, password, role } = req.body;

        if (!name || !usuario || !password || !role) {
            return res.status(400).json({ message: "Todos los campos son obligatorios" });
        }

        // Verificar si el usuario ya existe
        const userExists = await User.findOne({ where: { usuario } });
        if (userExists) return res.status(400).json({ message: "El usuario ya existe" });

        // Verificar que el rol sea válido
        if (!['admin', 'docente', 'alumno'].includes(role)) {
            return res.status(400).json({ message: "Rol no válido" });
        }

        // Hashear la contraseña antes de guardarla
        const hashedPassword = await bcrypt.hash(password, 10);

        // Crear nuevo usuario (Solo administradores pueden crear usuarios)
        const newUser = await User.create({ name, usuario, password: hashedPassword, role });

        res.status(201).json({ message: "Usuario creado correctamente", user: newUser });
    } catch (error) {
        res.status(500).json({ message: "Error al registrar usuario", error });
    }
};

// Inicio de sesión
export const login = async (req, res) => {
    try {
        const { usuario, password } = req.body;

        if (!usuario || !password) {
            return res.status(400).json({ message: "Usuario y contraseña son obligatorios" });
        }

        // Buscar usuario por nombre de usuario
        const user = await User.findOne({ where: { usuario } });
        if (!user) return res.status(400).json({ message: "Usuario no encontrado" });

        // Comparar contraseña
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: "Contraseña incorrecta" });

        // Verificar que JWT_SECRET esté definido
        if (!process.env.JWT_SECRET) {
            return res.status(500).json({ message: "Error interno: Clave JWT no configurada" });
        }

        // Generar Token JWT
        const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });

        // 🔹 ✅ Mover esta línea dentro de la función
        res.cookie("token", token, {
            httpOnly: true,
            secure: false, // ⚠ Cambiar a false en localhost, true en producción con HTTPS
            sameSite: "Lax"
        });
        
        res.json({ message: "Inicio de sesión exitoso", token, user: { id: user.id, name: user.name, role: user.role } });
    } catch (error) {
        res.status(500).json({ message: "Error en el login", error });
    }
};



// Obtener lista de usuarios (solo admin)
export const getUsers = async (req, res) => {
    try {
        const users = await User.findAll({ attributes: ["id", "name", "usuario", "role"] });
        res.json({ users });
    } catch (error) {
        res.status(500).json({ message: "Error al obtener usuarios", error });
    }
};

// Eliminar usuario
export const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        // No permitir eliminar a sí mismo si es admin
        if (req.user.id === id) {
            return res.status(403).json({ message: "No puedes eliminar tu propia cuenta" });
        }

        const user = await User.findByPk(id);

        if (!user) {
            return res.status(404).json({ message: "Usuario no encontrado" });
        }

        await user.destroy();
        res.json({ message: "Usuario eliminado correctamente" });
    } catch (error) {
        res.status(500).json({ message: "Error al eliminar usuario", error });
    }
};

// Actualizar usuario (incluyendo contraseña)
export const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, usuario, password, role } = req.body;

        const user = await User.findByPk(id);
        if (!user) {
            return res.status(404).json({ message: "Usuario no encontrado" });
        }

        // Si se proporciona una nueva contraseña, hashearla antes de actualizar
        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            user.password = hashedPassword;
        }

        user.name = name || user.name;
        user.usuario = usuario || user.usuario;
        user.role = role || user.role;

        await user.save();

        res.json({ message: "Usuario actualizado correctamente" });
    } catch (error) {
        res.status(500).json({ message: "Error al actualizar usuario", error });
    }
};

// Obtener el perfil del usuario autenticado
export const getProfile = async (req, res) => {
    try {
        const userId = req.user.id; // Asegurar que `req.user` contiene el ID
        if (!userId) return res.status(400).json({ message: "ID de usuario no encontrado" });

        const user = await User.findByPk(userId, {
            attributes: ["id", "name", "usuario", "role"]
        });

        if (!user) return res.status(404).json({ message: "Usuario no encontrado" });

        res.json({ user });
    } catch (error) {
        res.status(500).json({ message: "Error al obtener perfil", error });
    }
};


// Obtener estadísticas de los estudiantes (para docentes)
export const getStudentsStats = async (req, res) => {
    try {
        // Asegurar que el usuario sea un docente
        if (req.user.role !== 'docente') {
            return res.status(403).json({ message: "No autorizado" });
        }

        // Aquí deberías obtener las estadísticas de los estudiantes desde la base de datos
        const studentStats = await User.findAll({
            where: { role: 'alumno' },
            attributes: ["id", "name", "usuario", "role"],
            // Aquí podrías unir con la tabla de puntajes si la tienes
        });

        res.json({ studentStats });
    } catch (error) {
        res.status(500).json({ message: "Error al obtener estadísticas de estudiantes", error });
    }
};

export const getUserScores = async (req, res) => {
    try {
        const userId = req.params.id; // Obtener ID desde los parámetros de la ruta

        // Buscar los puntajes en la base de datos
        const scores = await Score.findAll({
            where: { userId },
            attributes: ["id", "game", "score", "createdAt"]
        });

        if (!scores || scores.length === 0) {
            return res.status(404).json({ message: "No se encontraron puntajes para este usuario" });
        }

        res.json({ scores });
    } catch (error) {
        res.status(500).json({ message: "Error al obtener puntajes del usuario", error });
    }
};

export default { register, login, getUsers, deleteUser, updateUser, getProfile, getStudentsStats  };
