var textReportGlobal = '';

function calculate() {
    var rawText = document.getElementById('inputText').value.trim();
    if (!rawText) return alert("Введите текст");
    
    var lines = rawText.replace(/(\d+),(\d+)/g, '$1.$2').toLowerCase().split('\n');
    var totalVolume = 0, totalPieces = 0;
    var detailsHtml = '';
    var textReport = '📊 ОТЧЕТ ПО РАСЧЕТУ ОБЪЕМА:\n\n';
    
    for (var i = 0; i < lines.length; i++) {
        var line = lines[i].trim();
        if (!line) continue;
        
        var quantity = 1;
        var hasQ = false;
        
        var qMatch = line.match(/(\d+)\s*(?:количество|кол-во|мест|шт|q)/) || line.match(/(?:количество|кол-во|мест|шт|q)\s*[:=-]?\s*(\d+)/);
        if (qMatch) {
            quantity = parseInt(qMatch);
            line = line.replace(qMatch, " ");
            hasQ = true;
        }
        
        var numbers = line.match(/\d+(\.\d+)?/g);
        if (numbers && numbers.length >= 3) {
            if (numbers.length === 4 && !hasQ) {
                quantity = parseInt(numbers);
            }
            
            var l = parseFloat(numbers[0]), w = parseFloat(numbers[1]), h = parseFloat(numbers[2]);
            var unit = 'см', divider = 1000000;
            var isDoubtful = false;
            var doubtMessage = '';
            
            var reMM = /(?:^|[^а-яa-z])(мм|mm)(?:[^а-яa-z]|$)/;
            var reCM = /(?:^|[^а-яa-z])(см|cm)(?:[^а-яa-z]|$)/;
            var reM = /(?:^|[^а-яa-z])(м|m)(?:[^а-яa-z]|$)/;
            
            if (reMM.test(line)) {
                unit = 'мм'; divider = 1000000000;
            } else if (reCM.test(line)) {
                unit = 'см'; divider = 1000000;
            } else if (reM.test(line)) {
                unit = 'м'; divider = 1;
            } else {
                var sum = l + w + h;
                var maxSide = Math.max(l, w, h);
                var minSide = Math.min(l, w, h);
                
                if (sum <= 30) {
                    if (maxSide > 5) {
                        unit = 'см'; divider = 1000000;
                        isDoubtful = true;
                        doubtMessage = '⚠️ Расчет в см, но проверьте — возможно это метры?';
                    } else {
                        unit = 'м'; divider = 1;
                    }
                } else if (sum >= 31 && sum <= 300) {
                    unit = 'см'; divider = 1000000;
                    isDoubtful = true;
                    doubtMessage = '⚠️ Расчет в см, но проверьте — возможно это мм?';
                } else if (sum >= 301 && sum <= 3000) {
                    if (maxSide >= 1000 && minSide >= 100) {
                        unit = 'мм'; divider = 1000000000;
                    } else if (minSide <= 25) {
                        unit = 'см'; divider = 1000000;
                    } else if (l > 100 && w > 100 && h > 100) {
                        unit = 'см'; divider = 1000000;
                        isDoubtful = true;
                        doubtMessage = '⚠️ Расчет в см, но проверьте — возможно это мм?';
                    } else {
                        unit = 'мм'; divider = 1000000000;
                        isDoubtful = true;
                        doubtMessage = '⚠️ Расчет в мм, но проверьте — возможно это см?';
                    }
                } else {
                    unit = 'мм'; divider = 1000000000;
                }
            }
            
            var itemVolume = (l * w * h * quantity) / divider;
            totalVolume += itemVolume;
            totalPieces += quantity;
            
            var lineClass = isDoubtful ? 'detail-line warning-line' : 'detail-line';
            
            detailsHtml += '<div class="' + lineClass + '">' +
                'Строка ' + (i + 1) + ': ' + l + ' x ' + w + ' x ' + h + ' <span class="badge">' + unit + '</span>' +
                ' × ' + quantity + ' шт. = <strong>' + itemVolume.toFixed(4) + '</strong> м³';
            
            textReport += '• Строка ' + (i + 1) + ': ' + l + 'x' + w + 'x' + h + ' ' + unit + ' × ' + quantity + ' шт. = ' + itemVolume.toFixed(4) + ' м³\n';
            if (isDoubtful) {
                detailsHtml += '<div class="warning-text">' + doubtMessage + '</div>';
                textReport += '  ' + doubtMessage + '\n';
            }
            detailsHtml += '</div>';
        } else {
            detailsHtml += '<div class="detail-line" style="color: #ef4444; border-left: 4px solid #ef4444;">Строка ' + (i + 1) + ': ❌ Не удалось распознать 3 габарита</div>';
        }
    }
    
    document.getElementById('totalVolume').innerHTML = '<strong>' + totalVolume.toFixed(4) + '</strong> м³';
    document.getElementById('totalPieces').innerText = totalPieces + ' шт.';
    document.getElementById('detailsList').innerHTML = detailsHtml;
    
    textReport += '\n___________________________\n🚚 ОБЩИЙ ОБЪЕМ: ' + totalVolume.toFixed(4) + ' м³\n🔢 ВСЕГО МЕСТ: ' + totalPieces + ' шт.';
    textReportGlobal = textReport;
    
    document.getElementById('resultBox').style.display = 'block';
    document.getElementById('copyBtn').innerText = '📋 Скопировать отчет';
}

function copyResults() {
    if (!textReportGlobal) return;
    navigator.clipboard.writeText(textReportGlobal).then(function() {
        document.getElementById('copyBtn').innerText = '✅ Отчет скопирован!';
        setTimeout(function() { 
            document.getElementById('copyBtn').innerText = '📋 Скопировать отчет'; 
        }, 2000);
    });
}
