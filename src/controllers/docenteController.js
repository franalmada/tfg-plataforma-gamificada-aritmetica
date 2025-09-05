import { User, Score, Difficulty } from "../models/index.js";
import { Op } from "sequelize";
import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";



// 📌 Obtener la lista de estudiantes
export const getStudents = async (req, res) => {
    try {
        const students = await User.findAll({
            where: { role: "alumno" },
            attributes: ["id", "name"]
        });

        if (!students) {
            return res.status(404).json({ message: "❌ No se encontraron estudiantes." });
        }

        res.json(students);
    } catch (error) {
        console.error("❌ Error al obtener estudiantes:", error);
        res.status(500).json({ message: "Error interno del servidor", error });
    }
};


// 📌 Obtener estadísticas de un estudiante
export const getStudentStats = async (req, res) => {
    const { studentId } = req.params;
    const { game } = req.query; // Captura el juego de la URL

    try {
        const whereClause = { id_usuario: studentId };
        
        // Si el usuario seleccionó un juego específico, agrégalo al filtro
        if (game && game !== "") {
            whereClause.juego = game;
        }

        const scores = await Score.findAll({
            where: whereClause,
            attributes: ["juego", "puntaje", "nivel", "tiempo", "fecha"]
        });

        res.json(scores);
    } catch (error) {
        console.error("❌ Error obteniendo estadísticas del estudiante:", error);
        res.status(500).json({ message: "Error al obtener estadísticas." });
    }
};


// 📌 Modificar la dificultad de los juegos
export const setDifficulty = async (req, res) => {
    const { juego, minNumber, maxNumber } = req.body;

    if (!juego || !minNumber || !maxNumber || minNumber >= maxNumber) {
        return res.status(400).json({ message: "❌ Valores de dificultad inválidos." });
    }

    try {
        await Difficulty.upsert({ juego, minNumber, maxNumber }); // Ahora guarda el juego también
        res.json({ message: `✅ Dificultad de "${juego}" actualizada correctamente.` });
    } catch (error) {
        console.error("❌ Error al actualizar dificultad:", error);
        res.status(500).json({ message: "Error interno del servidor" });
    }
};

export const getDifficulty = async (req, res) => {
    const { juego } = req.query;  

    if (!juego) {
        return res.status(400).json({ message: "❌ Se requiere un juego para obtener la dificultad." });
    }

    try {
        // Obtener el último registro de dificultad para el juego
        const difficulty = await Difficulty.findOne({
            where: { juego },
            order: [['id', 'DESC']]  // 🔥 Esto asegura que se obtenga el último registro insertado
        });

        if (!difficulty) {
            return res.status(404).json({ message: `❌ No se encontró configuración de dificultad para "${juego}".` });
        }

        console.log("📌 Dificultad encontrada:", difficulty.dataValues);
        res.json(difficulty);
    } catch (error) {
        console.error("❌ Error obteniendo dificultad:", error);
        res.status(500).json({ message: "Error interno del servidor" });
    }
};





export const generateOperation = async (req, res) => {
    const { juego } = req.query;

    if (!juego) {
        return res.status(400).json({ message: "❌ Se requiere un juego para generar la operación." });
    }

    try {
        // Obtener la configuración de dificultad del juego
        const difficulty = await Difficulty.findOne({ where: { juego } });

        if (!difficulty) {
            return res.status(404).json({ message: `❌ No se encontró configuración de dificultad para "${juego}".` });
        }

        let minNumber = parseInt(difficulty.minNumber, 10);
        let maxNumber = parseInt(difficulty.maxNumber, 10);

        // Validación estricta de valores
        if (isNaN(minNumber) || isNaN(maxNumber) || minNumber >= maxNumber) {
            return res.status(400).json({ message: "❌ La configuración de dificultad es inválida." });
        }

        // Generar números dentro del rango especificado
        const num1 = Math.floor(Math.random() * (maxNumber - minNumber + 1)) + minNumber;
        const num2 = Math.floor(Math.random() * (maxNumber - minNumber + 1)) + minNumber;
        const resultado = num1 + num2; // Solo sumas

        res.json({
            pregunta: `${num1} + ${num2} = ?`,
            respuesta: resultado
        });

    } catch (error) {
        console.error("❌ Error generando operación:", error);
        res.status(500).json({ message: "Error interno del servidor." });
    }
};


// Nueva función para eliminar los datos de un estudiante (pero NO eliminar al estudiante)
export const deleteStudentData = async (req, res) => {
    const { studentId } = req.params;

    try {
        // Buscar al estudiante
        const student = await User.findByPk(studentId);
        if (!student) {
            return res.status(404).json({ message: "❌ Estudiante no encontrado." });
        }

        // Eliminar las puntuaciones del estudiante
        const deletedScores = await Score.destroy({ where: { id_usuario: studentId } });

        if (deletedScores === 0) {
            return res.status(404).json({ message: "❌ No hay datos para eliminar." });
        }

        res.json({ message: "✅ Datos del estudiante eliminados correctamente." });
    } catch (error) {
        console.error("❌ Error al eliminar datos del estudiante:", error);
        res.status(500).json({ message: "Error interno del servidor." });
    }
};














