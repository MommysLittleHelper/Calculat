// --- БЛОК УПРАВЛЕНИЯ ТЕМАМИ ---
function initTheme() {
    var savedTheme = localStorage.getItem('user-theme') || 'system';
    setTheme(savedTheme);
}

function setTheme(themeMode) {
    var htmlEl = document.documentElement;
    
    document.getElementById('theme-light').classList.remove('active');
    document.getElementById('theme-dark').classList.remove('active');
    document.getElementById('theme-system').classList.remove('active');
    
    document.getElementById('theme-' + themeMode).classList.add('active');
    localStorage.setItem('user-theme', themeMode);

    if (themeMode === 'system') {
        var isDarkSystem = window.matchMedia('(prefers-color-scheme: dark)').matches;
        htmlEl.className = isDarkSystem ? 'dark' : 'light';
    } else {
        htmlEl.className = themeMode;
    }
}

window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function(e) {
    if (localStorage.getItem('user-theme') === 'system') {
        document.documentElement.className = e.matches ? 'dark' : 'light';
    }
});

initTheme();


// --- БЛОК ВЫЧИСЛЕНИЙ И ПОДСВЕТКИ СТРОК ---
var parsedItems = [];

function calculate() {
    var rawText = document.getElementById('inputText').value; // Убрали .trim(), чтобы сохранять точные переносы строк
    if (!rawText.trim()) return alert("Введите текст");
    
    var cleanText = rawText.replace(/(\d+),(\d+)/g, '$1.$2').toLowerCase().split('\n');
    parsedItems = [];
    
    for (var i = 0; i < cleanText.length; i++) {
        var line = cleanText[i].trim();
        
        var quantity = 1;
        var hasQ = false;
        
        var qMatch = line.match(/(\d+)\s*(?:количество|кол-во|мест|шт|q)/) || line.match(/(?:количество|кол-во|мест|шт|q)\s*[:=-]?\s*(\d+)/);
        if (qMatch) {
            quantity = parseInt(qMatch[1]);
            line = line.replace(qMatch[0], " ");
            hasQ = true;
        }
        
        var numbers = line.match(/\d+(\.\d+)?/g);
        
        // Запоминаем данные строки, даже если в ней ошибка (чтобы подсветить её)
        var itemData = {
            index: i,              // Оригинальный индекс строки (от 0)
            textLine: cleanText[i], // Исходный текст строки
            isValid: false,
            l: 0, w: 0, h: 0, quantity: quantity, unit: 'см', isDoubtful: false, doubtMessage: ''
        };

        if (numbers && numbers.length >= 3) {
            if (numbers.length === 4 && !hasQ) {
                quantity = parseInt(numbers[3]);
            }
            
            var l = parseFloat(numbers[0]), w = parseFloat(numbers[1]), h = parseFloat(numbers[2]);
            var unit = 'см';
            var isDoubtful = false;
            var doubtMessage = '';
            
            var reMM = /(?:^|[^а-яa-z])(мм|mm)(?:[^а-яa-z]|$)/;
            var reCM = /(?:^|[^а-яa-z])(см|cm)(?:[^а-яa-z]|$)/;
            var reM = /(?:^|[^а-яa-z])(м|m)(?:[^а-яa-z]|$)/;
            
            if (reMM.test(line)) { unit = 'мм'; } 
            else if (reCM.test(line)) { unit = 'см'; } 
            else if (reM.test(line)) { unit = 'м'; } 
            else {
                var sum = l + w + h;
                var maxSide = Math.max(l, w, h);
                var minSide = Math.min(l, w, h);
                
                if (sum <= 30) {
                    if (maxSide > 5) { unit = 'см'; isDoubtful = true; doubtMessage = '⚠️ Расчет в см, но проверьте — возможно это метры?'; }
                    else { unit = 'м'; }
                } else if (sum >= 31 && sum <= 300) {
                    unit = 'см'; isDoubtful = true; doubtMessage = '⚠️ Расчет в см, но проверьте — возможно это мм?';
                } else if (sum >= 301 && sum <= 3000) {
                    if (maxSide >= 1000 && minSide >= 100) { unit = 'мм'; } 
                    else if (minSide <= 25) { unit = 'см'; } 
                    else if (l > 100 && w > 100 && h > 100) { unit = 'см'; isDoubtful = true; doubtMessage = '⚠️ Расчет в см, но проверьте — возможно это мм?'; } 
                    else { unit = 'мм'; isDoubtful = true; doubtMessage = '⚠️ Расчет в мм, но проверьте — возможно это см?'; }
                } else { unit = 'мм'; }
            }
            
            itemData.isValid = true;
            itemData.l = l; itemData.w = w; itemData.h = h;
            itemData.quantity = quantity;
            itemData.unit = unit;
            itemData.isDoubtful = isDoubtful;
            itemData.doubtMessage = doubtMessage;
        }
        
        // Добавляем строку в массив, если она не пустая
        if (cleanText[i].trim() || numbers) {
            parsedItems.push(itemData);
        }
    }
    
    document.getElementById('bulkActions').style.display = parsedItems.filter(function(x){return x.isValid;}).length > 1 ? 'flex' : 'none';
    renderResults();
}

