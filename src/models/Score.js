import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Score = sequelize.define("Score", {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    id_usuario: { type: DataTypes.UUID, allowNull: false },
    juego: { type: DataTypes.STRING, allowNull: false },
    puntaje: { type: DataTypes.INTEGER, allowNull: false },
    nivel: { type: DataTypes.INTEGER, allowNull: false },
    tiempo: { type: DataTypes.FLOAT, allowNull: false },
    fecha: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
});

export default Score;
