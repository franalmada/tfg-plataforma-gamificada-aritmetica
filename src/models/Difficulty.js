import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Difficulty = sequelize.define("Difficulty", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    minNumber: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1
    },
    maxNumber: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 10
    },
    juego: {  // Nueva columna
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "General"
    }
}, {
    timestamps: false,
    tableName: "difficulty"
});

export default Difficulty;
