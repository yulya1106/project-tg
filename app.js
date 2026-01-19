// ===== КОНСТАНТЫ И ПЕРЕМЕННЫЕ =====
let words = [
    { arabic: "مرحبا", translation: "Привет", learned: false },
    { arabic: "شكرا", translation: "Спасибо", learned: false },
    { arabic: "كتاب", translation: "Книга", learned: false },
    { arabic: "قلم", translation: "Ручка", learned: false },
    { arabic: "ماء", translation: "Вода", learned: false }
];

let currentIndex = 0;
let currentTab = 'cards';
let userStats = {
    userId: null,
    words: {},
    problemWords: [],
    addedWords: [],
    totalSessions: 0,
    lastActivity: null
};

// ===== ОСНОВНЫЕ ФУНКЦИИ ПРИЛОЖЕНИЯ =====

function initApp() {
    loadWords();
    loadStats();
    setupEventListeners();
    updateWord();
    updateCounter();
    
    // Инициализация Telegram
    initTelegram();
    
    console.log('Приложение инициализировано');
}

function setupEventListeners() {
    // Вкладки
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.getAttribute('data-tab');
            showTab(tabName);
        });
    });
    
    // Кнопки карточек
    document.getElementById('show-translation-btn')?.addEventListener('click', showTranslation);
    document.getElementById('next-word-btn')?.addEventListener('click', nextWord);
    
    // Кнопка добавления слов
    document.getElementById('add-words-btn')?.addEventListener('click', addWords);
    
    // Кнопки упражнений
    document.getElementById('multiple-choice-btn')?.addEventListener('click', () => startExercise('multiple-choice'));
    document.getElementById('typing-btn')?.addEventListener('click', () => startExercise('typing'));
    document.getElementById('stats-btn')?.addEventListener('click', showStats);
}

// ===== УПРАВЛЕНИЕ ВКЛАДКАМИ =====

function showTab(tabName) {
    currentTab = tabName;
    
    // Обновляем активные табы
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.toggle('active', tab.getAttribute('data-tab') === tabName);
    });
    
    // Показываем нужную вкладку
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.toggle('active', content.id === `${tabName}-tab`);
    });
    
    // Обновляем кнопку "Назад" в Telegram
    updateTelegramBackButton();
    
    // Если открываем упражнения, показываем меню
    if (tabName === 'exercises') {
        showExerciseSelection();
    }
}

// ===== РАБОТА СО СЛОВАМИ =====

function updateWord() {
    const word = words[currentIndex];
    if (!word) return;
    
    document.getElementById('word').textContent = word.arabic;
    document.getElementById('translation').textContent = word.translation;
    document.getElementById('translation').style.display = 'none';
    
    // Подсвечиваем выученные слова
    const wordElement = document.getElementById('word');
    wordElement.style.color = word.learned ? '#00b894' : '';
}

function updateCounter() {
    document.getElementById('current').textContent = currentIndex + 1;
    document.getElementById('total').textContent = words.length;
}

function showTranslation() {
    const translationElement = document.getElementById('translation');
    translationElement.style.display = 'block';
    
    // Отмечаем слово как выученное
    if (!words[currentIndex].learned) {
        words[currentIndex].learned = true;
        saveWords();
        updateWord();
        showAlert('🎉 Отлично! Запомнили слово!');
    }
}

function nextWord() {
    currentIndex = (currentIndex + 1) % words.length;
    updateWord();
    updateCounter();
}

// ===== ДОБАВЛЕНИЕ СЛОВ =====

function addWords() {
    const textarea = document.getElementById('new-words');
    const text = textarea.value.trim();
    
    if (!text) {
        showAlert('Введите слова для добавления');
        return;
    }
    
    const lines = text.split('\n');
    let addedCount = 0;
    
    lines.forEach(line => {
        const trimmed = line.trim();
        if (trimmed && trimmed.includes('-')) {
            const parts = trimmed.split('-').map(p => p.trim());
            if (parts.length >= 2) {
                const arabic = parts[0];
                const translation = parts[1];
                
                // Проверяем, нет ли уже такого слова
                const exists = words.some(w => w.arabic === arabic);
                if (!exists) {
                    words.push({
                        arabic: arabic,
                        translation: translation,
                        learned: false
                    });
                    
                    // Добавляем в статистику
                    userStats.words[arabic] = {
                        seen: 0,
                        correct: 0,
                        incorrect: 0,
                        lastSeen: null,
                        difficulty: 2.0,
                        custom: true
                    };
                    
                    addedCount++;
                }
            }
        }
    });
    
    if (addedCount > 0) {
        saveWords();
        saveStats();
        updateCounter();
        
        showAlert(`✅ Добавлено ${addedCount} новых слов!`);
        textarea.value = '';
        showTab('cards');
    } else {
        showAlert('Не удалось добавить слова. Проверьте формат.');
    }
}

