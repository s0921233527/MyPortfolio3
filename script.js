// --- 取得 HTML 元素 ---
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
// 選單畫面元素
const startMenu = document.getElementById('startMenu');
const speedSlider = document.getElementById('speedSlider');
const speedValue = document.getElementById('speedValue');
const startEndlessButton = document.getElementById('startEndlessButton');
const startChallengeButton = document.getElementById('startChallengeButton');
// 遊戲畫面元素
const gameScreen = document.getElementById('gameScreen');
const scoreElement = document.getElementById('score');
const levelContainer = document.getElementById('levelContainer');
const levelElement = document.getElementById('level');
const autoButton = document.getElementById('autoButton');
const restartButton = document.getElementById('restartButton');
// 手機控制按鈕
const upBtn = document.getElementById('upBtn');
const downBtn = document.getElementById('downBtn');
const leftBtn = document.getElementById('leftBtn');
const rightBtn = document.getElementById('rightBtn');

// --- 遊戲設定 ---
const GRID_SIZE = 20;
let COLS, ROWS;
const speedLevels = {
    1: 250, 2: 200, 3: 170, 4: 140, 5: 120,
    6: 100, 7: 85, 8: 70, 9: 60, 10: 50
};

// 【新增】闖關模式的詳細設定
const CHALLENGE_MAX_LEVEL = 10;
const CHALLENGE_FOOD_PER_LEVEL = 5; // 每5個食物升一級
const CHALLENGE_INITIAL_SPEED = 150; // 第1關基礎速度延遲(ms)
const CHALLENGE_LEVEL_SPEED_DECREASE = 10; // 每升一級，基礎速度延遲減少10ms
const CHALLENGE_FOOD_SPEED_DECREASE = 2;   // 在同一關內，每吃一個食物，速度延遲再減少2ms

// --- 遊戲狀態變數 ---
let snake, food, direction, score, gameLoop;
let isGameOver, isAutoMode, gameMode, gameSpeedDelay;
// 【新增】闖關模式專用狀態變數
let currentLevel, foodEatenInLevel;

// --- 動態設定畫布大小 ---
function setupCanvas() {
    COLS = Math.floor(window.innerWidth * 0.9 / GRID_SIZE);
    ROWS = Math.floor(window.innerHeight * 0.6 / GRID_SIZE);
    COLS = Math.max(10, COLS);
    ROWS = Math.max(10, ROWS);
    canvas.width = COLS * GRID_SIZE;
    canvas.height = ROWS * GRID_SIZE;
}

// --- 主流程控制 ---
function startGame(mode) {
    gameMode = mode;
    startMenu.classList.add('hidden');
    gameScreen.classList.remove('hidden');
    setupCanvas();

    if (gameMode === 'endless') {
        const selectedSpeed = speedSlider.value;
        gameSpeedDelay = speedLevels[selectedSpeed];
        levelContainer.classList.add('hidden');
    } else { // challenge mode
        // 【修改】初始化闖關模式的狀態
        currentLevel = 1;
        foodEatenInLevel = 0;
        gameSpeedDelay = CHALLENGE_INITIAL_SPEED; // 設定第一關的初始速度
        levelContainer.classList.remove('hidden');
    }
    
    initGameLogic();
}

function initGameLogic() {
    snake = [{ x: Math.floor(COLS / 2), y: Math.floor(ROWS / 2) }];
    direction = { x: 0, y: 0 };
    score = 0;
    scoreElement.textContent = score;
    // 【修改】確保關卡顯示正確
    if (gameMode === 'challenge') {
        levelElement.textContent = currentLevel;
    }
    isGameOver = false;
    isAutoMode = false;
    autoButton.textContent = '啟用自動模式';
    autoButton.classList.remove('auto-active');
    
    spawnFood();
    if (gameLoop) clearInterval(gameLoop);
    gameLoop = setInterval(update, gameSpeedDelay);
}

