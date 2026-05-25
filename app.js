// ===== GLOBAL VARIABLES =====
let words = [
    { arabic: "مرحبا", translation: "Hello", learned: false, problem: false, list: "main" },
    { arabic: "شكرا", translation: "Thanks", learned: false, problem: false, list: "main" },
    { arabic: "كتاب", translation: "Book", learned: false, problem: false, list: "main" },
    { arabic: "قلم", translation: "Pen", learned: false, problem: false, list: "main" },
    { arabic: "ماء", translation: "Water", learned: false, problem: false, list: "main" }
];

let wordLists = [
    { id: "main", name: "Main list", description: "Basic words", wordCount: 5 }
];

let currentIndex = 0;
let currentTab = 'cards';
let currentFilter = 'all';
let currentListFilter = 'all';

let userStats = {
    userId: null,
    words: {},
    problemWords: [],
    addedWords: [],
    totalSessions: 0,
    lastActivity: null
};

let currentLanguage = 'en';
const translations = {
    en: {
        appTitle: "📚 Learn Arabic",
        word: "Word",
        of: "of",
        progress: "Progress",
        showTranslation: "👁️ Show translation",
        learnedBtn: "✅ Learned",
        difficultBtn: "⚠️ Difficult",
        nextBtn: "➡️ Next word",
        playArabic: "🎵",
        playTranslation: "🔊",
        all: "All",
        learned: "Learned",
        unlearned: "Not learned",
        problem: "Difficult",
        allLists: "All lists",
        wordExists: "Word already exists",
        added: "Added",
        noWords: "No words",
        addSome: "Add words to study",
        wrongFormat: "Invalid format",
        alertDefault: "Message",
        podcastGenerated: "Podcast generated",
        podcastError: "Generation failed",
        clearCache: "🗑️ Clear cache",
        language: "🌐 Language",
        close: "Close",
        listen: "Listen",
        podcasts: "🎙️ Podcasts",
        generate: "✨ Generate new podcast",
        recentPodcasts: "📀 Recent podcasts (last 5)",
        delete: "Delete",
        play: "Play"
    },
    ru: {
        appTitle: "📚 Учим арабский",
        word: "Слово",
        of: "из",
        progress: "Прогресс",
        showTranslation: "👁️ Показать перевод",
        learnedBtn: "✅ Выучено",
        difficultBtn: "⚠️ Сложное",
        nextBtn: "➡️ Следующее слово",
        playArabic: "🎵",
        playTranslation: "🔊",
        all: "Все",
        learned: "Выученные",
        unlearned: "Не выученные",
        problem: "Сложные",
        allLists: "Все списки",
        wordExists: "Слово уже существует",
        added: "Добавлено",
        noWords: "Нет слов",
        addSome: "Добавьте слова для изучения",
        wrongFormat: "Неверный формат",
        alertDefault: "Сообщение",
        podcastGenerated: "Подкаст создан",
        podcastError: "Ошибка генерации",
        clearCache: "🗑️ Очистить кэш",
        language: "🌐 Язык",
        close: "Закрыть",
        listen: "Прослушать",
        podcasts: "🎙️ Подкасты",
        generate: "✨ Создать новый подкаст",
        recentPodcasts: "📀 Последние подкасты (5)",
        delete: "Удалить",
        play: "Воспроизвести"
    }
};

// ===== LANGUAGE FUNCTIONS =====
function setLanguage(lang) {
    currentLanguage = lang;
    localStorage.setItem('app_language', lang);
    updateUITexts();
}

function updateUITexts() {
    const t = translations[currentLanguage];
    document.getElementById('app-title') && (document.getElementById('app-title').innerText = t.appTitle);
    // update dynamic elements later
}

function chooseLanguageFirstTime() {
    const modal = document.getElementById('language-modal');
    modal.classList.add('active');
    document.getElementById('lang-english').onclick = () => {
        setLanguage('en');
        modal.classList.remove('active');
        initApp();
    };
    document.getElementById('lang-russian').onclick = () => {
        setLanguage('ru');
        modal.classList.remove('active');
        initApp();
    };
}

// ===== INIT =====
function initApp() {
    loadWords();
    loadLists();
    loadStats();
    loadLanguage();
    setupEventListeners();
    updateWord();
    updateCounter();
    updateProgress();
    updateListsSelect();
    renderWordLists();
    renderListFilters();
    renderPodcastHistory();
    initTelegram();
}

function loadLanguage() {
    const saved = localStorage.getItem('app_language');
    if (saved) {
        currentLanguage = saved;
        updateUITexts();
    } else {
        chooseLanguageFirstTime();
        return;
    }
    // already called initApp after language selection, so we don't call it again.
}

