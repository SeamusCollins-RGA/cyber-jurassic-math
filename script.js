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
    let gameSpeedMultiplier = 1;
    let gameSpeedSettings = {
        'slow': { multiplier: 0.6, name: 'Slow (0.6x)' },
        'normal': { multiplier: 1.0, name: 'Normal (1x)' },
        'fast': { multiplier: 1.4, name: 'Fast (1.4x)' },
        'turbo': { multiplier: 1.8, name: 'Turbo (1.8x)' }
    };
    let currentSpeedSetting = 'normal';
    let num1, num2, correctAnswer;
    let mathOperation = '+';
    let operations = ['+', '-', '*'];
    let maxNumber = 10;
    let hintSystem = {
        consecutiveWrong: 0,
        showHint: false,
        hintText: ''
    };
    let encouragementMessages = [
        'Keep going! You can do this! 💪',
        'Great effort! Try the next one! ✨',
        'Learning by doing! You\'re improving! 🌟',
        'Every mistake is progress! 📈',
        'Focus and you\'ve got this! 🎯'
    ];
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

    function generateHint(n1, n2, operation, answer) {
        switch (operation) {
            case '+':
                return `Try counting: ${n1} + ${n2} = ${n1}${n2 <= 5 ? ' + ' + '●'.repeat(n2) : '...'}`;
            case '-':
                return `Start with ${n1}, take away ${n2}`;
            case '*':
                return `${n1} groups of ${n2}, or ${n1} × ${n2}`;
            default:
                return 'Think step by step!';
        }
    }

    function generateProblem() {
        // Adaptive difficulty based on recent performance
        let adaptiveMaxNumber = maxNumber;
        if (hintSystem.consecutiveWrong >= 2) {
            adaptiveMaxNumber = Math.max(5, maxNumber - 2); // Make easier
        }

        num1 = Math.floor(Math.random() * adaptiveMaxNumber) + 1;
        num2 = Math.floor(Math.random() * adaptiveMaxNumber) + 1;

        // Limit operations if struggling
        let availableOps = operations;
        if (hintSystem.consecutiveWrong >= 3) {
            availableOps = ['+']; // Only addition when struggling
        } else if (hintSystem.consecutiveWrong >= 2) {
            availableOps = ['+', '-']; // No multiplication when having trouble
        }

        mathOperation = availableOps[Math.floor(Math.random() * availableOps.length)];

        switch (mathOperation) {
            case '+':
                correctAnswer = num1 + num2;
                break;
            case '-':
                if (num1 < num2) [num1, num2] = [num2, num1];
                correctAnswer = num1 - num2;
                break;
            case '*':
                num1 = Math.floor(Math.random() * Math.min(adaptiveMaxNumber/2, 5)) + 1;
                num2 = Math.floor(Math.random() * Math.min(adaptiveMaxNumber/2, 5)) + 1;
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
            // Reset hint system on correct answer
            hintSystem.consecutiveWrong = 0;
            hintSystem.showHint = false;

            const points = 10 * gameSpeedMultiplier;
            feedbackElement.textContent = `CORRECT! +${Math.round(points)} points`;
            feedbackElement.style.color = '#00ff00';
            score += Math.round(points);
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
            // Enhanced wrong answer feedback with hint system
            hintSystem.consecutiveWrong++;

            if (hintSystem.consecutiveWrong >= 3) {
                hintSystem.showHint = true;
                hintSystem.hintText = generateHint(num1, num2, mathOperation, correctAnswer);
                feedbackElement.textContent = `${encouragementMessages[Math.floor(Math.random() * encouragementMessages.length)]}`;
                feedbackElement.style.color = '#ffff00';
            } else {
                feedbackElement.textContent = `WRONG! Answer was ${correctAnswer}`;
                feedbackElement.style.color = '#ff0000';
            }

            try {
                incorrectSound.play().catch(() => {});
            } catch (e) {}
            screenShake.intensity = Math.max(2, 5 - hintSystem.consecutiveWrong); // Reduced shake if struggling
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

        // Progressive difficulty with game speed multiplier
        const difficultyMultiplier = 1 + (score / 500);
        obstacleSpeed = baseObstacleSpeed * difficultyMultiplier * gameSpeedMultiplier;
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
            // Gentler obstacle spawning adjusted for game speed
            const baseInterval = Math.max(120, 250 - (score / 5));
            const obstacleInterval = baseInterval / gameSpeedMultiplier;
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

        // Update and draw particles (with mobile optimization)
        for (let i = particles.length - 1; i >= 0; i--) {
            if (!particles[i].update()) {
                particles.splice(i, 1);
            } else {
                particles[i].draw();
            }
        }

        // Limit particle count on mobile for performance
        if (particles.length > particleLimit) {
            particles.splice(0, particles.length - particleLimit);
        }

        // Enhanced UI with better readability
        ctx.save();

        // Dark background for UI text (expanded for more info)
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(5, 5, 280, 130);

        // Hint system display
        if (hintSystem.showHint) {
            ctx.fillStyle = 'rgba(0, 100, 200, 0.8)';
            ctx.fillRect(canvas.width/2 - 150, 120, 300, 60);
            ctx.fillStyle = '#ffffff';
            ctx.font = '14px "Press Start 2P"';
            ctx.fillText('💡 HINT:', canvas.width/2 - 140, 140);
            ctx.font = '12px "Press Start 2P"';
            ctx.fillText(hintSystem.hintText, canvas.width/2 - 140, 160);
        }

        ctx.shadowColor = '#00ffaa';
        ctx.shadowBlur = 15;
        ctx.fillStyle = '#00ffaa';
        ctx.font = 'bold 20px "Press Start 2P"';
        ctx.fillText('SCORE: ' + score, 15, 30);
        ctx.fillText('HIGH: ' + highScore, 15, 55);
        ctx.fillText('DIFF: ' + difficultyMultiplier.toFixed(1) + 'x', 15, 80);

        // Game speed indicator
        ctx.fillStyle = '#ffaa00';
        ctx.fillText('SPEED: ' + gameSpeedSettings[currentSpeedSetting].name, 15, 105);

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

        // Load saved preferences
        const savedSpeed = localStorage.getItem('mathGameSpeed');
        if (savedSpeed && gameSpeedSettings[savedSpeed]) {
            currentSpeedSetting = savedSpeed;
            gameSpeedMultiplier = gameSpeedSettings[currentSpeedSetting].multiplier;
        }

        // Reset hint system for new game
        hintSystem.consecutiveWrong = 0;
        hintSystem.showHint = false;
        hintSystem.hintText = '';

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

    function createPauseMenu() {
        if (document.getElementById('pause-menu')) return;

        const pauseMenu = document.createElement('div');
        pauseMenu.id = 'pause-menu';
        pauseMenu.innerHTML = `
            <div class="pause-overlay">
                <div class="pause-content">
                    <h2>⏸️ GAME PAUSED</h2>
                    <div class="speed-controls">
                        <h3>🚀 Game Speed</h3>
                        <div class="speed-buttons">
                            <button class="speed-btn" data-speed="slow">Slow (0.6x)</button>
                            <button class="speed-btn" data-speed="normal">Normal (1x)</button>
                            <button class="speed-btn" data-speed="fast">Fast (1.4x)</button>
                            <button class="speed-btn" data-speed="turbo">Turbo (1.8x)</button>
                        </div>
                        <p class="current-speed">Current: ${gameSpeedSettings[currentSpeedSetting].name}</p>
                    </div>
                    <div class="pause-actions">
                        <button id="resume-btn" class="action-btn primary">▶️ Resume Game</button>
                        <button id="restart-btn" class="action-btn secondary">🔄 Restart</button>
                    </div>
                    <div class="pause-extras">
                        <label class="toggle-label">
                            <input type="checkbox" id="particles-toggle" checked>
                            ✨ Particle Effects
                        </label>
                        <label class="toggle-label">
                            <input type="checkbox" id="hints-toggle" checked>
                            💡 Help Hints
                        </label>
                        <label class="toggle-label">
                            <input type="checkbox" id="encouragement-toggle" checked>
                            💪 Encouragement
                        </label>
                    </div>
                    <p class="pause-tip">💡 Tip: Higher speeds give more points but are harder!</p>
                </div>
            </div>
        `;
        document.body.appendChild(pauseMenu);

        // Add styles
        const style = document.createElement('style');
        style.textContent = `
            #pause-menu {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                z-index: 1000;
                font-family: 'Courier New', monospace;
            }
            .pause-overlay {
                background: rgba(0, 0, 0, 0.9);
                width: 100%;
                height: 100%;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .pause-content {
                background: linear-gradient(45deg, #1a1a2e, #16213e);
                border: 3px solid #00ffaa;
                border-radius: 15px;
                padding: 30px;
                text-align: center;
                box-shadow: 0 0 30px rgba(0, 255, 170, 0.5);
                min-width: 400px;
            }
            .pause-content h2 {
                color: #00ffaa;
                margin-bottom: 25px;
                font-size: 24px;
                text-shadow: 0 0 10px rgba(0, 255, 170, 0.8);
            }
            .pause-content h3 {
                color: #ffffff;
                margin-bottom: 15px;
                font-size: 18px;
            }
            .speed-buttons {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 10px;
                margin-bottom: 15px;
            }
            .speed-btn {
                background: linear-gradient(45deg, #0f3460, #16537e);
                color: white;
                border: 2px solid #00ffaa;
                padding: 10px 15px;
                border-radius: 8px;
                cursor: pointer;
                transition: all 0.3s ease;
                font-family: inherit;
            }
            .speed-btn:hover {
                background: linear-gradient(45deg, #16537e, #1e6091);
                box-shadow: 0 0 15px rgba(0, 255, 170, 0.4);
                transform: translateY(-2px);
            }
            .speed-btn.active {
                background: linear-gradient(45deg, #00cc88, #00ffaa);
                color: #000;
                box-shadow: 0 0 20px rgba(0, 255, 170, 0.6);
            }
            .current-speed {
                color: #00ffaa;
                margin-bottom: 20px;
                font-weight: bold;
            }
            .pause-actions {
                display: flex;
                gap: 15px;
                justify-content: center;
                margin-bottom: 15px;
            }
            .action-btn {
                padding: 12px 25px;
                border: none;
                border-radius: 8px;
                cursor: pointer;
                font-family: inherit;
                font-size: 16px;
                transition: all 0.3s ease;
            }
            .action-btn.primary {
                background: linear-gradient(45deg, #00cc88, #00ffaa);
                color: #000;
            }
            .action-btn.secondary {
                background: linear-gradient(45deg, #cc6600, #ff8800);
                color: white;
            }
            .action-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
            }
            .pause-tip {
                color: #ffff88;
                font-size: 12px;
                margin: 0;
            }
            .pause-extras {
                margin-top: 20px;
                display: flex;
                flex-direction: column;
                gap: 10px;
            }
            .toggle-label {
                display: flex;
                align-items: center;
                gap: 8px;
                color: #ffffff;
                cursor: pointer;
                user-select: none;
            }
            .toggle-label input[type="checkbox"] {
                width: 18px;
                height: 18px;
                cursor: pointer;
            }
        `;
        document.head.appendChild(style);

        // Event listeners
        const speedButtons = pauseMenu.querySelectorAll('.speed-btn');
        speedButtons.forEach(btn => {
            if (btn.dataset.speed === currentSpeedSetting) {
                btn.classList.add('active');
            }
            btn.addEventListener('click', () => {
                speedButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                currentSpeedSetting = btn.dataset.speed;
                gameSpeedMultiplier = gameSpeedSettings[currentSpeedSetting].multiplier;
                pauseMenu.querySelector('.current-speed').textContent =
                    `Current: ${gameSpeedSettings[currentSpeedSetting].name}`;

                // Save preference
                localStorage.setItem('mathGameSpeed', currentSpeedSetting);
            });
        });

        pauseMenu.querySelector('#resume-btn').addEventListener('click', () => {
            togglePause();
        });

        pauseMenu.querySelector('#restart-btn').addEventListener('click', () => {
            removePauseMenu();
            gameOver();
            setTimeout(() => startGame(), 100);
        });

        // Settings toggles
        pauseMenu.querySelector('#particles-toggle').addEventListener('change', (e) => {
            const enableParticles = e.target.checked;
            localStorage.setItem('mathGameParticles', enableParticles);
            // Adjust particle limit based on setting and device
            if (!enableParticles) {
                particles = []; // Clear all particles
                particleLimit = 0;
            } else {
                particleLimit = isMobile ? 50 : 200;
            }
        });

        pauseMenu.querySelector('#hints-toggle').addEventListener('change', (e) => {
            localStorage.setItem('mathGameHints', e.target.checked);
        });

        pauseMenu.querySelector('#encouragement-toggle').addEventListener('change', (e) => {
            localStorage.setItem('mathGameEncouragement', e.target.checked);
        });
    }

    function removePauseMenu() {
        const pauseMenu = document.getElementById('pause-menu');
        if (pauseMenu) {
            pauseMenu.remove();
        }
    }

    function togglePause() {
        if (!gameRunning) return;

        gamePaused = !gamePaused;
        if (gamePaused) {
            createPauseMenu();
            feedbackElement.textContent = '';
        } else {
            removePauseMenu();
            feedbackElement.textContent = '';
            gameAnswerElement.focus();
        }
    }

    // Enhanced canvas responsiveness for iPhone keyboard
    function resizeCanvas() {
        const container = canvas.parentElement;
        const containerWidth = container.clientWidth;
        const aspectRatio = 800 / 400;

        // Check if keyboard is open and adjust accordingly
        if (keyboardOpen && isMobile) {
            // iPhone keyboard mode: prioritize controls visibility
            const maxHeight = Math.min(180, window.innerHeight * 0.25);
            canvas.style.width = containerWidth + 'px';
            canvas.style.height = maxHeight + 'px';
        } else if (containerWidth < 800) {
            canvas.style.width = containerWidth + 'px';
            canvas.style.height = (containerWidth / aspectRatio) + 'px';
        } else {
            canvas.style.width = '800px';
            canvas.style.height = '400px';
        }

        // Adjust game physics for smaller canvas
        const canvasHeight = parseInt(canvas.style.height) || 400;
        dino.groundY = canvasHeight - 50;
        if (!gameRunning) {
            dino.y = dino.groundY;
        }
    }

    // Mobile performance optimization
    let isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    let isTouch = 'ontouchstart' in window;
    let particleLimit = isMobile ? 50 : 200; // Reduce particles on mobile

    // Virtual keyboard detection
    let viewportHeight = window.innerHeight;
    let keyboardOpen = false;

    function detectKeyboard() {
        const currentHeight = window.innerHeight;
        const heightDifference = viewportHeight - currentHeight;
        const keyboardThreshold = 150; // Minimum height difference to consider keyboard open

        if (heightDifference > keyboardThreshold && !keyboardOpen) {
            keyboardOpen = true;
            document.body.classList.add('keyboard-open');

            // Critical iPhone fix: Drastically reduce canvas size
            if (gameRunning) {
                canvas.style.height = '180px'; // Reduced from 400px
                canvas.style.maxHeight = '25vh';

                // Move game controls to fixed position above keyboard
                const gameContainer = document.getElementById('game-problem-container');
                if (gameContainer) {
                    gameContainer.style.position = 'fixed';
                    gameContainer.style.bottom = (heightDifference + 20) + 'px';
                    gameContainer.style.left = '50%';
                    gameContainer.style.transform = 'translateX(-50%)';
                    gameContainer.style.width = '90%';
                    gameContainer.style.zIndex = '1000';
                    gameContainer.style.background = 'rgba(0, 17, 34, 0.95)';
                    gameContainer.style.border = '2px solid #00ffaa';
                }
            }
        } else if (heightDifference <= keyboardThreshold && keyboardOpen) {
            keyboardOpen = false;
            document.body.classList.remove('keyboard-open');

            // Restore original layout
            if (canvas) {
                canvas.style.height = '';
                canvas.style.maxHeight = '';
            }

            const gameContainer = document.getElementById('game-problem-container');
            if (gameContainer) {
                gameContainer.style.position = '';
                gameContainer.style.bottom = '';
                gameContainer.style.left = '';
                gameContainer.style.transform = '';
                gameContainer.style.width = '';
                gameContainer.style.zIndex = '';
                gameContainer.style.background = '';
                gameContainer.style.border = '';
            }

            resizeCanvas();
        }
    }

    // Initialize
    resizeCanvas();
    initStars();
    window.addEventListener('resize', () => {
        resizeCanvas();
        detectKeyboard();
    });

    // Mobile-specific event listeners
    if (isTouch) {
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                resizeCanvas();
                viewportHeight = window.innerHeight;
            }, 100);
        });

        // Prevent zoom on input focus
        const inputs = document.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            input.addEventListener('focus', (e) => {
                e.target.style.fontSize = '16px';
            });
        });
    }

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

    // Auto-focus answer input when typing (desktop only)
    if (!isTouch) {
        window.addEventListener('keydown', (e) => {
            if (gameRunning && !gamePaused && e.key >= '0' && e.key <= '9') {
                gameAnswerElement.focus();
            }
        });
    }

    // Mobile-specific input handling
    if (isTouch) {
        gameAnswerElement.addEventListener('focus', () => {
            // Small delay to ensure keyboard is open
            setTimeout(() => {
                detectKeyboard();
                // Scroll input into view
                gameAnswerElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center'
                });
            }, 300);
        });

        gameAnswerElement.addEventListener('blur', () => {
            setTimeout(detectKeyboard, 300);
        });

        // Improve touch responsiveness for input
        gameAnswerElement.addEventListener('touchstart', (e) => {
            e.stopPropagation(); // Prevent canvas touch handler
        });

        gameSubmitButton.addEventListener('touchstart', (e) => {
            e.stopPropagation(); // Prevent canvas touch handler
        });
    }

    // Enhanced mobile touch controls
    let touchStartTime = 0;
    let touchStartPos = { x: 0, y: 0 };

    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        touchStartTime = Date.now();
        const touch = e.touches[0];
        touchStartPos.x = touch.clientX;
        touchStartPos.y = touch.clientY;
    }, { passive: false });

    canvas.addEventListener('touchend', (e) => {
        e.preventDefault();
        const touchDuration = Date.now() - touchStartTime;
        const touch = e.changedTouches[0];
        const deltaX = Math.abs(touch.clientX - touchStartPos.x);
        const deltaY = Math.abs(touch.clientY - touchStartPos.y);

        // Only register tap if it's quick and doesn't move much (not a swipe)
        if (touchDuration < 500 && deltaX < 30 && deltaY < 30) {
            if (gameRunning && !gamePaused) {
                if (gameAnswerElement.value.trim() !== '') {
                    checkAnswer();
                } else {
                    dino.jump();
                    // Visual feedback for touch
                    for (let i = 0; i < (isMobile ? 5 : 10); i++) {
                        particles.push(new Particle(
                            touch.clientX - canvas.getBoundingClientRect().left,
                            touch.clientY - canvas.getBoundingClientRect().top,
                            '#00ffaa',
                            Math.random() * 3 + 1,
                            { x: (Math.random() - 0.5) * 6, y: -Math.random() * 4 }
                        ));
                    }
                }
            }
        }
    }, { passive: false });

    // Prevent zoom on mobile
    document.addEventListener('touchmove', (e) => {
        if (e.scale !== 1) e.preventDefault();
    }, { passive: false });
});