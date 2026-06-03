// ВСТАВЬ СВОЮ ССЫЛКУ НА CSV МЕЖДУ КАВЫЧКАМИ:
const SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQr519uhivJSksrF57w-TIt7dLXx4AxF7gW1SVw0Niizm8wAC84g92KxvJpDAMnkU0xoKR2bVwRVNOz/pub?output=csv";

let allActivities = [];
let currentCategory = "all";

// Находим элементы на странице
const elLoading = document.getElementById('loading');
const elError = document.getElementById('error');
const elContent = document.getElementById('cardContent');
const elFilter = document.getElementById('categoryFilter');

const elImage = document.getElementById('actImage');
const elCategory = document.getElementById('actCategory');
const elTitle = document.getElementById('actTitle');
const elDescription = document.getElementById('actDescription');
const elRecommendations = document.getElementById('actRecommendations');
const elNextBtn = document.getElementById('nextBtn');

// Функция автоматического превращения CSV-текста в удобный формат
function parseCSV(text) {
    const lines = text.split('\n');
    if (lines.length < 2) return [];
    
    // Читаем заголовки колонок из первой строки таблицы
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    
    const result = [];
    for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        
        // Магия регулярных выражений, чтобы текст с запятыми внутри ячеек не ломал таблицу
        const matches = lines[i].match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || lines[i].split(',');
        const row = matches.map(val => val.replace(/^"|"$/g, '').trim());
        
        const obj = {};
        headers.forEach((header, index) => {
            obj[header] = row[index] || '';
        });
        result.push(obj);
    }
    return result;
}

// Загрузка данных из Google Sheets
async function loadData() {
    try {
        showLoading(true);
        const response = await fetch(SHEET_CSV_URL);
        if (!response.ok) throw new Error('Ошибка сети');
        
        const dataText = await response.text();
        allActivities = parseCSV(dataText);
        
        if (allActivities.length === 0) throw new Error('Таблица пустая');

        initFilter(); // Создаем фильтр на основе категорий из таблицы
        showRandomActivity(); // Показываем первую случайную карточку
    } catch (err) {
        console.error(err);
        elError.classList.remove('hidden');
        showLoading(false);
    }
}

// Создание списка категорий в выпадающем меню
function initFilter() {
    const categories = new Set();
    allActivities.forEach(item => {
        if (item.category) categories.add(item.category.trim());
    });

    elFilter.innerHTML = '<option value="all">🌟 Все категории</option>';
    
    categories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat;
        option.textContent = cat.charAt(0).toUpperCase() + cat.slice(1);
        elFilter.appendChild(option);
    });

    elFilter.disabled = false;
}

// Логика выбора случайной карточки
function showRandomActivity() {
    showLoading(true);
    
    // Фильтруем карточки: либо все, либо только выбранная категория
    const filtered = currentCategory === 'all' 
        ? allActivities 
        : allActivities.filter(item => item.category && item.category.trim() === currentCategory);

    if (filtered.length === 0) {
        alert('В этой категории пока ничего нет!');
        showLoading(false);
        return;
    }

    // Выбираем случайную строку
    const randomItem = filtered[Math.floor(Math.random() * filtered.length)];

    // Заполняем карточку данными
    elTitle.textContent = randomItem.title || 'Без названия';
    elDescription.textContent = randomItem.description || 'Описание отсутствует.';
    elRecommendations.textContent = randomItem.recommendations || 'Особых рекомендаций нет, просто попробуй!';
    elCategory.textContent = randomItem.category || 'Активность';
    
    // Если ссылки на картинку нет в таблице, ставим стандартную красивую заглушку
    elImage.src = randomItem.image || 'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?w=500';

    // Включаем отображение, как только картинка прогрузится базово браузером
    elImage.onload = () => showLoading(false);
    elImage.onerror = () => {
        elImage.src = 'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?w=500';
        showLoading(false);
    };
}

// Управление анимацией загрузки
function showLoading(isLoading) {
    if (isLoading) {
        elLoading.style.opacity = '1';
        elLoading.classList.remove('pointer-events-none');
        elContent.style.opacity = '0';
    } else {
        elLoading.style.opacity = '0';
        elLoading.classList.add('pointer-events-none');
        elContent.style.opacity = '1';
    }
}

// Кнопки и переключатели
elNextBtn.addEventListener('click', showRandomActivity);
elFilter.addEventListener('change', (e) => {
    currentCategory = e.target.value;
    showRandomActivity();
});

// Старт при загрузке страницы
window.addEventListener('DOMContentLoaded', loadData);