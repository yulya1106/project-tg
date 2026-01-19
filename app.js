// ===== ТЕЛЕГРАМ МИНИ APP =====

// Все слова для изучения
let words = [
    { arabic: "مرحبا", translation: "Привет", learned: false },
    { arabic: "شكرا", translation: "Спасибо", learned: false },
    { arabic: "كتاب", translation: "Книга", learned: false },
    { arabic: "قلم", translation: "Ручка", learned: false },
    { arabic: "ماء", translation: "Вода", learned: false }
];

// Текущий индекс слова
let currentIndex = 0;
let totalWords = 0;

// Инициализация при загрузке
function initApp() {
    // Загружаем слова из localStorage
    loadWords();
    
    // Устанавливаем общее количество слов
    totalWords = words.length;
    updateCounter();
    
    // Показываем первое слово
    updateWord();
    
    // Логируем загрузку
    console.log('Приложение инициализировано. Слов:', words.length);
    
    // Отправляем данные в Telegram при первом запуске
    if (window.Telegram && Telegram.WebApp) {
        const tg = Telegram.WebApp;
        
        // Можно отправить статистику в бота
        const userData = tg.initDataUnsafe?.user;
        if (userData) {
            console.log('Пользователь Telegram:', userData.first_name, userData.id);
            
            // Сохраняем ID пользователя
            localStorage.setItem('telegram_user_id', userData.id);
            
            // Отправляем событие запуска (опционально)
            // tg.sendData(JSON.stringify({
            //     action: 'app_launched',
            //     userId: userData.id,
            //     wordsCount: words.length
            // }));
        }
    }
}

// Обновление отображения слова
function updateWord() {
    const wordElement = document.getElementById('word');
    const translationElement = document.getElementById('translation');
    
    if (wordElement && translationElement && words[currentIndex]) {
        const currentWord = words[currentIndex];
        
        wordElement.textContent = currentWord.arabic;
        translationElement.textContent = currentWord.translation;
        translationElement.style.display = 'none';
        
        // Обновляем счетчик
        updateCounter();
        
        // Подсвечиваем выученные слова
        if (currentWord.learned) {
            wordElement.style.color = '#00b894';
        } else {
            wordElement.style.color = '';
        }
    }
}

// Показать перевод
function showTranslation() {
    const translationElement = document.getElementById('translation');
    if (translationElement) {
        translationElement.style.display = 'block';
        
        // Отмечаем слово как просмотренное
        if (!words[currentIndex].learned) {
            words[currentIndex].learned = true;
            saveWords();
            
            // Обновляем отображение
            updateWord();
            
            // Показываем уведомление в Telegram-стиле
            showTelegramAlert('🎉 Отлично! Запомнили слово!');
        }
    }
}

// Следующее слово
function nextWord() {
    currentIndex = (currentIndex + 1) % words.length;
    updateWord();
}

// Предыдущее слово
function prevWord() {
    currentIndex = (currentIndex - 1 + words.length) % words.length;
    updateWord();
}

// Обновление счетчика
function updateCounter() {
    const currentElement = document.getElementById('current');
    const totalElement = document.getElementById('total');
    
    if (currentElement) {
        currentElement.textContent = currentIndex + 1;
    }
    
    if (totalElement) {
        totalElement.textContent = words.length;
    }
}

// ===== ДОБАВЛЕНИЕ СЛОВ =====

function addWords() {
    const textarea = document.getElementById('new-words');
    if (!textarea) return;
    
    const text = textarea.value.trim();
    if (!text) {
        showTelegramAlert('Введите слова для добавления');
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
                    addedCount++;
                }
            }
        }
    });
    
    if (addedCount > 0) {
        saveWords();
        updateCounter();
        
        // Показываем уведомление
        showTelegramAlert(`✅ Добавлено ${addedCount} новых слов!`);
        
        // Очищаем поле
        textarea.value = '';
        
        // Возвращаемся к карточкам
        showTab('cards');
        
        // Отправляем статистику в Telegram (опционально)
        if (window.Telegram && Telegram.WebApp) {
            Telegram.WebApp.HapticFeedback.impactOccurred('medium');
        }
    } else {
        showTelegramAlert('Не удалось добавить слова. Проверьте формат.');
    }
}