function setupEventListeners() {
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => showTab(tab.getAttribute('data-tab')));
    });
    document.getElementById('show-translation-btn')?.addEventListener('click', showTranslation);
    document.getElementById('mark-learned-btn')?.addEventListener('click', toggleLearned);
    document.getElementById('mark-problem-btn')?.addEventListener('click', toggleProblem);
    document.getElementById('next-word-btn')?.addEventListener('click', nextWord);
    document.getElementById('play-arabic')?.addEventListener('click', playArabic);
    document.getElementById('play-translation')?.addEventListener('click', playTranslation);
    
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function() { setFilter(this.getAttribute('data-filter')); });
    });
    
    document.getElementById('create-list-btn')?.addEventListener('click', showCreateListModal);
    document.getElementById('view-all-words-btn')?.addEventListener('click', viewAllWords);
    document.getElementById('export-words-btn')?.addEventListener('click', exportWords);
    document.getElementById('import-words-btn')?.addEventListener('click', showImportModal);
    document.getElementById('save-list-btn')?.addEventListener('click', saveList);
    document.getElementById('cancel-list-btn')?.addEventListener('click', hideCreateListModal);
    document.getElementById('import-confirm-btn')?.addEventListener('click', importWords);
    document.getElementById('import-cancel-btn')?.addEventListener('click', hideImportModal);
    document.getElementById('add-words-btn')?.addEventListener('click', addWords);
    document.getElementById('clear-words-btn')?.addEventListener('click', clearWordsInput);
    
    document.getElementById('multiple-choice-btn')?.addEventListener('click', () => showExercise('multiple-choice'));
    document.getElementById('typing-btn')?.addEventListener('click', () => showExercise('typing'));
    document.getElementById('listening-btn')?.addEventListener('click', () => showExercise('listening'));
    document.getElementById('stats-btn')?.addEventListener('click', () => showExercise('stats'));
    document.getElementById('generate-podcast-btn')?.addEventListener('click', generatePodcast);
    
    document.getElementById('parse-file-btn')?.addEventListener('click', parseFileAndExtractWords);
    document.getElementById('confirm-add-preview-btn')?.addEventListener('click', addSelectedPreviewWords);
    document.getElementById('cancel-preview-btn')?.addEventListener('click', () => {
        document.getElementById('preview-words-container').style.display = 'none';
    });
}

// ===== FILTERS =====
function getFilteredWords() {
    let filtered = words;
    if (currentFilter === 'learned') filtered = filtered.filter(w => w.learned);
    else if (currentFilter === 'unlearned') filtered = filtered.filter(w => !w.learned);
    else if (currentFilter === 'problem') filtered = filtered.filter(w => w.problem);
    
    if (currentListFilter !== 'all') {
        filtered = filtered.filter(w => w.list === currentListFilter);
    }
    return filtered;
}

function renderListFilters() {
    const container = document.getElementById('list-filters');
    if (!container) return;
    const t = translations[currentLanguage];
    let html = `<button class="filter-list-btn active" data-list="all">${t.allLists}</button>`;
    wordLists.forEach(list => {
        html += `<button class="filter-list-btn" data-list="${list.id}">${list.name}</button>`;
    });
    container.innerHTML = html;
    document.querySelectorAll('.filter-list-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            currentListFilter = this.getAttribute('data-list');
            currentIndex = 0;
            updateWord();
            updateCounter();
            updateProgress();
            document.querySelectorAll('.filter-list-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
        });
    });
}

function updateWord() {
    const filtered = getFilteredWords();
    if (filtered.length === 0) {
        const t = translations[currentLanguage];
        document.getElementById('word').textContent = t.noWords;
        document.getElementById('translation').textContent = t.addSome;
        document.getElementById('translation').style.display = 'block';
        return;
    }
    if (currentIndex >= filtered.length) currentIndex = 0;
    const word = filtered[currentIndex];
    if (!word) return;
    document.getElementById('word').textContent = word.arabic;
    document.getElementById('translation').textContent = word.translation;
    document.getElementById('translation').style.display = 'none';
    const wordEl = document.getElementById('word');
    if (word.learned) wordEl.style.color = '#00b894';
    else if (word.problem) wordEl.style.color = '#e17055';
    else wordEl.style.color = '';
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
    const learned = filtered.filter(w => w.learned).length;
    const percent = Math.round((learned / filtered.length) * 100);
    document.getElementById('progress').textContent = `${percent}%`;
    document.getElementById('progress-fill').style.width = `${percent}%`;
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
    document.getElementById('translation').style.display = 'block';
    // Removed updateWordStats to avoid false positive
}

function toggleLearned() {
    const word = getFilteredWords()[currentIndex];
    if (!word) return;
    word.learned = !word.learned;
    if (word.learned) word.problem = false;
    saveWords();
    updateWord();
    updateProgress();
    renderWordList();
    showAlert(word.learned ? '✅ Learned!' : '📝 Back to study');
}

function toggleProblem() {
    const word = getFilteredWords()[currentIndex];
    if (!word) return;
    word.problem = !word.problem;
    if (word.problem) word.learned = false;
    saveWords();
    updateWord();
    renderWordList();
    showAlert(word.problem ? '⚠️ Marked as difficult' : '✅ Removed from difficult');
}

function nextWord() {
    const filtered = getFilteredWords();
    if (filtered.length === 0) return;
    currentIndex = (currentIndex + 1) % filtered.length;
    updateWord();
    updateCounter();
}

