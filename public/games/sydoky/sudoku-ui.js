// ============================================
// СУДОКУ — UI (С ПОДДЕРЖКОЙ NAVA)
// ============================================

// Проверяем, запущена ли игра в NAVA
function isNAVAEnvironment() {
    return typeof window.NAVA_GAME !== 'undefined';
}

// Адаптируем рендеринг для NAVA
const originalRender = renderSudokuUI;
renderSudokuUI = function(game) {
    // Вызываем оригинальный рендер
    originalRender(game);
    
    // Если в NAVA, обновляем состояние
    if (isNAVAEnvironment() && window.NAVA_GAME.currentGame) {
        const state = window.NAVA_GAME.currentGame.getState();
        if (state) {
            // Отправляем событие обновления в NAVA
            window.dispatchEvent(new CustomEvent('nava-game-update', {
                detail: {
                    game: 'sudoku',
                    state: state
                }
            }));
        }
    }
};

// Адаптируем модальные окна для NAVA
const originalShowWinModal = SudokuGame.prototype.showWinModal;
SudokuGame.prototype.showWinModal = function() {
    if (isNAVAEnvironment()) {
        // Показываем победу в NAVA стиле
        this.showNAVAWinModal();
    } else {
        originalShowWinModal.call(this);
    }
};

SudokuGame.prototype.showNAVAWinModal = function() {
    const mins = String(Math.floor(this.timer / 60)).padStart(2, '0');
    const secs = String(this.timer % 60).padStart(2, '0');
    
    // Создаем NAVA-совместимое окно победы
    const modal = document.createElement('div');
    modal.className = 'modal-overlay win-modal';
    modal.id = 'win-modal';
    modal.innerHTML = `
        <div class="modal-content" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white;">
            <button class="modal-close" onclick="closeModal('win-modal')" style="color: white;">✕</button>
            <div class="win-icon">🎉</div>
            <h2 style="color: white;">Судоку решено!</h2>
            <div class="win-stats">
                <div class="stat-item" style="background: rgba(255,255,255,0.2);">
                    <span class="stat-icon">⏱️</span>
                    <span class="stat-value" style="color: white;">${mins}:${secs}</span>
                    <span class="stat-label" style="color: rgba(255,255,255,0.8);">Время</span>
                </div>
                <div class="stat-item" style="background: rgba(255,255,255,0.2);">
                    <span class="stat-icon">❌</span>
                    <span class="stat-value" style="color: white;">${this.errors}</span>
                    <span class="stat-label" style="color: rgba(255,255,255,0.8);">Ошибок</span>
                </div>
                <div class="stat-item" style="background: rgba(255,255,255,0.2);">
                    <span class="stat-icon">❤️</span>
                    <span class="stat-value" style="color: white;">${this.lives}</span>
                    <span class="stat-label" style="color: rgba(255,255,255,0.8);">Жизней</span>
                </div>
            </div>
            <div class="win-message" style="color: white;">Ты справилась! 💕</div>
            <div class="modal-buttons">
                <button onclick="closeModal('win-modal'); resetSudokuGame();" style="background: white; color: #667eea;">
                    🔄 Играть снова
                </button>
                <button onclick="closeModal('win-modal'); showSudokuLevels();" style="background: transparent; border: 2px solid white; color: white;">
                    📊 Сменить уровень
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
};

// Аналогично для поражения
SudokuGame.prototype.showNAVALoseModal = function() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay lose-modal';
    modal.id = 'lose-modal';
    modal.innerHTML = `
        <div class="modal-content" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white;">
            <button class="modal-close" onclick="closeModal('lose-modal')" style="color: white;">✕</button>
            <div class="lose-icon">😢</div>
            <h2 style="color: white;">Жизни закончились!</h2>
            <div class="win-stats">
                <div class="stat-item" style="background: rgba(255,255,255,0.2);">
                    <span class="stat-icon">✅</span>
                    <span class="stat-value" style="color: white;">${this.moves}</span>
                    <span class="stat-label" style="color: rgba(255,255,255,0.8);">Ходов</span>
                </div>
                <div class="stat-item" style="background: rgba(255,255,255,0.2);">
                    <span class="stat-icon">❌</span>
                    <span class="stat-value" style="color: white;">${this.errors}</span>
                    <span class="stat-label" style="color: rgba(255,255,255,0.8);">Ошибок</span>
                </div>
            </div>
            <div class="lose-message" style="color: white;">Не сдавайся! Попробуй ещё раз 💪</div>
            <div class="modal-buttons">
                <button onclick="closeModal('lose-modal'); resetSudokuGame();" style="background: white; color: #f5576c;">
                    🔄 Попробовать снова
                </button>
                <button onclick="closeModal('lose-modal'); showSudokuLevels();" style="background: transparent; border: 2px solid white; color: white;">
                    📊 Сменить уровень
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
};

