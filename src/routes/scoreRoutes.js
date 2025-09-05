import { Router } from 'express';
import Score from '../models/Score.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = Router();

// ✅ Ruta para guardar puntajes
router.post('/save', verifyToken, async (req, res) => {
    try {
        const { game, score, nivel, timePlayed } = req.body;
        const userId = req.user.id;

        // 🚨 Verificar que `nivel` no sea null o undefined
        if (!game || score === undefined || nivel === undefined || !timePlayed) {
            return res.status(400).json({ message: "Todos los campos son obligatorios" });
        }

        const newScore = await Score.create({
            id_usuario: userId,
            juego: game,
            puntaje: score,
            nivel: nivel,  // ✅ Ahora garantizamos que `nivel` tenga un valor
            tiempo: timePlayed
        });

        res.status(201).json({ message: "Puntaje guardado", score: newScore });
    } catch (error) {
        console.error("❌ Error al guardar puntaje:", error);
        res.status(500).json({ message: "Error en el servidor" });
    }
});


// ✅ Ruta para obtener los puntajes de un usuario
router.get('/:userId', verifyToken, async (req, res) => {
    try {
        const { userId } = req.params;

        if (!userId) {
            return res.status(400).json({ message: "ID de usuario requerido" });
        }

        const scores = await Score.findAll({ where: { id_usuario: userId } });

        if (!scores.length) {
            return res.json([]); // Enviar lista vacía en lugar de 404
        }
        
        

        res.json(scores);
    } catch (error) {
        console.error("Error al obtener puntajes:", error);
        res.status(500).json({ message: "Error del servidor" });
    }
});


export default router;