function playArabic() {
    const word = getFilteredWords()[currentIndex];
    if (!word) return;
    if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(word.arabic);
        utterance.lang = 'ar-SA';
        utterance.rate = 0.8;
        speechSynthesis.speak(utterance);
    } else showAlert('Speech synthesis not supported');
}

function playTranslation() {
    const word = getFilteredWords()[currentIndex];
    if (!word) return;
    if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(word.translation);
        utterance.lang = currentLanguage === 'en' ? 'en-US' : 'ru-RU';
        speechSynthesis.speak(utterance);
    } else showAlert('Speech synthesis not supported');
}

// ===== LISTS MANAGEMENT =====
function updateListsSelect() {
    const select = document.getElementById('add-to-list');
    while (select.options.length > 1) select.remove(1);
    wordLists.forEach(list => {
        if (list.id !== 'main') {
            const opt = document.createElement('option');
            opt.value = list.id;
            opt.textContent = list.name;
            select.appendChild(opt);
        }
    });
}

function renderWordLists() {
    updateListsSelect();
}

function renderWordList() {
    const container = document.getElementById('words-list');
    container.innerHTML = '';
    wordLists.forEach(list => {
        const listWords = words.filter(w => w.list === list.id);
        if (listWords.length === 0) return;
        const header = document.createElement('div');
        header.style.cssText = 'background:rgba(0,0,0,0.1); padding:10px; border-radius:8px; margin:10px 0;';
        header.innerHTML = `<h3 style="margin:0; display:flex; justify-content:space-between;"><span>${list.name} (${listWords.length})</span><button onclick="deleteList('${list.id}')" style="background:var(--danger-color); padding:5px 10px; font-size:12px;">Delete</button></h3><p style="margin:5px 0 0; opacity:0.7;">${list.description || ''}</p>`;
        container.appendChild(header);
        listWords.forEach(word => {
            const item = document.createElement('div');
            item.className = `word-item ${word.learned ? 'learned' : ''} ${word.problem ? 'problem' : ''}`;
            item.innerHTML = `
                <div class="word-text">
                    <div class="word-arabic">${word.arabic}</div>
                    <div class="word-translation">${word.translation}</div>
                </div>
                <div class="word-actions">
                    <button class="action-btn audio-btn-small" onclick="playWord('${word.arabic}')">🔊</button>
                    <button class="action-btn learn-btn" onclick="toggleWordLearned('${word.arabic}')">${word.learned ? '↩️' : '✅'}</button>
                    <button class="action-btn problem-btn" onclick="toggleWordProblem('${word.arabic}')">${word.problem ? '👍' : '⚠️'}</button>
                </div>
            `;
            container.appendChild(item);
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
    if (!name) return showAlert('Enter list name');
    const id = 'list_' + Date.now();
    wordLists.push({ id, name, description: document.getElementById('list-description').value.trim(), wordCount: 0 });
    saveLists();
    updateListsSelect();
    renderListFilters();
    hideCreateListModal();
    showAlert(`✅ List "${name}" created`);
}
window.deleteList = function(listId) {
    if (listId === 'main') return showAlert('Cannot delete main list');
    if (confirm('Delete list? Words will move to main list.')) {
        words.forEach(w => { if (w.list === listId) w.list = 'main'; });
        wordLists = wordLists.filter(l => l.id !== listId);
        saveWords();
        saveLists();
        updateListsSelect();
        renderListFilters();
        renderWordList();
        showAlert('List deleted');
    }
};

function viewAllWords() {
    const container = document.getElementById('words-list');
    container.innerHTML = '<h3>All words</h3>';
    if (words.length === 0) { container.innerHTML += '<p>No words</p>'; return; }
    words.forEach(word => {
        const item = document.createElement('div');
        item.className = `word-item ${word.learned ? 'learned' : ''}`;
        item.innerHTML = `
            <div class="word-text">
                <div class="word-arabic">${word.arabic}</div>
                <div class="word-translation">${word.translation}</div>
                <div style="font-size:12px;">${wordLists.find(l => l.id === word.list)?.name || ''}</div>
            </div>
            <div class="word-actions">
                <button class="action-btn audio-btn-small" onclick="playWord('${word.arabic}')">🔊</button>
                <button class="action-btn learn-btn" onclick="toggleWordLearned('${word.arabic}')">${word.learned ? '↩️' : '✅'}</button>
            </div>
        `;
        container.appendChild(item);
    });
}

function exportWords() {
    const data = { words, lists: wordLists, stats: userStats, exportDate: new Date().toISOString() };
    const a = document.createElement('a');
    a.href = 'data:application/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(data, null, 2));
    a.download = `arabic-words-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
}
function showImportModal() { document.getElementById('import-modal').classList.add('active'); }
function hideImportModal() { document.getElementById('import-modal').classList.remove('active'); document.getElementById('import-data').value = ''; }
function importWords() {
    try {
        const data = JSON.parse(document.getElementById('import-data').value);
        if (data.words) {
            data.words.forEach(w => {
                if (!words.some(ex => ex.arabic === w.arabic)) words.push({ ...w, list: w.list || 'main' });
            });
            if (data.lists) data.lists.forEach(l => { if (!wordLists.some(ex => ex.id === l.id) && l.id !== 'main') wordLists.push(l); });
            saveWords(); saveLists(); updateListsSelect(); renderListFilters(); updateWord(); updateCounter(); updateProgress(); renderWordList();
            showAlert(`Imported ${data.words.length} words`);
            hideImportModal();
        } else showAlert('Invalid format');
    } catch(e) { showAlert('JSON error'); }
}

function addWords() {
    const text = document.getElementById('new-words').value.trim();
    const listId = document.getElementById('add-to-list').value;
    if (!text) return showAlert('Enter words');
    const lines = text.split('\n');
    let added = 0;
    lines.forEach(line => {
        const parts = line.split('-').map(s => s.trim());
        if (parts.length >= 2 && parts[0] && parts[1]) {
            const arabic = parts[0];
            const translation = parts[1];
            if (!words.some(w => w.arabic === arabic)) {
                words.push({ arabic, translation, learned: false, problem: false, list: listId });
                added++;
            }
        } else if (line.trim()) {
            const arabic = line.trim();
            if (!words.some(w => w.arabic === arabic)) {
                words.push({ arabic, translation: '(no translation)', learned: false, problem: false, list: listId });
                added++;
            }
        }
    });
    if (added) { saveWords(); updateCounter(); updateProgress(); updateListsSelect(); renderWordList(); showAlert(`Added ${added} words`); }
    else showAlert('No new words added');
}
function clearWordsInput() { document.getElementById('new-words').value = ''; }

// ===== FILE IMPORT (with preview and translation caching) =====
async function extractTextFromPDF(file) {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let text = '';
    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        text += content.items.map(item => item.str).join(' ') + '\n';
    }
    return text;
}
async function extractTextFromDOCX(file) {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
}
function extractArabicWordsFromText(text) {
    const arabicRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]+/g;
    const matches = text.match(arabicRegex) || [];
    const filtered = matches.filter(w => w.length >= 2 && !/^[\d\s]+$/.test(w));
    return [...new Set(filtered)];
}
function findNewWordsSection(text) {
    const markers = [/الكلمات الجديدة/gi, /مفردات/gi, /كلمات جديدة/gi, /جديدة/gi, /الْمفردات/gi];
    let start = -1;
    for (const m of markers) {
        const idx = text.search(m);
        if (idx !== -1 && (start === -1 || idx < start)) start = idx;
    }
    if (start === -1) return text;
    let section = text.substring(start, start + 3000);
    const endMarkers = [/التدريب/gi, /تمرين/gi, /اقرأ/gi];
    for (const em of endMarkers) {
        const end = section.search(em);
        if (end !== -1 && end > 10 && end < section.length) section = section.substring(0, end);
    }
    return section;
}
function getTranslationCacheKey(word) { return `trans_${word}`; }
async function getCachedTranslation(word) {
    const cached = localStorage.getItem(getTranslationCacheKey(word));
    return cached ? JSON.parse(cached).translation : null;
}
function cacheTranslation(word, translation) {
    localStorage.setItem(getTranslationCacheKey(word), JSON.stringify({ word, translation, timestamp: Date.now() }));
}
async function fetchTranslationMyMemory(word) {
    try {
        const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(word)}&langpair=ar|en`;
        const resp = await fetch(url);
        const data = await resp.json();
        if (data.responseData && data.responseData.translatedText) {
            let t = data.responseData.translatedText;
            if (t !== word && !t.includes('???') && t.length < 100) return t;
        }
        return null;
    } catch(e) { return null; }
}
async function getTranslation(word) {
    let t = await getCachedTranslation(word);
    if (t) return t;
    t = await fetchTranslationMyMemory(word);
    if (t) cacheTranslation(word, t);
    return t || '';
}
async function parseFileAndExtractWords() {
    const fileInput = document.getElementById('import-file-input');
    const file = fileInput.files[0];
    const listId = document.getElementById('add-to-list').value;
    if (!file) return showAlert('Select a file');
    const btn = document.getElementById('parse-file-btn');
    btn.disabled = true;
    btn.textContent = '⏳ Processing...';
    try {
        let rawText = '';
        const ext = file.name.split('.').pop().toLowerCase();
        if (ext === 'pdf') rawText = await extractTextFromPDF(file);
        else if (ext === 'docx') rawText = await extractTextFromDOCX(file);
        else if (ext === 'txt') rawText = await file.text();
        else throw new Error('Unsupported format');
        
        const section = findNewWordsSection(rawText);
        const arabicWords = extractArabicWordsFromText(section);
        if (arabicWords.length === 0) throw new Error('No Arabic words found');
        
        const previewMap = new Map();
        for (const word of arabicWords) {
            const exists = words.some(w => w.arabic === word);
            let translation = exists ? '(already exists)' : await getTranslation(word);
            previewMap.set(word, { translation, exists });
            await new Promise(r => setTimeout(r, 200));
        }
        showPreviewWords(previewMap, listId);
    } catch(e) {
        showAlert('Error: ' + e.message);
    } finally {
        btn.disabled = false;
        btn.textContent = '🔍 Extract words from file';
        fileInput.value = '';
    }
}
function showPreviewWords(wordMap, listId) {
    const container = document.getElementById('preview-words-container');
    const listDiv = document.getElementById('preview-words-list');
    listDiv.innerHTML = '';
    let html = '<table class="preview-table"><tr><th>Arabic word</th><th>Translation</th><th>Add</th></tr>';
    for (const [arabic, info] of wordMap.entries()) {
        const checked = !info.exists ? 'checked' : '';
        const disabled = info.exists ? 'disabled' : '';
        html += `<tr>
            <td style="font-family:'Noto Sans Arabic';">${arabic}</td>
            <td><input type="text" class="preview-translation" data-word="${arabic}" value="${info.translation}" ${disabled}></td>
            <td style="text-align:center"><input type="checkbox" class="preview-checkbox" data-word="${arabic}" ${checked} ${disabled}></td>
        </tr>`;
    }
    html += '</table>';
    listDiv.innerHTML = html;
    window.previewWordMap = wordMap;
    window.previewListId = listId;
    container.style.display = 'block';
}
function addSelectedPreviewWords() {
    const checkboxes = document.querySelectorAll('.preview-checkbox:checked');
    const listId = window.previewListId;
    let added = 0;
    checkboxes.forEach(cb => {
        const arabic = cb.getAttribute('data-word');
        const transInput = document.querySelector(`.preview-translation[data-word="${arabic}"]`);
        let translation = transInput ? transInput.value.trim() : '';
        if (translation === '(already exists)' || translation === '(no translation)' || !translation) return;
        if (!words.some(w => w.arabic === arabic)) {
            words.push({ arabic, translation, learned: false, problem: false, list: listId });
            added++;
        }
    });
    if (added) {
        saveWords();
        updateWord();
        updateCounter();
        updateProgress();
        renderWordList();
        showAlert(`✅ Added ${added} words`);
    } else showAlert('No new words to add');
    document.getElementById('preview-words-container').style.display = 'none';
}

// ===== PODCAST (ARABIC, AI, 25-35 random words, history cache) =====
async function generatePodcast() {
    if (words.length < 10) {
        showAlert('Need at least 10 words to generate a podcast (25-35 recommended)');
        return;
    }
    // random 25-35 words from all words (no filter)
    const shuffled = [...words];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    const count = Math.min(words.length, Math.floor(Math.random() * (35 - 25 + 1) + 25));
    const selected = shuffled.slice(0, count);
    
    showAlert(`🔄 Generating Arabic podcast from ${selected.length} words... (10-20 sec)`);
    try {
        const response = await fetch('/api/generate-podcast', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ words: selected.map(w => ({ arabic: w.arabic, translation: w.translation })) })
        });
        const data = await response.json();
        if (data.text && data.text.length > 20) {
            addPodcastToHistory(data.text, selected.map(w => w.arabic));
            renderPodcastHistory();
            displayPodcast(data.text, selected);
        } else {
            throw new Error('Empty response');
        }
    } catch(e) {
        console.error(e);
        // fallback without AI
        const fallbackText = selected.map(w => w.arabic).join('، ') + '. هذه جملة بسيطة. شكراً.';
        addPodcastToHistory(fallbackText, selected.map(w => w.arabic));
        renderPodcastHistory();
        displayPodcast(fallbackText, selected);
    }
}

