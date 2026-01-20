// ===== ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ =====
let words = [
    { arabic: "مرحبا", translation: "Привет", learned: false, problem: false, list: "main" },
    { arabic: "شكرا", translation: "Спасибо", learned: false, problem: false, list: "main" },
    { arabic: "كتاب", translation: "Книга", learned: false, problem: false, list: "main" },
    { arabic: "قلم", translation: "Ручка", learned: false, problem: false, list: "main" },
    { arabic: "ماء", translation: "Вода", learned: false, problem: false, list: "main" }
];

let wordLists = [
    { id: "main", name: "Основной список", description: "Основные слова", wordCount: 5 }
];

let currentIndex = 0;
let currentTab = 'cards';
let currentFilter = 'all';
let userStats = {
    userId: null,
    words: {},
    problemWords: [],
    addedWords: [],
    totalSessions: 0,
    lastActivity: null
};

// ===== ИНИЦИАЛИЗАЦИЯ =====
function initApp() {
    loadWords();
    loadLists();
    loadStats();
    setupEventListeners();
    updateWord();
    updateCounter();
    updateProgress();
    updateListsSelect();
    renderWordLists();
    
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
    document.getElementById('mark-learned-btn')?.addEventListener('click', toggleLearned);
    document.getElementById('mark-problem-btn')?.addEventListener('click', toggleProblem);
    document.getElementById('next-word-btn')?.addEventListener('click', nextWord);
    
    // Аудио
    document.getElementById('play-arabic')?.addEventListener('click', playArabic);
    document.getElementById('play-translation')?.addEventListener('click', playTranslation);
    
    // Фильтры
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            setFilter(this.getAttribute('data-filter'));
        });
    });
    
    // Списки слов
    document.getElementById('create-list-btn')?.addEventListener('click', showCreateListModal);
    document.getElementById('view-all-words-btn')?.addEventListener('click', viewAllWords);
    document.getElementById('export-words-btn')?.addEventListener('click', exportWords);
    document.getElementById('import-words-btn')?.addEventListener('click', showImportModal);
    
    // Модальное окно списка
    document.getElementById('save-list-btn')?.addEventListener('click', saveList);
    document.getElementById('cancel-list-btn')?.addEventListener('click', hideCreateListModal);
    
    // Импорт
    document.getElementById('import-confirm-btn')?.addEventListener('click', importWords);
    document.getElementById('import-cancel-btn')?.addEventListener('click', hideImportModal);
    
    // Добавление слов
    document.getElementById('add-words-btn')?.addEventListener('click', addWords);
    document.getElementById('clear-words-btn')?.addEventListener('click', clearWordsInput);
    
    // Упражнения
    document.getElementById('multiple-choice-btn')?.addEventListener('click', () => showExercise('multiple-choice'));
    document.getElementById('typing-btn')?.addEventListener('click', () => showExercise('typing'));
    document.getElementById('listening-btn')?.addEventListener('click', () => showExercise('listening'));
    document.getElementById('stats-btn')?.addEventListener('click', () => showExercise('stats'));
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
        showExerciseMenu();
    }
    
    // Если открываем списки, обновляем
    if (tabName === 'lists') {
        renderWordList();
    }
}

// ===== РАБОТА СО СЛОВАМИ =====
function getFilteredWords() {
    let filtered = words;
    
    // Фильтр по статусу
    if (currentFilter === 'learned') {
        filtered = filtered.filter(word => word.learned);
    } else if (currentFilter === 'unlearned') {
        filtered = filtered.filter(word => !word.learned);
    } else if (currentFilter === 'problem') {
        filtered = filtered.filter(word => word.problem);
    }
    
    return filtered;
}

function updateWord() {
    const filtered = getFilteredWords();
    if (filtered.length === 0) {
        document.getElementById('word').textContent = "Нет слов";
        document.getElementById('translation').textContent = "Добавьте слова для изучения";
        document.getElementById('translation').style.display = 'block';
        return;
    }
    
    if (currentIndex >= filtered.length) {
        currentIndex = 0;
    }
    
    const word = filtered[currentIndex];
    if (!word) return;
    
    document.getElementById('word').textContent = word.arabic;
    document.getElementById('translation').textContent = word.translation;
    document.getElementById('translation').style.display = 'none';
    
    // Подсвечиваем выученные и сложные слова
    const wordElement = document.getElementById('word');
    if (word.learned) {
        wordElement.style.color = '#00b894';
    } else if (word.problem) {
        wordElement.style.color = '#e17055';
    } else {
        wordElement.style.color = '';
    }
}