// Экспортируем для NAVA
if (isNAVAEnvironment()) {
    console.log('🎮 Судоку готов к работе в NAVA');
}

// ============================================
// СУДОКУ — UI (ПОЛНАЯ ВЕРСИЯ)
// ============================================

function renderSudokuUI(game) {
    let container = document.getElementById('sudoku-game-container');
    if (!container) return;

    let blockColors = ['#FFE5E5', '#E5FFE5', '#E5E5FF', '#FFF5E5', '#E5FFF5', '#F5E5FF', '#FFE5F5', '#E5F5FF', '#F5FFE5'];

    // Подсчёт оставшихся цифр
    let remaining = {};
    let usedCount = {};
    for (let num = 1; num <= 9; num++) {
        usedCount[num] = 0;
        remaining[num] = 0;
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (game.board[row][col] === num) {
                    usedCount[num]++;
                }
            }
        }
        remaining[num] = Math.max(0, 9 - usedCount[num]);
    }

    let html = '<div class="sudoku-wrapper">';

    // Верхняя панель
    html += '<div class="sudoku-top-panel">';
    html += '<div class="sudoku-timer">⏱️ <span id="sudoku-timer">00:00</span></div>';
    html += '<div class="sudoku-lives">' + '❤️'.repeat(game.lives) + '🖤'.repeat(game.maxLives - game.lives) + '</div>';
    html += '<div class="sudoku-errors">❌ ' + game.errors + '</div>';
    html += '<div class="sudoku-level">' + (SUDOKU_LEVELS[game.level]?.icon || '🎯') + ' ' + (SUDOKU_LEVELS[game.level]?.name || game.level) + '</div>';
    html += '</div>';

    // Игровое поле
    html += '<div class="sudoku-board" id="sudoku-board">';
    for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
            let val = game.board[row][col];
            let isFixed = game.isFixed(row, col);
            let isSelected = game.selectedCell && game.selectedCell.row === row && game.selectedCell.col === col;
            let key = row + '-' + col;
            let marks = game.pencilMarks[key] || new Set();
            let blockIndex = Math.floor(row / 3) * 3 + Math.floor(col / 3);
            let blockColor = blockColors[blockIndex] || '#f5f5f5';

            let cls = 'sudoku-cell';
            if (isFixed) cls += ' fixed';
            if (isSelected) cls += ' selected';
            if (val === 0 && marks.size > 0) cls += ' has-pencil';
            if (row % 3 === 0) cls += ' block-top';
            if (col % 3 === 0) cls += ' block-left';
            if (row === 8) cls += ' block-bottom';
            if (col === 8) cls += ' block-right';

            // === ПОДСВЕТКИ ===
            if (game.selectedCell) {
                let sr = game.selectedCell.row;
                let sc = game.selectedCell.col;

                // 1. Подсветка строки и столбца
                if (row === sr || col === sc) {
                    cls += ' highlight-row-col';
                }

                // 2. Подсветка блока 3x3
                let blockRow = Math.floor(sr / 3) * 3;
                let blockCol = Math.floor(sc / 3) * 3;
                if (row >= blockRow && row < blockRow + 3 && col >= blockCol && col < blockCol + 3) {
                    cls += ' highlight-block';
                }

                // 3. Подсветка одинаковых чисел
                if (game.highlightSameNumbers) {
                    let selectedVal = game.board[sr][sc];
                    if (selectedVal !== 0 && val === selectedVal && !(row === sr && col === sc)) {
                        cls += ' highlight-same';
                    }
                }
            }

            // 4. Красная подсветка ошибки
            if (game.errorCell && game.errorCell.row === row && game.errorCell.col === col) {
                cls += ' error-flash';
            }

            let content = '';
            if (val !== 0) {
                content = '<span class="cell-value">' + val + '</span>';
            } else if (marks.size > 0) {
                let pm = '';
                for (let i = 1; i <= 9; i++) {
                    pm += '<span class="pencil-mark ' + (marks.has(i) ? 'active' : '') + '">' + (marks.has(i) ? i : '') + '</span>';
                }
                content = '<div class="pencil-grid">' + pm + '</div>';
            }

            html += '<div class="' + cls + '" data-row="' + row + '" data-col="' + col + '" style="background-color:' + blockColor + ';" onclick="selectSudokuCell(' + row + ',' + col + ')">' + content + '</div>';
        }
    }
    html += '</div>';

    // Нижняя панель — цифры для быстрого ввода
    html += '<div class="sudoku-bottom-panel">';
    for (let num = 1; num <= 9; num++) {
        let count = remaining[num] || 0;
        let isActive = game.quickInputNumber === num;
        let isDisabled = count <= 0;
        html += '<div class="number-counter ' + (isActive ? 'active' : '') + (isDisabled ? 'disabled' : '') + '" data-num="' + num + '" onclick="toggleQuickInput(' + num + ')">';
        html += '<span class="number">' + num + '</span>';
        html += '<span class="count">' + count + '</span>';
        html += '</div>';
        if (num % 3 === 0 && num < 9) {
            html += '<div class="counter-divider"></div>';
        }
    }
    html += '</div>';

    // Панель управления
    html += '<div class="sudoku-controls">';
    html += '<button onclick="toggleSudokuPencil()" id="pencil-toggle" class="' + (game.isPencilMode ? 'active' : '') + '">✏️ Заметки</button>';
    html += '<button onclick="resetSudokuGame()">🔄 Новая игра</button>';
    html += '<button onclick="showSudokuLevels()">📊 Уровень</button>';
    html += '</div>';

    html += '</div>';

    container.innerHTML = html;
    game.updateTimerDisplay();

    if (game.errorCell) {
        setTimeout(() => {
            game.errorCell = null;
            renderSudokuUI(game);
        }, 500);
    }
}

