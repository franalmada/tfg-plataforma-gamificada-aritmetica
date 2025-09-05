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
    scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    scene: { preload, create, update },
    backgroundColor: '#d6eaf8',
};

const game = new Phaser.Game(config);

let player;
let platforms;
let operationText;
let score = 0;
let level = 1;
let timeLeft = 30;
let timerText;
let correctPlatform;
let particles;
let scoreText;
let levelText;
let texts; // Grupo de textos
let operationsRemaining = 10; // Contador de operaciones restantes


function preload() {
    this.load.image('platform', '../assets/platform.png');
    this.load.image('character', '../assets/character.png');
    this.load.image('star', '../assets/star.png');
}






function create() {
    // Establecer la imagen de fondo
    this.cameras.main.setBackgroundColor('#d6eaf8');


    // Texto de la operación matemática
    operationText = this.add.text(this.scale.width / 2, 50, '', {
        fontSize: '5vw',  // Texto más grande y llamativo
        color: '#00ff00', // Amarillo vibrante
        fontStyle: 'bold',
        stroke: '#000',   // Contorno negro para mejorar contraste
        strokeThickness: 8,
        shadow: {         // Agregar sombra para un efecto visual atractivo
            offsetX: 4,
            offsetY: 4,
            color: '#555',
            blur: 5,
            fill: true
        }
    }).setOrigin(0.5);
    
    // Puntaje, nivel y tiempo con colores llamativos
    scoreText = this.add.text(20, 20, `Puntaje: ${score}`, {
        fontSize: '3vw', 
        color: '#00ff00',  // Verde brillante
        fontStyle: 'bold',
        stroke: '#000', // Contorno verde oscuro
        strokeThickness: 6,
        shadow: {
            offsetX: 3,
            offsetY: 3,
            color: '#333',
            blur: 4,
            fill: true
        }
    });
    
    levelText = this.add.text(20, 70, `Nivel: ${level}`, {
        fontSize: '3vw',
        color: '#00ff00',  // Celeste
        fontStyle: 'bold',
        stroke: '#000', // Contorno azul oscuro
        strokeThickness: 6,
        shadow: {
            offsetX: 3,
            offsetY: 3,
            color: '#333',
            blur: 4,
            fill: true
        }
    });
    
    timerText = this.add.text(20, 120, `Tiempo: ${timeLeft}`, {
        fontSize: '3vw',
        color: '#00ff00',  // Rojo vibrante
        fontStyle: 'bold',
        stroke: '#000', // Contorno rojo oscuro
        strokeThickness: 6,
        shadow: {
            offsetX: 3,
            offsetY: 3,
            color: '#333',
            blur: 4,
            fill: true
        }
    });
    

    // Inicializar grupos y objetos
    particles = this.add.particles('star');
    platforms = this.add.group();
    texts = this.add.group();

    // Generar plataformas y rana
    generatePlatforms(this);
    player = this.add.sprite(this.scale.width / 2, this.scale.height - 100, 'character');
    player.setScale(0.1 * this.scale.width / 800);
    player.setDepth(10); // Asegura que la rana esté por encima de los elementos

    // Detectar clics para mover la rana
    this.input.on('pointerdown', (pointer) => {
        platforms.children.iterate((platform) => {
            if (
                Phaser.Geom.Intersects.RectangleToRectangle(
                    new Phaser.Geom.Rectangle(pointer.x, pointer.y, 1, 1),
                    platform.getBounds()
                )
            ) {
                moveToPlatform.call(this, player, platform);
                checkCollisionWithPlatform.call(this, player, platform);
            }
        });
    });

    // Configurar el temporizador del juego
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

    // Generar la primera operación matemática
    generateOperation(this);
}