function updateCounter() {
    const filtered = getFilteredWords();
    const total = filtered.length;
    const current = total > 0 ? Math.min(currentIndex + 1, total) : 0;
    
    document.getElementById('current').textContent = current;
    document.getElementById('total').textContent = total;
}

function updateProgress() {
    const filtered = getFilteredWords();
    if (filtered.length === 0) {
        document.getElementById('progress').textContent = "0%";
        document.getElementById('progress-fill').style.width = "0%";
        return;
    }
    
    const learned = filtered.filter(word => word.learned).length;
    const percentage = Math.round((learned / filtered.length) * 100);
    
    document.getElementById('progress').textContent = `${percentage}%`;
    document.getElementById('progress-fill').style.width = `${percentage}%`;
}

function setFilter(filter) {
    currentFilter = filter;
    currentIndex = 0;
    
    // Обновляем кнопки фильтров
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-filter') === filter);
    });
    
    updateWord();
    updateCounter();
    updateProgress();
}

function showTranslation() {
    const translationElement = document.getElementById('translation');
    translationElement.style.display = 'block';
    
    // Обновляем статистику просмотра
    const word = getFilteredWords()[currentIndex];
    if (word) {
        updateWordStats(word.arabic, true);
    }
}

function toggleLearned() {
    const filtered = getFilteredWords();
    const word = filtered[currentIndex];
    if (!word) return;
    
    word.learned = !word.learned;
    if (word.learned) {
        word.problem = false;
        showAlert('✅ Слово отмечено как выученное!');
    } else {
        showAlert('📝 Слово возвращено в изучение');
    }
    
    saveWords();
    updateWord();
    updateProgress();
    renderWordList();
}

function toggleProblem() {
    const filtered = getFilteredWords();
    const word = filtered[currentIndex];
    if (!word) return;
    
    word.problem = !word.problem;
    if (word.problem) {
        word.learned = false;
        showAlert('⚠️ Слово отмечено как сложное');
    } else {
        showAlert('✅ Слово убрано из сложных');
    }
    
    saveWords();
    updateWord();
    renderWordList();
}

function nextWord() {
    const filtered = getFilteredWords();
    if (filtered.length === 0) return;
    
    currentIndex = (currentIndex + 1) % filtered.length;
    updateWord();
    updateCounter();
}

// ===== АУДИО =====
function playArabic() {
    const word = getFilteredWords()[currentIndex];
    if (!word) return;
    
    // Используем Web Speech API для синтеза речи
    if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(word.arabic);
        utterance.lang = 'ar-SA'; // Арабский (Саудовская Аравия)
        utterance.rate = 0.8;
        
        speechSynthesis.speak(utterance);
    } else {
        showAlert('Ваш браузер не поддерживает синтез речи');
    }
}

function playTranslation() {
    const word = getFilteredWords()[currentIndex];
    if (!word) return;
    
    if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(word.translation);
        utterance.lang = 'ru-RU'; // Русский
        utterance.rate = 0.8;
        
        speechSynthesis.speak(utterance);
    } else {
        showAlert('Ваш браузер не поддерживает синтез речи');
    }
}

// ===== СПИСКИ СЛОВ =====
function updateListsSelect() {
    const select = document.getElementById('add-to-list');
    
    // Очищаем, кроме первого элемента
    while (select.options.length > 1) select.remove(1);
    
    // Добавляем списки
    wordLists.forEach(list => {
        if (list.id !== 'main') {
            const option = document.createElement('option');
            option.value = list.id;
            option.textContent = list.name;
            select.appendChild(option);
        }
    });
}

function renderWordLists() {
    updateListsSelect();
}