// ===== ПОИСК СЛЕДУЮЩЕЙ ДОСТУПНОЙ ЦИФРЫ (ИСПРАВЛЕН) =====
function findNextAvailableNumber(game) {
    // Проверяем цифры по порядку от 1 до 9
    for (let num = 1; num <= 9; num++) {
        let count = 0;
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (game.board[row][col] === num) count++;
            }
        }
        // Если цифра ещё не полностью использована (меньше 9)
        if (count < 9) {
            // Дополнительно проверяем, есть ли для неё пустые клетки
            let hasEmpty = false;
            for (let row = 0; row < 9; row++) {
                for (let col = 0; col < 9; col++) {
                    if (game.board[row][col] === 0 && game.isValid(game.board, row, col, num)) {
                        hasEmpty = true;
                        break;
                    }
                }
                if (hasEmpty) break;
            }
            if (hasEmpty) {
                return num;
            }
        }
    }
    return null; // Все цифры заполнены или нет доступных клеток
}

// ===== ВЫБОР КЛЕТКИ (ИСПРАВЛЕН) =====
function selectSudokuCell(row, col) {
    let game = getGame();
    if (!game || game.isFinished) return;

    // Если включён режим быстрого ввода
    if (game.quickInputNumber) {
        let num = game.quickInputNumber;
        
        if (game.isFixed(row, col)) {
            showToast('Эту клетку нельзя менять 🔒');
            return;
        }
        if (game.board[row][col] !== 0) {
            showToast('Эта клетка уже заполнена');
            return;
        }
        if (game.isPencilMode) {
            game.togglePencilMark(row, col, num);
            renderSudokuUI(game);
            return;
        }

        let success = game.inputNumber(row, col, num);
        if (success) {
            // Подсчитываем, сколько осталось таких цифр
            let count = 0;
            for (let r = 0; r < 9; r++) {
                for (let c = 0; c < 9; c++) {
                    if (game.board[r][c] === num) count++;
                }
            }
            
            // Если все 9 цифр использованы
            if (count >= 9) {
                game.quickInputNumber = null;
                showToast('✅ Все цифры ' + num + ' использованы!');
                
                // Ищем следующую доступную цифру
                let nextNum = findNextAvailableNumber(game);
                if (nextNum) {
                    game.quickInputNumber = nextNum;
                    showToast('⚡ Автопереключение: ' + nextNum);
                } else {
                    showToast('🎉 Все цифры заполнены!');
                }
            }
            renderSudokuUI(game);
        }
        return;
    }

    // Обычный режим — выбираем клетку
    let isSameCell = game.selectedCell && game.selectedCell.row === row && game.selectedCell.col === col;
    
    if (isSameCell) {
        game.selectedCell = null;
        game.highlightSameNumbers = false;
    } else {
        game.selectedCell = { row: row, col: col };
        if (game.board[row][col] !== 0) {
            game.highlightSameNumbers = true;
        } else {
            game.highlightSameNumbers = false;
        }
    }
    renderSudokuUI(game);
}

