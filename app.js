// Все слова для изучения
const words = [
    { arabic: "مرحبا", translation: "Привет" },
    { arabic: "شكرا", translation: "Спасибо" },
    { arabic: "كتاب", translation: "Книга" },
    { arabic: "قلم", translation: "Ручка" },
    { arabic: "ماء", translation: "Вода" }
];

// Какое слово сейчас показываем
let currentIndex = 0;

// Показывает перевод
function showTranslation() {
    document.getElementById('translation').style.display = 'block';
}

// Показывает следующее слово
function nextWord() {
    // Прячем перевод
    document.getElementById('translation').style.display = 'none';
    
    // Увеличиваем счетчик
    currentIndex = currentIndex + 1;
    
    // Если дошли до конца - начинаем сначала
    if (currentIndex >= words.length) {
        currentIndex = 0;
    }
    
    // Меняем слово на экране
    document.getElementById('word').textContent = words[currentIndex].arabic;
    document.getElementById('translation').textContent = words[currentIndex].translation;
    
    // Обновляем счетчик
    document.getElementById('counter').textContent = currentIndex + 1;
}

// При загрузке показываем общее количество слов
document.getElementById('total').textContent = words.length;