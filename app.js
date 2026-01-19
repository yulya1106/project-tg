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