// ===== УПРАЖНЕНИЯ =====

function startExercise(type) {
    if (words.length < 3) {
        showTelegramAlert('Добавьте минимум 3 слова для упражнений');
        return;
    }
    
    // Простое упражнение "Выбор ответа"
    if (type === 'multiple-choice') {
        startMultipleChoice();
    } 
    // Упражнение "Написание"
    else if (type === 'typing') {
        startTypingExercise();
    }
}

function startMultipleChoice() {
    // Выбираем случайное слово
    const correctIndex = Math.floor(Math.random() * words.length);
    const correctWord = words[correctIndex];
    
    // Выбираем 3 неправильных варианта
    let options = [correctWord.translation];
    while (options.length < 4) {
        const randomWord = words[Math.floor(Math.random() * words.length)];
        if (!options.includes(randomWord.translation)) {
            options.push(randomWord.translation);
        }
    }
    
    // Перемешиваем варианты
    options = shuffleArray(options);
    
    // Показываем упражнение
    const exerciseHTML = `
        <div class="card">
            <h2>❓ Выбери правильный перевод</h2>
            
            <div style="font-size: 48px; font-family: 'Noto Sans Arabic'; margin: 30px 0;">
                ${correctWord.arabic}
            </div>
            
            <div class="buttons">
                ${options.map((option, index) => `
                    <button onclick="checkAnswer('${option}', '${correctWord.translation}')" 
                            style="text-align: left; justify-content: flex-start;">
                        ${String.fromCharCode(65 + index)}. ${option}
                    </button>
                `).join('')}
            </div>
            
            <button onclick="showTab('exercises')" style="background: #636e72; margin-top: 20px;">
                ← Назад к упражнениям
            </button>
        </div>
    `;
    
    // Заменяем содержимое вкладки
    const exercisesTab = document.getElementById('exercises-tab');
    if (exercisesTab) {
        exercisesTab.innerHTML = exerciseHTML;
    }
}

function startTypingExercise() {
    const word = words[Math.floor(Math.random() * words.length)];
    
    const exerciseHTML = `
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
            
            <button onclick="checkTypingAnswer('${word.translation}')" 
                    style="background: var(--accent-color);">
                ✅ Проверить
            </button>
            
            <div style="margin-top: 15px; font-size: 14px; opacity: 0.7;">
                Подсказка: слово из ${word.translation.length} букв
            </div>
            
            <button onclick="showTab('exercises')" style="background: #636e72; margin-top: 20px;">
                ← Назад к упражнениям
            </button>
        </div>
    `;
    
    const exercisesTab = document.getElementById('exercises-tab');
    if (exercisesTab) {
        exercisesTab.innerHTML = exerciseHTML;
        // Фокус на поле ввода
        setTimeout(() => {
            const input = document.getElementById('typing-answer');
            if (input) input.focus();
        }, 100);
    }
}

function checkAnswer(selected, correct) {
    const buttons = document.querySelectorAll('#exercises-tab .buttons button');
    
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
        showTelegramAlert('✅ Правильно! Отличная работа!');
        
        // Вибрация в Telegram (если доступно)
        if (window.Telegram && Telegram.WebApp) {
            Telegram.WebApp.HapticFeedback.notificationOccurred('success');
        }
        
        // Следующее упражнение через 2 секунды
        setTimeout(() => {
            startMultipleChoice();
        }, 2000);
    } else {
        showTelegramAlert(`❌ Неправильно. Правильный ответ: ${correct}`);
        
        if (window.Telegram && Telegram.WebApp) {
            Telegram.WebApp.HapticFeedback.notificationOccurred('error');
        }
        
        setTimeout(() => {
            startMultipleChoice();
        }, 2000);
    }
}

