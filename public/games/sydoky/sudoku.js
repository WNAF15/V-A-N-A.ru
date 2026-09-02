// ============================================
// СУДОКУ — ОСНОВНАЯ ЛОГИКА (ПОЛНАЯ ВЕРСИЯ)
// ============================================

class SudokuGame {
    constructor() {
        this.board = [];
        this.solution = [];
        this.fixedCells = [];
        this.pencilMarks = {};
        this.level = 'EASY';
        this.cellsToRemove = 25;
        this.timer = 0;
        this.timerInterval = null;
        this.isRunning = false;
        this.lives = 3;
        this.maxLives = 3;
        this.errors = 0;
        this.moves = 0;
        this.selectedCell = null;
        this.isPencilMode = false;
        this.isFinished = false;
        this.isLevelSelected = false;
        this.quickInputNumber = null;
        this.errorCell = null;              // Клетка с ошибкой (для красной подсветки)
        this.highlightSameNumbers = false;  // Подсветка одинаковых чисел
    }

    init(level) {
        if (level && SUDOKU_LEVELS[level]) {
            this.level = level;
            this.cellsToRemove = SUDOKU_LEVELS[level].cellsToRemove;
        }
        this.lives = this.maxLives;
        this.errors = 0;
        this.moves = 0;
        this.isFinished = false;
        this.pencilMarks = {};
        this.selectedCell = null;
        this.isPencilMode = false;
        this.timer = 0;
        this.isRunning = false;
        this.isLevelSelected = true;
        this.quickInputNumber = null;
        this.errorCell = null;
        this.highlightSameNumbers = false;
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        this.generate();
        this.startTimer();
        if (typeof renderSudokuUI === 'function') {
            renderSudokuUI(this);
        }
    }