// 📌 Generar y descargar reportes en PDF
export const generateReport = async (req, res) => {
    const { studentId } = req.params;

    try {
        // Buscar estudiante por ID
        const student = await User.findByPk(studentId);
        if (!student) {
            return res.status(404).json({ message: "Estudiante no encontrado." });
        }

        // Obtener puntuaciones del estudiante
        const scores = await Score.findAll({
            where: { id_usuario: studentId },
            order: [["createdAt", "DESC"]],
        });

        if (!scores.length) {
            return res.status(404).json({ message: "No hay registros para este estudiante." });
        }

        // Sanitizar el nombre del archivo
        const sanitizedFileName = student.name.normalize("NFKD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/\s+/g, "_")
            .replace(/[^a-zA-Z0-9_\-]/g, "");

        // Iniciar PDF con márgenes ajustados
        const doc = new PDFDocument({ margin: 40, size: 'A4' });
        res.setHeader('Content-Disposition', `attachment; filename=reporte_${sanitizedFileName}.pdf`);
        res.setHeader('Content-Type', 'application/pdf');
        doc.pipe(res);

        // Usar fuente estándar sin caracteres especiales
        doc.font('Helvetica');

        // Encabezado
        doc.font('Helvetica-Bold');
        doc.rect(50, 50, 500, 40).fill("#5499c7").stroke();
        doc.fillColor("#333").fontSize(18)
        .text("Reporte de Desempeño", 50, 65, { align: 'center' });


        
        doc.moveDown(2);
        doc.fillColor("#000").fontSize(12)
            .text(`Estudiante: ${student.name}`, { align: 'left' })
            .text(`Fecha: ${new Date().toLocaleDateString('es-ES')}`, { align: 'left' });

        doc.moveDown(1);
        doc.strokeColor("#aaa").lineWidth(1).moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown(1);

        // Posiciones base
const startX = 50;
const columnWidths = [140, 80, 50, 90, 90];
const headerY = doc.y; // Guardar la posición actual para alinear correctamente

// 🔹 Dibujar fondo gris para el encabezado de la tabla
doc.rect(startX, headerY, 500, 20).fill("#7fb3d5").stroke();
doc.fillColor("#000").fontSize(10).font('Helvetica-Bold');

// 🔹 Escribir cada encabezado en la MISMA coordenada Y
doc.text("Juego", startX + 5, headerY + 5, { width: columnWidths[0], align: 'left' });
doc.text("Puntaje", startX + columnWidths[0], headerY + 5, { width: columnWidths[1], align: 'center' });
doc.text("Nivel", startX + columnWidths[0] + columnWidths[1], headerY + 5, { width: columnWidths[2], align: 'center' });
doc.text("Tiempo", startX + columnWidths[0] + columnWidths[1] + columnWidths[2], headerY + 5, { width: columnWidths[3], align: 'center' });
doc.text("Fecha", startX + columnWidths[0] + columnWidths[1] + columnWidths[2] + columnWidths[3], headerY + 5, { width: columnWidths[4], align: 'center' });

// 🔹 Mover el cursor de Y solo una vez después de toda la fila
doc.y += 25;

        let yPos = doc.y;
        const rowHeight = 20;
        let pageNumber = 1;

        // 🔹 Llenar la tabla con filas alternando colores
        doc.font('Helvetica').fontSize(10).fillColor("#000");
        scores.forEach((score, index) => {
            const fechaTexto = score.fecha ? new Date(score.fecha).toLocaleDateString('es-ES') : "Fecha no disponible";

            if (index % 2 === 0) {
                doc.rect(startX, yPos, 500, rowHeight).fill("#a9cce3").stroke();
            }

            doc.fillColor("#000");
            doc.text(score.juego.length > 20 ? score.juego.substring(0, 20) + "..." : score.juego, startX + 5, yPos + 5, { width: columnWidths[0], align: 'left' });
            doc.text(score.puntaje.toString(), startX + columnWidths[0], yPos + 5, { width: columnWidths[1], align: 'center' });
            doc.text(score.nivel.toString(), startX + columnWidths[0] + columnWidths[1], yPos + 5, { width: columnWidths[2], align: 'center' });
            doc.text(`${score.tiempo} seg`, startX + columnWidths[0] + columnWidths[1] + columnWidths[2], yPos + 5, { width: columnWidths[3], align: 'center' });
            doc.text(fechaTexto, startX + columnWidths[0] + columnWidths[1] + columnWidths[2] + columnWidths[3], yPos + 5, { width: columnWidths[4], align: 'center' });

            yPos += rowHeight;

            if (yPos + rowHeight > 750) {  
                addFooter(doc, pageNumber);
                doc.addPage();
                pageNumber++;
                yPos = 50;
            }
        });

        addFooter(doc, pageNumber);
        doc.end();
    } catch (error) {
        console.error("❌ Error generando el reporte:", error);
        if (!res.headersSent) {
            res.status(500).json({ message: "Error al generar el reporte." });
        }
    }
};

// 🔹 Función para agregar pie de página sin recursión infinita
const addFooter = (doc, pageNumber) => {
    doc.fontSize(9).fillColor("#555")
        .text(`Página ${pageNumber}`, 50, 800, { align: 'center' });
};