function checkTypingAnswer(correct) {
    const input = document.getElementById('typing-answer');
    if (!input) return;
    
    const answer = input.value.trim().toLowerCase();
    const correctLower = correct.toLowerCase();
    
    if (answer === correctLower) {
        showTelegramAlert('✅ Идеально! Ты правильно написал!');
        input.style.borderColor = '#00b894';
        
        if (window.Telegram && Telegram.WebApp) {
            Telegram.WebApp.HapticFeedback.notificationOccurred('success');
        }
        
        setTimeout(() => {
            startTypingExercise();
        }, 2000);
    } else {
        showTelegramAlert(`❌ Не совсем. Правильно: ${correct}`);
        input.style.borderColor = '#d63031';
        
        if (window.Telegram && Telegram.WebApp) {
            Telegram.WebApp.HapticFeedback.notificationOccurred('error');
        }
    }
}

// ===== СТАТИСТИКА =====

function showStats() {
    const learned = words.filter(w => w.learned).length;
    const total = words.length;
    const percentage = total > 0 ? Math.round((learned / total) * 100) : 0;
    
    const statsHTML = `
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
            
            <button onclick="showTab('exercises')" style="background: #636e72;">
                ← Назад к упражнениям
            </button>
        </div>
    `;
    
    const exercisesTab = document.getElementById('exercises-tab');
    if (exercisesTab) {
        exercisesTab.innerHTML = statsHTML;
    }
}

// ===== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ =====

function shuffleArray(array) {
    return [...array].sort(() => Math.random() - 0.5);
}

// Сохранение слов в localStorage
function saveWords() {
    try {
        localStorage.setItem('arabic_words', JSON.stringify(words));
        console.log('Слова сохранены');
    } catch (e) {
        console.error('Ошибка сохранения:', e);
    }
}

// Загрузка слов из localStorage
function loadWords() {
    try {
        const saved = localStorage.getItem('arabic_words');
        if (saved) {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed) && parsed.length > 0) {
                words = parsed;
                console.log('Слова загружены из localStorage:', words.length);
            }
        }
    } catch (e) {
        console.error('Ошибка загрузки:', e);
    }
}

