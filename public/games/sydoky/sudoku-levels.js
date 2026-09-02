// ============================================
// УРОВНИ СЛОЖНОСТИ СУДОКУ
// ============================================

const SUDOKU_LEVELS = {
    EASY: { name: 'Лёгкий', cellsToRemove: 25, icon: '🌟', description: 'Для начала' },
    MEDIUM: { name: 'Средний', cellsToRemove: 45, icon: '⭐', description: 'Для опыта' },
    HARD: { name: 'Сложный', cellsToRemove: 60, icon: '🔥', description: 'Для мастеров' },
    EXPERT: { name: 'Эксперт', cellsToRemove: 70, icon: '💎', description: 'Для гениев' }
};