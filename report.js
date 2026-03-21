let parsedData = [];
let currentStudentIndex = 0;
let charts = {};

document.addEventListener('DOMContentLoaded', () => {
    const rawData = localStorage.getItem('happySchoolData') || sessionStorage.getItem('happySchoolData');
    if (rawData) {
        parsedData = JSON.parse(rawData);
    }
    
    if (!parsedData || parsedData.length === 0) {
        document.getElementById('documentContainer').innerHTML = "<h2 style='color:white;text-align:center;margin-top:50px;'>출력할 데이터가 없습니다. 먼저 메인 화면에서 데이터를 파싱해주세요.</h2>";
        document.querySelector('.viewer-toolbar').style.display = 'none';
        document.querySelector('.bottom-nav').style.display = 'none';
        return;
    }
    
    populateSelector();

    const startIdx = localStorage.getItem('reportStudentIndex');
    if (startIdx !== null && startIdx !== "") {
        currentStudentIndex = parseInt(startIdx, 10);
        localStorage.removeItem('reportStudentIndex');
    }

    renderStudentPage(currentStudentIndex);
});

function getStudentName(row) {
    return row['이름'] || row['성명'] || row['name'] || Object.values(row)[3] || "이름없음";
}

function getStudentMeta(row) {
    let grade = String(row['학년'] || Object.values(row)[0] || "O").replace(/학년/g, '') + '학년';
    let ban = String(row['반'] || Object.values(row)[1] || "O").replace(/반/g, '') + '반';
    let num = String(row['번호'] || Object.values(row)[2] || "O").replace(/번/g, '') + '번';
    return `${grade} ${ban} ${num}`;
}

function populateSelector() {
    const sel = document.getElementById('studentSelector');
    sel.innerHTML = '';
    parsedData.forEach((row, i) => {
        const opt = document.createElement('option');
        opt.value = i;
        opt.textContent = `${getStudentMeta(row)} ${getStudentName(row)}`;
        sel.appendChild(opt);
    });
}

let viewCols = 1;
let currentZoom = 1.0;

window.changeViewMode = function(cols) {
    viewCols = parseInt(cols, 10);
    document.getElementById('documentContainer').style.setProperty('--cols', viewCols);
};

window.zoomIn = function() {
    if(currentZoom < 2.5) currentZoom += 0.1;
    updateZoom();
};

window.zoomOut = function() {
    if(currentZoom > 0.3) currentZoom -= 0.1;
    updateZoom();
};

function updateZoom() {
    document.getElementById('zoomLabel').innerText = Math.round(currentZoom * 100) + '%';
    document.documentElement.style.setProperty('--zoom', currentZoom);
}

window.jumpToStudent = function(val) {
    if(val !== "") {
        currentStudentIndex = parseInt(val, 10);
        renderStudentPage(currentStudentIndex);
    }
};

window.prevStudent = function() {
    if (currentStudentIndex > 0) {
        currentStudentIndex--;
        document.getElementById('studentSelector').value = currentStudentIndex;
        renderStudentPage(currentStudentIndex);
    }
};

window.nextStudent = function() {
    if (currentStudentIndex < parsedData.length - 1) {
        currentStudentIndex++;
        document.getElementById('studentSelector').value = currentStudentIndex;
        renderStudentPage(currentStudentIndex);
    }
};

// Extractor identical to app.js
function extractScore(str) {
    if(!str) return null;
    const m = str.toString().match(/^(\d)/);
    if(m) return parseInt(m[1]);
    return null;
}

