document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('game-canvas');
    const ctx = canvas.getContext('2d');
    const startButton = document.getElementById('start-button');
    // Easy mode removed
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
    let score = 0;
    let highScore = parseInt(localStorage.getItem('mathInvadersHighScore')) || 0;
    let obstacles = [];
    let frameCount = 0;
    let lastFrameTime = 0;
    let obstacleSpeed = 3;
    let baseObstacleSpeed = 3;
    let num1, num2, correctAnswer;
    let mathOperation = '+';
    let operations = ['+', '-', '*'];
    let maxNumber = 10;

    // Create simple dinosaur sprite as fallback
    const dino = {
        x: 50,
        y: canvas.height - 50,
        width: 52,
        height: 52,
        velocityY: 0,
        isJumping: false,
        groundY: canvas.height - 50,
        draw() {
            // Draw a cool cyber dinosaur
            const centerX = this.x + this.width / 2;
            const centerY = this.y + this.height / 2;

            // Body gradient effect
            const gradient = ctx.createLinearGradient(this.x, this.y, this.x, this.y + this.height);
            gradient.addColorStop(0, '#00ff88');
            gradient.addColorStop(0.5, '#00cc66');
            gradient.addColorStop(1, '#008844');

            // Main body
            ctx.fillStyle = gradient;
            ctx.fillRect(this.x + 5, this.y + 15, this.width - 10, this.height - 20);

            // Head
            ctx.fillStyle = '#00ff88';
            ctx.fillRect(this.x + 35, this.y + 5, 20, 25);

            // Spikes on back
            ctx.fillStyle = '#00ffaa';
            for (let i = 0; i < 4; i++) {
                const spikeX = this.x + 10 + (i * 8);
                ctx.beginPath();
                ctx.moveTo(spikeX, this.y + 15);
                ctx.lineTo(spikeX + 4, this.y + 5);
                ctx.lineTo(spikeX + 8, this.y + 15);
                ctx.fill();
            }

            // Glowing eyes
            ctx.fillStyle = '#ff0040';
            ctx.fillRect(this.x + 42, this.y + 12, 6, 6);
            ctx.fillRect(this.x + 42, this.y + 22, 6, 6);

            // Eye glow effect
            ctx.shadowColor = '#ff0040';
            ctx.shadowBlur = 8;
            ctx.fillStyle = '#ffff00';
            ctx.fillRect(this.x + 44, this.y + 14, 2, 2);
            ctx.fillRect(this.x + 44, this.y + 24, 2, 2);
            ctx.shadowBlur = 0;

            // Legs
            ctx.fillStyle = '#00cc66';
            ctx.fillRect(this.x + 8, this.y + this.height - 8, 6, 8);
            ctx.fillRect(this.x + 20, this.y + this.height - 8, 6, 8);

            // Tail
            ctx.fillStyle = '#00aa55';
            ctx.fillRect(this.x, this.y + 25, 12, 8);
        },
        jump() {
            if (!this.isJumping) {
                this.isJumping = true;
                this.velocityY = -20;
            }
        },
        reset() {
            this.y = this.groundY;
            this.velocityY = 0;
            this.isJumping = false;
        }
    };

    // Obstacle class
    class Obstacle {
        constructor() {
            this.x = canvas.width;
            this.y = canvas.height - 50;
            this.width = 20;
            this.height = 50;
        }

        draw() {
            // Draw scary alien enemy
            const centerX = this.x + this.width / 2;
            const centerY = this.y + this.height / 2;

            // Main body - dark red with gradient
            const gradient = ctx.createLinearGradient(this.x, this.y, this.x, this.y + this.height);
            gradient.addColorStop(0, '#ff1133');
            gradient.addColorStop(0.5, '#cc0022');
            gradient.addColorStop(1, '#990011');

            ctx.fillStyle = gradient;
            ctx.fillRect(this.x + 2, this.y, this.width - 4, this.height);

            // Scary spikes on top
            ctx.fillStyle = '#ff4444';
            for (let i = 0; i < 3; i++) {
                const spikeX = this.x + 3 + (i * 5);
                ctx.beginPath();
                ctx.moveTo(spikeX, this.y);
                ctx.lineTo(spikeX + 2, this.y - 8);
                ctx.lineTo(spikeX + 4, this.y);
                ctx.fill();
            }

            // Glowing evil eyes
            ctx.shadowColor = '#ff0000';
            ctx.shadowBlur = 6;
            ctx.fillStyle = '#ff0000';
            ctx.fillRect(this.x + 4, this.y + 8, 4, 4);
            ctx.fillRect(this.x + 12, this.y + 8, 4, 4);

            // Eye centers
            ctx.fillStyle = '#ffff00';
            ctx.fillRect(this.x + 5, this.y + 9, 2, 2);
            ctx.fillRect(this.x + 13, this.y + 9, 2, 2);
            ctx.shadowBlur = 0;

            // Teeth/claws
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(this.x + 6, this.y + 15, 2, 6);
            ctx.fillRect(this.x + 12, this.y + 15, 2, 6);

            // Side spikes
            ctx.fillStyle = '#ff2222';
            ctx.fillRect(this.x - 2, this.y + 20, 4, 3);
            ctx.fillRect(this.x + this.width - 2, this.y + 20, 4, 3);
        }

        update(deltaMultiplier = 1) {
            this.x -= obstacleSpeed * deltaMultiplier;
        }
    }

    function generateProblem() {
        num1 = Math.floor(Math.random() * maxNumber) + 1;
        num2 = Math.floor(Math.random() * maxNumber) + 1;

        // Select random operation
        mathOperation = operations[Math.floor(Math.random() * operations.length)];

        switch (mathOperation) {
            case '+':
                correctAnswer = num1 + num2;
                break;
            case '-':
                // Ensure positive result
                if (num1 < num2) [num1, num2] = [num2, num1];
                correctAnswer = num1 - num2;
                break;
            case '*':
                // Use smaller numbers for multiplication
                num1 = Math.floor(Math.random() * Math.min(maxNumber/2, 5)) + 1;
                num2 = Math.floor(Math.random() * Math.min(maxNumber/2, 5)) + 1;
                correctAnswer = num1 * num2;
                break;
        }

        gameProblemElement.textContent = `${num1} ${mathOperation} ${num2} = ?`;
    }

    function checkAnswer() {
        const input = gameAnswerElement.value.trim();

        // Input validation
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
            feedbackElement.textContent = 'Correct! +10 points';
            feedbackElement.style.color = '#00ff00';
            score += 10;
            try {
                correctSound.play().catch(() => {});
            } catch (e) {}
            dino.jump();
        } else {
            feedbackElement.textContent = `Wrong! Answer was ${correctAnswer}`;
            feedbackElement.style.color = '#ff0000';
            try {
                incorrectSound.play().catch(() => {});
            } catch (e) {}
        }

        gameAnswerElement.value = '';
        setTimeout(() => {
            if (feedbackElement.textContent !== 'GAME OVER! Final Score: ' + score) {
                feedbackElement.textContent = '';
            }
        }, 2000);
        generateProblem();
    }

    function gameLoop(currentTime) {
        if (!gameRunning) return;

        if (gamePaused) {
            requestAnimationFrame(gameLoop);
            return;
        }

        // Frame rate independent timing
        const deltaTime = currentTime - lastFrameTime;
        lastFrameTime = currentTime;
        const normalizedDelta = Math.min(deltaTime / 16.67, 3); // Cap at 3x normal speed

        // Clear canvas with cyber effect
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw cyber grid background
        ctx.strokeStyle = 'rgba(0, 255, 170, 0.1)';
        ctx.lineWidth = 1;
        for (let x = 0; x < canvas.width; x += 40) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvas.height);
            ctx.stroke();
        }
        for (let y = 0; y < canvas.height; y += 40) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
            ctx.stroke();
        }

        // Progressive difficulty
        const difficultyMultiplier = 1 + (score / 500);
        obstacleSpeed = baseObstacleSpeed * difficultyMultiplier;
        maxNumber = Math.min(10 + Math.floor(score / 100), 20);

        // Update and draw dinosaur with longer jump time
        const gravity = 0.6 * normalizedDelta;  // Reduced gravity for longer hang time
        dino.velocityY += gravity;
        dino.y += dino.velocityY * normalizedDelta;

        if (dino.y > dino.groundY) {
            dino.y = dino.groundY;
            dino.isJumping = false;
            dino.velocityY = 0;
        }

        dino.draw();

        // Generate obstacles
        frameCount++;
        const obstacleInterval = Math.max(100, 200 - (score / 10));
        if (frameCount % Math.floor(obstacleInterval) === 0) {
            obstacles.push(new Obstacle());
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
                gameOver();
                return;
            }

            // Remove off-screen obstacles and award points
            if (obstacles[i].x + obstacles[i].width < 0) {
                obstacles.splice(i, 1);
                score += 5;
            }
        }

        // Draw UI
        ctx.fillStyle = '#fff';
        ctx.font = '16px "Press Start 2P"';
        ctx.fillText('Score: ' + score, 10, 25);
        ctx.fillText('High: ' + highScore, 10, 50);
        ctx.fillText('Speed: ' + difficultyMultiplier.toFixed(1) + 'x', 10, 75);

        // Draw pause instruction
        ctx.font = '12px "Press Start 2P"';
        ctx.fillText('Press P to pause', canvas.width - 200, 25);

        requestAnimationFrame(gameLoop);
    }

    function startGame() {
        console.log('Starting game...');
        gameRunning = true;
        gamePaused = false;
        startButton.style.display = 'none';
        gameProblemContainer.style.display = 'block';
        score = 0;
        obstacles = [];
        frameCount = 0;
        lastFrameTime = 0;
        dino.reset();

        baseObstacleSpeed = 3;
        operations = ['+', '-', '*'];
        maxNumber = 10;
        obstacleSpeed = baseObstacleSpeed;

        generateProblem();
        gameAnswerElement.focus();
        requestAnimationFrame(gameLoop);
    }

    function gameOver() {
        gameRunning = false;

        // Update high score
        if (score > highScore) {
            highScore = score;
            localStorage.setItem('mathInvadersHighScore', highScore.toString());
            feedbackElement.textContent = `NEW HIGH SCORE! ${score}`;
            feedbackElement.style.color = '#ffff00';
        } else {
            feedbackElement.textContent = 'GAME OVER! Final Score: ' + score;
            feedbackElement.style.color = '#ff0000';
        }

        startButton.style.display = 'block';
        gameProblemContainer.style.display = 'none';
    }

    function togglePause() {
        if (!gameRunning) return;

        gamePaused = !gamePaused;
        if (gamePaused) {
            feedbackElement.textContent = 'PAUSED - Press P to continue';
            feedbackElement.style.color = '#ffff00';
        } else {
            feedbackElement.textContent = '';
            gameAnswerElement.focus();
        }
    }

    // Make canvas responsive
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

        // Update dino ground position based on actual canvas height
        dino.groundY = canvas.height - 50;
        if (!gameRunning) {
            dino.y = dino.groundY;
        }
    }

    // Initialize canvas size
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    startButton.addEventListener('click', () => {
        console.log('Start button clicked');
        startGame()
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
});