// Уведомление в стиле Telegram
function showTelegramAlert(message) {
    // В Telegram используем встроенные алерты
    if (window.Telegram && Telegram.WebApp) {
        Telegram.WebApp.showAlert(message);
        return;
    }
    
    // В браузере показываем свой алерт
    const alert = document.createElement('div');
    alert.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0,0,0,0.9);
        color: white;
        padding: 15px 25px;
        border-radius: 10px;
        z-index: 10000;
        font-weight: 600;
        box-shadow: 0 5px 20px rgba(0,0,0,0.3);
        animation: fadeInOut 3s;
    `;
    
    const style = document.createElement('style');
    style.textContent = `
        @keyframes fadeInOut {
            0% { opacity: 0; transform: translateX(-50%) translateY(-20px); }
            10% { opacity: 1; transform: translateX(-50%) translateY(0); }
            90% { opacity: 1; transform: translateX(-50%) translateY(0); }
            100% { opacity: 0; transform: translateX(-50%) translateY(-20px); }
        }
    `;
    
    alert.textContent = message;
    document.head.appendChild(style);
    document.body.appendChild(alert);
    
    setTimeout(() => {
        alert.remove();
        style.remove();
    }, 3000);
}

// Экспортируем функции для глобального доступа
window.showTab = showTab;
window.showTranslation = showTranslation;
window.nextWord = nextWord;
window.addWords = addWords;
window.startExercise = startExercise;
window.showStats = showStats;
window.checkAnswer = checkAnswer;
window.checkTypingAnswer = checkTypingAnswer;

// Инициализируем приложение при загрузке
document.addEventListener('DOMContentLoaded', initApp);

// ===== СИСТЕМА СОХРАНЕНИЯ ДАННЫХ =====

// Объект для статистики пользователя
let userStats = {
    userId: null,
    words: {}, // Статистика по каждому слову
    totalSessions: 0,
    totalTime: 0,
    addedWords: [], // Пользовательские слова
    lastActivity: null
};

// Инициализация статистики
function initStats() {
    // Пытаемся загрузить из localStorage
    const savedStats = localStorage.getItem('arabic_stats');
    if (savedStats) {
        userStats = JSON.parse(savedStats);
        console.log('Статистика загружена:', userStats);
    } else {
        // Создаём новую статистику
        userStats.userId = generateUserId();
        userStats.lastActivity = new Date().toISOString();
        saveStats();
    }
    
    // Инициализируем статистику для каждого слова
    words.forEach(word => {
        if (!userStats.words[word.arabic]) {
            userStats.words[word.arabic] = {
                seen: 0,
                correct: 0,
                incorrect: 0,
                lastSeen: null,
                difficulty: 1.0 // 1.0 - легко, 3.0 - сложно
            };
        }
    });
}

// Генерация ID пользователя
function generateUserId() {
    return 'user_' + Math.random().toString(36).substr(2, 9);
}

// Сохранение статистики
function saveStats() {
    userStats.lastActivity = new Date().toISOString();
    localStorage.setItem('arabic_stats', JSON.stringify(userStats));
    
    // Также пытаемся сохранить в Telegram Cloud
    saveToTelegramCloud();
    console.log('Статистика сохранена');
}

// Сохранение в Telegram Cloud (если доступно)
function saveToTelegramCloud() {
    if (window.Telegram && Telegram.WebApp) {
        const tg = Telegram.WebApp;
        const cloudData = {
            userId: tg.initDataUnsafe?.user?.id || userStats.userId,
            stats: userStats
        };
        
        // Используем Cloud Storage Telegram
        tg.CloudStorage.setItem('user_stats', JSON.stringify(cloudData))
            .then(() => console.log('Данные сохранены в Telegram Cloud'))
            .catch(err => console.log('Не удалось сохранить в Cloud:', err));
    }
}

// Загрузка из Telegram Cloud
function loadFromTelegramCloud() {
    if (window.Telegram && Telegram.WebApp) {
        const tg = Telegram.WebApp;
        tg.CloudStorage.getItem('user_stats')
            .then(data => {
                if (data) {
                    const cloudStats = JSON.parse(data);
                    if (cloudStats.userId === tg.initDataUnsafe?.user?.id) {
                        userStats = cloudStats.stats;
                        console.log('Данные загружены из Telegram Cloud');
                    }
                }
            })
            .catch(err => console.log('Не удалось загрузить из Cloud:', err));
    }
}

// Обновлённая функция checkAnswer
function checkAnswer(selected, correct, arabicWord) {
    const wordKey = arabicWord; // Используем арабское слово как ключ
    
    // Обновляем статистику слова
    if (!userStats.words[wordKey]) {
        userStats.words[wordKey] = {
            seen: 0,
            correct: 0,
            incorrect: 0,
            lastSeen: new Date().toISOString(),
            difficulty: 2.0
        };
    }
    
    userStats.words[wordKey].seen++;
    userStats.words[wordKey].lastSeen = new Date().toISOString();
    
    const buttons = document.querySelectorAll('#exercises-tab .buttons button');
    
    buttons.forEach(btn => {
        btn.disabled = true;
        const btnText = btn.textContent.split('. ')[1];
        
        if (btnText === correct) {
            btn.style.background = '#00b894';
            if (selected === correct) {
                // Правильный ответ
                userStats.words[wordKey].correct++;
                // Уменьшаем сложность слова
                userStats.words[wordKey].difficulty = Math.max(0.5, userStats.words[wordKey].difficulty * 0.9);
            }
        } else if (btnText === selected) {
            btn.style.background = '#d63031';
            // Неправильный ответ
            userStats.words[wordKey].incorrect++;
            // Увеличиваем сложность слова
            userStats.words[wordKey].difficulty = Math.min(3.0, userStats.words[wordKey].difficulty * 1.2);
            
            // Добавляем в список "проблемных" слов
            addToProblemWords(wordKey);
        }
    });
    
    // Сохраняем статистику
    saveStats();
    
    if (selected === correct) {
        showTelegramAlert('✅ Правильно! Отличная работа!');
        
        if (window.Telegram && Telegram.WebApp) {
            Telegram.WebApp.HapticFeedback.notificationOccurred('success');
        }
        
        setTimeout(() => {
            startMultipleChoice();
        }, 2000);
    } else {
        showTelegramAlert(`❌ Неправильно. Правильный ответ: ${correct}`);
        
        if (window.Telegram && Telegram.WebApp) {
            Telegram.WebApp.HapticFeedback.notificationOccurred('error');
        }
        
        setTimeout(() => {
            startMultipleChoice();
        }, 2000);
    }
}

// Функция для добавления слова в "проблемные"
function addToProblemWords(arabicWord) {
    if (!userStats.problemWords) {
        userStats.problemWords = [];
    }
    
    const word = words.find(w => w.arabic === arabicWord);
    if (word && !userStats.problemWords.includes(arabicWord)) {
        userStats.problemWords.push(arabicWord);
        
        // Показываем уведомление
        showTelegramAlert(`⚠️ Слово "${word.translation}" добавлено в сложные`);
        
        // Можно также показать кнопку для повторения сложных слов
        updateProblemWordsButton();
    }
}

// Обновляем кнопку для сложных слов
function updateProblemWordsButton() {
    const problemCount = userStats.problemWords ? userStats.problemWords.length : 0;
    
    let problemBtn = document.getElementById('problem-words-btn');
    if (!problemBtn) {
        // Создаём кнопку если её нет
        const exercisesTab = document.getElementById('exercises-tab');
        if (exercisesTab) {
            exercisesTab.innerHTML += `
                <button id="problem-words-btn" onclick="showProblemWords()" 
                        style="background: #e17055; margin-top: 10px;">
                    ⚠️ Сложные слова (${problemCount})
                </button>
            `;
        }
    } else {
        problemBtn.innerHTML = `⚠️ Сложные слова (${problemCount})`;
    }
}

// Обновлённая функция addWords
function addWords() {
    const textarea = document.getElementById('new-words');
    if (!textarea) return;
    
    const text = textarea.value.trim();
    if (!text) {
        showTelegramAlert('Введите слова для добавления');
        return;
    }
    
    const lines = text.split('\n');
    let addedCount = 0;
    const newWords = [];
    
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
                    const newWord = {
                        arabic: arabic,
                        translation: translation,
                        learned: false
                    };
                    
                    words.push(newWord);
                    
                    // Добавляем в статистику
                    userStats.words[arabic] = {
                        seen: 0,
                        correct: 0,
                        incorrect: 0,
                        lastSeen: null,
                        difficulty: 2.0,
                        custom: true // Помечаем как пользовательское слово
                    };
                    
                    // Сохраняем в список добавленных слов
                    if (!userStats.addedWords) {
                        userStats.addedWords = [];
                    }
                    userStats.addedWords.push({
                        arabic: arabic,
                        translation: translation,
                        dateAdded: new Date().toISOString()
                    });
                    
                    newWords.push(newWord);
                    addedCount++;
                }
            }
        }
    });
    
    if (addedCount > 0) {
        saveWords(); // Сохраняем слова
        saveStats(); // Сохраняем статистику
        
        // Показываем уведомление
        showTelegramAlert(`✅ Добавлено ${addedCount} новых слов!`);
        
        // Показываем список добавленных слов
        if (newWords.length > 0) {
            showAddedWordsPreview(newWords);
        }
        
        // Очищаем поле
        textarea.value = '';
        
        // Возвращаемся к карточкам
        showTab('cards');
        
        // Отправляем статистику в Telegram (опционально)
        if (window.Telegram && Telegram.WebApp) {
            Telegram.WebApp.HapticFeedback.impactOccurred('medium');
        }
    } else {
        showTelegramAlert('Не удалось добавить слова. Проверьте формат.');
    }
}

// Показ предпросмотра добавленных слов
function showAddedWordsPreview(newWords) {
    const previewHTML = newWords.map(word => `
        <div style="padding: 10px; margin: 5px 0; background: #00b89420; border-radius: 8px;">
            <strong>${word.arabic}</strong> - ${word.translation}
        </div>
    `).join('');
    
    // Создаём временное уведомление
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 80px;
        left: 50%;
        transform: translateX(-50%);
        background: white;
        color: #2d3436;
        padding: 20px;
        border-radius: 12px;
        z-index: 10000;
        max-width: 90%;
        box-shadow: 0 5px 25px rgba(0,0,0,0.2);
        border: 2px solid #00b894;
    `;
    
    notification.innerHTML = `
        <h3 style="margin-top: 0; color: #00b894;">🎉 Новые слова добавлены!</h3>
        ${previewHTML}
        <button onclick="this.parentElement.remove()" 
                style="margin-top: 15px; padding: 8px 16px; background: #00b894; color: white; border: none; border-radius: 6px;">
            Закрыть
        </button>
    `;
    
    document.body.appendChild(notification);
    
    // Автоматически скрыть через 10 секунд
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 10000);
}

