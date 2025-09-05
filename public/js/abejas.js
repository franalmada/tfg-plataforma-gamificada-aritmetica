document.addEventListener("DOMContentLoaded", () => {
    const token = localStorage.getItem("token");

    if (!token) {
        alert("Debes iniciar sesión antes de jugar.");
        window.location.href = "login.html";
    }
});


const startTime = Date.now();


const config = {
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    parent: 'game-container',
    physics: {
        default: 'arcade',
        arcade: { gravity: { y: 0 } },
    },
    scene: { preload, create, update },
    scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
    },
};

const game = new Phaser.Game(config);

let operationText;
let score = 0;
let level = 1;
let timeLeft = 30;
let timerText;
let scoreText, levelText;
let correctAnswer;
let bees;
let particles;
let beeTexts = new Map();
let maxQuestions = 10;
let currentQuestion = 0;

function preload() {
    this.load.image('hive', '../assets/hive.png');
    this.load.image('bee', '../assets/bee.png');
    this.load.image('star', '../assets/star.png');
    this.load.image('background', '../assets/flower_field.png');
}

function create() {
    this.add.image(this.scale.width / 2, this.scale.height / 2, 'background')
        .setDisplaySize(this.scale.width, this.scale.height);

        operationText = this.add.text(this.scale.width / 2, 50, '', {
            fontSize: '5vw',  // Texto más grande y llamativo
            color: '#00ff00', // Amarillo vibrante
            fontStyle: 'bold',
            stroke: '#222',   // Contorno oscuro para contraste
            strokeThickness: 8,
            shadow: {         // Sombra para dar profundidad
                offsetX: 5,
                offsetY: 5,
                color: '#555',
                blur: 5,
                fill: true
            }
        }).setOrigin(0.5);
        
        // Puntaje
        scoreText = this.add.text(20, 20, `Puntaje: ${score}`, {
            fontSize: '3vw', 
            color: '#00ff00',  // Verde brillante
            fontStyle: 'bold',
            stroke: '#222', // Contorno verde oscuro
            strokeThickness: 6,
            shadow: {
                offsetX: 4,
                offsetY: 4,
                color: '#222',
                blur: 4,
                fill: true
            }
        });
        
        // Nivel
        levelText = this.add.text(20, 70, `Nivel: ${level}`, {
            fontSize: '3vw',
            color: '#00ff00',  // Celeste llamativo
            fontStyle: 'bold',
            stroke: '#004477', // Contorno azul oscuro
            strokeThickness: 6,
            shadow: {
                offsetX: 4,
                offsetY: 4,
                color: '#222',
                blur: 4,
                fill: true
            }
        });
        
        // Tiempo restante
        timerText = this.add.text(20, 120, `Tiempo: ${timeLeft}`, {
            fontSize: '3vw',
            color: '#00ff00',  // Rojo vibrante
            fontStyle: 'bold',
            stroke: '#222', // Contorno rojo oscuro
            strokeThickness: 6,
            shadow: {
                offsetX: 4,
                offsetY: 4,
                color: '#222',
                blur: 4,
                fill: true
            }
        });
        

    particles = this.add.particles('star');
    bees = this.physics.add.group();

    generateOperation(this);

    this.time.addEvent({
        delay: 1000,
        callback: () => {
            if (timeLeft > 0) {
                timeLeft -= 1;
                timerText.setText(`Tiempo: ${timeLeft}`);
            } else {
                endGame.call(this, '¡Casi lo logras! Inténtalo de nuevo.');
            }
        },
        loop: true,
    });
}


async function getDifficultySettings() {
    try {
        const response = await fetch("http://localhost:5000/api/docente/getDifficulty?juego=Abejas");
        const data = await response.json();

        if (response.ok && data) {
            difficultySettings = { min: parseInt(data.minNumber, 10), max: parseInt(data.maxNumber, 10) };
        } else {
            console.warn("⚠ No se pudo obtener la configuración de dificultad, usando valores predeterminados.");
            difficultySettings = { min: 1, max: 10 }; // Valores predeterminados en caso de error
        }
    } catch (error) {
        console.error("❌ Error al obtener configuración de dificultad:", error);
        difficultySettings = { min: 1, max: 10 };
    }
}