function renderResults() {
    var totalVolume = 0, totalPieces = 0;
    var detailsHtml = '';
    var textReport = '📊 ОТЧЕТ ПО РАСЧЕТУ ОБЪЕМА:\n\n';
    
    for (var i = 0; i < parsedItems.length; i++) {
        var item = parsedItems[i];
        
        if (item.isValid) {
            var divider = 1000000;
            if (item.unit === 'мм') divider = 1000000000;
            if (item.unit === 'м') divider = 1;
            
            var itemVolume = (item.l * item.w * item.h * item.quantity) / divider;
            totalVolume += itemVolume;
            totalPieces += item.quantity;
            
            var lineClass = item.isDoubtful ? 'detail-line warning-line' : 'detail-line';
            
            var mActive = item.unit === 'м' ? 'active' : '';
            var cmActive = item.unit === 'см' ? 'active' : '';
            var mmActive = item.unit === 'мм' ? 'active' : '';
            
            // Новое: добавлено событие onmouseenter="highlightTextLine(item.index)" для подсветки при наведении
            detailsHtml += '<div class="' + lineClass + '" onmouseenter="highlightTextLine(' + item.index + ')">' +
                'Строка ' + (item.index + 1) + ': ' + item.l + ' x ' + item.w + ' x ' + item.h + ' ' +
                '<div class="badge-group">' +
                    '<button class="btn-badge ' + mActive + '" onclick="changeLineUnit(' + i + ', \'м\')">м</button>' +
                    '<button class="btn-badge ' + cmActive + '" onclick="changeLineUnit(' + i + ', \'см\')">см</button>' +
                    '<button class="btn-badge ' + mmActive + '" onclick="changeLineUnit(' + i + ', \'мм\')">мм</button>' +
                '</div>' +
                ' × ' + item.quantity + ' шт. = <strong>' + itemVolume.toFixed(4) + '</strong> м³';
            
            textReport += '• Строка ' + (item.index + 1) + ': ' + item.l + 'x' + item.w + 'x' + item.h + ' ' + item.unit + ' × ' + item.quantity + ' шт. = ' + itemVolume.toFixed(4) + ' м³\n';
            if (item.isDoubtful) {
                detailsHtml += '<div class="warning-text">' + item.doubtMessage + '</div>';
                textReport += '  ' + item.doubtMessage + '\n';
            }
            detailsHtml += '</div>';
        } else {
            // Подсветка работает и для строк, в которых произошла ошибка
            detailsHtml += '<div class="detail-line" style="color: #ef4444; border-left: 4px solid #ef4444;" onmouseenter="highlightTextLine(' + item.index + ')">' +
                'Строка ' + (item.index + 1) + ': ❌ Не удалось распознать 3 габарита</div>';
        }
    }
    
    document.getElementById('totalVolume').innerHTML = '<strong>' + totalVolume.toFixed(4) + '</strong> м³';
    document.getElementById('totalPieces').innerText = totalPieces + ' шт.';
    document.getElementById('detailsList').innerHTML = detailsHtml;
    
    textReport += '\n___________________________\n🚚 ОБЩИЙ ОБЪЕМ: ' + totalVolume.toFixed(4) + ' м³\n🔢 ВСЕГО МЕСТ: ' + totalPieces + ' шт.';
    window.textReportGlobal = textReport;
    
    document.getElementById('resultBox').style.display = 'block';
}

// ФУНКЦИЯ ИНТЕРАКТИВНОЙ ПОДСВЕТКИ СТРОКИ (Новая)
function highlightTextLine(lineIndex) {
    var textarea = document.getElementById('inputText');
    var text = textarea.value;
    var lines = text.split('\n');
    
    var startPos = 0;
    // Находим точную позицию символа, с которого начинается выбранная строка
    for (var i = 0; i < lineIndex; i++) {
        startPos += lines[i].length + 1; // +1 учитывает символ переноса строки \n
    }
    var endPos = startPos + lines[lineIndex].length;
    
    textarea.focus();
    // Выделяем строку в поле ввода
    textarea.setSelectionRange(startPos, endPos);
}

function changeLineUnit(itemIndex, newUnit) {
    parsedItems[itemIndex].unit = newUnit;
    parsedItems[itemIndex].isDoubtful = false; 
    renderResults();
}

function changeAllUnits(newUnit) {
    for (var i = 0; i < parsedItems.length; i++) {
        if(parsedItems[i].isValid) {
            parsedItems[i].unit = newUnit;
            parsedItems[i].isDoubtful = false;
        }
    }
    renderResults();
}

function copyResults() {
    if (!window.textReportGlobal) return;
    navigator.clipboard.writeText(window.textReportGlobal).then(function() {
        document.getElementById('copyBtn').innerText = '✅ Отчет скопирован!';
        setTimeout(function() { document.getElementById('copyBtn').innerText = '📋 Скопировать отчет'; }, 2000);
    });
}