function renderWordList() {
    const container = document.getElementById('words-list');
    container.innerHTML = '';
    
    // Группируем слова по спискам
    wordLists.forEach(list => {
        const listWords = words.filter(word => word.list === list.id);
        if (listWords.length === 0) return;
        
        const listHeader = document.createElement('div');
        listHeader.style.cssText = 'background: rgba(0,0,0,0.1); padding: 10px; border-radius: 8px; margin: 10px 0;';
        listHeader.innerHTML = `
            <h3 style="margin: 0; display: flex; justify-content: space-between;">
                <span>${list.name} (${listWords.length})</span>
                <button onclick="deleteList('${list.id}')" style="background: var(--danger-color); padding: 5px 10px; font-size: 12px;">
                    Удалить
                </button>
            </h3>
            <p style="margin: 5px 0 0; opacity: 0.7; font-size: 14px;">${list.description || 'Нет описания'}</p>
        `;
        container.appendChild(listHeader);
        
        listWords.forEach((word, index) => {
            const wordItem = document.createElement('div');
            wordItem.className = `word-item ${word.learned ? 'learned' : ''} ${word.problem ? 'problem' : ''}`;
            wordItem.innerHTML = `
                <div class="word-text">
                    <div class="word-arabic">${word.arabic}</div>
                    <div class="word-translation">${word.translation}</div>
                </div>
                <div class="word-actions">
                    <button class="action-btn audio-btn-small" onclick="playWord('${word.arabic}')">🔊</button>
                    <button class="action-btn learn-btn" onclick="toggleWordLearned('${word.arabic}')">
                        ${word.learned ? '↩️' : '✅'}
                    </button>
                    <button class="action-btn problem-btn" onclick="toggleWordProblem('${word.arabic}')">
                        ${word.problem ? '👍' : '⚠️'}
                    </button>
                </div>
            `;
            container.appendChild(wordItem);
        });
    });
}

function showCreateListModal() {
    document.getElementById('create-list-modal').classList.add('active');
}

function hideCreateListModal() {
    document.getElementById('create-list-modal').classList.remove('active');
    document.getElementById('list-name').value = '';
    document.getElementById('list-description').value = '';
}

function saveList() {
    const name = document.getElementById('list-name').value.trim();
    if (!name) {
        showAlert('Введите название списка');
        return;
    }
    
    const id = 'list_' + Date.now();
    const description = document.getElementById('list-description').value.trim();
    
    wordLists.push({
        id: id,
        name: name,
        description: description,
        wordCount: 0
    });
    
    saveLists();
    updateListsSelect();
    hideCreateListModal();
    showAlert(`✅ Список "${name}" создан`);
}

function deleteList(listId) {
    if (listId === 'main') {
        showAlert('Основной список нельзя удалить');
        return;
    }
    
    if (confirm('Удалить этот список? Слова из него перейдут в основной список.')) {
        // Перемещаем слова в основной список
        words.forEach(word => {
            if (word.list === listId) {
                word.list = 'main';
            }
        });
        
        // Удаляем список
        wordLists = wordLists.filter(list => list.id !== listId);
        
        saveWords();
        saveLists();
        updateListsSelect();
        renderWordList();
        showAlert('✅ Список удален');
    }
}

function viewAllWords() {
    const allWords = words;
    const container = document.getElementById('words-list');
    container.innerHTML = '<h3 style="margin-bottom: 15px;">Все слова</h3>';
    
    if (allWords.length === 0) {
        container.innerHTML += '<p style="opacity: 0.7;">Нет слов для отображения</p>';
        return;
    }
    
    allWords.forEach(word => {
        const wordItem = document.createElement('div');
        wordItem.className = `word-item ${word.learned ? 'learned' : ''} ${word.problem ? 'problem' : ''}`;
        wordItem.innerHTML = `
            <div class="word-text">
                <div class="word-arabic">${word.arabic}</div>
                <div class="word-translation">${word.translation}</div>
                <div style="font-size: 12px; opacity: 0.6;">${wordLists.find(l => l.id === word.list)?.name || 'Без списка'}</div>
            </div>
            <div class="word-actions">
                <button class="action-btn audio-btn-small" onclick="playWord('${word.arabic}')">🔊</button>
                <button class="action-btn learn-btn" onclick="toggleWordLearned('${word.arabic}')">
                    ${word.learned ? '↩️' : '✅'}
                </button>
            </div>
        `;
        container.appendChild(wordItem);
    });
}

