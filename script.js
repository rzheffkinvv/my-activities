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

// НАДЕЖНАЯ ФУНКЦИЯ ДЛЯ РАЗБОРА CSV (ПРАВИЛЬНО ЧИТАЕТ ДЛИННЫЕ ТЕКСТЫ И СИМВОЛЫ)
function parseCSV(text) {
    const lines = [];
    let row = [""];
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const nextChar = text[i + 1];

        if (char === '"') {
            if (inQuotes && nextChar === '"') {
                row[row.length - 1] += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            row.push('');
        } else if ((char === '\r' || char === '\n') && !inQuotes) {
            if (char === '\r' && nextChar === '\n') { i++; }
            lines.push(row);
            row = [''];
        } else {
            row[row.length - 1] += char;
        }
    }
    if (row.length > 1 || row[0] !== '') { lines.push(row); }
    if (lines.length < 2) return [];

    const headers = lines[0].map(h => h.trim().toLowerCase());
    const result = [];

    for (let i = 1; i < lines.length; i++) {
        const currentRow = lines[i];
        if (currentRow.length === 1 && currentRow[0] === '') continue;
        
        const obj = {};
        headers.forEach((header, index) => {
            let val = currentRow[index] || '';
            obj[header] = val.trim();
        });
        result.push(obj);
    }
    return result;
}

// Загрузка данных из Google Sheets
async function loadData() {
    try {
        showLoading(true);
        // Добавляем случайный параметр, чтобы браузер не кэшировал старую таблицу
        const response = await fetch(`${SHEET_CSV_URL}&nocache=${Date.now()}`);
        if (!response.ok) throw new Error('Ошибка сети');
        
        const dataText = await response.text();
        allActivities = parseCSV(dataText);
        
        if (allActivities.length === 0) throw new Error('Таблица пустая');

        initFilter(); 
        showRandomActivity(); 
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
    
    const filtered = currentCategory === 'all' 
        ? allActivities 
        : allActivities.filter(item => item.category && item.category.trim() === currentCategory);

    if (filtered.length === 0) {
        alert('В этой категории пока ничего нет!');
        showLoading(false);
        return;
    }

    const randomItem = filtered[Math.floor(Math.random() * filtered.length)];

    elTitle.textContent = randomItem.title || 'Без названия';
    elDescription.textContent = randomItem.description || 'Описание отсутствует.';
    elRecommendations.textContent = randomItem.recommendations || 'Особых рекомендаций нет, просто попробуй!';
    elCategory.textContent = randomItem.category || 'Активность';
    
    elImage.src = randomItem.image || 'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?w=500';

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
