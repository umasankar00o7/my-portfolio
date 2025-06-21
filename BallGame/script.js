document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const gameArenaElement = document.getElementById('gameArena');
    const ballElement = document.getElementById('ball');
    const paddleElement = document.getElementById('paddle');
    const scoreValueElement = document.getElementById('scoreValue');
    const highScoreValueElement = document.getElementById('highScoreValue');
    const messageOverlayElement = document.getElementById('messageOverlay');
    const messageTextElement = document.getElementById('messageText');
    const startButtonElement = document.getElementById('startButton');

    // Byline elements (IDs are the same, they are just in a different parent container now)
    const bylinePrefixElement = document.getElementById('bylinePrefix');
    const bylineNameElement = document.getElementById('bylineName');

    // Game State Variables
    let score = 0;
    let highScore = 0;
    let ballX, ballY;
    let ballSpeedX, ballSpeedY;
    let paddleX;
    let gameLoopInterval;
    let isGameRunning = false;

    // Game Variables for Dimensions
    let arenaWidth, arenaHeight;
    let ballDiameter;
    let paddleWidth, paddleHeight;
    const PADDLE_CSS_BOTTOM_OFFSET = 20;

    // Gameplay Constants
    const SCORE_INCREMENT = 5;
    const GRAVITY = 0.25;
    const INITIAL_BALL_SPEED_Y = -6;
    const PADDLE_SENSITIVITY_FACTOR = 1.8;
    const FRAME_RATE = 1000 / 60;

    // --- UPDATED Byline Typing Function ---
    function typeByline() {
        // UPDATED TEXT for "Pro & Genius"
        const prefixText = "Designed by: "; // 29 characters
        const nameText = "Uma sankar Kontyana"; // 10 characters

        bylinePrefixElement.textContent = '';
        bylineNameElement.textContent = '';
        bylinePrefixElement.style.maxWidth = '0';
        bylineNameElement.style.maxWidth = '0';

        // Trigger reflow for animations
        bylinePrefixElement.style.animation = 'none';
        bylineNameElement.style.animation = 'none';
        bylinePrefixElement.offsetHeight;
        bylineNameElement.offsetHeight;

        bylinePrefixElement.textContent = prefixText;
        bylineNameElement.textContent = nameText;

        // Re-apply animations - Ensure steps and durations match CSS
        // The animation names in CSS are now typingPrefixHeading and typingNameHeading
        bylinePrefixElement.style.animation = `typingPrefixHeading 2.5s steps(${prefixText.length}, end) forwards`;
        bylineNameElement.style.animation = `typingNameHeading 1.5s steps(${nameText.length}, end) 2.5s forwards, blink-caret-byline-heading .75s step-end 2.5s infinite`;
        // Note: The delay for name typing (2.5s) should match the duration of the prefix typing.
    }


    function updateDimensions() {
        arenaWidth = gameArenaElement.offsetWidth;
        arenaHeight = gameArenaElement.offsetHeight;
        ballDiameter = ballElement.offsetWidth;
        paddleWidth = paddleElement.offsetWidth;
        paddleHeight = paddleElement.offsetHeight;
    }

    function loadHighScore() {
        const storedHighScore = localStorage.getItem('keepTheBallUpHighScore');
        if (storedHighScore) {
            highScore = parseInt(storedHighScore, 10);
        } else {
            highScore = 0;
        }
        highScoreValueElement.textContent = highScore;
    }

    function saveHighScore() {
        if (score > highScore) {
            highScore = score;
            localStorage.setItem('keepTheBallUpHighScore', highScore.toString());
            highScoreValueElement.textContent = highScore;
        }
    }

    function initializeGame() {
        updateDimensions();
        loadHighScore();

        score = 0;
        updateScoreDisplay();

        paddleX = (arenaWidth - paddleWidth) / 2;
        paddleElement.style.left = `${paddleX}px`;

        ballX = (arenaWidth - ballDiameter) / 2;
        ballY = arenaHeight - paddleHeight - PADDLE_CSS_BOTTOM_OFFSET - ballDiameter - 30;
        ballElement.style.left = `${ballX}px`;
        ballElement.style.top = `${ballY}px`;

        ballSpeedX = (Math.random() - 0.5) * 3;
        ballSpeedY = INITIAL_BALL_SPEED_Y;

        messageTextElement.innerHTML = "Move mouse or touch to control paddle.<br>Click to Start!";
        startButtonElement.textContent = "Start Game";
        messageOverlayElement.classList.remove('hidden');
        isGameRunning = false;
        typeByline(); // Start byline animation
    }

    function startGame() {
        if (isGameRunning) return;
        updateDimensions();
        isGameRunning = true;
        messageOverlayElement.classList.add('hidden');
        gameLoopInterval = setInterval(gameLoop, FRAME_RATE);
    }

    function gameLoop() {
        ballSpeedY += GRAVITY;
        ballX += ballSpeedX;
        ballY += ballSpeedY;

        if (ballX <= 0) {
            ballX = 0;
            ballSpeedX *= -1;
        } else if (ballX + ballDiameter >= arenaWidth) {
            ballX = arenaWidth - ballDiameter;
            ballSpeedX *= -1;
        }

        if (ballY <= 0) {
            ballY = 0;
            ballSpeedY *= -1;
        }

        const paddleTopY = arenaHeight - paddleHeight - PADDLE_CSS_BOTTOM_OFFSET;

        if (
            ballX + ballDiameter > paddleX &&
            ballX < paddleX + paddleWidth &&
            ballY + ballDiameter > paddleTopY &&
            ballY < paddleTopY + paddleHeight &&
            ballSpeedY > 0
        ) {
            ballSpeedY *= -1.03;
            if (Math.abs(ballSpeedY) < Math.abs(INITIAL_BALL_SPEED_Y * 0.8)) ballSpeedY = INITIAL_BALL_SPEED_Y * (ballSpeedY > 0 ? 0.8 : -0.8);

            ballY = paddleTopY - ballDiameter;

            let hitPositionRatio = ( (ballX + ballDiameter / 2) - (paddleX + paddleWidth / 2) ) / (paddleWidth / 2);
            ballSpeedX = hitPositionRatio * PADDLE_SENSITIVITY_FACTOR * Math.abs(INITIAL_BALL_SPEED_Y / 2);

            score += SCORE_INCREMENT;
            updateScoreDisplay();
        }

        if (ballY + ballDiameter >= arenaHeight) {
            gameOver();
        }

        ballElement.style.left = `${ballX}px`;
        ballElement.style.top = `${ballY}px`;
    }

    function gameOver() {
        isGameRunning = false;
        clearInterval(gameLoopInterval);
        saveHighScore();
        messageTextElement.innerHTML = `Game Over! <br> Your Score: ${score}`;
        startButtonElement.textContent = "Play Again";
        messageOverlayElement.classList.remove('hidden');
        typeByline(); // Restart byline animation on game over screen
    }

    function updateScoreDisplay() {
        scoreValueElement.textContent = score;
    }

    function movePaddle(event) {
        const canMoveOnInitialScreen = !isGameRunning &&
                                     !messageOverlayElement.classList.contains('hidden') &&
                                     startButtonElement.textContent.includes("Start Game");

        if (!isGameRunning && !canMoveOnInitialScreen) {
            return;
        }

        let clientX;
        if (event.touches) {
            clientX = event.touches[0].clientX;
        } else {
            clientX = event.clientX;
        }

        const arenaRect = gameArenaElement.getBoundingClientRect();
        paddleX = clientX - arenaRect.left - (paddleWidth / 2);
        paddleX = Math.max(0, paddleX);
        paddleX = Math.min(arenaWidth - paddleWidth, paddleX);
        paddleElement.style.left = `${paddleX}px`;
    }

    // Event Listeners
    startButtonElement.addEventListener('click', () => {
        if (!isGameRunning) {
            initializeGame();
            startGame();
        }
    });

    messageOverlayElement.addEventListener('click', (e) => {
        if (e.target !== startButtonElement &&
            !isGameRunning &&
            startButtonElement.textContent.includes("Start Game")) {
            initializeGame();
            startGame();
        }
    });

    gameArenaElement.addEventListener('mousemove', movePaddle);
    gameArenaElement.addEventListener('touchmove', (e) => {
        movePaddle(e);
        e.preventDefault();
    }, { passive: false });

    window.addEventListener('resize', () => {
        updateDimensions();
        if (!isGameRunning) {
            initializeGame();
        } else {
            paddleX = Math.max(0, Math.min(paddleX, arenaWidth - paddleWidth));
            paddleElement.style.left = `${paddleX}px`;
            if (ballX + ballDiameter > arenaWidth) ballX = arenaWidth - ballDiameter;
            if (ballX < 0) ballX = 0;
            if (ballY + ballDiameter > arenaHeight) gameOver();
            if (ballY < 0) ballY = 0;
        }
    });

    // Initial Setup
    initializeGame();
});