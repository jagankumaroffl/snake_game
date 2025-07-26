document.addEventListener('DOMContentLoaded', () => {
    // Get DOM elements
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const scoreElement = document.getElementById('score');
    const highScoreElement = document.getElementById('highScore');
    const startScreen = document.getElementById('startScreen');
    const gameOverScreen = document.getElementById('gameOverScreen');
    const startGameBtn = document.getElementById('startGameBtn');
    const retryBtn = document.getElementById('retryBtn');
    const finalScoreElement = document.getElementById('finalScore');
    
    // Flag to track if we're waiting for key press after game over
    let waitingForKeyPress = false;

    // Game settings
    const gridSize = 20;
    const tileCount = canvas.width / gridSize;
    let speed = 7;

    // Game state
    let gameRunning = false;
    let gameOver = false;
    let score = 0;
    let highScore = localStorage.getItem('snakeHighScore') || 0;
    highScoreElement.textContent = highScore;

    // Snake initial state
    let snake = [
        { x: 10, y: 10 }
    ];
    let velocityX = 0;
    let velocityY = 0;
    let nextVelocityX = 0;
    let nextVelocityY = 0;

    // Food initial state
    let food = generateFood();

    // Colors
    const snakeHeadColor = '#2c8a2c';
    const snakeBodyColors = ['#388e3c', '#3c9f41', '#43b548', '#4caf50'];
    const foodColor = '#e53935';
    const gridColor = '#e8f5e9';
    
    // Snake textures
    const snakeEyeColor = '#fff';
    const snakeTongueColor = '#ff0000';

    // Game loop
    function gameLoop() {
        if (!gameRunning) return;

        setTimeout(() => {
            if (gameOver) {
                drawGameOver();
                return;
            }

            requestAnimationFrame(gameLoop);
            clearCanvas();
            drawGrid();
            moveSnake();
            checkCollision();
            drawSnake();
            drawFood();
        }, 1000 / speed);
    }

    // Draw functions
    function clearCanvas() {
        ctx.fillStyle = gridColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    function drawGrid() {
        ctx.strokeStyle = '#d0e8d0';
        ctx.lineWidth = 0.5;

        for (let i = 0; i < tileCount; i++) {
            // Draw vertical lines
            ctx.beginPath();
            ctx.moveTo(i * gridSize, 0);
            ctx.lineTo(i * gridSize, canvas.height);
            ctx.stroke();

            // Draw horizontal lines
            ctx.beginPath();
            ctx.moveTo(0, i * gridSize);
            ctx.lineTo(canvas.width, i * gridSize);
            ctx.stroke();
        }
    }

    function drawSnake() {
        // Draw each snake segment with realistic features
        snake.forEach((part, index) => {
            const x = part.x * gridSize;
            const y = part.y * gridSize;
            
            // Determine segment color - alternate colors for body segments
            if (index === 0) {
                // Draw head
                ctx.fillStyle = snakeHeadColor;
                ctx.fillRect(x, y, gridSize, gridSize);
                
                // Round the corners of the head
                ctx.beginPath();
                ctx.arc(x + gridSize - 5, y + 5, 5, 0, Math.PI/2);
                ctx.arc(x + 5, y + 5, 5, Math.PI/2, Math.PI);
                ctx.arc(x + 5, y + gridSize - 5, 5, Math.PI, Math.PI*3/2);
                ctx.arc(x + gridSize - 5, y + gridSize - 5, 5, Math.PI*3/2, Math.PI*2);
                ctx.fill();
                
                // Add eyes based on direction
                ctx.fillStyle = snakeEyeColor;
                
                // Default eyes position (facing right)
                let leftEyeX = x + gridSize - 6;
                let leftEyeY = y + 7;
                let rightEyeX = x + gridSize - 6;
                let rightEyeY = y + gridSize - 7;
                
                // Adjust eyes based on direction
                if (velocityX === -1) { // Left
                    leftEyeX = x + 6;
                    leftEyeY = y + 7;
                    rightEyeX = x + 6;
                    rightEyeY = y + gridSize - 7;
                } else if (velocityY === -1) { // Up
                    leftEyeX = x + 7;
                    leftEyeY = y + 6;
                    rightEyeX = x + gridSize - 7;
                    rightEyeY = y + 6;
                } else if (velocityY === 1) { // Down
                    leftEyeX = x + 7;
                    leftEyeY = y + gridSize - 6;
                    rightEyeX = x + gridSize - 7;
                    rightEyeY = y + gridSize - 6;
                }
                
                // Draw eyes
                ctx.beginPath();
                ctx.arc(leftEyeX, leftEyeY, 2, 0, Math.PI * 2);
                ctx.arc(rightEyeX, rightEyeY, 2, 0, Math.PI * 2);
                ctx.fill();
                
                // Add pupils
                ctx.fillStyle = '#000';
                ctx.beginPath();
                ctx.arc(leftEyeX, leftEyeY, 1, 0, Math.PI * 2);
                ctx.arc(rightEyeX, rightEyeY, 1, 0, Math.PI * 2);
                ctx.fill();
                
                // Add tongue occasionally
                if (Math.random() < 0.3) {
                    ctx.fillStyle = snakeTongueColor;
                    ctx.beginPath();
                    
                    // Tongue position based on direction
                    if (velocityX === 1) { // Right
                        ctx.moveTo(x + gridSize, y + gridSize/2);
                        ctx.lineTo(x + gridSize + 5, y + gridSize/2 - 2);
                        ctx.lineTo(x + gridSize + 5, y + gridSize/2 + 2);
                    } else if (velocityX === -1) { // Left
                        ctx.moveTo(x, y + gridSize/2);
                        ctx.lineTo(x - 5, y + gridSize/2 - 2);
                        ctx.lineTo(x - 5, y + gridSize/2 + 2);
                    } else if (velocityY === -1) { // Up
                        ctx.moveTo(x + gridSize/2, y);
                        ctx.lineTo(x + gridSize/2 - 2, y - 5);
                        ctx.lineTo(x + gridSize/2 + 2, y - 5);
                    } else if (velocityY === 1) { // Down
                        ctx.moveTo(x + gridSize/2, y + gridSize);
                        ctx.lineTo(x + gridSize/2 - 2, y + gridSize + 5);
                        ctx.lineTo(x + gridSize/2 + 2, y + gridSize + 5);
                    }
                    
                    ctx.fill();
                }
            } else {
                // Draw body segments with alternating colors
                ctx.fillStyle = snakeBodyColors[index % snakeBodyColors.length];
                
                // Draw rounded rectangle for body segments
                ctx.beginPath();
                const radius = 3;
                ctx.moveTo(x + radius, y);
                ctx.lineTo(x + gridSize - radius, y);
                ctx.quadraticCurveTo(x + gridSize, y, x + gridSize, y + radius);
                ctx.lineTo(x + gridSize, y + gridSize - radius);
                ctx.quadraticCurveTo(x + gridSize, y + gridSize, x + gridSize - radius, y + gridSize);
                ctx.lineTo(x + radius, y + gridSize);
                ctx.quadraticCurveTo(x, y + gridSize, x, y + gridSize - radius);
                ctx.lineTo(x, y + radius);
                ctx.quadraticCurveTo(x, y, x + radius, y);
                ctx.fill();
                
                // Add scale pattern
                if (index % 2 === 0) {
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
                    ctx.beginPath();
                    ctx.arc(x + gridSize/2, y + gridSize/2, gridSize/4, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
            
            // Add shadow effect
            ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
            ctx.shadowBlur = 2;
            ctx.shadowOffsetX = 1;
            ctx.shadowOffsetY = 1;
        });
        
        // Reset shadow
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
    }

    function drawFood() {
        ctx.fillStyle = foodColor;
        ctx.beginPath();
        const radius = gridSize / 2;
        const centerX = food.x * gridSize + radius;
        const centerY = food.y * gridSize + radius;
        ctx.arc(centerX, centerY, radius - 2, 0, Math.PI * 2);
        ctx.fill();
    }

    function drawGameOver() {
        clearCanvas();
        drawGrid();
        drawSnake();
        drawFood();

        // Show game over screen
        gameOverScreen.classList.remove('hidden');
        finalScoreElement.textContent = score;
    }

    // Game logic functions
    function moveSnake() {
        // Update velocity based on next velocity (prevents 180-degree turns)
        velocityX = nextVelocityX;
        velocityY = nextVelocityY;

        // Create new head based on current velocity
        const head = { x: snake[0].x + velocityX, y: snake[0].y + velocityY };
        snake.unshift(head);

        // Check if snake ate food
        if (head.x === food.x && head.y === food.y) {
            // Increase score
            score += 10;
            scoreElement.textContent = score;

            // Update high score if needed
            if (score > highScore) {
                highScore = score;
                highScoreElement.textContent = highScore;
                localStorage.setItem('snakeHighScore', highScore);
            }

            // Generate new food
            food = generateFood();

            // Increase speed slightly
            if (speed < 15) {
                speed += 0.2;
            }
        } else {
            // Remove tail if no food was eaten
            snake.pop();
        }
    }

    function checkCollision() {
        const head = snake[0];

        // Check wall collision
        if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount) {
            gameOver = true;
            return;
        }

        // Check self collision (start from index 1 to skip the head)
        for (let i = 1; i < snake.length; i++) {
            if (head.x === snake[i].x && head.y === snake[i].y) {
                gameOver = true;
                return;
            }
        }
    }

    function generateFood() {
        let newFood;
        let foodOnSnake;

        // Keep generating until food is not on snake
        do {
            foodOnSnake = false;
            newFood = {
                x: Math.floor(Math.random() * tileCount),
                y: Math.floor(Math.random() * tileCount)
            };

            // Check if food is on snake
            for (let i = 0; i < snake.length; i++) {
                if (newFood.x === snake[i].x && newFood.y === snake[i].y) {
                    foodOnSnake = true;
                    break;
                }
            }
        } while (foodOnSnake);

        return newFood;
    }

    // Event listeners
    function handleKeyDown(e) {
        // Prevent default behavior for arrow keys to avoid page scrolling
        if ([37, 38, 39, 40].includes(e.keyCode)) {
            e.preventDefault();
        }

        // Check if we're waiting for key press after game over
        if (waitingForKeyPress && [37, 38, 39, 40].includes(e.keyCode)) {
            waitingForKeyPress = false;
            gameRunning = true;
            gameLoop();
        }

        // Only change direction if game is running
        if (!gameRunning || gameOver) return;

        // Left arrow
        if (e.keyCode === 37 && velocityX !== 1) {
            nextVelocityX = -1;
            nextVelocityY = 0;
        }
        // Up arrow
        else if (e.keyCode === 38 && velocityY !== 1) {
            nextVelocityX = 0;
            nextVelocityY = -1;
        }
        // Right arrow
        else if (e.keyCode === 39 && velocityX !== -1) {
            nextVelocityX = 1;
            nextVelocityY = 0;
        }
        // Down arrow
        else if (e.keyCode === 40 && velocityY !== -1) {
            nextVelocityX = 0;
            nextVelocityY = 1;
        }
    }

    function startGame(e) {
        if (gameRunning && !gameOver) return;

        // Hide screens
        startScreen.classList.add('hidden');
        gameOverScreen.classList.add('hidden');

        // Reset game state
        snake = [{ x: 10, y: 10 }];
        velocityX = 0;
        velocityY = 0;
        nextVelocityX = 0;
        nextVelocityY = 0;
        speed = 7;
        score = 0;
        scoreElement.textContent = score;
        food = generateFood();
        gameOver = false;

        // Check if this is from retry button
        const isRetry = e && e.target === retryBtn;
        
        if (isRetry) {
            // Set waiting flag and don't start game loop yet
            waitingForKeyPress = true;
            gameRunning = false;
            
            // Draw initial state
            clearCanvas();
            drawGrid();
            drawSnake();
            drawFood();
        } else {
            // Start game loop if not already running
            if (!gameRunning) {
                gameRunning = true;
                gameLoop();
            }
        }
    }

    function resetGame() {
        // Reset game state
        gameRunning = false;
        gameOver = false;
        snake = [{ x: 10, y: 10 }];
        velocityX = 0;
        velocityY = 0;
        nextVelocityX = 0;
        nextVelocityY = 0;
        speed = 7;
        score = 0;
        scoreElement.textContent = score;
        food = generateFood();

        // Reset button text
        startBtn.textContent = 'Start Game';

        // Clear canvas and draw initial state
        clearCanvas();
        drawGrid();
        drawSnake();
        drawFood();
    }

    // Mobile control functions
    function handleMobileControls() {
        // Get mobile control buttons
        const upBtn = document.getElementById('upBtn');
        const leftBtn = document.getElementById('leftBtn');
        const rightBtn = document.getElementById('rightBtn');
        const downBtn = document.getElementById('downBtn');
        
        // Add touch event listeners
        upBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (!gameRunning && waitingForKeyPress) {
                waitingForKeyPress = false;
                gameRunning = true;
                gameLoop();
            }
            if (gameRunning && !gameOver && velocityY !== 1) {
                nextVelocityX = 0;
                nextVelocityY = -1;
            }
        });
        
        leftBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (!gameRunning && waitingForKeyPress) {
                waitingForKeyPress = false;
                gameRunning = true;
                gameLoop();
            }
            if (gameRunning && !gameOver && velocityX !== 1) {
                nextVelocityX = -1;
                nextVelocityY = 0;
            }
        });
        
        rightBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (!gameRunning && waitingForKeyPress) {
                waitingForKeyPress = false;
                gameRunning = true;
                gameLoop();
            }
            if (gameRunning && !gameOver && velocityX !== -1) {
                nextVelocityX = 1;
                nextVelocityY = 0;
            }
        });
        
        downBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (!gameRunning && waitingForKeyPress) {
                waitingForKeyPress = false;
                gameRunning = true;
                gameLoop();
            }
            if (gameRunning && !gameOver && velocityY !== -1) {
                nextVelocityX = 0;
                nextVelocityY = 1;
            }
        });
        
        // Also add click events for testing on desktop
        upBtn.addEventListener('click', () => {
            if (!gameRunning && waitingForKeyPress) {
                waitingForKeyPress = false;
                gameRunning = true;
                gameLoop();
            }
            if (gameRunning && !gameOver && velocityY !== 1) {
                nextVelocityX = 0;
                nextVelocityY = -1;
            }
        });
        
        leftBtn.addEventListener('click', () => {
            if (!gameRunning && waitingForKeyPress) {
                waitingForKeyPress = false;
                gameRunning = true;
                gameLoop();
            }
            if (gameRunning && !gameOver && velocityX !== 1) {
                nextVelocityX = -1;
                nextVelocityY = 0;
            }
        });
        
        rightBtn.addEventListener('click', () => {
            if (!gameRunning && waitingForKeyPress) {
                waitingForKeyPress = false;
                gameRunning = true;
                gameLoop();
            }
            if (gameRunning && !gameOver && velocityX !== -1) {
                nextVelocityX = 1;
                nextVelocityY = 0;
            }
        });
        
        downBtn.addEventListener('click', () => {
            if (!gameRunning && waitingForKeyPress) {
                waitingForKeyPress = false;
                gameRunning = true;
                gameLoop();
            }
            if (gameRunning && !gameOver && velocityY !== -1) {
                nextVelocityX = 0;
                nextVelocityY = 1;
            }
        });
    }

    // Add event listeners
    document.addEventListener('keydown', handleKeyDown);
    startGameBtn.addEventListener('click', startGame);
    retryBtn.addEventListener('click', startGame);
    
    // Initialize mobile controls
    handleMobileControls();

    // Initialize game
    clearCanvas();
    drawGrid();
    drawSnake();
    drawFood();
    
    // Show start screen initially
    gameOverScreen.classList.add('hidden');
    startScreen.classList.remove('hidden');
});