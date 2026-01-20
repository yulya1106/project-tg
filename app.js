// ===== ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ =====
let words = [
    { arabic: "مرحبا", translation: "Привет", learned: false, problem: false, list: "main", audio: null },
    { arabic: "شكرا", translation: "Спасибо", learned: false, problem: false, list: "main", audio: null },
    { arabic: "كتاب", translation: "Книга", learned: false, problem: false, list: "main", audio: null },
    { arabic: "قلم", translation: "Ручка", learned: false, problem: false, list: "main", audio: null },
    { arabic: "ماء", translation: "Вода", learned: false, problem: false, list: "main", audio: null }
];

let wordLists = [
    { id: "main", name: "Основной список", description: "Основные слова", wordCount: 5 }
];

let currentIndex = 0;
let currentTab = 'cards';
let currentFilter = 'all';
let selectedList = 'all';
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
    updateFileSelect();
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
    
    // Выбор файла
    document.getElementById('file-select')?.addEventListener('change', function() {
        selectedList = this.value;
        updateWord();
        updateCounter();
        updateProgress();
    });
    
    // Списки слов
    document.getElementById('create-list-btn')?.addEventListener('click', showCreateListModal);
    document.getElementById('view-all-words-btn')?.addEventListener('click', viewAllWords);
    document.getElementById('export-words-btn')?.addEventListener('click', exportWords);
    
    // Модальное окно списка
    document.getElementById('save-list-btn')?.addEventListener('click', saveList);
    document.getElementById('cancel-list-btn')?.addEventListener('click', hideCreateListModal);
    
    // PDF
    document.getElementById('pdf-input')?.addEventListener('change', handlePDFUpload);
    document.getElementById('add-from-pdf-btn')?.addEventListener('click', addWordsFromPDF);
    document.getElementById('clear-pdf-btn')?.addEventListener('click', clearPDF);
    
    // Добавление слов
    document.getElementById('add-words-btn')?.addEventListener('click', addWords);
    
    // Упражнения
    document.getElementById('multiple-choice-btn')?.addEventListener('click', () => startExercise('multiple-choice'));
    document.getElementById('typing-btn')?.addEventListener('click', () => startExercise('typing'));
    document.getElementById('listening-btn')?.addEventListener('click', () => startExercise('listening'));
    document.getElementById('stats-btn')?.addEventListener('click', showStats);
}

// ===== УПРАВЛЕНИЕ ВКЛАДКАМИ =====
function showTab(tabName) {
    currentTab = tabName;
    
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.toggle('active', tab.getAttribute('data-tab') === tabName);
    });
    
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.toggle('active', content.id === `${tabName}-tab`);
    });
    
    updateTelegramBackButton();
    
    if (tabName === 'lists') {
        renderWordList();
    }
}

// ===== РАБОТА СО СЛОВАМИ =====
function getFilteredWords() {
    let filtered = words;
    
    if (selectedList !== 'all') {
        filtered = filtered.filter(word => word.list === selectedList);
    }
    
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
    
    if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(word.arabic);
        utterance.lang = 'ar-SA';
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
        utterance.lang = 'ru-RU';
        utterance.rate = 0.8;
        
        speechSynthesis.speak(utterance);
    } else {
        showAlert('Ваш браузер не поддерживает синтез речи');
    }
}

// ===== СПИСКИ СЛОВ =====
function renderWordLists() {
    const select = document.getElementById('add-to-list');
    const fileSelect = document.getElementById('file-select');
    
    while (select.options.length > 1) select.remove(1);
    while (fileSelect.options.length > 1) fileSelect.remove(1);
    
    wordLists.forEach(list => {
        if (list.id !== 'main') {
            const option = document.createElement('option');
            option.value = list.id;
            option.textContent = list.name;
            select.appendChild(option);
            
            const fileOption = document.createElement('option');
            fileOption.value = list.id;
            fileOption.textContent = list.name;
            fileSelect.appendChild(fileOption);
        }
    });
}

function renderWordList() {
    const container = document.getElementById('words-list');
    container.innerHTML = '';
    
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
    renderWordLists();
    hideCreateListModal();
    showAlert(`✅ Список "${name}" создан`);
}

