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

let currentZoom = 1.0;

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

// Robust score extraction matching app.js
function extractScore(valStr) {
    if(!valStr) return null;
    const str = String(valStr).trim();
    const digitMatch = str.match(/\d+/);
    if(digitMatch && parseInt(digitMatch[0], 10) <= 5 && parseInt(digitMatch[0], 10) >= 1) {
        return parseInt(digitMatch[0], 10);
    }
    
    if(str.includes("전혀 그렇지 않다") || str.includes("매우 그렇지 않다") || str.includes("매우 부족")) return 1;
    if(str.includes("그렇지 않다") || str.includes("부족")) return 2;
    if(str.includes("보통이다") || str.includes("보통")) return 3;
    if(str.includes("매우 그렇다") || str.includes("매우 우수")) return 5;
    if(str.includes("그렇다") || str.includes("우수")) return 4;

    return null;
}

function getRandomItems(arr, count) {
    const shuffled = [...arr].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
}

function transformWeakness(weakness) {
    if(!weakness) return "";
    if(weakness.includes("필요") || weakness.includes("요망") || weakness.includes("바람")) {
        return weakness; 
    }
    return weakness;
}

// Extract keywords matching app.js logic
function extractKeywordsForStudent(row, version, dsKeys, OFFSETS) {
    let strengthsPool = [];
    let weaknessesPool = [];

    if(typeof MAPPING_DATA !== 'undefined' && typeof KEYWORD_BANK !== 'undefined') {
        Object.keys(MAPPING_DATA).forEach(category => {
            if(category === 'MBTI') return;
            
            Object.keys(MAPPING_DATA[category]).forEach(sub => {
                const qNums = MAPPING_DATA[category][sub][version];
                if(!qNums) return;
                
                let totalScore = 0;
                let count = 0;
                qNums.forEach(qNum => {
                    const globalIdx = OFFSETS[version][category] + qNum - 1;
                    if(globalIdx < dsKeys.length) {
                        const valStr = row[dsKeys[globalIdx]];
                        if(valStr) {
                            const score = extractScore(valStr);
                            if(score !== null) {
                                totalScore += score;
                                count++;
                            }
                        }
                    }
                });
                
                if(count > 0) {
                    const avg = totalScore / count;
                    const banks = KEYWORD_BANK[category][sub];
                    if(!banks) return;
                    
                    if(avg >= 4.0) {
                        if(banks["강점"]) strengthsPool = strengthsPool.concat(getRandomItems(banks["강점"], 3));
                    } else if(avg <= 2.5) {
                        if(banks["보완"]) weaknessesPool = weaknessesPool.concat(getRandomItems(banks["보완"], 2));
                    } else {
                        if(banks["강점"]) strengthsPool = strengthsPool.concat(getRandomItems(banks["강점"], 1));
                    }
                }
            });
        });
    }

    if(strengthsPool.length < 10) {
        strengthsPool = strengthsPool.concat(getRandomItems(allStrengths || [], 15 - strengthsPool.length));
    }
    if(weaknessesPool.length === 0) {
        weaknessesPool = weaknessesPool.concat(getRandomItems(allWeaknesses || [], 3));
    }

    strengthsPool = [...new Set(strengthsPool)];
    weaknessesPool = [...new Set(weaknessesPool)];

    return { strengths: strengthsPool, weaknesses: weaknessesPool };
}