function update() {
    if (isGameOver) {
        clearInterval(gameLoop);
        showGameOver();
        return;
    }
    if (isAutoMode) {
        findBestDirection();
    }
    if (direction.x === 0 && direction.y === 0) {
        draw();
        return;
    }
    let head = { x: snake[0].x + direction.x, y: snake[0].y + direction.y };
    if (head.x >= COLS) head.x = 0; if (head.x < 0) head.x = COLS - 1;
    if (head.y >= ROWS) head.y = 0; if (head.y < 0) head.y = ROWS - 1;
    if (checkCollision(head)) {
        isGameOver = true;
        return;
    }
    snake.unshift(head);
    if (head.x === food.x && head.y === food.y) {
        score++;
        scoreElement.textContent = score;
        spawnFood();

        // 【大幅修改】套用新的闖關模式邏輯
        if (gameMode === 'challenge') {
            foodEatenInLevel++;
            let newSpeedDelay = gameSpeedDelay;

            // 判斷是否達到最大等級
            if (currentLevel >= CHALLENGE_MAX_LEVEL) {
                 // 到達滿級後，速度繼續微幅增加
                 newSpeedDelay = gameSpeedDelay - CHALLENGE_FOOD_SPEED_DECREASE;
            } 
            // 判斷是否滿足升級條件
            else if (foodEatenInLevel >= CHALLENGE_FOOD_PER_LEVEL) {
                currentLevel++;
                foodEatenInLevel = 0;
                // 計算新關卡的基礎速度
                newSpeedDelay = CHALLENGE_INITIAL_SPEED - ((currentLevel - 1) * CHALLENGE_LEVEL_SPEED_DECREASE);
            } 
            // 在關卡內，微調速度
            else {
                // 先取得當前關卡的基礎速度
                const currentLevelBaseSpeed = CHALLENGE_INITIAL_SPEED - ((currentLevel - 1) * CHALLENGE_LEVEL_SPEED_DECREASE);
                // 在基礎速度上，根據已吃的食物數量進行微調
                newSpeedDelay = currentLevelBaseSpeed - (foodEatenInLevel * CHALLENGE_FOOD_SPEED_DECREASE);
            }

            // 更新速度（確保有最低速限制）
            gameSpeedDelay = Math.max(40, newSpeedDelay);
            levelElement.textContent = currentLevel;
            
            clearInterval(gameLoop);
            gameLoop = setInterval(update, gameSpeedDelay);
        }
    } else {
        snake.pop();
    }
    draw();
}

// --- 事件監聽 --- (此區塊所有程式碼維持不變)
window.addEventListener('keydown', e => {
    if (isAutoMode) return;
    const key = e.key.toLowerCase();
    switch (key) {
        case 'arrowup': case 'w':
            if (direction.y !== 1) direction = { x: 0, y: -1 };
            break;
        case 'arrowdown': case 's':
            if (direction.y !== -1) direction = { x: 0, y: 1 };
            break;
        case 'arrowleft': case 'a':
            if (direction.x !== 1) direction = { x: -1, y: 0 };
            break;
        case 'arrowright': case 'd':
            if (direction.x !== -1) direction = { x: 1, y: 0 };
            break;
    }
});

function handleMobileControl(e, newDirection) {
    e.preventDefault();
    if (isAutoMode) return;
    if (snake.length > 1) {
        if (newDirection.x === -direction.x && newDirection.y === -direction.y) {
            return;
        }
    }
    direction = newDirection;
}

upBtn.addEventListener('touchstart', e => handleMobileControl(e, { x: 0, y: -1 }));
downBtn.addEventListener('touchstart', e => handleMobileControl(e, { x: 0, y: 1 }));
leftBtn.addEventListener('touchstart', e => handleMobileControl(e, { x: -1, y: 0 }));
rightBtn.addEventListener('touchstart', e => handleMobileControl(e, { x: 1, y: 0 }));

speedSlider.addEventListener('input', e => {
    speedValue.textContent = e.target.value;
});
startEndlessButton.addEventListener('click', () => startGame('endless'));
startChallengeButton.addEventListener('click', () => startGame('challenge'));

restartButton.addEventListener('click', () => {
    gameScreen.classList.add('hidden');
    startMenu.classList.remove('hidden');
    if(gameLoop) clearInterval(gameLoop);
});

autoButton.addEventListener('click', () => {
    isAutoMode = !isAutoMode;
    autoButton.textContent = isAutoMode ? '停用自動模式' : '啟用自動模式';
    autoButton.classList.toggle('auto-active', isAutoMode);
});