function addPodcastToHistory(text, arabicWordsArray) {
    let history = localStorage.getItem('podcast_history');
    let items = history ? JSON.parse(history) : [];
    const newItem = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        text: text,
        words: arabicWordsArray,
        preview: text.substring(0, 60) + (text.length > 60 ? '…' : '')
    };
    items.unshift(newItem);
    if (items.length > 5) items = items.slice(0, 5);
    localStorage.setItem('podcast_history', JSON.stringify(items));
}

function renderPodcastHistory() {
    const container = document.getElementById('podcast-list');
    if (!container) return;
    const history = localStorage.getItem('podcast_history');
    const items = history ? JSON.parse(history) : [];
    const t = translations[currentLanguage];
    if (items.length === 0) {
        container.innerHTML = '<p style="opacity:0.7; text-align:center;">No podcasts yet. Generate your first!</p>';
        return;
    }
    let html = '';
    items.forEach(item => {
        const date = new Date(item.timestamp).toLocaleString();
        html += `
            <div class="podcast-history-item" data-id="${item.id}">
                <div class="podcast-history-date">${date}</div>
                <div class="podcast-history-preview" dir="rtl">${item.preview}</div>
                <div class="podcast-history-actions">
                    <button class="play-podcast-btn" data-text="${escapeHtml(item.text)}" data-words='${JSON.stringify(item.words)}'>🔊 ${t.play}</button>
                    <button class="delete-podcast-btn" data-id="${item.id}" style="background:var(--danger-color);">🗑️ ${t.delete}</button>
                </div>
            </div>
        `;
    });
    container.innerHTML = html;
    
    // attach event listeners
    document.querySelectorAll('.play-podcast-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const text = btn.getAttribute('data-text');
            const wordsJson = btn.getAttribute('data-words');
            const wordsList = JSON.parse(wordsJson);
            // reconstruct word objects for display (need full word objects)
            const wordObjs = wordsList.map(arabic => words.find(w => w.arabic === arabic)).filter(w => w);
            displayPodcast(text, wordObjs);
        });
    });
    document.querySelectorAll('.delete-podcast-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = parseInt(btn.getAttribute('data-id'));
            let history = localStorage.getItem('podcast_history');
            let items = history ? JSON.parse(history) : [];
            items = items.filter(item => item.id !== id);
            localStorage.setItem('podcast_history', JSON.stringify(items));
            renderPodcastHistory();
        });
    });
}