// ===== УПРАЖНЕНИЯ =====

function showExerciseSelection() {
    const exercisesTab = document.getElementById('exercises-tab');
    if (!exercisesTab) return;
    
    const problemCount = userStats.problemWords?.length || 0;
    
    exercisesTab.innerHTML = `
        <div class="card">
            <h1>🧪 Упражнения</h1>
            
            <div style="margin: 25px 0;">
                <p style="opacity: 0.8; margin-bottom: 20px;">Выберите тип упражнения:</p>
                
                <div class="buttons">
                    <button id="multiple-choice-btn" style="background: #fd79a8;">
                        ❓ Выбор ответа
                    </button>
                    
                    <button id="typing-btn" style="background: #74b9ff;">
                        ⌨️ Написание
                    </button>
                    
                    <button id="stats-btn" style="background: #a29bfe;">
                        📊 Статистика
                    </button>
                    
                    ${problemCount > 0 ? `
                        <button id="problem-words-btn" style="background: #e17055;">
                            ⚠️ Сложные слова (${problemCount})
                        </button>
                    ` : ''}
                </div>
            </div>
        </div>
    `;
    
    // Обновляем обработчики
    document.getElementById('multiple-choice-btn')?.addEventListener('click', () => startExercise('multiple-choice'));
    document.getElementById('typing-btn')?.addEventListener('click', () => startExercise('typing'));
    document.getElementById('stats-btn')?.addEventListener('click', showStats);
    document.getElementById('problem-words-btn')?.addEventListener('click', showProblemWords);
}

function startExercise(type) {
    if (words.length < 3) {
        showAlert('Добавьте минимум 3 слова для упражнений');
        return;
    }
    
    if (type === 'multiple-choice') {
        startMultipleChoice();
    } else if (type === 'typing') {
        startTypingExercise();
    }
}

function startMultipleChoice() {
    const correctWord = words[Math.floor(Math.random() * words.length)];
    let options = [correctWord.translation];
    
    // Добавляем 3 неправильных варианта
    while (options.length < 4) {
        const randomWord = words[Math.floor(Math.random() * words.length)];
        if (!options.includes(randomWord.translation)) {
            options.push(randomWord.translation);
        }
    }
    
    // Перемешиваем
    options = shuffleArray(options);
    
    const exercisesTab = document.getElementById('exercises-tab');
    exercisesTab.innerHTML = `
        <div class="card">
            <h2>❓ Выбери правильный перевод</h2>
            
            <div style="font-size: 48px; font-family: 'Noto Sans Arabic'; margin: 30px 0;">
                ${correctWord.arabic}
            </div>
            
            <div class="buttons">
                ${options.map((option, index) => `
                    <button class="exercise-option" data-answer="${option}" data-correct="${correctWord.translation}" data-arabic="${correctWord.arabic}"
                            style="text-align: left; justify-content: flex-start;">
                        ${String.fromCharCode(65 + index)}. ${option}
                    </button>
                `).join('')}
            </div>
            
            <button id="back-to-exercises" style="background: #636e72; margin-top: 20px;">
                ← Назад к упражнениям
            </button>
        </div>
    `;
    
    // Добавляем обработчики
    document.querySelectorAll('.exercise-option').forEach(btn => {
        btn.addEventListener('click', function() {
            checkAnswer(
                this.getAttribute('data-answer'),
                this.getAttribute('data-correct'),
                this.getAttribute('data-arabic')
            );
        });
    });
    
    document.getElementById('back-to-exercises').addEventListener('click', () => showTab('exercises'));
}

