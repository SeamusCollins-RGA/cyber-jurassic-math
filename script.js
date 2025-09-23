document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('game-canvas');
    const ctx = canvas.getContext('2d');
    const startButton = document.getElementById('start-button');
    const gameProblemContainer = document.getElementById('game-problem-container');
    const gameProblemElement = document.getElementById('game-problem');
    const gameAnswerElement = document.getElementById('game-answer');
    const gameSubmitButton = document.getElementById('game-submit');
    const feedbackElement = document.getElementById('feedback');
    const correctSound = document.getElementById('correct-sound');
    const incorrectSound = document.getElementById('incorrect-sound');

    // Game variables
    let gameRunning = false;
    let gamePaused = false;
    let gameStartTime = 0;
    let gracePeriod = true;
    let score = 0;
    let highScore = parseInt(localStorage.getItem('mathInvadersHighScore')) || 0;
    let obstacles = [];
    let particles = [];
    let stars = [];
    let frameCount = 0;
    let lastFrameTime = 0;
    let obstacleSpeed = 3;
    let baseObstacleSpeed = 3;
    let num1, num2, correctAnswer;
    let mathOperation = '+';
    let operations = ['+', '-', '*'];
    let maxNumber = 10;
    let screenShake = { x: 0, y: 0, intensity: 0 };
    let cameraOffset = { x: 0, y: 0 };

    // Visual effects
    let lightning = [];
    let energyBeams = [];

    // Particle System
    class Particle {
        constructor(x, y, color = '#00ffaa', size = 3, velocity = null) {
            this.x = x;
            this.y = y;
            this.color = color;
            this.size = size;
            this.life = 1.0;
            this.maxLife = 1.0;
            this.velocity = velocity || {
                x: (Math.random() - 0.5) * 10,
                y: (Math.random() - 0.5) * 10
            };
            this.gravity = 0.2;
            this.friction = 0.95;
        }

        update() {
            this.x += this.velocity.x;
            this.y += this.velocity.y;
            this.velocity.y += this.gravity;
            this.velocity.x *= this.friction;
            this.velocity.y *= this.friction;
            this.life -= 0.02;
            return this.life > 0;
        }

        draw() {
            const alpha = this.life / this.maxLife;
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.shadowColor = this.color;
            ctx.shadowBlur = 10;
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size * alpha, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }

    // Star field background
    class Star {
        constructor() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.z = Math.random() * 3 + 1;
            this.brightness = Math.random();
        }

        update() {
            this.x -= this.z * 2;
            if (this.x < 0) {
                this.x = canvas.width;
                this.y = Math.random() * canvas.height;
            }
        }

        draw() {
            const alpha = this.brightness * (Math.sin(frameCount * 0.01 + this.z) * 0.5 + 0.5);
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.fillStyle = '#00ffaa';
            ctx.shadowColor = '#00ffaa';
            ctx.shadowBlur = this.z * 2;
            ctx.fillRect(this.x, this.y, this.z, 1);
            ctx.restore();
        }
    }

    // Enhanced Cyber Dinosaur
    const dino = {
        x: 50,
        y: canvas.height - 50,
        width: 52,
        height: 52,
        velocityY: 0,
        isJumping: false,
        groundY: canvas.height - 50,
        trail: [],
        energy: 100,
        draw() {
            // Add trail effect when jumping
            if (this.isJumping) {
                this.trail.push({ x: this.x + this.width/2, y: this.y + this.height/2, life: 20 });
            }

            // Draw trail
            for (let i = this.trail.length - 1; i >= 0; i--) {
                const t = this.trail[i];
                const alpha = t.life / 20;
                ctx.save();
                ctx.globalAlpha = alpha;
                ctx.fillStyle = '#00ffaa';
                ctx.shadowColor = '#00ffaa';
                ctx.shadowBlur = 15;
                ctx.beginPath();
                ctx.arc(t.x, t.y, 8 * alpha, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();

                t.life--;
                if (t.life <= 0) this.trail.splice(i, 1);
            }

            // Main body with enhanced glow
            const centerX = this.x + this.width / 2;
            const centerY = this.y + this.height / 2;

            ctx.save();
            ctx.shadowColor = '#00ffaa';
            ctx.shadowBlur = 20;

            // Body gradient with energy pulse
            const energyPulse = Math.sin(frameCount * 0.1) * 0.2 + 0.8;
            const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, this.width);
            gradient.addColorStop(0, `rgba(0, 255, 170, ${energyPulse})`);
            gradient.addColorStop(0.7, `rgba(0, 204, 136, ${energyPulse * 0.7})`);
            gradient.addColorStop(1, `rgba(0, 136, 102, ${energyPulse * 0.5})`);

            // Main body
            ctx.fillStyle = gradient;
            ctx.fillRect(this.x + 5, this.y + 15, this.width - 10, this.height - 20);

            // Head with glow
            ctx.fillStyle = '#00ff88';
            ctx.fillRect(this.x + 35, this.y + 5, 20, 25);

            // Enhanced spikes
            ctx.fillStyle = '#00ffcc';
            for (let i = 0; i < 4; i++) {
                const spikeX = this.x + 10 + (i * 8);
                ctx.beginPath();
                ctx.moveTo(spikeX, this.y + 15);
                ctx.lineTo(spikeX + 4, this.y);
                ctx.lineTo(spikeX + 8, this.y + 15);
                ctx.fill();
            }

            // Glowing eyes with energy effect
            const eyeGlow = Math.sin(frameCount * 0.2) * 0.5 + 0.5;
            ctx.shadowBlur = 15 + eyeGlow * 10;
            ctx.fillStyle = '#ff0040';
            ctx.fillRect(this.x + 42, this.y + 12, 6, 6);
            ctx.fillRect(this.x + 42, this.y + 22, 6, 6);

            // Eye centers with intense glow
            ctx.shadowBlur = 25;
            ctx.fillStyle = '#ffff00';
            ctx.fillRect(this.x + 44, this.y + 14, 2, 2);
            ctx.fillRect(this.x + 44, this.y + 24, 2, 2);

            // Power lines across body
            ctx.strokeStyle = `rgba(0, 255, 170, ${energyPulse})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            for (let i = 0; i < 3; i++) {
                const lineY = this.y + 20 + (i * 8);
                ctx.moveTo(this.x + 8, lineY);
                ctx.lineTo(this.x + this.width - 8, lineY);
            }
            ctx.stroke();

            ctx.restore();

            // Legs with energy
            ctx.fillStyle = '#00cc66';
            ctx.fillRect(this.x + 8, this.y + this.height - 8, 6, 8);
            ctx.fillRect(this.x + 20, this.y + this.height - 8, 6, 8);

            // Enhanced tail
            ctx.fillStyle = '#00aa55';
            ctx.fillRect(this.x, this.y + 25, 12, 8);
        },
        jump() {
            if (!this.isJumping) {
                this.isJumping = true;
                this.velocityY = -20;
                // Create jump particle effect
                for (let i = 0; i < 10; i++) {
                    particles.push(new Particle(
                        this.x + this.width/2 + (Math.random() - 0.5) * this.width,
                        this.y + this.height,
                        '#00ffaa',
                        Math.random() * 4 + 2,
                        { x: (Math.random() - 0.5) * 8, y: -Math.random() * 5 }
                    ));
                }
            }
        },
        reset() {
            this.y = this.groundY;
            this.velocityY = 0;
            this.isJumping = false;
            this.trail = [];
        }
    };

    // Enhanced Alien Enemy
    class Obstacle {
        constructor() {
            this.x = canvas.width;
            this.y = canvas.height - 50;
            this.width = 20;
            this.height = 50;
            this.energy = Math.sin(frameCount * 0.1) * 0.3 + 0.7;
        }

        draw() {
            const centerX = this.x + this.width / 2;
            const centerY = this.y + this.height / 2;

            ctx.save();
            ctx.shadowColor = '#ff0000';
            ctx.shadowBlur = 15 + Math.sin(frameCount * 0.2) * 5;

            // Pulsing energy effect
            const pulse = Math.sin(frameCount * 0.15 + this.x * 0.01) * 0.3 + 0.7;

            // Main body with evil gradient
            const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, this.width);
            gradient.addColorStop(0, `rgba(255, 17, 51, ${pulse})`);
            gradient.addColorStop(0.7, `rgba(204, 0, 34, ${pulse * 0.8})`);
            gradient.addColorStop(1, `rgba(153, 0, 17, ${pulse * 0.6})`);

            ctx.fillStyle = gradient;
            ctx.fillRect(this.x + 2, this.y, this.width - 4, this.height);

            // Menacing spikes
            ctx.fillStyle = '#ff4444';
            for (let i = 0; i < 3; i++) {
                const spikeX = this.x + 3 + (i * 5);
                ctx.beginPath();
                ctx.moveTo(spikeX, this.y);
                ctx.lineTo(spikeX + 2, this.y - 12);
                ctx.lineTo(spikeX + 4, this.y);
                ctx.fill();
            }

            // Glowing evil eyes
            const eyeGlow = Math.sin(frameCount * 0.25 + this.x * 0.02) * 0.5 + 0.5;
            ctx.shadowBlur = 20 + eyeGlow * 10;
            ctx.fillStyle = '#ff0000';
            ctx.fillRect(this.x + 4, this.y + 8, 4, 4);
            ctx.fillRect(this.x + 12, this.y + 8, 4, 4);

            // Eye energy beams
            if (Math.random() < 0.1) {
                ctx.strokeStyle = 'rgba(255, 0, 0, 0.8)';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(this.x + 6, this.y + 10);
                ctx.lineTo(this.x - 50, this.y + 10);
                ctx.moveTo(this.x + 14, this.y + 10);
                ctx.lineTo(this.x - 50, this.y + 10);
                ctx.stroke();
            }

            // Eye centers
            ctx.shadowBlur = 30;
            ctx.fillStyle = '#ffff00';
            ctx.fillRect(this.x + 5, this.y + 9, 2, 2);
            ctx.fillRect(this.x + 13, this.y + 9, 2, 2);

            // Teeth/claws with glow
            ctx.shadowBlur = 10;
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(this.x + 6, this.y + 15, 2, 8);
            ctx.fillRect(this.x + 12, this.y + 15, 2, 8);

            // Side energy spikes
            ctx.fillStyle = '#ff2222';
            ctx.fillRect(this.x - 3, this.y + 20, 6, 4);
            ctx.fillRect(this.x + this.width - 3, this.y + 20, 6, 4);

            ctx.restore();

            // Particle trail
            if (Math.random() < 0.3) {
                particles.push(new Particle(
                    this.x + Math.random() * this.width,
                    this.y + Math.random() * this.height,
                    '#ff3333',
                    Math.random() * 3 + 1,
                    { x: -2, y: (Math.random() - 0.5) * 4 }
                ));
            }
        }

        update(deltaMultiplier = 1) {
            this.x -= obstacleSpeed * deltaMultiplier;
        }

        explode() {
            // Create explosion particles
            for (let i = 0; i < 25; i++) {
                particles.push(new Particle(
                    this.x + this.width/2 + (Math.random() - 0.5) * this.width,
                    this.y + this.height/2 + (Math.random() - 0.5) * this.height,
                    Math.random() < 0.5 ? '#ff0000' : '#ffaa00',
                    Math.random() * 6 + 3,
                    {
                        x: (Math.random() - 0.5) * 15,
                        y: (Math.random() - 0.5) * 15
                    }
                ));
            }
            // Screen shake on explosion
            screenShake.intensity = 10;
        }
    }

    // Initialize starfield
    function initStars() {
        stars = [];
        for (let i = 0; i < 100; i++) {
            stars.push(new Star());
        }
    }

    function generateProblem() {
        num1 = Math.floor(Math.random() * maxNumber) + 1;
        num2 = Math.floor(Math.random() * maxNumber) + 1;

        mathOperation = operations[Math.floor(Math.random() * operations.length)];

        switch (mathOperation) {
            case '+':
                correctAnswer = num1 + num2;
                break;
            case '-':
                if (num1 < num2) [num1, num2] = [num2, num1];
                correctAnswer = num1 - num2;
                break;
            case '*':
                num1 = Math.floor(Math.random() * Math.min(maxNumber/2, 5)) + 1;
                num2 = Math.floor(Math.random() * Math.min(maxNumber/2, 5)) + 1;
                correctAnswer = num1 * num2;
                break;
        }

        gameProblemElement.textContent = `${num1} ${mathOperation} ${num2} = ?`;
    }

    function checkAnswer() {
        const input = gameAnswerElement.value.trim();

        if (input === '') {
            feedbackElement.textContent = 'Please enter an answer!';
            feedbackElement.style.color = '#ffff00';
            return;
        }

        const userAnswer = parseInt(input);
        if (isNaN(userAnswer)) {
            feedbackElement.textContent = 'Please enter a valid number!';
            feedbackElement.style.color = '#ffff00';
            return;
        }

        if (userAnswer === correctAnswer) {
            feedbackElement.textContent = 'CORRECT! +10 points';
            feedbackElement.style.color = '#00ff00';
            score += 10;
            try {
                correctSound.play().catch(() => {});
            } catch (e) {}
            dino.jump();
            // Success particle burst
            for (let i = 0; i < 15; i++) {
                particles.push(new Particle(
                    canvas.width/2 + (Math.random() - 0.5) * 100,
                    50,
                    '#00ff00',
                    Math.random() * 5 + 3,
                    { x: (Math.random() - 0.5) * 10, y: -Math.random() * 8 }
                ));
            }
        } else {
            feedbackElement.textContent = `WRONG! Answer was ${correctAnswer}`;
            feedbackElement.style.color = '#ff0000';
            try {
                incorrectSound.play().catch(() => {});
            } catch (e) {}
            screenShake.intensity = 5;
        }

        gameAnswerElement.value = '';
        setTimeout(() => {
            if (feedbackElement.textContent !== 'GAME OVER! Final Score: ' + score) {
                feedbackElement.textContent = '';
            }
        }, 2000);
        generateProblem();
    }

    function updateScreenShake() {
        if (screenShake.intensity > 0) {
            screenShake.x = (Math.random() - 0.5) * screenShake.intensity;
            screenShake.y = (Math.random() - 0.5) * screenShake.intensity;
            screenShake.intensity *= 0.9;
            if (screenShake.intensity < 0.1) screenShake.intensity = 0;
        } else {
            screenShake.x = 0;
            screenShake.y = 0;
        }
    }

    function gameLoop(currentTime) {
        if (!gameRunning) return;

        if (gamePaused) {
            requestAnimationFrame(gameLoop);
            return;
        }

        const deltaTime = currentTime - lastFrameTime;
        lastFrameTime = currentTime;
        const normalizedDelta = Math.min(deltaTime / 16.67, 3);

        // Update screen shake
        updateScreenShake();

        // Apply camera shake
        ctx.save();
        ctx.translate(screenShake.x, screenShake.y);

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw animated starfield
        stars.forEach(star => {
            star.update();
            star.draw();
        });

        // Draw cyber grid with movement
        ctx.strokeStyle = 'rgba(0, 255, 170, 0.2)';
        ctx.lineWidth = 1;
        const gridOffset = (frameCount * 2) % 40;
        for (let x = -gridOffset; x < canvas.width + 40; x += 40) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvas.height);
            ctx.stroke();
        }
        for (let y = 0; y < canvas.height + 40; y += 40) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
            ctx.stroke();
        }

        // Progressive difficulty
        const difficultyMultiplier = 1 + (score / 500);
        obstacleSpeed = baseObstacleSpeed * difficultyMultiplier;
        maxNumber = Math.min(10 + Math.floor(score / 100), 20);

        // Update and draw dinosaur
        const gravity = 0.6 * normalizedDelta;
        dino.velocityY += gravity;
        dino.y += dino.velocityY * normalizedDelta;

        if (dino.y > dino.groundY) {
            dino.y = dino.groundY;
            dino.isJumping = false;
            dino.velocityY = 0;
        }

        dino.draw();

        // Generate obstacles with grace period for new players
        frameCount++;
        const gameTime = (currentTime - gameStartTime) / 1000;

        // Grace period - no obstacles for first 5 seconds
        if (gameTime < 5) {
            gracePeriod = true;
        } else {
            gracePeriod = false;
            // Gentler obstacle spawning
            const obstacleInterval = Math.max(120, 250 - (score / 5));
            if (frameCount % Math.floor(obstacleInterval) === 0) {
                obstacles.push(new Obstacle());
            }
        }

        // Update and draw obstacles
        for (let i = obstacles.length - 1; i >= 0; i--) {
            obstacles[i].update(normalizedDelta);
            obstacles[i].draw();

            // Collision detection
            if (
                dino.x < obstacles[i].x + obstacles[i].width &&
                dino.x + dino.width > obstacles[i].x &&
                dino.y < obstacles[i].y + obstacles[i].height &&
                dino.y + dino.height > obstacles[i].y
            ) {
                obstacles[i].explode();
                gameOver();
                ctx.restore();
                return;
            }

            // Remove off-screen obstacles
            if (obstacles[i].x + obstacles[i].width < 0) {
                obstacles[i].explode();
                obstacles.splice(i, 1);
                score += 5;
            }
        }

        // Update and draw particles
        for (let i = particles.length - 1; i >= 0; i--) {
            if (!particles[i].update()) {
                particles.splice(i, 1);
            } else {
                particles[i].draw();
            }
        }

        // Enhanced UI with better readability
        ctx.save();

        // Dark background for UI text
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(5, 5, 250, 90);

        ctx.shadowColor = '#00ffaa';
        ctx.shadowBlur = 15;
        ctx.fillStyle = '#00ffaa';
        ctx.font = 'bold 20px "Press Start 2P"';
        ctx.fillText('SCORE: ' + score, 15, 30);
        ctx.fillText('HIGH: ' + highScore, 15, 55);
        ctx.fillText('SPEED: ' + difficultyMultiplier.toFixed(1) + 'x', 15, 80);

        // Grace period indicator
        if (gracePeriod) {
            ctx.fillStyle = '#ffff00';
            ctx.font = '16px "Press Start 2P"';
            ctx.fillText('GRACE PERIOD: ' + Math.ceil(5 - gameTime) + 's', canvas.width/2 - 120, 30);
        }

        // Pause instruction with background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(canvas.width - 200, 5, 190, 25);
        ctx.fillStyle = '#00ffaa';
        ctx.font = '12px "Press Start 2P"';
        ctx.fillText('Press P to pause', canvas.width - 190, 22);
        ctx.restore();

        ctx.restore(); // Restore camera shake transformation

        requestAnimationFrame(gameLoop);
    }

    function startGame() {
        console.log('Starting game...');
        gameRunning = true;
        gamePaused = false;
        gameStartTime = performance.now();
        gracePeriod = true;

        // Hide instructions and start button
        startButton.style.display = 'none';
        document.getElementById('instructions').style.display = 'none';
        gameProblemContainer.style.display = 'block';

        score = 0;
        obstacles = [];
        particles = [];
        frameCount = 0;
        lastFrameTime = 0;
        screenShake = { x: 0, y: 0, intensity: 0 };
        dino.reset();

        // Gentler starting difficulty
        baseObstacleSpeed = 2;
        operations = ['+'];
        maxNumber = 5;
        obstacleSpeed = baseObstacleSpeed;

        initStars();
        generateProblem();
        gameAnswerElement.focus();

        // Show welcome message
        feedbackElement.textContent = 'Get ready! Grace period active...';
        feedbackElement.style.color = '#ffff00';
        setTimeout(() => {
            if (gameRunning) feedbackElement.textContent = '';
        }, 3000);

        requestAnimationFrame(gameLoop);
    }

    function gameOver() {
        gameRunning = false;
        gracePeriod = false;

        // Reduced explosion effect for accessibility
        for (let i = 0; i < 20; i++) {
            particles.push(new Particle(
                canvas.width/2 + (Math.random() - 0.5) * 100,
                canvas.height/2 + (Math.random() - 0.5) * 100,
                Math.random() < 0.5 ? '#ff0000' : '#ffaa00',
                Math.random() * 6 + 2,
                {
                    x: (Math.random() - 0.5) * 10,
                    y: (Math.random() - 0.5) * 10
                }
            ));
        }

        screenShake.intensity = 10; // Reduced shake

        if (score > highScore) {
            highScore = score;
            localStorage.setItem('mathInvadersHighScore', highScore.toString());
            feedbackElement.textContent = `🏆 NEW HIGH SCORE! ${score} 🏆`;
            feedbackElement.style.color = '#ffff00';
        } else {
            feedbackElement.textContent = 'GAME OVER! Final Score: ' + score;
            feedbackElement.style.color = '#ff0000';
        }

        // Show instructions again
        startButton.style.display = 'block';
        document.getElementById('instructions').style.display = 'block';
        gameProblemContainer.style.display = 'none';

        // Progressive difficulty after first game
        setTimeout(() => {
            if (!gameRunning) {
                operations = ['+', '-', '*'];
                maxNumber = 10;
            }
        }, 1000);
    }

    function togglePause() {
        if (!gameRunning) return;

        gamePaused = !gamePaused;
        if (gamePaused) {
            feedbackElement.textContent = '⏸️ PAUSED - Press P to continue';
            feedbackElement.style.color = '#ffff00';
        } else {
            feedbackElement.textContent = '';
            gameAnswerElement.focus();
        }
    }

    // Canvas responsiveness
    function resizeCanvas() {
        const container = canvas.parentElement;
        const containerWidth = container.clientWidth;
        const aspectRatio = 800 / 400;

        if (containerWidth < 800) {
            canvas.style.width = containerWidth + 'px';
            canvas.style.height = (containerWidth / aspectRatio) + 'px';
        } else {
            canvas.style.width = '800px';
            canvas.style.height = '400px';
        }

        dino.groundY = canvas.height - 50;
        if (!gameRunning) {
            dino.y = dino.groundY;
        }
    }

    // Initialize
    resizeCanvas();
    initStars();
    window.addEventListener('resize', resizeCanvas);

    // Event listeners
    startButton.addEventListener('click', () => {
        console.log('Start button clicked');
        startGame();
    });

    gameSubmitButton.addEventListener('click', checkAnswer);

    window.addEventListener('keydown', (e) => {
        if (e.code === 'Space' && gameRunning && !gamePaused) {
            e.preventDefault();
            if (gameAnswerElement.value.trim() !== '') {
                checkAnswer();
            } else {
                dino.jump();
            }
        } else if (e.code === 'KeyP') {
            e.preventDefault();
            togglePause();
        } else if (e.code === 'Enter' && gameRunning && !gamePaused) {
            e.preventDefault();
            checkAnswer();
        }
    });

    // Auto-focus answer input when typing
    window.addEventListener('keydown', (e) => {
        if (gameRunning && !gamePaused && e.key >= '0' && e.key <= '9') {
            gameAnswerElement.focus();
        }
    });

    // Mobile touch controls
    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        if (gameRunning && !gamePaused) {
            if (gameAnswerElement.value.trim() !== '') {
                checkAnswer();
            } else {
                dino.jump();
            }
        }
    }, { passive: false });

    // Prevent zoom on mobile
    document.addEventListener('touchmove', (e) => {
        if (e.scale !== 1) e.preventDefault();
    }, { passive: false });
});