async function fetchDifficultySettings() {
    await getDifficultySettings();
    console.log("✅ Nueva dificultad aplicada:", difficultySettings);
}








async function generateOperation(scene) {
    if (currentQuestion >= maxQuestions) {
        level -= 1; // 🔥 Ajustamos el nivel antes de guardar si ya está en el final
        endGame.call(scene, `¡Juego terminado! Puntaje final: ${score}`);
        return;
    }
    

    await fetchDifficultySettings(); // Asegurar que la configuración esté lista

    const { min, max } = difficultySettings;
    console.log(`📌 Generando operación con dificultad: min = ${min}, max = ${max}`);

    if (min >= max) {
        console.error("❌ Error: minNumber debe ser menor que maxNumber.");
        return;
    }

    currentQuestion++;
    bees.clear(true, true);
    beeTexts.forEach((text) => text.destroy());
    beeTexts.clear();

    // 🔥 Ajuste del tiempo para evitar inconsistencias
    if (timeLeft > 0) {
        if (level <= 1) {
            timeLeft = 30;
        } else if (level <= 5) {
            timeLeft = 20;
        } else {
            timeLeft = 15;
        }
        timerText.setText(`Tiempo: ${timeLeft}`);
    }

    const num1 = Phaser.Math.Between(min, max - 1);
    const num2 = Phaser.Math.Between(min, max - 1);
    correctAnswer = num1 * num2;
    const answers = [correctAnswer];

    console.log(`✅ Nueva operación generada: ${num1} × ${num2} = ${correctAnswer}`);

    while (answers.length < 4) {
        let wrongAnswer;
        do {
            wrongAnswer = Phaser.Math.Between(correctAnswer - 10, correctAnswer + 10);
        } while (answers.includes(wrongAnswer) || wrongAnswer < 0);
        answers.push(wrongAnswer);
    }

    Phaser.Utils.Array.Shuffle(answers);

    answers.forEach((answer) => {
        const x = Phaser.Math.Between(100, scene.scale.width - 100);
        const y = Phaser.Math.Between(200, scene.scale.height - 200);
        const bee = bees.create(x, y, 'bee').setScale(0.1 * scene.scale.width / 800);
        bee.setInteractive();
        bee.correct = answer === correctAnswer;

        const text = scene.add.text(x, y - 20, answer, {
            fontSize: '2vw',
            color: '#00ff00',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 3,
        }).setOrigin(0.5);

        beeTexts.set(bee, text);

        bee.velocityX = Phaser.Math.Between(-100, 100);
        bee.velocityY = Phaser.Math.Between(-100, 100);

        // 🐝 Juego de Abejas — feedback visual "✗" al fallar

// ... (código intacto hasta el interior de generateOperation) ...

bee.on('pointerdown', () => {
    if (bee.correct) {
        score += 10;
        level += 1;
        scoreText.setText(`Puntaje: ${score}`);
        levelText.setText(`Nivel: ${level}`);

        const emitter = particles.createEmitter({
            x: bee.x,
            y: bee.y,
            speed: { min: -50, max: 50 },
            scale: { start: 0.5, end: 0 },
            lifespan: 500,
            quantity: 15,
        });

        scene.time.delayedCall(500, () => {
            emitter.stop();
            emitter.manager.removeEmitter(emitter);
        });

        const correctText = scene.add.text(scene.scale.width / 2, scene.scale.height / 2, '¡Correcto!', {
            fontSize: '5vw',
            color: '#000000',
            fontStyle: 'bold',
        }).setOrigin(0.5);

        scene.time.delayedCall(1000, () => {
            correctText.destroy();
            generateOperation(scene);
        });
    } else {
        score -= 5;
        scoreText.setText(`Puntaje: ${score}`);

        // ✗ Feedback visual al fallar
        const xFeedback = scene.add.text(bee.x, bee.y - 40, '✗', {
            fontSize: '5vw',
            color: '#ff0000',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 6,
            shadow: {
                offsetX: 4,
                offsetY: 4,
                color: '#550000',
                blur: 5,
                fill: true
            }
        }).setOrigin(0.5);

        scene.tweens.add({
            targets: xFeedback,
            alpha: 0,
            scale: 1.5,
            duration: 500,
            ease: 'Cubic.easeOut',
            onComplete: () => xFeedback.destroy()
        });
    }

    bee.destroy();
    text.destroy();
});

// ... (resto del código igual) ...

    });

    operationText.setText(`${num1} × ${num2} = ?`);
}