function escapeHtml(str) {
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    }).replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, function(c) {
        return c;
    });
}

function displayPodcast(text, wordsList) {
    let html = `<div style="background:rgba(0,0,0,0.05); padding:15px; border-radius:12px; line-height:1.8; font-size:20px; direction:rtl; text-align:right; font-family:'Noto Sans Arabic';">`;
    let processed = text;
    for (const w of wordsList) {
        if (!w) continue;
        const regex = new RegExp(`(${w.arabic.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
        processed = processed.replace(regex, `<span class="podcast-word" data-translation="${w.translation}" style="cursor:pointer; background:#e0e0e0; border-radius:6px; padding:0 4px;">$1</span>`);
    }
    html += processed + '</div>';
    html += `<p style="font-size:12px; margin-top:10px; direction:ltr;">🔊 Click on any Arabic word to see translation.</p>`;
    
    const modal = document.createElement('div');
    modal.className = 'modal active';
    const t = translations[currentLanguage];
    modal.innerHTML = `<div class="modal-content"><h2>🎙️ Arabic Podcast</h2>${html}<div class="buttons"><button id="close-podcast" style="background:var(--danger-color);">${t.close}</button><button id="play-podcast" style="background:var(--accent-color);">🔊 ${t.listen}</button></div></div>`;
    document.body.appendChild(modal);
    
    modal.querySelector('#close-podcast').onclick = () => modal.remove();
    modal.querySelector('#play-podcast').onclick = () => {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'ar-SA';
        utterance.rate = 0.85;
        speechSynthesis.speak(utterance);
    };
    modal.querySelectorAll('.podcast-word').forEach(el => {
        el.onclick = () => showAlert(`Translation: ${el.getAttribute('data-translation')}`);
    });
}

// ===== EXERCISES =====
function showExerciseMenu() {
    document.querySelectorAll('.exercise-container').forEach(c => c.classList.remove('active'));
    document.getElementById('exercises-menu').classList.add('active');
}
function showExercise(type) {
    if (words.length < 3) { showAlert('Add at least 3 words first'); return; }
    document.querySelectorAll('.exercise-container').forEach(c => c.classList.remove('active'));
    if (type === 'multiple-choice') startMultipleChoice();
    else if (type === 'typing') startTypingExercise();
    else if (type === 'listening') startListeningExercise();
    else if (type === 'stats') showStats();
}
function startMultipleChoice() {
    const filtered = getFilteredWords();
    if (filtered.length < 3) { showAlert('Need at least 3 words'); showExerciseMenu(); return; }
    const correct = filtered[Math.floor(Math.random() * filtered.length)];
    let options = [correct.translation];
    while (options.length < 4) {
        const rand = filtered[Math.floor(Math.random() * filtered.length)];
        if (!options.includes(rand.translation)) options.push(rand.translation);
    }
    options = options.sort(() => Math.random() - 0.5);
    const container = document.getElementById('exercise-multiple-choice');
    container.innerHTML = `<div class="card"><h2>Choose the correct translation</h2><div style="font-size:48px; font-family:'Noto Sans Arabic';">${correct.arabic}</div><div class="buttons">${options.map((opt,i) => `<button class="mc-option" data-answer="${opt}" data-correct="${correct.translation}" data-arabic="${correct.arabic}">${String.fromCharCode(65+i)}. ${opt}</button>`).join('')}</div><div class="buttons"><button id="back-mc" class="secondary">Back</button><button id="next-mc">Next</button></div></div>`;
    container.classList.add('active');
    document.querySelectorAll('.mc-option').forEach(btn => {
        btn.addEventListener('click', function() {
            const selected = this.getAttribute('data-answer');
            const correctAns = this.getAttribute('data-correct');
            const arabic = this.getAttribute('data-arabic');
            updateWordStats(arabic, selected === correctAns);
            document.querySelectorAll('.mc-option').forEach(b => b.disabled = true);
            if (selected === correctAns) this.style.background = '#00b894';
            else {
                this.style.background = '#d63031';
                document.querySelector(`.mc-option[data-answer="${correctAns}"]`).style.background = '#00b894';
            }
            showAlert(selected === correctAns ? '✅ Correct!' : `❌ Wrong: ${correctAns}`);
        });
    });
    document.getElementById('back-mc').onclick = showExerciseMenu;
    document.getElementById('next-mc').onclick = () => startMultipleChoice();
}
function startTypingExercise() {
    const filtered = getFilteredWords();
    if (filtered.length === 0) return;
    const word = filtered[Math.floor(Math.random() * filtered.length)];
    const container = document.getElementById('exercise-typing');
    container.innerHTML = `<div class="card"><h2>Type the translation</h2><div style="font-size:48px; font-family:'Noto Sans Arabic';">${word.arabic}</div><input type="text" id="typing-answer" placeholder="Enter translation" style="width:100%; padding:12px; margin:20px 0;"><div class="buttons"><button id="check-typing">Check</button></div><div class="buttons"><button id="back-typing">Back</button><button id="next-typing">Next</button></div></div>`;
    container.classList.add('active');
    document.getElementById('check-typing').onclick = () => {
        const input = document.getElementById('typing-answer');
        const answer = input.value.trim().toLowerCase();
        const correct = word.translation.toLowerCase();
        updateWordStats(word.arabic, answer === correct);
        if (answer === correct) {
            input.style.borderColor = '#00b894';
            showAlert('✅ Correct!');
        } else {
            input.style.borderColor = '#d63031';
            showAlert(`❌ Correct: ${word.translation}`);
        }
    };
    document.getElementById('back-typing').onclick = showExerciseMenu;
    document.getElementById('next-typing').onclick = () => startTypingExercise();
}
function startListeningExercise() {
    const filtered = getFilteredWords();
    if (filtered.length < 3) return;
    const word = filtered[Math.floor(Math.random() * filtered.length)];
    let options = [word.arabic];
    while (options.length < 4) {
        const rand = filtered[Math.floor(Math.random() * filtered.length)];
        if (!options.includes(rand.arabic)) options.push(rand.arabic);
    }
    options = options.sort(() => Math.random() - 0.5);
    const container = document.getElementById('exercise-listening');
    container.innerHTML = `<div class="card"><h2>Listening exercise</h2><p>Listen and choose the correct Arabic word:</p><div style="font-size:24px; margin:20px;">"${word.translation}"</div><button id="play-listening-audio" style="background:#00cec9;">🔊 Play</button><div class="buttons">${options.map((opt,i) => `<button class="listening-option" data-answer="${opt}" data-correct="${word.arabic}">${String.fromCharCode(65+i)}. ${opt}</button>`).join('')}</div><div class="buttons"><button id="back-listening">Back</button><button id="next-listening">Next</button></div></div>`;
    container.classList.add('active');
    document.getElementById('play-listening-audio').onclick = () => playWord(word.arabic);
    document.querySelectorAll('.listening-option').forEach(btn => {
        btn.addEventListener('click', function() {
            const selected = this.getAttribute('data-answer');
            const correct = this.getAttribute('data-correct');
            updateWordStats(correct, selected === correct);
            document.querySelectorAll('.listening-option').forEach(b => b.disabled = true);
            if (selected === correct) this.style.background = '#00b894';
            else {
                this.style.background = '#d63031';
                document.querySelector(`.listening-option[data-answer="${correct}"]`).style.background = '#00b894';
            }
            showAlert(selected === correct ? '✅ Correct!' : '❌ Wrong');
        });
    });
    document.getElementById('back-listening').onclick = showExerciseMenu;
    document.getElementById('next-listening').onclick = () => startListeningExercise();
    setTimeout(() => playWord(word.arabic), 500);
}
function showStats() {
    const filtered = getFilteredWords();
    const learned = filtered.filter(w => w.learned).length;
    const total = filtered.length;
    const percent = total ? Math.round((learned/total)*100) : 0;
    const problem = filtered.filter(w => w.problem).length;
    const listStats = {};
    wordLists.forEach(list => {
        const listWords = words.filter(w => w.list === list.id);
        if (listWords.length) listStats[list.name] = { total: listWords.length, learned: listWords.filter(w=>w.learned).length };
    });
    const t = translations[currentLanguage];
    const container = document.getElementById('exercise-stats');
    container.innerHTML = `<div class="card"><h2>${t.progress}</h2><div style="margin:20px 0;"><div>Total words: ${total}</div><div>Learned: ${learned}</div><div>Difficult: ${problem}</div><div>Progress: ${percent}%</div><div class="progress-bar"><div class="progress-fill" style="width:${percent}%;"></div></div>${Object.entries(listStats).map(([name, st]) => `<div><strong>${name}</strong>: ${st.learned}/${st.total}</div>`).join('')}</div><div class="buttons"><button id="back-stats">Back</button><button id="clear-cache-btn" style="background:var(--warning-color);">${t.clearCache}</button><button id="lang-toggle-btn" style="background:var(--accent-color);">${t.language}</button></div></div>`;
    container.classList.add('active');
    document.getElementById('back-stats').onclick = showExerciseMenu;
    document.getElementById('clear-cache-btn').onclick = () => {
        if (confirm('Clear translation cache and podcast history?')) {
            clearAllCache();
            showAlert('Cache cleared');
            renderPodcastHistory();
        }
    };
    document.getElementById('lang-toggle-btn').onclick = () => {
        const newLang = currentLanguage === 'en' ? 'ru' : 'en';
        setLanguage(newLang);
        showExercise('stats');
    };
}
function updateWordStats(arabic, isCorrect) {
    if (!userStats.words[arabic]) userStats.words[arabic] = { correct:0, incorrect:0 };
    if (isCorrect) userStats.words[arabic].correct++;
    else userStats.words[arabic].incorrect++;
    saveStats();
}
function clearAllCache() {
    // clear translation cache
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('trans_')) {
            localStorage.removeItem(key);
        }
    }
    // clear podcast history
    localStorage.removeItem('podcast_history');
}
window.playWord = function(arabic) {
    const word = words.find(w => w.arabic === arabic);
    if (word && 'speechSynthesis' in window) {
        const utter = new SpeechSynthesisUtterance(word.arabic);
        utter.lang = 'ar-SA';
        speechSynthesis.speak(utter);
    }
};
window.toggleWordLearned = function(arabic) {
    const w = words.find(w => w.arabic === arabic);
    if (w) { w.learned = !w.learned; if(w.learned) w.problem=false; saveWords(); renderWordList(); updateWord(); updateProgress(); }
};
window.toggleWordProblem = function(arabic) {
    const w = words.find(w => w.arabic === arabic);
    if (w) { w.problem = !w.problem; if(w.problem) w.learned=false; saveWords(); renderWordList(); updateWord(); }
};

// ===== TELEGRAM INTEGRATION =====
function initTelegram() {
    if (typeof Telegram !== 'undefined' && Telegram.WebApp) {
        const tg = Telegram.WebApp;
        tg.ready();
        tg.expand();
        applyTelegramTheme(tg);
        tg.onEvent('themeChanged', () => applyTelegramTheme(tg));
        tg.BackButton.onClick(() => handleTelegramBackButton());
    } else setupBrowserMode();
}
function applyTelegramTheme(tg) {
    document.body.classList.toggle('theme-dark', tg.colorScheme === 'dark');
}
function updateTelegramBackButton() {
    if (typeof Telegram !== 'undefined' && Telegram.WebApp) {
        if (currentTab !== 'cards') Telegram.WebApp.BackButton.show();
        else Telegram.WebApp.BackButton.hide();
    } else {
        document.getElementById('back-button').style.display = currentTab !== 'cards' ? 'block' : 'none';
    }
}
function handleTelegramBackButton() {
    const activeModal = document.querySelector('.modal.active');
    if (activeModal) {
        activeModal.classList.remove('active');
        return;
    }
    if (currentTab === 'exercises') {
        const isInExercise = Array.from(document.querySelectorAll('.exercise-container')).some(c => c.classList.contains('active') && c.id !== 'exercises-menu');
        if (isInExercise) showExerciseMenu();
        else showTab('cards');
    } else if (currentTab !== 'cards') showTab('cards');
    else if (typeof Telegram !== 'undefined' && Telegram.WebApp) Telegram.WebApp.close();
}
function setupBrowserMode() {
    const backBtn = document.getElementById('back-button');
    if (backBtn) backBtn.style.display = 'none';
}
function showAlert(msg) {
    if (typeof Telegram !== 'undefined' && Telegram.WebApp) Telegram.WebApp.showAlert(msg);
    else alert(msg);
}
function showTab(tabName) {
    currentTab = tabName;
    document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t.getAttribute('data-tab') === tabName));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.toggle('active', c.id === `${tabName}-tab`));
    updateTelegramBackButton();
    if (tabName === 'exercises') showExerciseMenu();
    if (tabName === 'lists') renderWordList();
    if (tabName === 'podcasts') renderPodcastHistory();
}
function saveWords() { localStorage.setItem('arabic_words', JSON.stringify(words)); wordLists.forEach(l => l.wordCount = words.filter(w => w.list === l.id).length); saveLists(); }
function loadWords() { const saved = localStorage.getItem('arabic_words'); if (saved) words = JSON.parse(saved); }
function saveLists() { localStorage.setItem('arabic_lists', JSON.stringify(wordLists)); }
function loadLists() { const saved = localStorage.getItem('arabic_lists'); if (saved) wordLists = JSON.parse(saved); }
function saveStats() { localStorage.setItem('arabic_stats', JSON.stringify(userStats)); }
function loadStats() { const saved = localStorage.getItem('arabic_stats'); if (saved) userStats = JSON.parse(saved); else userStats.userId = 'user_' + Math.random().toString(36).substr(2,9); }

// start app after language selection or directly
document.addEventListener('DOMContentLoaded', () => {
    if (!localStorage.getItem('app_language')) {
        chooseLanguageFirstTime();
    } else {
        loadLanguage();
        initApp();
    }
});