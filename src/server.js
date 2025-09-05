import 'dotenv/config';
import express from 'express';
import cors from 'cors'; // Middleware para permitir CORS
import path from 'path'; // Manejo de rutas de archivos
import { fileURLToPath } from 'url'; // Necesario para __dirname en ES Modules
import sequelize from './config/database.js';
import authRoutes from './routes/authRoutes.js';
import scoreRoutes from './routes/scoreRoutes.js';
import docenteRoutes from './routes/docenteRoutes.js'; // ✅ Importamos el módulo docente
import Difficulty from './models/Difficulty.js'; // ✅ Ahora funcionará
import { verifyToken, verificarRol } from './middleware/authMiddleware.js';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';

// 📌 Conf|gurar __dirname en ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express(); // Inicializar Express

// 🔹 Middleware
app.use(cors());
app.use(express.json());
app.use(cookieParser());

// ✅ Servir archivos estáticos

// 🔹 Rutas protegidas con verificación de rol
app.get('/admin', verifyToken, verificarRol(['admin']), (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'admin.html'));
});

app.get('/docente', verifyToken, verificarRol(['docente']), (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'docente.html'));
});

app.get('/perfil', verifyToken, verificarRol(['alumno']), (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'perfil.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'login.html'));
});

// 🔹 Redirigir a login o al panel según el rol
app.get('/', (req, res) => {
    const token = req.cookies.token;
    
    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            if (decoded.role === 'admin') return res.redirect('/admin');
            if (decoded.role === 'docente') return res.redirect('/docente');
            if (decoded.role === 'alumno') return res.redirect('/perfil');

            return res.redirect('/login');
        } catch (error) {
            console.error("⚠️ Token inválido:", error.message);
        }
    }

    // ✅ Si el token es inválido o no existe, mostrar `login.html`
    res.sendFile(path.join(__dirname, 'views', 'login.html'));
});

app.use(express.static(path.join(__dirname, '../public')));
app.use(express.static(path.join(__dirname, 'views'))); // Asegurar que views esté disponible





// 🔹 Rutas de autenticación, puntajes y docentes
app.use('/api/auth', authRoutes);
app.use('/api/scores', scoreRoutes);
app.use('/api/docente', docenteRoutes); // ✅ Agregamos la ruta del módulo docente

// 🔹 Ruta para manejar archivos que no existen (404)
app.use((req, res, next) => {
    if (req.accepts("html")) {
        res.status(404).sendFile(path.join(__dirname, 'views', '404.html'), (err) => {
            if (err) {
                res.status(404).send("<h1>❌ 404 - Página no encontrada</h1><p>La página que buscas no existe.</p><a href='/login'>Volver al inicio</a>");
            }
        });
    } else {
        res.status(404).json({ message: "❌ Ruta no encontrada" });
    }
});

// 🔹 Middleware de manejo de errores global
app.use((err, req, res, next) => {
    console.error("❌ Error en el servidor:", err);
    res.status(500).json({ message: "❌ Error interno del servidor" });
});

// 🔹 Verificar conexión a la base de datos y levantar servidor
const PORT = process.env.PORT || 5000;

sequelize.sync({ alter: true }) // ✅ Se asegura de sincronizar todos los modelos, incluyendo `Difficulty`
    .then(async () => {
        await Difficulty.findOrCreate({ where: { id: 1 }, defaults: { minNumber: 1, maxNumber: 10 } });
        console.log("📦 Base de datos conectada correctamente");
        app.listen(PORT, () => console.log(`🚀 Servidor corriendo en: http://localhost:${PORT}`));
    })
    .catch(err => console.error("❌ Error en la base de datos:", err));