// Generate HTML and Chart configs for a single student
function buildStudentTemplate(index) {
    const row = parsedData[index];
    const name = getStudentName(row);
    const meta = getStudentMeta(row);
    
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
    
    // Initialize student data if missing (matching app.js)
    if(!row._mbti) {
        const mbtiArr = ["ENTP", "ISFJ", "ENFP", "ISTJ", "ESTP", "INFP", "ESFJ", "INTJ", "ENTJ", "ISFP", "ENFJ", "ISTP", "ESTJ", "INTP", "ESFP", "INFJ"];
        row._mbti = mbtiArr[Math.floor(Math.random() * mbtiArr.length)];
    }
    
    if(!row._strengths || !row._weaknesses) {
        const extracted = extractKeywordsForStudent(row, version, dsKeys, OFFSETS);
        row._strengths = extracted.strengths;
        row._weaknesses = extracted.weaknesses.map(transformWeakness);
    }
    
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

    // Build Page 1 Labels and Data
    const hapLabels = ['긍정성', '정서조절', '안정감', '관계성', '유능감', '자율성'];
    const hapData = hapLabels.map(l => getSubCategoryAvg('행복', l));
    const miLabels = ['언어', '논리수학', '공간', '신체운동', '음악', '대인관계', '자기성찰', '자연친화'];
    const miChartData = miLabels.map(l => getSubCategoryAvg('다중지능', l));
    const adaptLabels = ['교우관계', '교사관계', '학업태도', '규칙준수'];
    const adaptChartData = adaptLabels.map(l => getSubCategoryAvg('학교적응력', l));


    // Build Raw Survey Data across multiple Pages (Chunking)
    const validKeys = Object.keys(row).filter(k => !k.startsWith('_') && !/^Col\d*$/i.test(k));
    const PAGE_LIMIT = 26; // 약 26개의 문항이 한 A4 페이지에 적당함
    let surveyPagesHtml = '';

    for (let i = 0; i < validKeys.length; i += PAGE_LIMIT) {
        let chunkKeys = validKeys.slice(i, i + PAGE_LIMIT);
        
        let chunkHtml = '<table style="width:100%; border-collapse: collapse; font-size: 0.85rem; background:white;">';
        chunkHtml += '<thead><tr><th style="padding:8px; border-bottom:2px solid #2c3e50; text-align:left; width:70%;">설문 문항</th><th style="padding:8px; border-bottom:2px solid #2c3e50; text-align:left;">학생 응답</th></tr></thead><tbody>';
        
        chunkKeys.forEach(key => {
            let val = row[key] !== undefined && row[key] !== null ? row[key] : '';
            chunkHtml += `<tr>
                <td style="padding:8px; border-bottom:1px solid #eee; font-weight:500;">${key}</td>
                <td style="padding:8px; border-bottom:1px solid #eee; color: #2980b9; font-weight:bold;">${val}</td>
            </tr>`;
        });
        chunkHtml += '</tbody></table>';
        
        let pageTitle = i === 0 ? `<div class="raw-data-title">${name} 학생 설문 응답 원본</div>` : `<div class="raw-data-title" style="border-bottom:none; margin-bottom:10px;">${name} 학생 설문 응답 원본 (계속)</div>`;
        
        surveyPagesHtml += `
        <div class="a4-page" style="display:flex; flex-direction:column;">
            ${pageTitle}
            <div class="report-raw-data" style="flex:1;">
                ${chunkHtml}
            </div>
        </div>`;
    }

    const html = `
        <!-- 페이지 1: 요약 및 차트 -->
        <div class="a4-page">
            <div class="report-header">
                <!-- 좌측: 학년반번호이름 / 학생이름 -->
                <div class="header-column left">
                    <div class="header-title-meta">${meta} ${name}</div>
                    <div class="header-title-name">${name} 학생</div>
                </div>

                <!-- 중앙: MBTI / 행복도 -->
                <div class="header-column center">
                    <div class="badge-item">
                        <span class="badge-label">성향(MBTI)</span>
                        <div class="badge-value mbti">${mbti}</div>
                    </div>
                    <div class="badge-item">
                        <span class="badge-label">행복도</span>
                        <div style="font-size:1.15rem; color:#f39c12; font-weight:bold; text-shadow:1px 1px 1px rgba(0,0,0,0.1);">${hapStars}</div>
                    </div>
                </div>

                <!-- 우측: 강점 다중지능 / 학교적응도 -->
                <div class="header-column right">
                    <div class="badge-item">
                        <span class="badge-label">강점 다중지능</span>
                        <div class="badge-value mi" style="font-size:0.9rem; padding:4px 10px;">${topMi}</div>
                    </div>
                    <div class="badge-item">
                        <span class="badge-label">학교적응도</span>
                        <div style="font-size:1.15rem; color:#27ae60; font-weight:bold; text-shadow:1px 1px 1px rgba(0,0,0,0.1);">${adaptStars}</div>
                    </div>
                </div>
            </div>
            
            <div class="report-charts-grid">
                <div class="report-chart-card">
                    <h3>행복 요소 평균 프로필 (방사형)</h3>
                    <div class="canvas-wrapper"><canvas id="reportHapChart_${index}"></canvas></div>
                </div>
                <div class="report-chart-card">
                    <h3>다중지능 프로파일 (방사형)</h3>
                    <div class="canvas-wrapper"><canvas id="reportMiChart_${index}"></canvas></div>
                </div>
                <div class="report-chart-card full-width">
                    <h3>학교생활 적응력 세부 수준 (막대형)</h3>
                    <div class="canvas-wrapper" style="max-width:none; height:200px;"><canvas id="reportAdaptChart_${index}"></canvas></div>
                </div>
            </div>
            <div style="text-align:right; font-size:0.8rem; color:#95a5a6; margin-top:10px;">본 리포트는 설문조사 기반 분석 자료입니다.</div>
        </div>

        <!-- 이어지는 페이지들 (원본 데이터) -->
        ${surveyPagesHtml}
    `;

    return {
        html,
        index,
        hapLabels, hapData,
        miLabels, miChartData,
        adaptLabels, adaptChartData
    };
}