// Показ проблемных слов
function showProblemWords() {
    if (!userStats.problemWords || userStats.problemWords.length === 0) {
        showTelegramAlert('У вас пока нет сложных слов!');
        return;
    }
    
    // Создаём модальное окно
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
    
    const problemWordsList = userStats.problemWords.map(arabic => {
        const word = words.find(w => w.arabic === arabic);
        const stats = userStats.words[arabic] || {};
        return word ? `
            <div class="problem-word-item" style="
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
                <div style="text-align: right;">
                    <div style="font-size: 12px; color: #d63031;">
                        ❌ ${stats.incorrect || 0} ошибок
                    </div>
                    <button onclick="practiceWord('${word.arabic}')" 
                            style="padding: 6px 12px; background: #e17055; color: white; border: none; border-radius: 6px; font-size: 12px;">
                        Повторить
                    </button>
                </div>
            </div>
        ` : '';
    }).join('');
    
    modal.innerHTML = `
        <div style="
            background: white;
            border-radius: 16px;
            padding: 25px;
            max-width: 500px;
            width: 100%;
            max-height: 80vh;
            overflow-y: auto;
        ">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h2 style="margin: 0; color: #e17055;">⚠️ Сложные слова</h2>
                <button onclick="this.parentElement.parentElement.parentElement.remove()" 
                        style="background: none; border: none; font-size: 24px; cursor: pointer; color: #999;">
                    ×
                </button>
            </div>
            
            <p style="color: #636e72; margin-bottom: 20px;">
                Эти слова вызывают у вас трудности. Рекомендуем повторить их.
            </p>
            
            <div id="problem-words-list">
                ${problemWordsList}
            </div>
            
            <div style="margin-top: 20px; display: flex; gap: 10px;">
                <button onclick="startProblemWordsExercise()" 
                        style="flex: 1; padding: 12px; background: #e17055; color: white; border: none; border-radius: 8px;">
                    🧪 Тренировать все
                </button>
                <button onclick="clearProblemWords()" 
                        style="padding: 12px; background: #636e72; color: white; border: none; border-radius: 8px;">
                    Очистить список
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// Тренировка конкретного слова
function practiceWord(arabicWord) {
    const word = words.find(w => w.arabic === arabicWord);
    if (!word) return;
    
    showTab('exercises');
    
    // Создаём специальное упражнение для этого слова
    const exercisesTab = document.getElementById('exercises-tab');
    exercisesTab.innerHTML = `
        <div class="card">
            <h2>📝 Тренировка слова</h2>
            
            <div style="text-align: center; margin: 30px 0;">
                <div style="font-size: 48px; font-family: 'Noto Sans Arabic';">${word.arabic}</div>
                <div style="font-size: 24px; color: #636e72; margin-top: 10px;">${word.translation}</div>
            </div>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 12px; margin: 20px 0;">
                <h4>Статистика:</h4>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 10px;">
                    <div>👁️ Просмотрено: <strong>${userStats.words[arabicWord]?.seen || 0}</strong></div>
                    <div>✅ Правильно: <strong>${userStats.words[arabicWord]?.correct || 0}</strong></div>
                    <div>❌ Ошибок: <strong style="color: #d63031;">${userStats.words[arabicWord]?.incorrect || 0}</strong></div>
                    <div>⚡ Сложность: <strong>${(userStats.words[arabicWord]?.difficulty || 1.0).toFixed(1)}</strong></div>
                </div>
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

// ===== СИСТЕМА НАВИГАЦИИ =====

// Текущий экран приложения
let currentScreen = 'cards'; // cards, add, exercises, game

// Инициализация навигации Telegram
function initTelegramNavigation() {
    if (window.Telegram && Telegram.WebApp) {
        const tg = Telegram.WebApp;
        
        // Настройка кнопки "Назад"
        tg.BackButton.onClick(() => {
            handleBackButton();
        });
        
        // Скрываем кнопку по умолчанию
        tg.BackButton.hide();
        
        console.log('Навигация Telegram инициализирована');
    }
}

// Обработка нажатия кнопки "Назад"
function handleBackButton() {
    console.log('Нажата кнопка "Назад", текущий экран:', currentScreen);
    
    switch (currentScreen) {
        case 'cards':
        case 'add':
            // Если мы на главных вкладках, скрываем кнопку
            if (window.Telegram && Telegram.WebApp) {
                Telegram.WebApp.BackButton.hide();
            }
            // Можно закрыть приложение или ничего не делать
            break;
            
        case 'exercises':
            // В упражнениях - возвращаемся к выбору типа упражнений
            showExerciseSelection();
            updateBackButton('exercises');
            break;
            
        case 'game':
            // В игре - возвращаемся к упражнениям
            showTab('exercises');
            updateBackButton('exercises');
            break;
            
        case 'problem-words':
            // В сложных словах - возвращаемся к упражнениям
            showTab('exercises');
            updateBackButton('exercises');
            break;
            
        default:
            // По умолчанию показываем карточки
            showTab('cards');
            updateBackButton('cards');
    }
}

// Обновление состояния кнопки "Назад"
function updateBackButton(screen) {
    currentScreen = screen;
    
    if (window.Telegram && Telegram.WebApp) {
        const tg = Telegram.WebApp;
        
        // Показываем кнопку "Назад" только когда нужно
        if (screen === 'exercises' || screen === 'game' || screen === 'problem-words') {
            tg.BackButton.show();
        } else {
            tg.BackButton.hide();
        }
        
        // Меняем цвет кнопки под тему
        tg.BackButton.setParams({
            color: tg.themeParams.button_color || '#6c5ce7'
        });
    }
}


// Обновлённая функция showTab
function showTab(tabName) {
    // Скрываем все вкладки
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Убираем активный класс у всех кнопок
    document.querySelectorAll('.tab').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Показываем выбранную вкладку
    document.getElementById(`${tabName}-tab`).classList.add('active');
    
    // Активируем кнопку
    document.querySelector(`.tab[onclick="showTab('${tabName}')"]`).classList.add('active');
    
    // Обновляем навигацию
    updateBackButton(tabName);
    
    // Если переключаемся на упражнения, показываем выбор упражнений
    if (tabName === 'exercises') {
        showExerciseSelection();
    }
}

// Показ выбора упражнений (вместо самого упражнения)
function showExerciseSelection() {
    const exercisesTab = document.getElementById('exercises-tab');
    
    exercisesTab.innerHTML = `
        <div class="card">
            <h1>🧪 Упражнения</h1>
            
            <div style="margin: 25px 0;">
                <p style="opacity: 0.8; margin-bottom: 20px;">Выберите тип упражнения:</p>
                
                <div class="buttons">
                    <button onclick="startGame('multiple-choice')" style="background: #fd79a8;">
                        ❓ Выбор ответа
                    </button>
                    
                    <button onclick="startGame('typing')" style="background: #74b9ff;">
                        ⌨️ Написание
                    </button>
                    
                    <button onclick="showStats()" style="background: #a29bfe;">
                        📊 Статистика
                    </button>
                    
                    ${userStats.problemWords && userStats.problemWords.length > 0 ? `
                        <button onclick="showProblemWords()" style="background: #e17055;">
                            ⚠️ Сложные слова (${userStats.problemWords.length})
                        </button>
                    ` : ''}
                </div>
                
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #dfe6e9;">
                    <h3>📈 Ваш прогресс</h3>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 15px;">
                        <div style="text-align: center;">
                            <div style="font-size: 24px; color: #00b894;">${getTotalCorrectAnswers()}</div>
                            <div style="font-size: 12px; color: #636e72;">Правильных ответов</div>
                        </div>
                        <div style="text-align: center;">
                            <div style="font-size: 24px; color: #d63031;">${getTotalIncorrectAnswers()}</div>
                            <div style="font-size: 12px; color: #636e72;">Ошибок</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    updateBackButton('exercises');
}

// Запуск игры (упражнения)
function startGame(gameType) {
    currentScreen = 'game';
    
    if (gameType === 'multiple-choice') {
        startMultipleChoice();
    } else if (gameType === 'typing') {
        startTypingExercise();
    }
    
    updateBackButton('game');
}

// Обновлённая startMultipleChoice
function startMultipleChoice() {
    // Выбираем случайное слово, учитывая сложность
    const word = getWeightedRandomWord();
    const wrongWords = getRandomWords(3, [word]);
    
    const allOptions = shuffleArray([word, ...wrongWords]);
    
    const exercisesTab = document.getElementById('exercises-tab');
    exercisesTab.innerHTML = `
        <div class="card">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h2 style="margin: 0;">❓ Выбери правильный перевод</h2>
                <button onclick="showExerciseSelection()" style="
                    background: none; border: none; color: #636e72; font-size: 24px; cursor: pointer;">
                    ←
                </button>
            </div>
            
            <div class="exercise-question">
                ${word.arabic}
            </div>
            
            <p>Выберите правильный перевод:</p>
            
            <div class="exercise-options">
                ${allOptions.map(option => `
                    <button class="option-button" onclick="checkAnswer('${option.translation}', '${word.translation}', '${word.arabic}')">
                        ${option.translation}
                    </button>
                `).join('')}
            </div>
            
            <div style="margin-top: 30px; text-align: center;">
                <button onclick="showExerciseSelection()" style="
                    background: #636e72; color: white; border: none; padding: 12px 24px; 
                    border-radius: 8px; cursor: pointer;">
                    ← Вернуться к выбору
                </button>
            </div>
            
            <div id="feedback" style="display: none;"></div>
        </div>
    `;
}

// Получение слова с учётом весов (сложные слова появляются чаще)
function getWeightedRandomWord() {
    if (!userStats.problemWords || userStats.problemWords.length === 0) {
        // Если нет сложных слов, берём случайное
        return words[Math.floor(Math.random() * words.length)];
    }
    
    // 50% шанс получить сложное слово
    if (Math.random() < 0.5) {
        const problemArabic = userStats.problemWords[
            Math.floor(Math.random() * userStats.problemWords.length)
        ];
        return words.find(w => w.arabic === problemArabic) || 
               words[Math.floor(Math.random() * words.length)];
    } else {
        return words[Math.floor(Math.random() * words.length)];
    }
}

// Получение общего количества правильных ответов
function getTotalCorrectAnswers() {
    let total = 0;
    Object.values(userStats.words).forEach(wordStats => {
        total += wordStats.correct || 0;
    });
    return total;
}

// Получение общего количества ошибок
function getTotalIncorrectAnswers() {
    let total = 0;
    Object.values(userStats.words).forEach(wordStats => {
        total += wordStats.incorrect || 0;
    });
    return total;
}

// Очистка списка проблемных слов
function clearProblemWords() {
    if (confirm('Вы уверены, что хотите очистить список сложных слов?')) {
        userStats.problemWords = [];
        saveStats();
        showTelegramAlert('Список сложных слов очищен!');
        
        // Закрываем модальное окно если оно открыто
        const modal = document.querySelector('[style*="position: fixed"][style*="background: rgba"]');
        if (modal) modal.remove();
        
        // Обновляем кнопку
        updateProblemWordsButton();
    }
}

// Обновлённый DOMContentLoaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('Приложение загружено');
    
    // Инициализация статистики
    initStats();
    
    // Инициализация навигации Telegram
    initTelegramNavigation();
    
    // Загружаем слова
    loadWords();
    
    // Устанавливаем общее количество слов
    totalWords = words.length;
    updateCounter();
    
    // Показываем первое слово
    updateWord();
    
    // Обновляем кнопку сложных слов
    if (userStats.problemWords && userStats.problemWords.length > 0) {
        updateProblemWordsButton();
    }
    
    // Инициализация Telegram
    if (window.Telegram && Telegram.WebApp) {
        const tg = Telegram.WebApp;
        tg.ready();
        tg.expand();
        
        console.log('Telegram Mini App инициализирован');
        console.log('Пользователь:', tg.initDataUnsafe?.user);
        
        // Загружаем данные из Telegram Cloud
        loadFromTelegramCloud();
    }
});