    generate() {
        this.board = Array(9).fill(null).map(() => Array(9).fill(0));
        this.solveBoard(this.board);
        this.solution = this.board.map(row => [...row]);

        this.fixedCells = [];
        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                this.fixedCells.push({ row: r, col: c });
            }
        }

        let removed = 0;
        while (removed < this.cellsToRemove) {
            let row = Math.floor(Math.random() * 9);
            let col = Math.floor(Math.random() * 9);
            if (this.board[row][col] !== 0) {
                this.board[row][col] = 0;
                removed++;
                this.fixedCells = this.fixedCells.filter(cell =>
                    !(cell.row === row && cell.col === col)
                );
            }
        }
    }

    solveBoard(board) {
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (board[row][col] === 0) {
                    let nums = [1, 2, 3, 4, 5, 6, 7, 8, 9];
                    for (let i = nums.length - 1; i > 0; i--) {
                        let j = Math.floor(Math.random() * (i + 1));
                        [nums[i], nums[j]] = [nums[j], nums[i]];
                    }
                    for (let num of nums) {
                        if (this.isValid(board, row, col, num)) {
                            board[row][col] = num;
                            if (this.solveBoard(board)) return true;
                            board[row][col] = 0;
                        }
                    }
                    return false;
                }
            }
        }
        return true;
    }

    isValid(board, row, col, num) {
        for (let i = 0; i < 9; i++) {
            if (board[row][i] === num) return false;
            if (board[i][col] === num) return false;
        }
        let sr = Math.floor(row / 3) * 3;
        let sc = Math.floor(col / 3) * 3;
        for (let i = sr; i < sr + 3; i++) {
            for (let j = sc; j < sc + 3; j++) {
                if (board[i][j] === num) return false;
            }
        }
        return true;
    }

    isFixed(row, col) {
        return this.fixedCells.some(cell =>
            cell.row === row && cell.col === col
        );
    }

    inputNumber(row, col, num) {
        if (this.isFinished) {
            showToast('Игра уже завершена! Начни новую.');
            return false;
        }
        if (this.isFixed(row, col)) {
            showToast('Эту клетку нельзя менять 🔒');
            return false;
        }
        if (this.board[row][col] !== 0) {
            showToast('Эта клетка уже заполнена');
            return false;
        }
        if (num < 1 || num > 9) return false;

        if (num === this.solution[row][col]) {
            this.board[row][col] = num;
            this.moves++;
            let key = row + '-' + col;
            if (this.pencilMarks[key]) {
                delete this.pencilMarks[key];
            }
            if (typeof renderSudokuUI === 'function') {
                renderSudokuUI(this);
            }
            this.checkWin();
            return true;
        } else {
            this.errors++;
            this.lives--;
            this.errorCell = { row: row, col: col };
            if (typeof renderSudokuUI === 'function') {
                renderSudokuUI(this);
            }
            showToast('❌ Неверная цифра! Осталось жизней: ' + this.lives);
            if (this.lives <= 0) {
                this.gameOver();
            }
            return false;
        }
    }

    togglePencilMark(row, col, num) {
        if (this.isFinished || this.isFixed(row, col) || this.board[row][col] !== 0) return;
        let key = row + '-' + col;
        if (!this.pencilMarks[key]) this.pencilMarks[key] = new Set();
        if (this.pencilMarks[key].has(num)) {
            this.pencilMarks[key].delete(num);
            if (this.pencilMarks[key].size === 0) delete this.pencilMarks[key];
        } else {
            this.pencilMarks[key].add(num);
        }
        if (typeof renderSudokuUI === 'function') {
            renderSudokuUI(this);
        }
    }

    checkWin() {
        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                if (this.board[r][c] === 0 || this.board[r][c] !== this.solution[r][c]) {
                    return false;
                }
            }
        }
        this.isFinished = true;
        this.isRunning = false;
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        if (typeof renderSudokuUI === 'function') {
            renderSudokuUI(this);
        }
        this.showWinModal();
        return true;
    }

    gameOver() {
        this.isFinished = true;
        this.isRunning = false;
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        if (typeof renderSudokuUI === 'function') {
            renderSudokuUI(this);
        }
        this.showLoseModal();
    }

    startTimer() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.timerInterval = setInterval(() => {
            this.timer++;
            this.updateTimerDisplay();
        }, 1000);
    }

    updateTimerDisplay() {
        let mins = String(Math.floor(this.timer / 60)).padStart(2, '0');
        let secs = String(this.timer % 60).padStart(2, '0');
        let el = document.getElementById('sudoku-timer');
        if (el) el.textContent = mins + ':' + secs;
    }

    reset() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        this.quickInputNumber = null;
        this.errorCell = null;
        this.highlightSameNumbers = false;
        this.init(this.level);
    }

    showWinModal() {
        let mins = String(Math.floor(this.timer / 60)).padStart(2, '0');
        let secs = String(this.timer % 60).padStart(2, '0');
        let html = `
            <div class="modal-overlay win-modal" id="win-modal">
                <div class="modal-content">
                    <div class="win-icon">🎉</div>
                    <h2>Судоку решено!</h2>
                    <div class="win-stats">
                        <div class="stat-item"><span class="stat-icon">⏱️</span><span class="stat-value">${mins}:${secs}</span><span class="stat-label">Время</span></div>
                        <div class="stat-item"><span class="stat-icon">❌</span><span class="stat-value">${this.errors}</span><span class="stat-label">Ошибок</span></div>
                        <div class="stat-item"><span class="stat-icon">❤️</span><span class="stat-value">${this.lives}</span><span class="stat-label">Жизней</span></div>
                    </div>
                    <div class="win-message">Ты справилась! 💕</div>
                    <div class="modal-buttons">
                        <button onclick="closeModal('win-modal'); resetSudokuGame();">🔄 Играть снова</button>
                        <button onclick="closeModal('win-modal'); showSudokuLevels();" class="secondary">📊 Сменить уровень</button>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', html);
    }

    showLoseModal() {
        let html = `
            <div class="modal-overlay lose-modal" id="lose-modal">
                <div class="modal-content">
                    <div class="lose-icon">😢</div>
                    <h2>Жизни закончились!</h2>
                    <div class="win-stats">
                        <div class="stat-item"><span class="stat-icon">✅</span><span class="stat-value">${this.moves}</span><span class="stat-label">Ходов</span></div>
                        <div class="stat-item"><span class="stat-icon">❌</span><span class="stat-value">${this.errors}</span><span class="stat-label">Ошибок</span></div>
                    </div>
                    <div class="lose-message">Не сдавайся! Попробуй ещё раз 💪</div>
                    <div class="modal-buttons">
                        <button onclick="closeModal('lose-modal'); resetSudokuGame();">🔄 Попробовать снова</button>
                        <button onclick="closeModal('lose-modal'); showSudokuLevels();" class="secondary">📊 Сменить уровень</button>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', html);
    }
}

let currentGame = null;

function initSudoku(level) {
    currentGame = new SudokuGame();
    currentGame.init(level || 'EASY');
}

function getGame() {
    return currentGame;
}

function resetSudokuGame() {
    if (currentGame) {
        if (confirm('Начать новую игру?')) {
            currentGame.quickInputNumber = null;
            currentGame.errorCell = null;
            currentGame.highlightSameNumbers = false;
            currentGame.reset();
        }
    }
}

function closeModal(id) {
    let el = document.getElementById(id);
    if (el) el.remove();
}

function showToast(message) {
    let toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        bottom: 30px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0,0,0,0.8);
        color: #fff;
        padding: 12px 24px;
        border-radius: 12px;
        font-size: 1rem;
        z-index: 9999;
        max-width: 90%;
        text-align: center;
        animation: fadeIn 0.3s ease;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.5s';
        setTimeout(() => toast.remove(), 500);
    }, 2000);
}