function startTypingExercise() {
    const word = words[Math.floor(Math.random() * words.length)];
    
    const exercisesTab = document.getElementById('exercises-tab');
    exercisesTab.innerHTML = `
        <div class="card">
            <h2>⌨️ Напиши перевод</h2>
            
            <div style="font-size: 48px; font-family: 'Noto Sans Arabic'; margin: 30px 0;">
                ${word.arabic}
            </div>
            
            <input type="text" id="typing-answer" 
                   placeholder="Введите перевод..."
                   style="width: 100%; padding: 15px; font-size: 18px; 
                          border: 2px solid #ddd; border-radius: 10px; 
                          margin: 20px 0; background: var(--card-bg); 
                          color: var(--text-color);">
            
            <button id="check-typing-btn" style="background: var(--accent-color);">
                ✅ Проверить
            </button>
            
            <div style="margin-top: 15px; font-size: 14px; opacity: 0.7;">
                Подсказка: слово из ${word.translation.length} букв
            </div>
            
            <button id="back-to-exercises-typing" style="background: #636e72; margin-top: 20px;">
                ← Назад к упражнениям
            </button>
        </div>
    `;
    
    document.getElementById('check-typing-btn').addEventListener('click', () => {
        checkTypingAnswer(word.translation);
    });
    
    document.getElementById('back-to-exercises-typing').addEventListener('click', () => showTab('exercises'));
    
    // Фокус на поле ввода
    setTimeout(() => {
        document.getElementById('typing-answer')?.focus();
    }, 100);
}

function checkAnswer(selected, correct, arabicWord) {
    const buttons = document.querySelectorAll('.exercise-option');
    
    // Обновляем статистику
    updateWordStats(arabicWord, selected === correct);
    
    buttons.forEach(btn => {
        btn.disabled = true;
        const btnText = btn.textContent.split('. ')[1];
        
        if (btnText === correct) {
            btn.style.background = '#00b894';
        } else if (btnText === selected) {
            btn.style.background = '#d63031';
        }
    });
    
    if (selected === correct) {
        showAlert('✅ Правильно! Отличная работа!');
        setTimeout(() => startMultipleChoice(), 2000);
    } else {
        showAlert(`❌ Неправильно. Правильный ответ: ${correct}`);
        setTimeout(() => startMultipleChoice(), 2000);
    }
}

function checkTypingAnswer(correct) {
    const input = document.getElementById('typing-answer');
    if (!input) return;
    
    const answer = input.value.trim().toLowerCase();
    const correctLower = correct.toLowerCase();
    
    if (answer === correctLower) {
        showAlert('✅ Идеально! Ты правильно написал!');
        input.style.borderColor = '#00b894';
        setTimeout(() => startTypingExercise(), 2000);
    } else {
        showAlert(`❌ Не совсем. Правильно: ${correct}`);
        input.style.borderColor = '#d63031';
    }
}

// ===== СТАТИСТИКА =====

function showStats() {
    const learned = words.filter(w => w.learned).length;
    const total = words.length;
    const percentage = total > 0 ? Math.round((learned / total) * 100) : 0;
    
    const exercisesTab = document.getElementById('exercises-tab');
    exercisesTab.innerHTML = `
        <div class="card">
            <h2>📊 Твоя статистика</h2>
            
            <div style="margin: 30px 0;">
                <div style="display: flex; justify-content: space-between; margin: 15px 0;">
                    <span>Всего слов:</span>
                    <strong>${total}</strong>
                </div>
                
                <div style="display: flex; justify-content: space-between; margin: 15px 0;">
                    <span>Выучено:</span>
                    <strong style="color: #00b894;">${learned}</strong>
                </div>
                
                <div style="display: flex; justify-content: space-between; margin: 15px 0;">
                    <span>Прогресс:</span>
                    <strong>${percentage}%</strong>
                </div>
                
                <div style="margin: 25px 0; height: 10px; background: rgba(0,0,0,0.1); border-radius: 5px; overflow: hidden;">
                    <div style="height: 100%; width: ${percentage}%; background: #00b894; transition: width 0.5s;"></div>
                </div>
            </div>
            
            <button id="back-to-stats" style="background: #636e72;">
                ← Назад к упражнениям
            </button>
        </div>
    `;
    
    document.getElementById('back-to-stats').addEventListener('click', () => showTab('exercises'));
}

// ===== СЛОЖНЫЕ СЛОВА =====