function exportWords() {
    const data = {
        words: words,
        lists: wordLists,
        stats: userStats,
        exportDate: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(data, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `arabic-words-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    showAlert('✅ Слова экспортированы в JSON файл');
}

function showImportModal() {
    document.getElementById('import-modal').classList.add('active');
}

function hideImportModal() {
    document.getElementById('import-modal').classList.remove('active');
    document.getElementById('import-data').value = '';
}

function importWords() {
    const importData = document.getElementById('import-data').value.trim();
    
    if (!importData) {
        showAlert('Введите данные для импорта');
        return;
    }
    
    try {
        const data = JSON.parse(importData);
        
        if (data.words && Array.isArray(data.words)) {
            // Добавляем слова
            data.words.forEach(word => {
                // Проверяем, нет ли уже такого слова
                const exists = words.some(w => w.arabic === word.arabic && w.translation === word.translation);
                if (!exists) {
                    // Устанавливаем список по умолчанию, если не указан
                    if (!word.list) word.list = 'main';
                    words.push(word);
                }
            });
            
            // Добавляем списки
            if (data.lists && Array.isArray(data.lists)) {
                data.lists.forEach(list => {
                    const exists = wordLists.some(l => l.id === list.id);
                    if (!exists && list.id !== 'main') {
                        wordLists.push(list);
                    }
                });
            }
            
            // Обновляем статистику
            if (data.stats) {
                Object.assign(userStats, data.stats);
            }
            
            saveWords();
            saveLists();
            saveStats();
            updateListsSelect();
            updateWord();
            updateCounter();
            updateProgress();
            renderWordList();
            
            showAlert(`✅ Импортировано ${data.words.length} слов`);
            hideImportModal();
        } else {
            showAlert('❌ Неверный формат данных. Ожидается объект с массивом "words"');
        }
    } catch (error) {
        console.error('Ошибка импорта:', error);
        showAlert('❌ Ошибка при разборе JSON. Проверьте формат данных.');
    }
}

// ===== ДОБАВЛЕНИЕ СЛОВ =====
function addWords() {
    const textarea = document.getElementById('new-words');
    const text = textarea.value.trim();
    const listId = document.getElementById('add-to-list').value;
    
    if (!text) {
        showAlert('Введите слова для добавления');
        return;
    }
    
    const lines = text.split('\n');
    let addedCount = 0;
    let errors = [];
    
    lines.forEach((line, index) => {
        const trimmed = line.trim();
        if (trimmed && trimmed.includes('-')) {
            const parts = trimmed.split('-').map(p => p.trim());
            if (parts.length >= 2) {
                const arabic = parts[0];
                const translation = parts[1];
                
                if (!arabic || !translation) {
                    errors.push(`Строка ${index + 1}: пропущено слово или перевод`);
                    return;
                }
                
                // Проверяем, нет ли уже такого слова
                const exists = words.some(w => w.arabic === arabic && w.translation === translation);
                if (!exists) {
                    words.push({
                        arabic: arabic,
                        translation: translation,
                        learned: false,
                        problem: false,
                        list: listId
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
                } else {
                    errors.push(`Строка ${index + 1}: слово уже существует`);
                }
            } else {
                errors.push(`Строка ${index + 1}: неверный формат`);
            }
        } else if (trimmed) {
            errors.push(`Строка ${index + 1}: неверный формат (используйте " - " между словами)`);
        }
    });
    
    if (addedCount > 0) {
        saveWords();
        saveStats();
        updateCounter();
        updateProgress();
        updateListsSelect();
        
        let message = `✅ Добавлено ${addedCount} новых слов!`;
        if (errors.length > 0) {
            message += `\n\nОшибки:\n${errors.slice(0, 5).join('\n')}`;
            if (errors.length > 5) message += `\n... и еще ${errors.length - 5} ошибок`;
        }
        
        showAlert(message);
        textarea.value = '';
        showTab('cards');
    } else {
        let errorMessage = 'Не удалось добавить слова.';
        if (errors.length > 0) {
            errorMessage += `\n\nОшибки:\n${errors.slice(0, 5).join('\n')}`;
            if (errors.length > 5) errorMessage += `\n... и еще ${errors.length - 5} ошибок`;
        }
        showAlert(errorMessage);
    }
}

function clearWordsInput() {
    document.getElementById('new-words').value = '';
    showAlert('Поле очищено');
}

// ===== УПРАЖНЕНИЯ =====
function showExerciseMenu() {
    // Скрываем все упражнения и показываем меню
    document.querySelectorAll('.exercise-container').forEach(container => {
        container.classList.remove('active');
    });
    document.getElementById('exercises-menu').classList.add('active');
}

function showExercise(type) {
    if (words.length < 3) {
        showAlert('Добавьте минимум 3 слова для упражнений');
        return;
    }
    
    // Скрываем меню и другие упражнения
    document.querySelectorAll('.exercise-container').forEach(container => {
        container.classList.remove('active');
    });
    
    if (type === 'multiple-choice') {
        startMultipleChoice();
    } else if (type === 'typing') {
        startTypingExercise();
    } else if (type === 'listening') {
        startListeningExercise();
    } else if (type === 'stats') {
        showStats();
    }
}

function startMultipleChoice() {
    const filtered = getFilteredWords();
    if (filtered.length < 3) {
        showAlert('Для этого упражнения нужно минимум 3 слова');
        showExerciseMenu();
        return;
    }
    
    const correctWord = filtered[Math.floor(Math.random() * filtered.length)];
    let options = [correctWord.translation];
    
    // Добавляем 3 неправильных варианта
    while (options.length < 4) {
        const randomWord = filtered[Math.floor(Math.random() * filtered.length)];
        if (!options.includes(randomWord.translation)) {
            options.push(randomWord.translation);
        }
    }
    
    // Перемешиваем
    options = shuffleArray(options);
    
    const exerciseContainer = document.getElementById('exercise-multiple-choice');
    exerciseContainer.innerHTML = `
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
            
            <div class="buttons" style="margin-top: 20px;">
                <button id="back-to-exercises-mc" style="background: #636e72;">
                    ← Назад к упражнениям
                </button>
                <button id="next-mc-exercise" style="background: var(--accent-color);">
                    🔄 Следующее слово
                </button>
            </div>
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
    
    document.getElementById('back-to-exercises-mc').addEventListener('click', showExerciseMenu);
    document.getElementById('next-mc-exercise').addEventListener('click', () => showExercise('multiple-choice'));
    
    // Показываем контейнер с упражнением
    exerciseContainer.classList.add('active');
}

function startTypingExercise() {
    const filtered = getFilteredWords();
    if (filtered.length === 0) {
        showAlert('Нет слов для упражнения');
        showExerciseMenu();
        return;
    }
    
    const word = filtered[Math.floor(Math.random() * filtered.length)];
    
    const exerciseContainer = document.getElementById('exercise-typing');
    exerciseContainer.innerHTML = `
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
            
            <div class="buttons">
                <button id="check-typing-btn" style="background: var(--accent-color);">
                    ✅ Проверить
                </button>
            </div>
            
            <div style="margin-top: 15px; font-size: 14px; opacity: 0.7;">
                Подсказка: слово из ${word.translation.length} букв
            </div>
            
            <div class="buttons" style="margin-top: 20px;">
                <button id="back-to-exercises-typing" style="background: #636e72;">
                    ← Назад к упражнениям
                </button>
                <button id="next-typing-exercise" style="background: var(--accent-color);">
                    🔄 Следующее слово
                </button>
            </div>
        </div>
    `;
    
    document.getElementById('check-typing-btn').addEventListener('click', () => {
        checkTypingAnswer(word.translation);
    });
    
    document.getElementById('back-to-exercises-typing').addEventListener('click', showExerciseMenu);
    document.getElementById('next-typing-exercise').addEventListener('click', () => showExercise('typing'));
    
    // Фокус на поле ввода
    setTimeout(() => {
        document.getElementById('typing-answer')?.focus();
    }, 100);
    
    // Показываем контейнер с упражнением
    exerciseContainer.classList.add('active');
}

function startListeningExercise() {
    const filtered = getFilteredWords();
    if (filtered.length === 0) {
        showAlert('Нет слов для упражнения');
        showExerciseMenu();
        return;
    }
    
    const word = filtered[Math.floor(Math.random() * filtered.length)];
    let options = [word.arabic];
    
    // Добавляем 3 неправильных варианта
    while (options.length < 4) {
        const randomWord = filtered[Math.floor(Math.random() * filtered.length)];
        if (!options.includes(randomWord.arabic)) {
            options.push(randomWord.arabic);
        }
    }
    
    // Перемешиваем
    options = shuffleArray(options);
    
    const exerciseContainer = document.getElementById('exercise-listening');
    exerciseContainer.innerHTML = `
        <div class="card">
            <h2>👂 Аудирование</h2>
            
            <div style="margin: 30px 0;">
                <p>Прослушайте слово и выберите правильный перевод:</p>
                
                <div style="font-size: 24px; margin: 20px 0; color: var(--text-color);">
                    "${word.translation}"
                </div>
                
                <button id="play-exercise-audio" style="background: #00cec9; margin: 20px 0;">
                    🔊 Проиграть слово
                </button>
            </div>
            
            <div class="buttons">
                ${options.map((option, index) => `
                    <button class="listening-option" data-answer="${option}" data-correct="${word.arabic}"
                            style="font-family: 'Noto Sans Arabic'; font-size: 24px; text-align: right;">
                        ${String.fromCharCode(65 + index)}. ${option}
                    </button>
                `).join('')}
            </div>
            
            <div class="buttons" style="margin-top: 20px;">
                <button id="back-to-exercises-listening" style="background: #636e72;">
                    ← Назад к упражнениям
                </button>
                <button id="next-listening-exercise" style="background: var(--accent-color);">
                    🔄 Следующее слово
                </button>
            </div>
        </div>
    `;
    
    // Обработчики
    document.getElementById('play-exercise-audio').addEventListener('click', () => {
        playWord(word.arabic);
    });
    
    document.querySelectorAll('.listening-option').forEach(btn => {
        btn.addEventListener('click', function() {
            checkListeningAnswer(
                this.getAttribute('data-answer'),
                this.getAttribute('data-correct')
            );
        });
    });
    
    document.getElementById('back-to-exercises-listening').addEventListener('click', showExerciseMenu);
    document.getElementById('next-listening-exercise').addEventListener('click', () => showExercise('listening'));
    
    // Автоматически проигрываем слово через секунду
    setTimeout(() => {
        playWord(word.arabic);
    }, 1000);
    
    // Показываем контейнер с упражнением
    exerciseContainer.classList.add('active');
}

function showStats() {
    const filtered = getFilteredWords();
    const learned = filtered.filter(w => w.learned).length;
    const total = filtered.length;
    const percentage = total > 0 ? Math.round((learned / total) * 100) : 0;
    
    // Считаем сложные слова
    const problem = filtered.filter(w => w.problem).length;
    
    // Считаем слова по спискам
    const listStats = {};
    wordLists.forEach(list => {
        const listWords = words.filter(word => word.list === list.id);
        if (listWords.length > 0) {
            listStats[list.name] = {
                total: listWords.length,
                learned: listWords.filter(w => w.learned).length,
                problem: listWords.filter(w => w.problem).length
            };
        }
    });
    
    const exerciseContainer = document.getElementById('exercise-stats');
    exerciseContainer.innerHTML = `
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
                    <span>Сложные слова:</span>
                    <strong style="color: #e17055;">${problem}</strong>
                </div>
                
                <div style="display: flex; justify-content: space-between; margin: 15px 0;">
                    <span>Прогресс:</span>
                    <strong>${percentage}%</strong>
                </div>
                
                <div style="margin: 25px 0; height: 10px; background: rgba(0,0,0,0.1); border-radius: 5px; overflow: hidden;">
                    <div style="height: 100%; width: ${percentage}%; background: #00b894; transition: width 0.5s;"></div>
                </div>
                
                ${Object.keys(listStats).length > 0 ? `
                    <h3 style="margin-top: 30px;">По спискам:</h3>
                    ${Object.entries(listStats).map(([listName, stats]) => `
                        <div style="background: rgba(0,0,0,0.05); padding: 10px; border-radius: 8px; margin: 10px 0;">
                            <div style="font-weight: bold;">${listName}</div>
                            <div style="display: flex; justify-content: space-between; font-size: 14px;">
                                <span>Всего: ${stats.total}</span>
                                <span style="color: #00b894;">Выучено: ${stats.learned}</span>
                                <span style="color: #e17055;">Сложные: ${stats.problem}</span>
                            </div>
                        </div>
                    `).join('')}
                ` : ''}
            </div>
            
            <div class="buttons">
                <button id="back-to-exercises-stats" style="background: #636e72;">
                    ← Назад к упражнениям
                </button>
                <button id="reset-stats-btn" style="background: var(--danger-color);">
                    🗑️ Сбросить статистику
                </button>
            </div>
        </div>
    `;
    
    document.getElementById('back-to-exercises-stats').addEventListener('click', showExerciseMenu);
    document.getElementById('reset-stats-btn').addEventListener('click', () => {
        if (confirm('Вы уверены, что хотите сбросить всю статистику? Это действие нельзя отменить.')) {
            userStats.words = {};
            userStats.problemWords = [];
            saveStats();
            showAlert('✅ Статистика сброшена');
            showExercise('stats');
        }
    });
    
    // Показываем контейнер со статистикой
    exerciseContainer.classList.add('active');
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
    } else {
        showAlert(`❌ Неправильно. Правильный ответ: ${correct}`);
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
    } else {
        showAlert(`❌ Не совсем. Правильно: ${correct}`);
        input.style.borderColor = '#d63031';
    }
}

function checkListeningAnswer(selected, correct) {
    const buttons = document.querySelectorAll('.listening-option');
    
    // Обновляем статистику
    updateWordStats(correct, selected === correct);
    
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
        showAlert('✅ Правильно! Отличный слух!');
    } else {
        showAlert('❌ Неправильно. Попробуйте еще раз!');
    }
}

