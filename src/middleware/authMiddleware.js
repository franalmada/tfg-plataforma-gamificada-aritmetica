import jwt from 'jsonwebtoken';



export const verifyToken = (req, res, next) => {
    console.log("🔍 Cookies recibidas:", req.cookies); // Verifica si la cookie con el token está llegando

    const token = req.cookies.token || (req.headers.authorization && req.headers.authorization.split(" ")[1]);

    if (!token) {
        console.error("❌ No se recibió ningún token");
        return res.status(401).json({ message: "Token requerido" });
    }

    try {
        console.log("🔹 Token recibido:", token);
        console.log("🔹 Usando JWT_SECRET:", process.env.JWT_SECRET);

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log("✅ Token decodificado:", decoded);

        req.user = decoded;
        next();
    } catch (error) {
        console.error("❌ Error verificando token:", error.message);
        return res.status(401).json({ message: "Token inválido o expirado", error: error.message });
    }
};







export const verificarRol = (rolesPermitidos) => {
    return (req, res, next) => {
        if (!req.user || !req.user.role) {
            return res.status(403).json({ message: "Acceso denegado: Usuario no autenticado" });
        }
        if (!rolesPermitidos.includes(req.user.role)) {
            return res.status(403).json({ message: "Acceso denegado: No tienes los permisos requeridos" });
        }
        next();
    };
};



// Middleware para verificar si el usuario es administrador
export const isAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Acceso denegado. Solo administradores pueden realizar esta acción." });
    }
    next();
};

export const isStudent = (req, res, next) => {
    if (req.user && req.user.role === 'alumno') {
        next(); // Permitir acceso si el usuario es un alumno
    } else {
        return res.status(403).json({ message: "Acceso denegado. Se requiere rol de alumno" });
    }
};

export const isTeacher = (req, res, next) => {
    if (req.user && req.user.role === 'docente') {
        next();
    } else {
        res.status(403).json({ message: "Acceso denegado: Se requiere rol de docente" });
    }
};