function showProblemWords() {
    const problemWords = words.filter(word => 
        userStats.problemWords?.includes(word.arabic)
    );
    
    if (problemWords.length === 0) {
        showAlert('У вас пока нет сложных слов!');
        return;
    }
    
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.7);
        z-index: 10000;
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 20px;
    `;
    
    modal.innerHTML = `
        <div style="
            background: white;
            border-radius: 16px;
            padding: 25px;
            max-width: 500px;
            width: 100%;
            max-height: 80vh;
            overflow-y: auto;
            color: #2d3436;
        ">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h2 style="margin: 0; color: #e17055;">⚠️ Сложные слова</h2>
                <button id="close-problem-modal" 
                        style="background: none; border: none; font-size: 24px; cursor: pointer; color: #999;">
                    ×
                </button>
            </div>
            
            <p style="color: #636e72; margin-bottom: 20px;">
                Эти слова вызывают у вас трудности.
            </p>
            
            <div id="problem-words-list">
                ${problemWords.map(word => `
                    <div style="
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        padding: 12px;
                        margin: 8px 0;
                        background: rgba(225, 112, 85, 0.1);
                        border-radius: 8px;
                        border-left: 4px solid #e17055;
                    ">
                        <div>
                            <div style="font-size: 24px; font-family: 'Noto Sans Arabic';">${word.arabic}</div>
                            <div style="color: #636e72;">${word.translation}</div>
                        </div>
                        <button onclick="practiceWord('${word.arabic}')" 
                                style="padding: 6px 12px; background: #e17055; color: white; border: none; border-radius: 6px; font-size: 12px;">
                            Повторить
                        </button>
                    </div>
                `).join('')}
            </div>
            
            <button id="clear-problem-words" 
                    style="padding: 12px; background: #636e72; color: white; border: none; border-radius: 8px; width: 100%; margin-top: 20px;">
                Очистить список
            </button>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    document.getElementById('close-problem-modal').addEventListener('click', () => {
        modal.remove();
    });
    
    document.getElementById('clear-problem-words').addEventListener('click', () => {
        if (confirm('Вы уверены, что хотите очистить список сложных слов?')) {
            userStats.problemWords = [];
            saveStats();
            modal.remove();
            showAlert('Список сложных слов очищен!');
            showExerciseSelection();
        }
    });
}

function practiceWord(arabicWord) {
    const word = words.find(w => w.arabic === arabicWord);
    if (!word) return;
    
    showTab('exercises');
    
    const exercisesTab = document.getElementById('exercises-tab');
    exercisesTab.innerHTML = `
        <div class="card">
            <h2>📝 Тренировка слова</h2>
            
            <div style="text-align: center; margin: 30px 0;">
                <div style="font-size: 48px; font-family: 'Noto Sans Arabic';">${word.arabic}</div>
                <div style="font-size: 24px; color: #636e72; margin-top: 10px;">${word.translation}</div>
            </div>
            
            <div class="buttons">
                <button onclick="startTypingExerciseForWord('${arabicWord}')" style="background: #74b9ff;">
                    ⌨️ Написать перевод
                </button>
                <button onclick="startMultipleChoiceForWord('${arabicWord}')" style="background: #a29bfe;">
                    ❓ Выбрать перевод
                </button>
                <button onclick="showTab('exercises')" style="background: #636e72;">
                    ← Назад к упражнениям
                </button>
            </div>
        </div>
    `;
}

// ===== TELEGRAM ИНТЕГРАЦИЯ =====

function initTelegram() {
    if (typeof Telegram !== 'undefined' && Telegram.WebApp) {
        const tg = Telegram.WebApp;
        
        // Инициализация
        tg.ready();
        tg.expand();
        
        // Настройка темы
        applyTelegramTheme(tg);
        tg.onEvent('themeChanged', () => applyTelegramTheme(tg));
        
        // Настройка кнопки "Назад"
        tg.BackButton.onClick(() => {
            handleTelegramBackButton();
        });
        
        console.log('Telegram Mini App инициализирован');
    } else {
        // Режим браузера
        setupBrowserMode();
    }
}