function deleteList(listId) {
    if (listId === 'main') {
        showAlert('Основной список нельзя удалить');
        return;
    }
    
    if (confirm('Удалить этот список? Слова из него перейдут в основной список.')) {
        words.forEach(word => {
            if (word.list === listId) {
                word.list = 'main';
            }
        });
        
        wordLists = wordLists.filter(list => list.id !== listId);
        
        saveWords();
        saveLists();
        renderWordLists();
        renderWordList();
        updateFileSelect();
        showAlert('✅ Список удален');
    }
}

function viewAllWords() {
    const allWords = words;
    const container = document.getElementById('words-list');
    container.innerHTML = '<h3>Все слова</h3>';
    
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
    const dataStr = JSON.stringify({
        words: words,
        lists: wordLists,
        stats: userStats
    }, null, 2);
    
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `arabic-words-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    showAlert('✅ Слова экспортированы в JSON файл');
}

// ===== PDF ОБРАБОТКА =====
async function handlePDFUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    if (file.type !== 'application/pdf') {
        showAlert('Пожалуйста, загрузите PDF файл');
        return;
    }
    
    document.getElementById('pdf-processing').style.display = 'block';
    document.getElementById('pdf-results').style.display = 'none';
    
    try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const totalPages = pdf.numPages;
        
        let extractedText = '';
        
        for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
            document.getElementById('pdf-progress').style.width = `${(pageNum / totalPages) * 100}%`;
            
            const page = await pdf.getPage(pageNum);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map(item => item.str).join(' ');
            
            extractedText += `=== Страница ${pageNum} ===\n${pageText}\n\n`;
        }
        
        document.getElementById('pdf-processing').style.display = 'none';
        document.getElementById('pdf-results').style.display = 'block';
        
        const parsedWords = parsePDFText(extractedText);
        
        localStorage.setItem('last_pdf_words', JSON.stringify(parsedWords));
        localStorage.setItem('last_pdf_filename', file.name);
        
        showPDFPreview(parsedWords, file.name);
        
        showAlert(`✅ PDF обработан. Найдено ${parsedWords.length} слов`);
        
    } catch (error) {
        console.error('Ошибка обработки PDF:', error);
        showAlert('❌ Ошибка обработки PDF. Убедитесь, что файл содержит текст.');
        document.getElementById('pdf-processing').style.display = 'none';
    }
}

function parsePDFText(text) {
    const lines = text.split('\n');
    const words = [];
    
    lines.forEach(line => {
        const cleanLine = line.trim();
        if (!cleanLine || cleanLine.startsWith('===')) return;
        
        const separators = [' - ', ': ', ' — ', ' = '];
        let arabic = '';
        let translation = '';
        
        for (const sep of separators) {
            if (cleanLine.includes(sep)) {
                const parts = cleanLine.split(sep);
                if (parts.length >= 2) {
                    arabic = parts[0].trim();
                    translation = parts[1].trim();
                    break;
                }
            }
        }
        
        if (arabic && translation) {
            const arabicRegex = /[\u0600-\u06FF]/;
            if (arabicRegex.test(arabic)) {
                words.push({
                    arabic: arabic,
                    translation: translation,
                    source: 'pdf'
                });
            }
        }
    });
    
    return words;
}

function showPDFPreview(words, filename) {
    const container = document.getElementById('pdf-preview');
    container.innerHTML = `<h3>${filename} (${words.length} слов)</h3>`;
    
    words.forEach((word, index) => {
        const wordDiv = document.createElement('div');
        wordDiv.style.cssText = 'padding: 10px; margin: 5px 0; background: rgba(0,0,0,0.05); border-radius: 8px;';
        wordDiv.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div style="text-align: right; flex: 1;">
                    <div style="font-family: 'Noto Sans Arabic'; font-size: 20px;">${word.arabic}</div>
                    <div style="opacity: 0.7;">${word.translation}</div>
                </div>
                <div>
                    <input type="checkbox" id="pdf-word-${index}" checked style="transform: scale(1.5);">
                </div>
            </div>
        `;
        container.appendChild(wordDiv);
    });
}

