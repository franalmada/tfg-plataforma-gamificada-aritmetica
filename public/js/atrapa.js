// atrapa.js — versión actualizada con feedback "✗" animado

// ========================
// 1. Autenticación previa
// ========================
document.addEventListener("DOMContentLoaded", () => {
    const token = localStorage.getItem("token");

    if (!token) {
        alert("Debes iniciar sesión antes de jugar.");
        window.location.href = "login.html";
    }
});

// ========================
// 2. Configuración general
// ========================
const startTime = Date.now();

const config = {
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    parent: 'game-container',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 200 },
        },
    },
    scene: { preload, create, update },
    scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
    },
};

const game = new Phaser.Game(config);

// ========================
// 3. Variables de estado
// ========================
let score = 0;
let level = 1;
let maxOperations = 10;
let currentOperation = 0;
let timeLeft = 30;
let balloons, texts, timerText, particles, timerEvent;
let difficultySettings = { min: 1, max: 10 }; // Valor predeterminado

// ========================
// 4. Carga de assets
// ========================
function preload() {
    this.load.image('background', '../assets/background.png');
    this.load.image('balloon', '../assets/balloon.png');
    this.load.image('star', '../assets/star.png');
}

// ========================
// 5. Creación de la escena
// ========================
function create() {
    // Fondo
    const bg = this.add.image(this.scale.width / 2, this.scale.height / 2, 'background');
    bg.setDisplaySize(this.scale.width, this.scale.height).setOrigin(0.5);

    // Texto de operación
    this.operationText = this.add.text(this.scale.width / 2, 80, '', {
        fontSize: '5vw',
        color: '#00ff00',
        fontStyle: 'bold',
        stroke: '#222222',
        strokeThickness: 8,
        shadow: { offsetX: 5, offsetY: 5, color: '#444', blur: 6, fill: true }
    }).setOrigin(0.5);

    // Puntaje
    this.scoreText = this.add.text(20, 20, `Puntaje: ${score}`, {
        fontSize: '2.5vw',
        color: '#00ff00',
        fontStyle: 'bold',
        stroke: '#333333',
        strokeThickness: 5,
        shadow: { offsetX: 4, offsetY: 4, color: '#222', blur: 4, fill: true }
    });

    // Nivel
    this.levelText = this.add.text(20, 70, `Nivel: ${level}`, {
        fontSize: '2.5vw',
        color: '#00ff00',
        fontStyle: 'bold',
        stroke: '#333333',
        strokeThickness: 5,
        shadow: { offsetX: 4, offsetY: 4, color: '#222', blur: 4, fill: true }
    });

    // Tiempo restante
    timerText = this.add.text(20, 120, `Tiempo: ${timeLeft}`, {
        fontSize: '2.5vw',
        color: '#00ff00',
        fontStyle: 'bold',
        stroke: '#222222',
        strokeThickness: 5,
        shadow: { offsetX: 4, offsetY: 4, color: '#222', blur: 4, fill: true }
    });

    // Partículas y grupos
    particles = this.add.particles('star');
    balloons = this.physics.add.group();
    texts = this.add.group();

    // Temporizador global
    timerEvent = this.time.addEvent({
        delay: 1000,
        callback: () => {
            if (timeLeft > 0) {
                timeLeft -= 1;
                timerText.setText(`Tiempo: ${timeLeft}`);
            } else {
                this.endGame('¡Casi lo logras! Inténtalo de nuevo.', false);
            }
        },
        loop: true,
    });

    // Métodos expuestos al scene
    this.generateNewOperation = generateNewOperation.bind(this);
    this.endGame = endGame.bind(this);

    // Primera operación
    this.generateNewOperation();
}

// ========================
// 6. Dificultad dinámica
// ========================
async function getDifficultySettings() {
    try {
        const response = await fetch("http://localhost:5000/api/docente/getDifficulty?juego=Atrapa%20la%20Respuesta%20Correcta");
        const data = await response.json();

        if (response.ok && data) {
            difficultySettings = { min: parseInt(data.minNumber, 10), max: parseInt(data.maxNumber, 10) };
        } else {
            console.warn("⚠ No se pudo obtener la configuración de dificultad, usando valores predeterminados.");
            difficultySettings = { min: 4, max: 8 };
        }
    } catch (error) {
        console.error("❌ Error al obtener configuración de dificultad:", error);
        difficultySettings = { min: 4, max: 8 };
    }
}

async function fetchDifficultySettings() {
    await getDifficultySettings();
    console.log("✅ Nueva dificultad aplicada:", difficultySettings);
}