// ===== РЕЖИМ БЫСТРОГО ВВОДА =====
function toggleQuickInput(num) {
    let game = getGame();
    if (!game) return;

    if (game.quickInputNumber === num) {
        game.quickInputNumber = null;
        showToast('Режим быстрого ввода отключён');
    } else {
        let count = 0;
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (game.board[row][col] === num) count++;
            }
        }
        if (count >= 9) {
            showToast('Все цифры ' + num + ' уже использованы!');
            return;
        }
        game.quickInputNumber = num;
        showToast('⚡ Быстрый ввод: ' + num + ' (нажми на пустую клетку)');
        game.selectedCell = null;
        game.highlightSameNumbers = false;
    }
    renderSudokuUI(game);
}

// ===== ВЫБОР КЛЕТКИ =====
function selectSudokuCell(row, col) {
    let game = getGame();
    if (!game || game.isFinished) return;

    // Если включён режим быстрого ввода
    if (game.quickInputNumber) {
        let num = game.quickInputNumber;
        
        if (game.isFixed(row, col)) {
            showToast('Эту клетку нельзя менять 🔒');
            return;
        }
        if (game.board[row][col] !== 0) {
            showToast('Эта клетка уже заполнена');
            return;
        }
        if (game.isPencilMode) {
            game.togglePencilMark(row, col, num);
            renderSudokuUI(game);
            return;
        }

        let success = game.inputNumber(row, col, num);
        if (success) {
            let count = 0;
            for (let r = 0; r < 9; r++) {
                for (let c = 0; c < 9; c++) {
                    if (game.board[r][c] === num) count++;
                }
            }
            
            if (count >= 9) {
                game.quickInputNumber = null;
                showToast('✅ Все цифры ' + num + ' использованы!');
                
                let nextNum = findNextAvailableNumber(game);
                if (nextNum) {
                    game.quickInputNumber = nextNum;
                    showToast('⚡ Автопереключение: ' + nextNum);
                } else {
                    showToast('🎉 Все цифры заполнены!');
                }
            }
            renderSudokuUI(game);
        }
        return;
    }

    // Обычный режим — выбираем клетку
    let isSameCell = game.selectedCell && game.selectedCell.row === row && game.selectedCell.col === col;
    
    if (isSameCell) {
        game.selectedCell = null;
        game.highlightSameNumbers = false;
    } else {
        game.selectedCell = { row: row, col: col };
        if (game.board[row][col] !== 0) {
            game.highlightSameNumbers = true;
        } else {
            game.highlightSameNumbers = false;
        }
    }
    renderSudokuUI(game);
}

// ===== ВВОД ЦИФРЫ =====
function inputSudokuNumber(num) {
    let game = getGame();
    if (!game || game.isFinished) return;
    
    if (game.selectedCell) {
        let row = game.selectedCell.row;
        let col = game.selectedCell.col;

        if (game.isFixed(row, col)) {
            showToast('Эту клетку нельзя менять 🔒');
            return;
        }
        if (game.board[row][col] !== 0) {
            showToast('Эта клетка уже заполнена');
            return;
        }

        if (game.isPencilMode) {
            game.togglePencilMark(row, col, num);
            renderSudokuUI(game);
        } else {
            let success = game.inputNumber(row, col, num);
            if (success) {
                game.selectedCell = null;
                game.highlightSameNumbers = false;
                renderSudokuUI(game);
            }
        }
    } else {
        toggleQuickInput(num);
    }
}