function addWordsFromPDF() {
    const savedWords = JSON.parse(localStorage.getItem('last_pdf_words') || '[]');
    const listId = document.getElementById('add-to-list').value;
    let addedCount = 0;
    
    savedWords.forEach((word, index) => {
        const checkbox = document.getElementById(`pdf-word-${index}`);
        if (checkbox && checkbox.checked) {
            const exists = words.some(w => w.arabic === word.arabic && w.translation === word.translation);
            if (!exists) {
                words.push({
                    arabic: word.arabic,
                    translation: word.translation,
                    learned: false,
                    problem: false,
                    list: listId,
                    audio: null,
                    source: 'pdf'
                });
                addedCount++;
            }
        }
    });
    
    if (addedCount > 0) {
        saveWords();
        updateCounter();
        updateProgress();
        updateFileSelect();
        showAlert(`✅ Добавлено ${addedCount} слов из PDF`);
        clearPDF();
    } else {
        showAlert('Не выбрано ни одного слова для добавления');
    }
}

function clearPDF() {
    document.getElementById('pdf-input').value = '';
    document.getElementById('pdf-results').style.display = 'none';
    localStorage.removeItem('last_pdf_words');
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
    
    lines.forEach(line => {
        const trimmed = line.trim();
        if (trimmed && trimmed.includes('-')) {
            const parts = trimmed.split('-').map(p => p.trim());
            if (parts.length >= 2) {
                const arabic = parts[0];
                const translation = parts[1];
                
                const exists = words.some(w => w.arabic === arabic && w.translation === translation);
                if (!exists) {
                    words.push({
                        arabic: arabic,
                        translation: translation,
                        learned: false,
                        problem: false,
                        list: listId,
                        audio: null
                    });
                    
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
        updateProgress();
        updateFileSelect();
        
        showAlert(`✅ Добавлено ${addedCount} новых слов!`);
        textarea.value = '';
        showTab('cards');
    } else {
        showAlert('Не удалось добавить слова. Проверьте формат.');
    }
}

// ===== УПРАЖНЕНИЯ =====
function startExercise(type) {
    if (words.length < 3) {
        showAlert('Добавьте минимум 3 слова для упражнений');
        return;
    }
    
    showTab('exercises');
    
    if (type === 'multiple-choice') {
        startMultipleChoice();
    } else if (type === 'typing') {
        startTypingExercise();
    } else if (type === 'listening') {
        startListeningExercise();
    }
}

function startMultipleChoice() {
    const filtered = getFilteredWords();
    if (filtered.length < 3) {
        showAlert('Для этого упражнения нужно минимум 3 слова в выбранном списке');
        return;
    }
    
    const correctWord = filtered[Math.floor(Math.random() * filtered.length)];
    let options = [correctWord.translation];
    
    while (options.length < 4) {
        const randomWord = filtered[Math.floor(Math.random() * filtered.length)];
        if (!options.includes(randomWord.translation)) {
            options.push(randomWord.translation);
        }
    }
    
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
    const filtered = getFilteredWords();
    if (filtered.length === 0) {
        showAlert('Нет слов для упражнения');
        return;
    }
    
    const word = filtered[Math.floor(Math.random() * filtered.length)];
    
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
    
    setTimeout(() => {
        document.getElementById('typing-answer')?.focus();
    }, 100);
}

function startListeningExercise() {
    const filtered = getFilteredWords();
    if (filtered.length === 0) {
        showAlert('Нет слов для упражнения');
        return;
    }
    
    const word = filtered[Math.floor(Math.random() * filtered.length)];
    let options = [word.arabic];
    
    while (options.length < 4) {
        const randomWord = filtered[Math.floor(Math.random() * filtered.length)];
        if (!options.includes(randomWord.arabic)) {
            options.push(randomWord.arabic);
        }
    }
    
    options = shuffleArray(options);
    
    const exercisesTab = document.getElementById('exercises-tab');
    exercisesTab.innerHTML = `
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
            
            <button id="back-to-exercises-listening" style="background: #636e72; margin-top: 20px;">
                ← Назад к упражнениям
            </button>
        </div>
    `;
    
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
    
    document.getElementById('back-to-exercises-listening').addEventListener('click', () => showTab('exercises'));
    
    setTimeout(() => {
        playWord(word.arabic);
    }, 1000);
}

function checkAnswer(selected, correct, arabicWord) {
    const buttons = document.querySelectorAll('.exercise-option');
    
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

function checkListeningAnswer(selected, correct) {
    const buttons = document.querySelectorAll('.listening-option');
    
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
        setTimeout(() => startListeningExercise(), 2000);
    } else {
        showAlert('❌ Неправильно. Попробуйте еще раз!');
        setTimeout(() => startListeningExercise(), 2000);
    }
}

// ===== СТАТИСТИКА =====
function showStats() {
    const filtered = getFilteredWords();
    const learned = filtered.filter(w => w.learned).length;
    const total = filtered.length;
    const percentage = total > 0 ? Math.round((learned / total) * 100) : 0;
    
    const problem = filtered.filter(w => w.problem).length;
    
    const listStats = {};
    wordLists.forEach(list => {
        const listWords = words.filter(word => word.list === list.id);
        listStats[list.name] = {
            total: listWords.length,
            learned: listWords.filter(w => w.learned).length,
            problem: listWords.filter(w => w.problem).length
        };
    });
    
    const exercisesTab = document.getElementById('exercises-tab');
    exercisesTab.innerHTML = `
        <div class="card">
            <h2>📊 Твоя статистика</h2>
            
            <div style="margin: 30px 0;">
                <div style="display: flex; justify-content: space-between; margin: 15px 0;">
                    <span>Всего слов в выбранном списке:</span>
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
            </div>
            
            <button id="back-to-stats" style="background: #636e72;">
                ← Назад к упражнениям
            </button>
        </div>
    `;
    
    document.getElementById('back-to-stats').addEventListener('click', () => showTab('exercises'));
}

// ===== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ =====
function updateFileSelect() {
    const select = document.getElementById('file-select');
    const currentValue = select.value;
    
    select.innerHTML = '<option value="all">Все слова</option>';
    
    wordLists.forEach(list => {
        const listWords = words.filter(word => word.list === list.id);
        if (listWords.length > 0) {
            const option = document.createElement('option');
            option.value = list.id;
            option.textContent = `${list.name} (${listWords.length})`;
            select.appendChild(option);
        }
    });
    
    const optionExists = Array.from(select.options).some(opt => opt.value === currentValue);
    if (optionExists) {
        select.value = currentValue;
    } else {
        select.value = 'all';
        selectedList = 'all';
    }
}

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
        
        tg.ready();
        tg.expand();
        
        applyTelegramTheme(tg);
        tg.onEvent('themeChanged', () => applyTelegramTheme(tg));
        
        tg.BackButton.onClick(() => {
            handleTelegramBackButton();
        });
        
        console.log('Telegram Mini App инициализирован');
    } else {
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
        
        if (currentTab !== 'cards') {
            tg.BackButton.show();
        } else {
            tg.BackButton.hide();
        }
    } else {
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

function showAlert(message) {
    if (typeof Telegram !== 'undefined' && Telegram.WebApp) {
        Telegram.WebApp.showAlert(message);
        return;
    }
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
        
        if (!userStats.problemWords) userStats.problemWords = [];
        if (!userStats.problemWords.includes(arabicWord)) {
            userStats.problemWords.push(arabicWord);
            
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
window.practiceWord = function(arabicWord) {
    const word = words.find(w => w.arabic === arabicWord);
    if (!word) return;
    
    const filtered = getFilteredWords();
    const wordIndex = filtered.findIndex(w => w.arabic === arabicWord);
    
    if (wordIndex !== -1) {
        currentIndex = wordIndex;
        showTab('cards');
        updateWord();
    } else {
        showAlert('Слово не найдено в текущем фильтре');
    }
};

// ===== ЗАПУСК ПРИЛОЖЕНИЯ =====
document.addEventListener('DOMContentLoaded', initApp);