// ===== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ =====
function toggleWordLearned(arabic) {
    const word = words.find(w => w.arabic === arabic);
    if (word) {
        word.learned = !word.learned;
        if (word.learned) word.problem = false;
        saveWords();
        updateProgress();
        renderWordList();
        updateWord();
    }
}

function toggleWordProblem(arabic) {
    const word = words.find(w => w.arabic === arabic);
    if (word) {
        word.problem = !word.problem;
        if (word.problem) word.learned = false;
        saveWords();
        renderWordList();
        updateWord();
    }
}

function playWord(arabic) {
    const word = words.find(w => w.arabic === arabic);
    if (!word) return;
    
    if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(word.arabic);
        utterance.lang = 'ar-SA';
        utterance.rate = 0.8;
        speechSynthesis.speak(utterance);
    }
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
    if (currentTab === 'exercises') {
        // Если находимся в упражнении, возвращаемся в меню упражнений
        const isInExercise = Array.from(document.querySelectorAll('.exercise-container')).some(
            container => container.classList.contains('active') && container.id !== 'exercises-menu'
        );
        
        if (isInExercise) {
            showExerciseMenu();
        } else {
            showTab('cards');
        }
    } else if (currentTab !== 'cards') {
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
            handleTelegramBackButton();
        });
    }
    console.log('Запущено в браузере');
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