// --- AI 演算法與輔助函式 --- (此區塊所有程式碼維持不變)
function findBestDirection() {
    const head = snake[0];
    const possibleMoves = [{ x: 0, y: -1 }, { x: 0, y: 1 }, { x: -1, y: 0 }, { x: 1, y: 0 }];
    let bestMoves = [];
    let maxSpace = -1;
    for (const move of possibleMoves) {
        if (snake.length > 1 && direction.x === -move.x && direction.y === -move.y) continue;
        let newHead = { x: head.x + move.x, y: head.y + move.y };
        if (newHead.x >= COLS) newHead.x = 0; if (newHead.x < 0) newHead.x = COLS - 1;
        if (newHead.y >= ROWS) newHead.y = 0; if (newHead.y < 0) newHead.y = ROWS - 1;
        if (!isPositionOnSnake(newHead)) {
            const futureSnake = [newHead, ...snake.slice(0, snake.length - 1)];
            const space = countReachableSpace(newHead, futureSnake);
            const distance = Math.abs(newHead.x - food.x) + Math.abs(newHead.y - food.y);
            if (space > maxSpace) {
                maxSpace = space;
                bestMoves = [{ move, distance }];
            } else if (space === maxSpace) {
                bestMoves.push({ move, distance });
            }
        }
    }
    if (bestMoves.length > 0) {
        bestMoves.sort((a, b) => a.distance - b.distance);
        direction = bestMoves[0].move;
    } else {
        for (const move of possibleMoves) {
            if (snake.length === 1 || (direction.x !== -move.x || direction.y !== -move.y)) {
                direction = move;
                break;
            }
        }
    }
}

function countReachableSpace(startNode, snakeBody) {
    const queue = [startNode];
    const visited = new Set([`${startNode.x},${startNode.y}`]);
    let count = 0;
    const snakeBodySet = new Set(snakeBody.map(p => `${p.x},${p.y}`));
    while (queue.length > 0) {
        const current = queue.shift();
        count++;
        const neighbors = [
            { x: current.x, y: current.y - 1 }, { x: current.x, y: current.y + 1 },
            { x: current.x - 1, y: current.y }, { x: current.x + 1, y: current.y }
        ];
        for (const neighbor of neighbors) {
            if (neighbor.x >= COLS) neighbor.x = 0; if (neighbor.x < 0) neighbor.x = COLS - 1;
            if (neighbor.y >= ROWS) neighbor.y = 0; if (neighbor.y < 0) neighbor.y = ROWS - 1;
            const neighborKey = `${neighbor.x},${neighbor.y}`;
            if (!visited.has(neighborKey) && !snakeBodySet.has(neighborKey)) {
                visited.add(neighborKey);
                queue.push(neighbor);
            }
        }
    }
    return count;
}

function draw() {
    ctx.fillStyle = '#1a1a1a'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    snake.forEach((segment, index) => {
        ctx.fillStyle = index === 0 ? '#4CAF50' : '#8BC34A';
        ctx.fillRect(segment.x * GRID_SIZE, segment.y * GRID_SIZE, GRID_SIZE, GRID_SIZE);
        ctx.strokeStyle = '#1a1a1a'; ctx.strokeRect(segment.x * GRID_SIZE, segment.y * GRID_SIZE, GRID_SIZE, GRID_SIZE);
    });
    ctx.fillStyle = '#FF6347'; ctx.fillRect(food.x * GRID_SIZE, food.y * GRID_SIZE, GRID_SIZE, GRID_SIZE);
}

function spawnFood() {
    let newFoodPosition;
    do {
        newFoodPosition = { x: Math.floor(Math.random() * COLS), y: Math.floor(Math.random() * ROWS) };
    } while (isPositionOnSnake(newFoodPosition));
    food = newFoodPosition;
}

function isPositionOnSnake(position) {
    for (const segment of snake) { if (segment.x === position.x && segment.y === position.y) return true; }
    return false;
}

function checkCollision(head) {
    for (let i = 1; i < snake.length; i++) { if (head.x === snake[i].x && head.y === snake[i].y) return true; }
    return false;
}

function showGameOver() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'white'; ctx.font = '40px Arial'; ctx.textAlign = 'center';
    ctx.fillText('遊戲結束', canvas.width / 2, canvas.height / 2 - 20);
    // 【新增】在遊戲結束時，如果是闖關模式，額外顯示最終關卡
    if (gameMode === 'challenge') {
        ctx.font = '24px Arial';
        ctx.fillText(`最終關卡: ${currentLevel}`, canvas.width / 2, canvas.height / 2 + 20);
        ctx.font = '20px Arial';
        ctx.fillText(`總分數: ${score}`, canvas.width / 2, canvas.height / 2 + 50);
    } else {
        ctx.font = '20px Arial';
        ctx.fillText(`最終分數: ${score}`, canvas.width / 2, canvas.height / 2 + 20);
    }
}