// ========================
// 7. Generar operación nueva
// ========================
async function generateNewOperation() {
    await fetchDifficultySettings();

    const { min, max } = difficultySettings;
    if (min >= max) {
        console.error("❌ Error: minNumber debe ser menor que maxNumber.");
        return;
    }

    if (level > 9) {
        this.endGame(`¡Felicidades! Has completado el nivel 10 con un puntaje de ${score}`);
        return;
    }

    const num1 = Phaser.Math.Between(min, max - 1);
    const num2 = Phaser.Math.Between(min, max - 1);
    const correctAnswer = num1 + num2;
    const answers = [correctAnswer];

    while (answers.length < 5) {
        const wrongAnswer = Phaser.Math.Between(correctAnswer - 10, correctAnswer + 10);
        if (wrongAnswer !== correctAnswer && !answers.includes(wrongAnswer)) {
            answers.push(wrongAnswer);
        }
    }
    Phaser.Utils.Array.Shuffle(answers);

    balloons.clear(true, true);
    texts.clear(true, true);

    answers.forEach((answer) => {
        const balloon = balloons.create(Phaser.Math.Between(100, this.scale.width - 100), -50, 'balloon')
            .setScale(0.1 * this.scale.width / 800)
            .setVelocity(Phaser.Math.Between(-200, 200), Phaser.Math.Between(100, 150))
            .setCollideWorldBounds(true).setBounce(1)
            .setInteractive();

        balloon.correct = answer === correctAnswer;

        const text = this.add.text(balloon.x, balloon.y, answer, {
            fontSize: '2vw',
            color: '#FFFFFF',
            fontStyle: 'bold',
            stroke: '#17202a',
            strokeThickness: 5
        }).setOrigin(0.5);
        texts.add(text);
        balloon.text = text;

        // ============================
        // Evento de clic en el globo
        // ============================
        balloon.on('pointerdown', () => {
            if (balloon.correct) {
                // --- Respuesta correcta ---
                score += 10;
                level += 1;
                this.scoreText.setText(`Puntaje: ${score}`);
                this.levelText.setText(`Nivel: ${level}`);
                timeLeft = Math.max(15, 30 - level * 2);
                timerText.setText(`Tiempo: ${timeLeft}`);

                // Partículas de estrella
                const emitter = particles.createEmitter({
                    x: balloon.x,
                    y: balloon.y,
                    speed: { min: -50, max: 50 },
                    scale: { start: 0.5, end: 0 },
                    lifespan: 500,
                    quantity: 15,
                });

                this.time.delayedCall(500, () => {
                    emitter.stop();
                    emitter.manager.removeEmitter(emitter);
                });

                this.generateNewOperation();
            } else {
                // --- Respuesta incorrecta ---
                score -= 5;
                this.scoreText.setText(`Puntaje: ${score}`);

                // "✗" animada
                const xFeedback = this.add.text(balloon.x, balloon.y, '✗', {
                    fontSize: '6vw',
                    color: '#ff0000',
                    fontStyle: 'bold',
                    stroke: '#000000',
                    strokeThickness: 8,
                    shadow: {
                        offsetX: 5, offsetY: 5, color: '#550000', blur: 6, fill: true
                    }
                }).setOrigin(0.5).setAlpha(1);

                this.tweens.add({
                    targets: xFeedback,
                    alpha: 0,
                    scale: 1.5,
                    duration: 500,
                    ease: 'Cubic.easeOut',
                    onComplete: () => xFeedback.destroy()
                });
            }
        });
    });

    this.operationText.setText(`${num1} + ${num2} = ?`);
}

// ========================
// 8. Guardar puntaje
// ========================
async function saveScore(game, score, nivel, timePlayed) {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
        await fetch("http://localhost:5000/api/scores/save", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                game: "Atrapa la Respuesta Correcta",
                score,
                nivel,
                timePlayed
            })
        });
    } catch (error) {
        console.error("❌ Error en la solicitud de guardado:", error);
    }
}

// ========================
// 9. Fin del juego
// ========================
function endGame(message, showParticles = true) {
    if (timerEvent) timerEvent.remove();

    const timePlayed = Math.floor((Date.now() - startTime) / 1000);
    saveScore("Atrapa la Respuesta Correcta", score, level, timePlayed);

    // Overlay oscuro
    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.7).fillRect(0, 0, this.scale.width, this.scale.height);

    // Texto final
    const endText = this.add.text(this.scale.width / 2, this.scale.height / 2 - 50, message, {
        fontSize: '4vw',
        color: '#FFD700',
        fontStyle: 'bold',
        align: 'center',
        stroke: '#8B0000',
        strokeThickness: 6,
        shadow: { offsetX: 4, offsetY: 4, color: '#000', blur: 5, fill: true },
        wordWrap: { width: this.scale.width * 0.8 }
    }).setOrigin(0.5).setScale(0);

    // Animaciones
    this.tweens.add({ targets: endText, scale: 1, duration: 800, ease: 'Back.Out' });
    this.tweens.add({ targets: endText, alpha: { from: 1, to: 0.5 }, duration: 500, yoyo: true, repeat: -1 });

    // Confeti opcional
    if (showParticles) {
        const confetti = this.add.particles('star');
        const emitter = confetti.createEmitter({
            x: { min: 0, max: this.scale.width }, y: 0,
            speedY: { min: 100, max: 200 }, speedX: { min: -100, max: 100 },
            scale: { start: 0.5, end: 0 }, lifespan: 1500, quantity: 5, frequency: 200, blendMode: 'ADD'
        });
        setTimeout(() => { emitter.stop(); confetti.destroy(); window.location.href = "perfil.html"; }, 5000);
    } else {
        setTimeout(() => window.location.href = "perfil.html", 5000);
    }
}

// ========================
// 10. Update loop
// ========================
function update() {
    balloons.children.iterate((balloon) => {
        if (balloon.text) {
            balloon.text.x = balloon.x;
            balloon.text.y = balloon.y;
        }
    });
}