function applyTelegramTheme(tg) {
    const isDark = tg.colorScheme === 'dark';
    document.body.classList.toggle('theme-dark', isDark);
    
    document.documentElement.style.setProperty(
        '--bg-color', 
        tg.themeParams.bg_color || (isDark ? '#1a1a1a' : '#667eea')
    );
    document.documentElement.style.setProperty(
        '--text-color', 
        tg.themeParams.text_color || (isDark ? '#ffffff' : '#2d3436')
    );
}

function updateTelegramBackButton() {
    if (typeof Telegram !== 'undefined' && Telegram.WebApp) {
        const tg = Telegram.WebApp;
        
        // Показываем кнопку "Назад" только не на главной вкладке
        if (currentTab !== 'cards') {
            tg.BackButton.show();
        } else {
            tg.BackButton.hide();
        }
    } else {
        // В браузере
        const backBtn = document.getElementById('back-button');
        if (backBtn) {
            backBtn.style.display = currentTab !== 'cards' ? 'block' : 'none';
        }
    }
}

function handleTelegramBackButton() {
    if (currentTab !== 'cards') {
        showTab('cards');
    } else if (typeof Telegram !== 'undefined' && Telegram.WebApp) {
        Telegram.WebApp.close();
    }
}

function setupBrowserMode() {
    const backBtn = document.getElementById('back-button');
    if (backBtn) {
        backBtn.style.display = 'none';
        backBtn.addEventListener('click', () => {
            if (currentTab !== 'cards') {
                showTab('cards');
            } else {
                alert('В браузере кнопка "Назад" закрывает приложение');
            }
        });
    }
    console.log('Запущено в браузере');
}

// ===== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ =====

function shuffleArray(array) {
    return [...array].sort(() => Math.random() - 0.5);
}

function showAlert(message) {
    // В Telegram
    if (typeof Telegram !== 'undefined' && Telegram.WebApp) {
        Telegram.WebApp.showAlert(message);
        return;
    }
    
    // В браузере
    alert(message);
}

function updateWordStats(arabicWord, isCorrect) {
    if (!userStats.words[arabicWord]) {
        userStats.words[arabicWord] = {
            seen: 0,
            correct: 0,
            incorrect: 0,
            lastSeen: new Date().toISOString(),
            difficulty: 2.0
        };
    }
    
    userStats.words[arabicWord].seen++;
    userStats.words[arabicWord].lastSeen = new Date().toISOString();
    
    if (isCorrect) {
        userStats.words[arabicWord].correct++;
        userStats.words[arabicWord].difficulty = Math.max(0.5, userStats.words[arabicWord].difficulty * 0.9);
    } else {
        userStats.words[arabicWord].incorrect++;
        userStats.words[arabicWord].difficulty = Math.min(3.0, userStats.words[arabicWord].difficulty * 1.2);
        
        // Добавляем в проблемные слова
        if (!userStats.problemWords) userStats.problemWords = [];
        if (!userStats.problemWords.includes(arabicWord)) {
            userStats.problemWords.push(arabicWord);
            saveStats();
        }
    }
    
    saveStats();
}

// ===== СОХРАНЕНИЕ ДАННЫХ =====

function saveWords() {
    try {
        localStorage.setItem('arabic_words', JSON.stringify(words));
    } catch (e) {
        console.error('Ошибка сохранения слов:', e);
    }
}

function loadWords() {
    try {
        const saved = localStorage.getItem('arabic_words');
        if (saved) {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed) && parsed.length > 0) {
                words = parsed;
            }
        }
    } catch (e) {
        console.error('Ошибка загрузки слов:', e);
    }
}

function saveStats() {
    try {
        localStorage.setItem('arabic_stats', JSON.stringify(userStats));
    } catch (e) {
        console.error('Ошибка сохранения статистики:', e);
    }
}

function loadStats() {
    try {
        const saved = localStorage.getItem('arabic_stats');
        if (saved) {
            userStats = JSON.parse(saved);
        } else {
            // Инициализация новой статистики
            userStats.userId = 'user_' + Math.random().toString(36).substr(2, 9);
            userStats.lastActivity = new Date().toISOString();
            saveStats();
        }
    } catch (e) {
        console.error('Ошибка загрузки статистики:', e);
    }
}

// ===== ГЛОБАЛЬНЫЕ ФУНКЦИИ =====
window.practiceWord = practiceWord;

// ===== ЗАПУСК ПРИЛОЖЕНИЯ =====
document.addEventListener('DOMContentLoaded', initApp);