async function getDifficultySettings() {
    try {
        const response = await fetch("http://localhost:5000/api/docente/getDifficulty?juego=Salto");
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

function moveToPlatform(player, platform) {
    const jumpHeight = 200; // Altura máxima del salto
    const duration = 800; // Duración total del salto (en milisegundos)

    // Tween para hacer que la rana "salte" en un arco
    this.tweens.add({
        targets: player,
        x: platform.x,
        ease: 'Power1', // Movimiento más natural en el eje X
        duration: duration,
    });

    this.tweens.add({
        targets: player,
        y: { 
            from: player.y, 
            to: platform.y - 40 
        },
        ease: 'Sine.easeInOut', // Hace que suba y baje suavemente
        yoyo: true, // Hace que la rana suba y luego baje
        duration: duration / 2, // La mitad del tiempo sube, la otra baja
        onComplete: () => {
            checkCollisionWithPlatform.call(this, player, platform);
        },
    });
}



function generatePlatforms(scene) {
    texts.clear(true, true);

    platforms.clear(true, true); // Limpiar plataformas existentes

    const safeMarginTop = 150; // Espacio reservado para la interfaz (cronómetro y puntaje)
    const safeMarginBottom = 100; // Espacio reservado cerca de la rana
    const minDistance = 180; // Distancia mínima entre plataformas

    const positions = [];
    const maxAttempts = 100; // Máximo de intentos para generar posiciones válidas
    

    for (let i = 0; i < 4; i++) {
        let validPosition = false;
        let attempts = 0;

        while (!validPosition && attempts < maxAttempts) {
            const x = Phaser.Math.Between(100, scene.scale.width - 100);
            const y = Phaser.Math.Between(
                safeMarginTop,
                scene.scale.height - safeMarginBottom
            );

            // Verificar que la posición no esté en conflicto con otras plataformas
            validPosition = positions.every(pos => {
                const distance = Phaser.Math.Distance.Between(x, y, pos.x, pos.y);
                return distance > minDistance;
            });

            if (validPosition) {
                positions.push({ x, y });
            }

            attempts++;
        }

        if (attempts === maxAttempts) {
            console.warn('No se pudo generar una posición válida para una plataforma.');
        }
    }

    positions.forEach(pos => createPlatform(scene, pos.x, pos.y));
}

function createPlatform(scene, x, y) {
    const platform = scene.add.sprite(x, y, 'platform').setScale(0.3);

    // Agregar plataforma al grupo
    platforms.add(platform);

    platform.text = null;
    platform.answer = null;
}

async function generateOperation(scene) {
    if (operationsRemaining <= 0) {
        endGame.call(scene, '¡Juego terminado!');
        return;
    }

    await fetchDifficultySettings(); // Asegurar que la configuración esté lista

    const { min, max } = difficultySettings;
    console.log(`📌 Generando operación con dificultad: min = ${min}, max = ${max}`);

    if (min >= max) {
        console.error("❌ Error: minNumber debe ser menor que maxNumber.");
        return;
    }

    // 🔥 Ahora usamos el rango configurado en la base de datos
    const num1 = Phaser.Math.Between(min, max - 1);
    const num2 = Phaser.Math.Between(min, num1);
    const correctAnswer = num1 - num2;
    const answers = [correctAnswer];

    console.log(`✅ Nueva operación generada: ${num1} - ${num2} = ${correctAnswer}`);

    while (answers.length < 4) {
        let wrongAnswer;
        do {
            wrongAnswer = Phaser.Math.Between(correctAnswer - 5, correctAnswer + 5);
        } while (answers.includes(wrongAnswer) || wrongAnswer < 0);
        answers.push(wrongAnswer);
    }

    Phaser.Utils.Array.Shuffle(answers);

    let platformIndex = 0;
    platforms.children.iterate((platform) => {
        if (platform.text) {
            platform.text.destroy();
        }
    
        platform.answer = answers[platformIndex];
    
        // Crear el texto con borde blanco
        const text = scene.add.text(platform.x, platform.y - 20, answers[platformIndex], {
            fontSize: '2vw',
            color: '#000000', // Color negro para el texto principal
            fontStyle: 'bold',
            stroke: '#FFFFFF', // Borde blanco
            strokeThickness: 6, // Grosor del borde
        }).setOrigin(0.5);
    
        texts.add(text);
        platform.text = text;
    
        if (answers[platformIndex] === correctAnswer) {
            correctPlatform = platform;
        }
        platformIndex++;
    });
    

    operationText.setText(`${num1} - ${num2} = ?`);
    operationsRemaining--; // Reducir el contador de operaciones
}







function checkCollisionWithPlatform(player, platform) {
    if (!platform.checked) {
        platform.checked = true;

        if (platform.answer === correctPlatform.answer) {
            score += 10;
            
            // 🔥 Agregar límite de nivel
            if (level >= 10) {
                endGame.call(this, `¡Felicidades! Has completado el nivel 11 con un puntaje de ${score}`);
                return;
            }

            level += 1;

            timeLeft = Math.max(15, 30 - level * 2);

            const star = this.add.sprite(platform.x, platform.y - 40, 'star').setScale(0.5);
            this.tweens.add({
                targets: star,
                scale: 1,
                alpha: 0,
                duration: 1000,
                onComplete: () => {
                    star.destroy();
                },
            });

            const correctMessage = this.add.text(
                this.scale.width / 2,
                this.scale.height / 2 - 50,
                '¡Correcto!',
                { fontSize: '4vw', color: '#000000', fontStyle: 'bold' }
            ).setOrigin(0.5);

            this.tweens.add({
                targets: correctMessage,
                alpha: 0,
                duration: 1000,
                delay: 500,
                onComplete: () => {
                    correctMessage.destroy();
                },
            });

            this.time.delayedCall(500, () => {
                generatePlatforms(this);
                generateOperation(this);
            });
        } else {
            score -= 5;
        }

        scoreText.setText(`Puntaje: ${score}`);
        levelText.setText(`Nivel: ${level}`);
    }
}









function endGame(message) {
    const timePlayed = Math.floor((Date.now() - startTime) / 1000);
    saveScore("Salto", score, level, timePlayed);

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





function update() {}


async function saveScore(game, score, nivel, timePlayed) {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
        const response = await fetch("http://localhost:5000/api/scores/save", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ game, score, nivel, timePlayed })
        });

        const data = await response.json();
        if (response.ok) console.log("✅ Puntaje guardado correctamente:", data);
        else console.error("❌ Error al guardar puntaje:", data.message);
    } catch (error) {
        console.error("❌ Error en la solicitud de guardado:", error);
    }
}