// ===== РЕЖИМ ЗАМЕТОК =====
function toggleSudokuPencil() {
    let game = getGame();
    if (!game) return;
    game.isPencilMode = !game.isPencilMode;
    if (game.isPencilMode) {
        game.quickInputNumber = null;
    }
    let btn = document.getElementById('pencil-toggle');
    if (btn) btn.classList.toggle('active');
    renderSudokuUI(game);
}

// ===== ВЫБОР УРОВНЯ =====
function showSudokuLevels() {
    let container = document.getElementById('sudoku-game-container');
    if (!container) return;

    let game = getGame();
    if (game && game.timerInterval) {
        clearInterval(game.timerInterval);
        game.timerInterval = null;
        game.isRunning = false;
    }

    let html = '<div class="level-selector">';
    html += '<h3>🎯 Выбери уровень сложности</h3>';
    html += '<div class="level-grid">';

    let levels = Object.keys(SUDOKU_LEVELS);
    for (let key of levels) {
        let level = SUDOKU_LEVELS[key];
        html += `<button class="level-btn" onclick="startSudokuGame('${key}')">
            ${level.icon} ${level.name}
            <small>${level.description} (${level.cellsToRemove} клеток)</small>
        </button>`;
    }

    html += `<button class="level-btn custom" onclick="showSudokuCustomLevel()">🎨 Свой уровень</button>`;
    html += '</div></div>';

    container.innerHTML = html;
}

function startSudokuGame(level) {
    if (typeof initSudoku === 'function') {
        initSudoku(level);
    }
}

function showSudokuCustomLevel() {
    let val = prompt('Введите количество удалённых клеток (от 20 до 80):', '40');
    if (val !== null) {
        let num = parseInt(val);
        if (!isNaN(num) && num >= 20 && num <= 80) {
            let game = getGame();
            if (game) {
                game.level = 'CUSTOM';
                game.cellsToRemove = num;
                game.reset();
            } else {
                initSudoku('EASY');
                let g = getGame();
                g.level = 'CUSTOM';
                g.cellsToRemove = num;
                g.reset();
            }
        } else {
            alert('Введите число от 20 до 80');
        }
    }
}

function resetSudokuGame() {
    let game = getGame();
    if (game) {
        if (confirm('Начать новую игру?')) {
            game.quickInputNumber = null;
            game.highlightSameNumbers = false;
            game.errorCell = null;
            game.reset();
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

// ===== КЛАВИАТУРА =====
document.addEventListener('keydown', function(e) {
    let game = getGame();
    if (!game) return;

    if (e.key >= '1' && e.key <= '9') {
        inputSudokuNumber(parseInt(e.key));
        e.preventDefault();
    }

    if (e.key === 'Backspace' || e.key === 'Delete') {
        if (game.selectedCell) {
            let row = game.selectedCell.row;
            let col = game.selectedCell.col;
            if (!game.isFixed(row, col)) {
                if (game.board[row][col] !== 0) {
                    game.board[row][col] = 0;
                    renderSudokuUI(game);
                } else {
                    let key = row + '-' + col;
                    if (game.pencilMarks[key]) {
                        delete game.pencilMarks[key];
                        renderSudokuUI(game);
                    }
                }
            }
        }
        e.preventDefault();
    }

    if (e.key === 'p' || e.key === 'P') {
        toggleSudokuPencil();
        e.preventDefault();
    }

    if (e.key === 'Escape') {
        if (game) {
            game.selectedCell = null;
            game.quickInputNumber = null;
            game.highlightSameNumbers = false;
            renderSudokuUI(game);
            e.preventDefault();
        }
    }
});

// ===== ГЛОБАЛЬНЫЙ ДОСТУП =====
window.selectSudokuCell = selectSudokuCell;
window.inputSudokuNumber = inputSudokuNumber;
window.toggleSudokuPencil = toggleSudokuPencil;
window.showSudokuLevels = showSudokuLevels;
window.startSudokuGame = startSudokuGame;
window.showSudokuCustomLevel = showSudokuCustomLevel;
window.resetSudokuGame = resetSudokuGame;
window.toggleQuickInput = toggleQuickInput;
window.closeModal = closeModal;
window.showToast = showToast;
window.findNextAvailableNumber = findNextAvailableNumber;