// ============================================
// СУДОКУ — ИНТЕГРАЦИЯ С NAVA
// ============================================

// Подключаем все необходимые файлы
// (в реальном проекте они будут объединены)

// ===== РЕГИСТРАЦИЯ ИГРЫ В NAVA =====
window.NAVA_GAME.register({
    slug: 'sudoku',
    name: 'Судоку',
    description: 'Классическая головоломка Судоку',
    version: '1.0.0',
    
    // Иконка в 64x64 (base64 или URL)
    icon: '🧩',
    
    // Настройки игры
    config: {
        levels: ['EASY', 'MEDIUM', 'HARD', 'EXPERT'],
        defaultLevel: 'EASY'
    },

    mount(container, context) {
        console.log('🎮 Запуск Судоку в NAVA');
        
        // Создаем контейнер для игры
        const gameContainer = document.createElement('div');
        gameContainer.id = 'sudoku-game-container';
        gameContainer.style.cssText = `
            width: 100%;
            height: 100%;
            min-height: 500px;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 10px;
        `;
        container.appendChild(gameContainer);

        // Сохраняем ссылку на контейнер
        this.container = container;
        this.gameContainer = gameContainer;

        // Получаем уровень из контекста или используем по умолчанию
        const level = context?.level || 'EASY';
        
        // Инициализируем игру
        if (typeof initSudoku === 'function') {
            initSudoku(level);
        } else {
            console.error('❌ Sudoku не инициализирован!');
            gameContainer.innerHTML = '<div style="color:red;text-align:center;">Ошибка загрузки игры</div>';
        }

        // Настраиваем обработчики для NAVA
        this.setupNAVAHandlers(context);

        // Возвращаем API для управления игрой
        return {
            destroy: () => this.destroy(),
            pause: () => this.pause(),
            resume: () => this.resume(),
            setLevel: (level) => this.setLevel(level),
            getState: () => this.getState(),
            restart: () => this.restart()
        };
    },

    // ===== МЕТОДЫ УПРАВЛЕНИЯ =====
    
    destroy() {
        console.log('🗑️ Уничтожение игры Судоку');
        
        // Очищаем таймеры
        const game = getGame();
        if (game) {
            if (game.timerInterval) {
                clearInterval(game.timerInterval);
                game.timerInterval = null;
            }
            game.isRunning = false;
        }

        // Очищаем модальные окна
        document.querySelectorAll('.modal-overlay').forEach(el => el.remove());

        // Очищаем контейнер
        if (this.gameContainer) {
            this.gameContainer.innerHTML = '';
        }
        
        // Удаляем глобальные обработчики событий
        this.removeEventListeners();
    },

    pause() {
        console.log('⏸️ Пауза в игре Судоку');
        const game = getGame();
        if (game && !game.isFinished) {
            game.isRunning = false;
            if (game.timerInterval) {
                clearInterval(game.timerInterval);
                game.timerInterval = null;
            }
            // Показываем затемнение
            this.showPauseOverlay();
        }
    },

    resume() {
        console.log('▶️ Продолжение игры Судоку');
        const game = getGame();
        if (game && !game.isFinished) {
            game.startTimer();
            this.hidePauseOverlay();
        }
    },

    setLevel(level) {
        console.log(`📊 Смена уровня на ${level}`);
        const game = getGame();
        if (game && SUDOKU_LEVELS[level]) {
            game.level = level;
            game.cellsToRemove = SUDOKU_LEVELS[level].cellsToRemove;
            game.reset();
            this.hidePauseOverlay();
        }
    },

    getState() {
        const game = getGame();
        if (!game) return null;

        return {
            level: game.level,
            timer: game.timer,
            lives: game.lives,
            errors: game.errors,
            moves: game.moves,
            isFinished: game.isFinished,
            progress: this.calculateProgress(game),
            board: game.board,
            solution: game.solution,
            fixedCells: game.fixedCells,
            pencilMarks: game.pencilMarks
        };
    },

    restart() {
        console.log('🔄 Перезапуск игры Судоку');
        const game = getGame();
        if (game) {
            game.quickInputNumber = null;
            game.highlightSameNumbers = false;
            game.errorCell = null;
            game.reset();
            this.hidePauseOverlay();
        }
    },

    // ===== ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ =====

    calculateProgress(game) {
        if (!game) return 0;
        let filled = 0;
        let total = 81;
        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                if (game.board[r][c] !== 0) filled++;
            }
        }
        return Math.round((filled / total) * 100);
    },

    showPauseOverlay() {
        let overlay = document.getElementById('nava-pause-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'nava-pause-overlay';
            overlay.style.cssText = `
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.7);
                backdrop-filter: blur(5px);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 100;
                border-radius: 20px;
            `;
            overlay.innerHTML = `
                <div style="text-align: center; color: white;">
                    <div style="font-size: 3rem; margin-bottom: 10px;">⏸️</div>
                    <h2 style="margin: 0; color: white;">Пауза</h2>
                    <p style="opacity: 0.8; margin: 5px 0;">Игра приостановлена</p>
                </div>
            `;
            this.gameContainer.appendChild(overlay);
        }
        overlay.style.display = 'flex';
    },

    hidePauseOverlay() {
        const overlay = document.getElementById('nava-pause-overlay');
        if (overlay) {
            overlay.style.display = 'none';
        }
    },

    setupNAVAHandlers(context) {
        // Сохраняем обработчики для удаления
        this.eventListeners = [];

        // Обработчик для NAVA событий
        if (context?.on) {
            // Например, подписка на событие смены темы
            context.on('themeChange', (theme) => {
                console.log('🎨 Смена темы:', theme);
                this.applyTheme(theme);
            });
        }

        // Обработчик клавиш NAVA (если есть)
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
        this.eventListeners.push({ type: 'keydown', handler: this.handleKeyDown.bind(this) });

        // Обработчик для переключения полноэкранного режима
        if (context?.fullscreen) {
            context.on('fullscreenChange', (isFullscreen) => {
                console.log('🖥️ Полноэкранный режим:', isFullscreen);
                this.adjustSize(isFullscreen);
            });
        }
    },

    handleKeyDown(e) {
        // Перехватываем клавиши для NAVA
        if (e.key === 'Escape') {
            const game = getGame();
            if (game) {
                game.selectedCell = null;
                game.quickInputNumber = null;
                game.highlightSameNumbers = false;
                renderSudokuUI(game);
            }
        }
    },

    removeEventListeners() {
        if (this.eventListeners) {
            this.eventListeners.forEach(({ type, handler }) => {
                document.removeEventListener(type, handler);
            });
            this.eventListeners = [];
        }
    },

    applyTheme(theme) {
        // Применяем тему NAVA к игре
        const root = document.documentElement;
        if (theme === 'dark') {
            root.style.setProperty('--bg-color', '#1a1a2e');
            root.style.setProperty('--card-bg', '#16213e');
            root.style.setProperty('--text-color', '#ffffff');
            root.style.setProperty('--border-color', '#333366');
            root.style.setProperty('--hover-bg', '#1f1f3a');
        } else {
            root.style.setProperty('--bg-color', '#f0f4f8');
            root.style.setProperty('--card-bg', '#ffffff');
            root.style.setProperty('--text-color', '#333333');
            root.style.setProperty('--border-color', '#e0e0e0');
            root.style.setProperty('--hover-bg', '#f5f5f5');
        }
    },

    adjustSize(isFullscreen) {
        const container = this.gameContainer;
        if (container) {
            if (isFullscreen) {
                container.style.minHeight = '90vh';
                container.style.maxWidth = '800px';
            } else {
                container.style.minHeight = '500px';
                container.style.maxWidth = '600px';
            }
        }
    }
});

console.log('✅ Судоку зарегистрирован в NAVA!');