// Generate UI logic
function renderStudentPage(index) {
    const row = parsedData[index];
    const name = getStudentName(row);
    const meta = getStudentMeta(row);
    
    document.getElementById('studentSelector').value = index;
    document.getElementById('pageIndicator').innerText = `학생 ${index + 1} / ${parsedData.length}`;
    document.getElementById('bottomIndicator').innerText = index + 1;
    document.getElementById('btnPrev').disabled = (index === 0);
    document.getElementById('btnNext').disabled = (index === parsedData.length - 1);
    
    // Calculate missing attributes via app.js logic
    let studentGradeStr = String(row['학년'] || row['학년 반 번호'] || Object.values(row)[0] || "O");
    let version = "v3";
    if (studentGradeStr.includes('1') || studentGradeStr.includes('2')) version = "v1";
    else if (studentGradeStr.includes('3') || studentGradeStr.includes('4')) version = "v2";

    const rowKeysAll = Object.keys(row);
    let dsKeys = rowKeysAll.filter(k => /^\d+[\.\s]|\[\d+\]/.test(k));
    if (dsKeys.length === 0) dsKeys = rowKeysAll.slice(4).filter(k => !k.startsWith('_'));

    const OFFSETS = {
        v1: { '행복': 0, 'MBTI': 6, '다중지능': 10, '학교적응력': 18 },
        v2: { '행복': 0, 'MBTI': 6, '다중지능': 14, '학교적응력': 22 },
        v3: { '행복': 0, 'MBTI': 12, '다중지능': 28, '학교적응력': 44 }
    };
    
    function getSubCategoryAvg(catName, subName) {
        if(typeof MAPPING_DATA === 'undefined') return 0;
        if(!MAPPING_DATA[catName] || !MAPPING_DATA[catName][subName]) return 0;
        const qNums = MAPPING_DATA[catName][subName][version];
        if(!qNums) return 0;
        let total = 0, count = 0;
        qNums.forEach(q => {
            const globalIdx = OFFSETS[version][catName] + q - 1;
            if(globalIdx < dsKeys.length) {
                const valStr = row[dsKeys[globalIdx]];
                if(valStr) {
                    const score = extractScore(valStr);
                    if(score !== null) { total += score; count++; }
                }
            }
        });
        return count > 0 ? (total / count) : 0;
    }
    
    function getCategoryAvg(catName) {
        if(typeof MAPPING_DATA === 'undefined') return 0;
        if(!MAPPING_DATA[catName]) return 0;
        let total = 0, count = 0;
        Object.keys(MAPPING_DATA[catName]).forEach(sub => {
            const qNums = MAPPING_DATA[catName][sub][version];
            if(!qNums) return;
            qNums.forEach(q => {
                const globalIdx = OFFSETS[version][catName] + q - 1;
                if(globalIdx < dsKeys.length) {
                    const valStr = row[dsKeys[globalIdx]];
                    if(valStr) {
                        const score = extractScore(valStr);
                        if(score !== null) { total += score; count++; }
                    }
                }
            });
        });
        return count > 0 ? (total / count) : 0;
    }

    const hapAvg = getCategoryAvg('행복');
    const adaptAvg = getCategoryAvg('학교적응력');
    
    function getStars(score) {
        const full = Math.round(score);
        let starStr = "";
        for(let i=0; i<5; i++) {
            starStr += (i < full) ? "★" : "☆";
        }
        return starStr;
    }
    
    const hapStars = hapAvg > 0 ? getStars(hapAvg) : '데이터 없음';
    const adaptStars = adaptAvg > 0 ? getStars(adaptAvg) : '데이터 없음';
    const mbti = row._mbti || "미상";
    
    // Top MI
    let miScores = [];
    if(typeof MAPPING_DATA !== 'undefined' && MAPPING_DATA['다중지능']) {
        Object.keys(MAPPING_DATA['다중지능']).forEach(sub => {
            let sum = 0, c = 0;
            const qNums = MAPPING_DATA['다중지능'][sub][version];
            if(qNums) {
                qNums.forEach(q => {
                    const globalIdx = OFFSETS[version]['다중지능'] + q - 1;
                    if(globalIdx < dsKeys.length) {
                        const valStr = row[dsKeys[globalIdx]];
                        if(valStr) {
                            const score = extractScore(valStr);
                            if(score !== null) { sum += score; c++; }
                        }
                    }
                });
            }
            if(c>0) miScores.push({name: sub, score: sum/c});
        });
    }
    miScores.sort((a,b) => b.score - a.score);
    const topMi = miScores.length > 0 ? miScores.slice(0, 2).map(m => m.name).join(', ') : '부분 누락';

    // Build Page 1
    const hapLabels = ['긍정성', '정서조절', '안정감', '관계성', '유능감', '자율성'];
    const hapData = hapLabels.map(l => getSubCategoryAvg('행복', l));
    
    const miLabels = ['언어', '논리수학', '공간', '신체운동', '음악', '대인관계', '자기성찰', '자연친화'];
    const miChartData = miLabels.map(l => getSubCategoryAvg('다중지능', l));
    
    const adaptLabels = ['교우관계', '교사관계', '학업태도', '규칙준수'];
    const adaptChartData = adaptLabels.map(l => getSubCategoryAvg('학교적응력', l));

    // Build Raw Survey Data for Page 2
    let allHtml = '<table style="width:100%; border-collapse: collapse; font-size: 0.85rem; background:white;">';
    allHtml += '<thead><tr><th style="padding:8px; border-bottom:2px solid #2c3e50; text-align:left; width:70%;">설문 문항</th><th style="padding:8px; border-bottom:2px solid #2c3e50; text-align:left;">학생 응답</th></tr></thead><tbody>';
    
    const rowKeys = Object.keys(row).filter(k => !k.startsWith('_'));
    rowKeys.forEach(key => {
        allHtml += `<tr>
            <td style="padding:8px; border-bottom:1px solid #eee; font-weight:500;">${key}</td>
            <td style="padding:8px; border-bottom:1px solid #eee; color: #2980b9; font-weight:bold;">${row[key]}</td>
        </tr>`;
    });
    allHtml += '</tbody></table>';

    // Render HTML Container
    const container = document.getElementById('documentContainer');
    container.innerHTML = `
        <!-- 페이지 1: 요약 및 차트 -->
        <div class="a4-page">
            <div class="report-header">
                <div class="header-info-box">
                    <div class="header-title-meta">${meta}</div>
                    <div class="header-title-name">${name} 학생 리포트</div>
                </div>
                <div class="header-badges">
                    <div class="badge-item">
                        <span class="badge-label">행복도</span>
                        <span style="font-size:1.1rem; color:#f39c12; text-shadow:1px 1px 1px rgba(0,0,0,0.1); font-weight:bold;">${hapStars}</span>
                    </div>
                    <div class="badge-item">
                        <span class="badge-label">학교적응</span>
                        <span style="font-size:1.1rem; color:#27ae60; text-shadow:1px 1px 1px rgba(0,0,0,0.1); font-weight:bold;">${adaptStars}</span>
                    </div>
                    <div class="badge-item">
                        <span class="badge-label">성향(MBTI)</span>
                        <span class="badge-value mbti">${mbti}</span>
                    </div>
                    <div class="badge-item">
                        <span class="badge-label">강점 다중지능</span>
                        <span class="badge-value mi">${topMi}</span>
                    </div>
                </div>
            </div>
            
            <div class="report-charts-grid">
                <div class="report-chart-card">
                    <h3>행복 요소 평균 프로마일 (방사형)</h3>
                    <div class="canvas-wrapper"><canvas id="reportHapChart"></canvas></div>
                </div>
                <div class="report-chart-card">
                    <h3>다중지능 프로파일 (방사형)</h3>
                    <div class="canvas-wrapper"><canvas id="reportMiChart"></canvas></div>
                </div>
                <div class="report-chart-card full-width">
                    <h3>학교생활 적응력 세부 수준 (막대형)</h3>
                    <div class="canvas-wrapper" style="max-width:none; height:200px;"><canvas id="reportAdaptChart"></canvas></div>
                </div>
            </div>
            <div style="text-align:right; font-size:0.8rem; color:#95a5a6; margin-top:10px;">본 리포트는 설문조사 기반 분석 자료입니다.</div>
        </div>

        <!-- 페이지 2: 원본 데이터 -->
        <div class="a4-page" style="display:flex; flex-direction:column;">
            <div class="raw-data-title">${name} 학생 설문 응답 원본</div>
            <div class="report-raw-data" style="flex:1;">
                ${allHtml}
            </div>
        </div>
    `;

    // Render Charts
    setTimeout(() => {
        if(charts.hap) charts.hap.destroy();
        charts.hap = new Chart(document.getElementById('reportHapChart').getContext('2d'), {
            type: 'radar',
            data: {
                labels: hapLabels,
                datasets: [{
                    label: '학생 개별 행복 요소',
                    data: hapData,
                    backgroundColor: 'rgba(243, 156, 18, 0.3)',
                    borderColor: '#f39c12',
                    pointBackgroundColor: '#f39c12',
                    borderWidth: 2
                }]
            },
            options: { scales: { r: { min: 0, max: 5, ticks: { stepSize: 1 } } }, plugins: { legend: { display: false } } }
        });

        if(charts.mi) charts.mi.destroy();
        charts.mi = new Chart(document.getElementById('reportMiChart').getContext('2d'), {
            type: 'radar',
            data: {
                labels: miLabels,
                datasets: [{
                    label: '학생 다중지능',
                    data: miChartData,
                    backgroundColor: 'rgba(41, 128, 185, 0.3)',
                    borderColor: '#2980b9',
                    pointBackgroundColor: '#2980b9',
                    borderWidth: 2
                }]
            },
            options: { scales: { r: { min: 0, max: 5, ticks: { stepSize: 1 } } }, plugins: { legend: { display: false } } }
        });

        if(charts.adapt) charts.adapt.destroy();
        charts.adapt = new Chart(document.getElementById('reportAdaptChart').getContext('2d'), {
            type: 'bar',
            data: {
                labels: adaptLabels,
                datasets: [{
                    label: '적응 요소 분석',
                    data: adaptChartData,
                    backgroundColor: '#2ecc71',
                    borderRadius: 4
                }]
            },
            options: {
                maintainAspectRatio: false,
                scales: { y: { min: 0, max: 5, ticks: { stepSize: 1 } } }, 
                plugins: { legend: { display: false } } 
            }
        });
    }, 50);
}
