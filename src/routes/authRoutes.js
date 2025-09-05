import { Router } from 'express';
import { register, login, getUsers, deleteUser, updateUser, getProfile, getUserScores, getStudentsStats } from '../controllers/authController.js';
import { verifyToken, isAdmin, isTeacher, isStudent } from '../middleware/authMiddleware.js';

const router = Router();

// ✅ Rutas de autenticación
router.post('/register', register);
router.post('/login', login);

// ✅ Ruta protegida para obtener usuarios (solo admin)
router.get('/admin/users', verifyToken, isAdmin, getUsers);

// ✅ Ruta para eliminar un usuario
router.delete('/admin/users/:id', verifyToken, isAdmin, deleteUser);

// ✅ Ruta para actualizar un usuario (incluyendo contraseña)
router.put('/admin/users/:id', verifyToken, isAdmin, updateUser);

// ✅ Ruta protegida para obtener el perfil del usuario autenticado
router.get('/profile', verifyToken, getProfile);

// ✅ Ruta para obtener los puntajes de un alumno específico
router.get('/profile/scores', verifyToken, isStudent, getUserScores);

// ✅ Ruta protegida para que el docente vea las estadísticas de sus estudiantes
router.get('/teacher/students-stats', verifyToken, isTeacher, getStudentsStats);

// ✅ Nueva ruta para obtener puntajes de un usuario específico
router.get('/user/:id/scores', verifyToken, getUserScores);

export default router;