function shuffleArray(array) {
    return [...array].sort(() => Math.random() - 0.5);
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
            
            // Также помечаем слово как проблемное в основном массиве
            const word = words.find(w => w.arabic === arabicWord);
            if (word) {
                word.problem = true;
                word.learned = false;
                saveWords();
            }
        }
    }
    
    saveStats();
}

// ===== СОХРАНЕНИЕ ДАННЫХ =====
function saveWords() {
    try {
        localStorage.setItem('arabic_words', JSON.stringify(words));
        
        // Обновляем счетчики в списках
        wordLists.forEach(list => {
            list.wordCount = words.filter(word => word.list === list.id).length;
        });
        saveLists();
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

function saveLists() {
    try {
        localStorage.setItem('arabic_lists', JSON.stringify(wordLists));
    } catch (e) {
        console.error('Ошибка сохранения списков:', e);
    }
}

function loadLists() {
    try {
        const saved = localStorage.getItem('arabic_lists');
        if (saved) {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed) && parsed.length > 0) {
                wordLists = parsed;
            }
        }
    } catch (e) {
        console.error('Ошибка загрузки списков:', e);
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
            userStats.userId = 'user_' + Math.random().toString(36).substr(2, 9);
            userStats.lastActivity = new Date().toISOString();
            saveStats();
        }
    } catch (e) {
        console.error('Ошибка загрузки статистики:', e);
    }
}

// ===== ГЛОБАЛЬНЫЕ ФУНКЦИИ ДЛЯ HTML =====
window.playWord = playWord;
window.toggleWordLearned = toggleWordLearned;
window.toggleWordProblem = toggleWordProblem;
window.deleteList = deleteList;

// ===== ЗАПУСК ПРИЛОЖЕНИЯ =====
document.addEventListener('DOMContentLoaded', initApp);