function endGame(message) {
    if (level > 10) level = 10; // 🔥 Evita que se guarde el nivel 11
    const timePlayed = Math.floor((Date.now() - startTime) / 1000);
    saveScore("Abejas", score, level, timePlayed);


    // Crear un fondo semitransparente para resaltar el mensaje
    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.6); // Negro con opacidad
    overlay.fillRect(0, 0, this.scale.width, this.scale.height);

    // Crear el texto de felicitaciones con mejor diseño
    const endText = this.add.text(this.scale.width / 2, this.scale.height / 2 - 50, message, {
        fontSize: '4vw',
        color: '#FFD700', // Dorado brillante
        fontStyle: 'bold',
        align: 'center',
        stroke: '#8B0000', // Contorno rojo oscuro
        strokeThickness: 6,
        shadow: { offsetX: 4, offsetY: 4, color: '#000', blur: 5, fill: true },
        wordWrap: { width: this.scale.width * 0.8 }
    }).setOrigin(0.5).setScale(0);

    // Animación de aparición del texto con efecto de escala
    this.tweens.add({
        targets: endText,
        scale: 1,
        duration: 800,
        ease: 'Back.Out',
    });

    // Efecto de parpadeo suave para el texto
    this.tweens.add({
        targets: endText,
        alpha: { start: 1, to: 0.5 },
        duration: 500,
        yoyo: true,
        repeat: -1
    });

    // Verificar que la imagen 'star' está cargada
    if (this.textures.exists('star')) {
        const confetti = this.add.particles('star');

        const emitter = confetti.createEmitter({
            x: { min: 0, max: this.scale.width },
            y: 0,
            speedY: { min: 100, max: 200 }, // Menos velocidad para evitar acumulación rápida
            speedX: { min: -100, max: 100 }, // Rango de movimiento más equilibrado
            scale: { start: 0.5, end: 0 }, // Tamaño inicial más pequeño para evitar saturación
            lifespan: 1500, // Menor duración para que desaparezcan antes de acumularse
            quantity: 5, // Reducimos la cantidad para evitar sobrecarga visual
            frequency: 200, // Disminuir la frecuencia de emisión
            blendMode: 'ADD' // Hace que las estrellas se vean más suaves y brillantes
        });
        

        // Detener el emisor después de unos segundos para evitar acumulación
        this.time.delayedCall(4000, () => {
            emitter.stop();
        });
    } else {
        console.warn("⚠️ La textura 'star' no está cargada, revisa preload()");
    }

    // ⏳ Aumentar el tiempo antes de redirigir (5s en lugar de 3s)
    setTimeout(() => window.location.href = "perfil.html", 5000);
}

function update() {
    bees.getChildren().forEach((bee) => {
        // Movimiento basado en velocidad constante
        bee.x += bee.velocityX * 0.016;
        bee.y += bee.velocityY * 0.016;

        // Rebotar en los bordes del canvas
        if (bee.x <= 50 || bee.x >= this.scale.width - 50) {
            bee.velocityX *= -1; // Invertir dirección horizontal
        }
        if (bee.y <= 150 || bee.y >= this.scale.height - 150) {
            bee.velocityY *= -1; // Invertir dirección vertical
        }

        // Actualizar posición del texto vinculado
        const text = beeTexts.get(bee);
        if (text) {
            text.x = bee.x;
            text.y = bee.y - 20;
        }
    });
}

async function saveScore(game, score, nivel, timePlayed) {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
        const response = await fetch("http://localhost:5000/api/scores/save", {
            method: "POST",
            headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
            body: JSON.stringify({ game, score, nivel, timePlayed })
        });

        const data = await response.json();
        if (response.ok) console.log("✅ Puntaje guardado correctamente:", data);
        else console.error("❌ Error al guardar puntaje:", data.message);
    } catch (error) {
        console.error("❌ Error en la solicitud de guardado:", error);
    }
}