function renderStudentCharts(dataInfo) {
    const idx = dataInfo.index;
    
    if(charts[`hap_${idx}`]) charts[`hap_${idx}`].destroy();
    charts[`hap_${idx}`] = new Chart(document.getElementById(`reportHapChart_${idx}`).getContext('2d'), {
        type: 'radar',
        data: {
            labels: dataInfo.hapLabels,
            datasets: [{
                label: '학생 개별 행복 요소',
                data: dataInfo.hapData,
                backgroundColor: 'rgba(243, 156, 18, 0.3)',
                borderColor: '#f39c12',
                pointBackgroundColor: '#f39c12',
                borderWidth: 2
            }]
        },
        options: { scales: { r: { min: 0, max: 5, ticks: { stepSize: 1 } } }, plugins: { legend: { display: false } } }
    });

    if(charts[`mi_${idx}`]) charts[`mi_${idx}`].destroy();
    charts[`mi_${idx}`] = new Chart(document.getElementById(`reportMiChart_${idx}`).getContext('2d'), {
        type: 'radar',
        data: {
            labels: dataInfo.miLabels,
            datasets: [{
                label: '학생 다중지능',
                data: dataInfo.miChartData,
                backgroundColor: 'rgba(41, 128, 185, 0.3)',
                borderColor: '#2980b9',
                pointBackgroundColor: '#2980b9',
                borderWidth: 2
            }]
        },
        options: { scales: { r: { min: 0, max: 5, ticks: { stepSize: 1 } } }, plugins: { legend: { display: false } } }
    });

    if(charts[`adapt_${idx}`]) charts[`adapt_${idx}`].destroy();
    charts[`adapt_${idx}`] = new Chart(document.getElementById(`reportAdaptChart_${idx}`).getContext('2d'), {
        type: 'bar',
        data: {
            labels: dataInfo.adaptLabels,
            datasets: [{
                label: '적응 요소 분석',
                data: dataInfo.adaptChartData,
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
}

function renderStudentPage(index) {
    document.getElementById('studentSelector').value = index;
    document.getElementById('pageIndicator').innerText = `학생 ${index + 1} / ${parsedData.length}`;
    document.getElementById('bottomIndicator').innerText = index + 1;
    document.getElementById('btnPrev').disabled = (index === 0);
    document.getElementById('btnNext').disabled = (index === parsedData.length - 1);
    
    // Clear old charts
    Object.keys(charts).forEach(k => { if(charts[k]) charts[k].destroy(); });
    charts = {};

    const dataInfo = buildStudentTemplate(index);
    const container = document.getElementById('documentContainer');
    container.innerHTML = dataInfo.html;

    setTimeout(() => {
        renderStudentCharts(dataInfo);
    }, 50);
}

window.renderAllStudents = function() {
    document.getElementById('studentSelector').value = "";
    document.getElementById('pageIndicator').innerText = `전체 확인 모드 (${parsedData.length}명)`;
    document.getElementById('bottomIndicator').innerText = `전체`;
    document.getElementById('btnPrev').disabled = true;
    document.getElementById('btnNext').disabled = true;

    // Clear old charts
    Object.keys(charts).forEach(k => { if(charts[k]) charts[k].destroy(); });
    charts = {};

    const container = document.getElementById('documentContainer');
    container.innerHTML = "";

    let allHtml = "";
    let templatesData = [];

    parsedData.forEach((row, i) => {
        const dataInfo = buildStudentTemplate(i);
        allHtml += dataInfo.html;
        templatesData.push(dataInfo);
    });

    container.innerHTML = allHtml;

    setTimeout(() => {
        templatesData.forEach(dataInfo => {
            renderStudentCharts(dataInfo);
        });
    }, 100);
};
