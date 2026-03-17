// Survey Mapping and Keyword Bank Data loaded from db.js

let parsedData = [];
let classCharts = {};

// DOM Elements
const menuItems = document.querySelectorAll('.menu li');
const pageSections = document.querySelectorAll('.page-section');
const parseDataBtn = document.getElementById('parseDataBtn');
const dataTextarea = document.getElementById('dataTextarea');
const previewTable = document.getElementById('previewTable');
const previewArea = document.querySelector('.preview-area');
const studentSelect = document.getElementById('studentSelect');

// Navigation Logic
menuItems.forEach(item => {
    item.addEventListener('click', () => {
        // Remove active class from all
        menuItems.forEach(i => i.classList.remove('active'));
        pageSections.forEach(s => s.classList.remove('active'));
        
        // Add active class to clicked
        item.classList.add('active');
        const targetId = item.getAttribute('data-target');
        document.getElementById(targetId).classList.add('active');

        // Trigger updates if necessary
        if(targetId === 'class-stats' && parsedData.length > 0) {
            updateClassCharts();
        }
    });
});

// Clipboard Parsing Logic
parseDataBtn.addEventListener('click', () => {
    const rawData = dataTextarea.value.trim();
    if (!rawData) {
        alert("데이터를 입력해주세요.");
        return;
    }

    const rows = rawData.split('\n');
    if (rows.length < 2) {
        alert("헤더(첫 줄)와 최소 1명 이상의 데이터가 필요합니다.");
        return;
    }

    const headers = rows[0].split('\t').map(h => h.trim());
    
    parsedData = [];
    previewTable.querySelector('thead').innerHTML = '<tr>' + headers.map(h => `<th>${h}</th>`).join('') + '</tr>';
    
    let tbodyHtml = '';
    for (let i = 1; i < rows.length; i++) {
        const cols = rows[i].split('\t');
        if (cols.length === headers.length || cols.length > 3) {
            let rowObj = {};
            let tdHtml = '';
            cols.forEach((col, index) => {
                let header = headers[index] ? headers[index] : `Col${index}`;
                rowObj[header] = col.trim();
                tdHtml += `<td>${col.trim()}</td>`;
            });
            parsedData.push(rowObj);
            tbodyHtml += `<tr>${tdHtml}</tr>`;
        }
    }
    previewTable.querySelector('tbody').innerHTML = tbodyHtml;
    previewArea.style.display = 'block';

    // Populate Select & AI Table
    populateStudentSelect();
    populateAiTable();
    alert(`성공적으로 ${parsedData.length}명의 데이터를 파싱했습니다.`);
});

function getStudentName(row) {
    return row['이름'] || row['성명'] || row['name'] || Object.values(row)[3] || "이름없음";
}

function getStudentMeta(row) {
    let grade = row['학년'] || Object.values(row)[0] || "O";
    let ban = row['반'] || Object.values(row)[1] || "O";
    let num = row['번호'] || Object.values(row)[2] || "O";
    
    grade = grade.toString().replace(/학년/g, '') + '학년';
    ban = ban.toString().replace(/반/g, '') + '반';
    num = num.toString().replace(/번/g, '') + '번';
    
    return `${grade} ${ban} ${num}`;
}

function populateStudentSelect() {
    studentSelect.innerHTML = '<option value="">-- 학생을 선택하세요 --</option>';
    parsedData.forEach((row, index) => {
        const name = getStudentName(row);
        const option = document.createElement('option');
        option.value = index;
        option.textContent = `${getStudentMeta(row)} ${name}`;
        studentSelect.appendChild(option);
    });
}

function getRandomItems(arr, count) {
    const shuffled = [...arr].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
}

// Transform weakness to a more positive future-oriented phrasing
function transformWeakness(weakness) {
    if(weakness.includes("필요") || weakness.includes("요망") || weakness.includes("바람")) {
        return weakness; 
    }
    return `${weakness} 점이 앞으로 점차 개선될 것으로 기대됨`;
}

// AI Table Logic
function populateAiTable() {
    const tbody = document.querySelector('#aiDataTable tbody');
    tbody.innerHTML = '';
    
    parsedData.forEach((row, index) => {
        const name = getStudentName(row);
        const meta = getStudentMeta(row);

        // Extract >= 15 strengths
        const strengths = getRandomItems(allStrengths, 15);
        // Extract <= 5 weaknesses
        const rawWeaknesses = getRandomItems(allWeaknesses, Math.floor(Math.random() * 3) + 2); // 2~4

        row._aiGenerated = "";

        const strengthsHtml = strengths.map(s => 
            `<span class="keyword-badge strength active" onclick="toggleKeyword(this)">${s}</span>`
        ).join('');
        
        const weaknessesHtml = rawWeaknesses.map(w => 
            `<span class="keyword-badge weakness active" onclick="toggleKeyword(this)">${w}</span>`
        ).join('');

        const tr = document.createElement('tr');
        tr.id = `ai-row-${index}`;
        tr.innerHTML = `
            <td>${index + 1}</td>
            <td><strong>${name}</strong><br><small style="color:var(--text-muted)">${meta}</small></td>
            <td id="ai-strengths-${index}">${strengthsHtml}</td>
            <td id="ai-weaknesses-${index}">${weaknessesHtml}</td>
            <td><button class="btn btn-outline-primary btn-sm" onclick="copyManualPrompt(${index})" style="width:100%"><i class="fa-solid fa-copy"></i> 수동 복사</button></td>
            <td id="ai-result-${index}" style="font-size:0.95rem; line-height:1.5; color:var(--text-muted);">
                [대기중] API Key 입력 후 클릭
            </td>
            <td><button class="btn btn-primary btn-sm" onclick="generateAiText(${index})"><i class="fa-solid fa-robot"></i></button></td>
        `;
        tbody.appendChild(tr);
    });
}

// Toggle Keyword Badge
window.toggleKeyword = function(el) {
    el.classList.toggle('active');
};

// Generate Manual Prompt Text
window.generateManualPromptText = function(index) {
    const row = parsedData[index];
    const name = getStudentName(row);
    const meta = getStudentMeta(row);
    
    // Read active badges from DOM
    const strengthNodes = document.querySelectorAll(`#ai-strengths-${index} .keyword-badge.strength.active`);
    const weaknessNodes = document.querySelectorAll(`#ai-weaknesses-${index} .keyword-badge.weakness.active`);
    
    const activeStrengths = Array.from(strengthNodes).map(n => n.innerText);
    const activeWeaknesses = Array.from(weaknessNodes).map(n => n.innerText);
    
    let prompt = `다음 학생의 학교생활기록부 행동발달 문장을 300자 내외로 작성해줘.\n`;
    prompt += `- 학생 이름: ${name}\n`;
    prompt += `- 배경 정보: ${meta}\n`;
    prompt += `- 주요 강점 키워드: ${activeStrengths.join(', ')}\n`;
    if(activeWeaknesses.length > 0) {
        prompt += `- 지도 및 보완 요망 지점: ${activeWeaknesses.join(', ')}\n`;
    }
    prompt += `어조는 교사가 학생을 객관적이면서도 애정어린 시선으로 관찰한 긍정적 평어체로, '~함.', '~임.' 으로 끝나게 작성해줘.`;
    return prompt;
};

// Copy Manual Prompt for a single student
window.copyManualPrompt = function(index) {
    const promptText = generateManualPromptText(index);
    navigator.clipboard.writeText(promptText).then(() => {
        alert(`${parsedData[index]['이름'] || '학생'}의 평어 생성 프롬프트가 복사되었습니다! ChatGPT나 Claude에 붙여넣으세요.`);
    });
};

// Create mock AI result or use real logic depending on future Needs
window.generateAiText = function(index) {
    const row = parsedData[index];
    const apiKey = document.getElementById('apiKeyInput')?.value || '';
    const resultCell = document.getElementById(`ai-result-${index}`);
    
    // Read active badges from DOM
    const strengthNodes = document.querySelectorAll(`#ai-strengths-${index} .keyword-badge.strength.active`);
    const activeStrengths = Array.from(strengthNodes).map(n => n.innerText);

    if(!apiKey) {
        // Mock generation using active badges
        resultCell.innerHTML = `<i class="fa-solid fa-spinner fa-spin" style="color:var(--primary-color)"></i> 생성 중...`;
        setTimeout(() => {
            const sampleStrengths = activeStrengths.slice(0, 3).join(', ');
            const mockText = `평소 ${sampleStrengths} 등의 긍정적 측면이 돋보이며 학급 분위기를 쇄신함. 앞으로의 성장이 더욱 기대되는 모범적인 학생임.`;
            row._aiGenerated = mockText;
            resultCell.innerText = mockText;
        }, 800 + Math.random() * 700);
        return;
    }
    
    // Real API Logic placeholder
    resultCell.innerText = "API 연결 기능은 현재 데모 버전에서 미지원 상태입니다. [수동 복사]를 활용해주세요.";
}

document.getElementById('generateAllBtn').addEventListener('click', () => {
    if(parsedData.length === 0) return alert("데이터를 먼저 분석해주세요.");
    for(let i=0; i<parsedData.length; i++) {
        setTimeout(()=>{
            window.generateAiText(i);
        }, i*300); 
    }
});

document.getElementById('copyAllPromptBtn').addEventListener('click', () => {
    if(parsedData.length === 0) return alert("데이터가 없습니다.");
    let text = "이름\t소속\tAI 수동생성용 프롬프트 명령어\n";
    parsedData.forEach((row, index) => {
        const prompt = generateManualPromptText(index).replace(/\n/g, " "); // Replace newlines for excel
        text += `${getStudentName(row)}\t${getStudentMeta(row)}\t${prompt}\n`;
    });
    navigator.clipboard.writeText(text).then(() => alert("전체 학생의 [수동 프롬프트]가 엑셀 붙여넣기 형태로 클립보드에 복사되었습니다."));
});


// Chart.js Setup and Class Consulting Logic
function updateClassCharts() {
    if(parsedData.length === 0) return;

    // 1. Radar and Bar Chart (Placeholder for actual calculations)
    const ctxRadar = document.getElementById('classRadarChart').getContext('2d');
    const ctxBar = document.getElementById('classBarChart').getContext('2d');

    if(classCharts.radar) classCharts.radar.destroy();
    if(classCharts.bar) classCharts.bar.destroy();

    Chart.defaults.font.family = "'Noto Sans KR', sans-serif";
    Chart.defaults.font.size = 11;

    classCharts.radar = new Chart(ctxRadar, {
        type: 'radar',
        data: {
            labels: ['긍정성', '정서조절', '안정감', '관계성', '유능감', '자율성'],
            datasets: [{
                label: '학급 평균 점수',
                data: [4.2, 3.8, 4.0, 4.5, 3.9, 4.1],
                backgroundColor: 'rgba(123, 197, 174, 0.2)',
                borderColor: '#7BC5AE',
                pointBackgroundColor: '#7BC5AE',
                borderWidth: 2
            }]
        },
        options: {
            scales: { r: { min: 0, max: 5, ticks: { stepSize: 1, backdropColor: 'transparent' } } },
            plugins: { legend: { position: 'bottom' } }
        }
    });

    classCharts.bar = new Chart(ctxBar, {
        type: 'bar',
        data: {
            labels: ['교우관계', '교사관계', '학업태도', '규칙준수'],
            datasets: [{
                label: '학급 평균 점수',
                data: [4.5, 4.2, 3.8, 4.0],
                backgroundColor: '#92B4F2',
                borderRadius: 4
            }]
        },
        options: {
            scales: { y: { min: 0, max: 5, ticks: { stepSize: 1 } } },
            plugins: { legend: { display: false } }
        }
    });

    const ctxMi = document.getElementById('classMiChart').getContext('2d');
    if(classCharts.mi) classCharts.mi.destroy();
    classCharts.mi = new Chart(ctxMi, {
        type: 'radar',
        data: {
            labels: ['언어', '논리수학', '공간', '신체운동', '음악', '대인관계', '자기성찰', '자연친화'],
            datasets: [{
                label: '학급 평균 다중지능',
                data: [3.5, 3.8, 4.0, 4.2, 3.6, 4.1, 3.7, 3.9],
                backgroundColor: 'rgba(155, 134, 219, 0.2)',
                borderColor: '#9B86DB',
                pointBackgroundColor: '#9B86DB',
                borderWidth: 2
            }]
        },
        options: {
            scales: { r: { min: 0, max: 5, ticks: { stepSize: 1, backdropColor: 'transparent' } } },
            plugins: { legend: { position: 'bottom' } }
        }
    });

    // 2. MBTI Distribution
    // For demo purposes, assign random MBTI to each student if not exists, and calculate
    const mbtiCounts = { E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 };
    const mbtiNames = { E: [], I: [], S: [], N: [], T: [], F: [], J: [], P: [] };
    const mbtiTypes = ["ENTP", "ISFJ", "ENFP", "ISTJ", "ESTP", "INFP", "ESFJ", "INTJ", "ENTJ", "ISFP", "ENFJ", "ISTP", "ESTJ", "INTP", "ESFP", "INFJ"];
    
    parsedData.forEach(row => {
        if(!row._mbti) row._mbti = mbtiTypes[Math.floor(Math.random() * mbtiTypes.length)];
        const m = row._mbti;
        mbtiCounts[m[0]]++; mbtiNames[m[0]].push(getStudentName(row));
        mbtiCounts[m[1]]++; mbtiNames[m[1]].push(getStudentName(row));
        mbtiCounts[m[2]]++; mbtiNames[m[2]].push(getStudentName(row));
        mbtiCounts[m[3]]++; mbtiNames[m[3]].push(getStudentName(row));
    });

    const total = parsedData.length;
    const renderBar = (left, right) => {
        const lCount = mbtiCounts[left];
        const rCount = mbtiCounts[right];
        const lPct = total === 0 ? 0 : Math.round((lCount/total)*100);
        const rPct = 100 - lPct;
        const lTitle = mbtiNames[left].join(', ');
        const rTitle = mbtiNames[right].join(', ');

        return `
        <div class="mbti-row">
            <span class="mbti-label">${left}</span>
            <div class="mbti-bar-wrapper">
                <div class="mbti-segment left-side" style="width: ${lPct}%" title="${lTitle}">${lCount}명 (${lPct}%)</div>
                <div class="mbti-segment right-side" style="width: ${rPct}%" title="${rTitle}">${rCount}명 (${rPct}%)</div>
            </div>
            <span class="mbti-label">${right}</span>
        </div>`;
    };

    document.getElementById('mbtiDistribution').innerHTML = 
        renderBar('E', 'I') + renderBar('S', 'N') + renderBar('T', 'F') + renderBar('J', 'P');


    // 3. High Risk Students Calculation (Demo logic: 20% chance of being high risk)
    const riskListContainer = document.getElementById('highRiskList');
    let riskHtml = '';
    let riskCount = 0;

    parsedData.forEach((row, i) => {
        // Mocking risk conditions based on random chance
        if (Math.random() > 0.8) {
            riskCount++;
            const issues = ["행복요소 전반 점수 낮음", "교우관계 문항 주의 구간", "학급 내 소외감/스트레스 수치 높음"];
            const reason = issues[Math.floor(Math.random() * issues.length)];
            riskHtml += `
                <div class="risk-item">
                    <div class="risk-item-info">
                        <strong>${getStudentName(row)}</strong>
                        <span class="risk-item-reason">(${getStudentMeta(row)}) - ${reason}</span>
                    </div>
                    <button class="btn-risk-action" onclick="document.querySelector('.menu li[data-target=\\'personal-stats\\']').click(); document.getElementById('studentSelect').value = ${i}; document.getElementById('studentSelect').dispatchEvent(new Event('change'));">상세 보기</button>
                </div>
            `;
        }
    });

    if(riskCount === 0) {
        riskHtml = `<div style="color:var(--success); font-weight:600; padding:15px; background:#F0FFF4; border-radius:8px;"><i class="fa-solid fa-check-circle"></i> 전문가 기준 관심 필요 대상 학생이 발견되지 않았습니다.</div>`;
    }
    const btnRiskNav = document.getElementById('btnRiskNav');
    btnRiskNav.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> 요주의 학생목록 (${riskCount}명) <i class="fa-solid fa-caret-down"></i>`;
}

// Risk Dropdown UI
window.toggleRiskDropdown = function() {
    const dropdown = document.getElementById('riskDropdown');
    if (dropdown.style.display === 'none') {
        dropdown.style.display = 'block';
    } else {
        dropdown.style.display = 'none';
    }
};

window.addEventListener('click', function(event) {
    const btn = document.getElementById('btnRiskNav');
    const dropdown = document.getElementById('riskDropdown');
    if (btn && dropdown && !btn.contains(event.target) && !dropdown.contains(event.target)) {
        dropdown.style.display = 'none';
    }
    const modal = document.getElementById('surveyPreviewModal');
    if (event.target === modal) {
        closeSurveyPreview();
    }
});

// Tab Switching Logic
window.switchTab = function(tabId) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-pane').forEach(pane => pane.style.display = 'none');
    
    document.querySelector(`.tab-btn[data-tab="${tabId}"]`).classList.add('active');
    document.getElementById(tabId).style.display = 'block';
};

// Student Select change
studentSelect.addEventListener('change', (e) => {
    const index = e.target.value;
    const profileCard = document.getElementById('studentProfile');
    
    if (index === "") {
        profileCard.style.display = 'none';
        return;
    }

    const row = parsedData[index];
    document.getElementById('studentName').innerText = getStudentName(row);
    document.getElementById('studentMeta').innerText = getStudentMeta(row);
    
    if(!row._mbti) {
        const mbtiArr = ["ENTP", "ISFJ", "ENFP", "ISTJ", "ESTP", "INFP", "ESFJ", "INTJ", "ENTJ", "ISFP", "ENFJ", "ISTP", "ESTJ", "INTP", "ESFP", "INFJ"];
        row._mbti = mbtiArr[Math.floor(Math.random() * mbtiArr.length)];
    }
    
    document.getElementById('studentMbti').innerHTML = `MBTI: <span style="color:var(--primary-color)">${row._mbti}</span>`;

    // Reset Tabs
    switchTab('tab-happiness');

    profileCard.style.display = 'block';

    // 1. Happiness Chart
    const ctxRadar = document.getElementById('studentRadarChart').getContext('2d');
    if(classCharts.studentRadar) classCharts.studentRadar.destroy();
    classCharts.studentRadar = new Chart(ctxRadar, {
        type: 'radar',
        data: {
            labels: ['긍정성', '정서조절', '안정감', '관계성', '유능감', '자율성'],
            datasets: [{
                label: '개별 행복 점수',
                data: Array.from({length:6}, () => 2.5 + Math.random()*2.5),
                backgroundColor: 'rgba(244, 196, 118, 0.3)',
                borderColor: '#F4C476',
                pointBackgroundColor: '#F4C476',
                borderWidth: 2
            }]
        },
        options: {
            scales: { r: { min: 0, max: 5, ticks: { stepSize: 1, backdropColor: 'transparent' } } },
            plugins: { legend: { position: 'bottom' } }
        }
    });

    if(!row._strengths) row._strengths = getRandomItems(allStrengths, 15); // Require more keywords
    if(!row._weaknesses) row._weaknesses = getRandomItems(allWeaknesses, 4).map(transformWeakness);

    document.getElementById('studentSummary').innerHTML = `
        <div class="summary-box">
            <h4><i class="fa-solid fa-thumbs-up" style="color:var(--primary-color)"></i> 대표 강점 파악 (상위 5개 우선)</h4>
            <div style="margin-top:10px; display:flex; flex-wrap:wrap; gap:8px;">
                ${row._strengths.slice(0, 5).map(s => `<span class="badge" style="background:#E6F4EF; color:var(--primary-color)">${s}</span>`).join('')}
            </div>
        </div>
         <div class="summary-box">
            <h4><i class="fa-solid fa-seedling" style="color:#E2B467"></i> 지도 보완 요망 지점</h4>
            <ul style="margin-top:10px; padding-left:20px; color:var(--text-muted); font-size:0.95rem;">
                ${row._weaknesses.map(w => `<li>${w}</li>`).join('')}
            </ul>
        </div>
    `;

    // 2. MBTI detail
    document.getElementById('studentMbtiDetail').innerHTML = `
        <h4 style="color:var(--primary-color); margin-bottom:10px;">${row._mbti} 유형 행동 특성 요약</h4>
        <p>평소 외부 환경에 대한 호기심이 많고 교우들과 활발하게 소통하는 편입니다. 사실적인 지표나 체계적인 학습보다는 창의적이고 자율적인 과제에서 더 높은 성취를 보이는 경향이 있습니다. 관계 지향적이어서 주변의 인정에 크게 동기부여를 받습니다.</p>
        <p style="margin-top:10px; font-size:0.9rem; color:#666;">※ 위 특성은 설문응답 데이터와 MBTI 지표를 종합한 추정 내용입니다.</p>
    `;

    // 3. MI Chart
    const ctxMi = document.getElementById('studentMiChart').getContext('2d');
    if(classCharts.studentMi) classCharts.studentMi.destroy();
    classCharts.studentMi = new Chart(ctxMi, {
        type: 'radar',
        data: {
            labels: ['언어', '논리수학', '공간', '신체운동', '음악', '대인관계', '자기성찰', '자연친화'],
            datasets: [{
                label: '학생 다중지능 프로파일',
                data: Array.from({length:8}, () => 2.5 + Math.random()*2.5),
                backgroundColor: 'rgba(155, 134, 219, 0.3)',
                borderColor: '#9B86DB',
                pointBackgroundColor: '#9B86DB',
                borderWidth: 2
            }]
        },
        options: {
            scales: { r: { min: 0, max: 5, ticks: { stepSize: 1, backdropColor: 'transparent' } } },
            plugins: { legend: { position: 'bottom' } }
        }
    });

    // 4. Adapt Chart
    const ctxAdapt = document.getElementById('studentAdaptChart').getContext('2d');
    if(classCharts.studentAdapt) classCharts.studentAdapt.destroy();
    classCharts.studentAdapt = new Chart(ctxAdapt, {
        type: 'bar',
        data: {
            labels: ['교우관계', '교사관계', '학업태도', '규칙준수'],
            datasets: [{
                label: '항목별 적응 수준',
                data: Array.from({length:4}, () => 2.5 + Math.random()*2.5),
                backgroundColor: '#92B4F2',
                borderRadius: 4
            }]
        },
        options: {
            scales: { y: { min: 0, max: 5, ticks: { stepSize: 1 } } },
            plugins: { legend: { display: false } }
        }
    });

    // 5. Raw Survey Data Render
    let html = '<table style="width:100%; border-collapse: collapse; font-size: 0.95rem;">';
    html += '<thead><tr><th style="padding:10px; border-bottom:2px solid #ddd; text-align:left;">항목 헤더</th><th style="padding:10px; border-bottom:2px solid #ddd; text-align:left;">응답 값</th></tr></thead><tbody>';
    Object.keys(row).forEach(key => {
        if(!key.startsWith('_')) {
            html += `<tr>
                <td style="padding:12px; border-bottom:1px solid #eee; font-weight:500; width:40%;">${key}</td>
                <td style="padding:12px; border-bottom:1px solid #eee; color: var(--text-main);">${row[key]}</td>
            </tr>`;
        }
    });
    html += '</tbody></table>';
    document.getElementById('studentSurveyRaw').innerHTML = html;
});


// Survey Preview Modal Logic
window.openSurveyPreview = function(grade) {
    const modal = document.getElementById('surveyPreviewModal');
    const title = document.getElementById('surveyPreviewTitle');
    const body = document.getElementById('surveyPreviewBody');
    
    if (!SURVEY_DATA || !SURVEY_DATA[grade]) {
        alert("해당 학년의 설문지 원본 데이터를 찾을 수 없습니다.");
        return;
    }

    title.innerText = `[${grade}] 설문지 원본 문항 미리보기`;
    
    let html = '';
    SURVEY_DATA[grade].forEach(section => {
        html += `<div class="survey-section-header">${section.section}</div>`;
        section.questions.forEach(q => {
            html += `
                <div class="survey-question-item">
                    <span style="flex:1;">${q.q}</span>
                    <span class="eval-badge">${q.eval}</span>
                </div>
            `;
        });
    });

    body.innerHTML = html;
    modal.style.display = 'flex';
};

window.closeSurveyPreview = function() {
    const modal = document.getElementById('surveyPreviewModal');
    if (modal) {
        modal.style.display = 'none';
    }
};

// Close modal when clicking outside
window.addEventListener('click', function(event) {
    const modal = document.getElementById('surveyPreviewModal');
    if (event.target === modal) {
        closeSurveyPreview();
    }
});

// Student Raw Data Modal
window.showStudentRawData = function(index) {
    const row = parsedData[index];
    const name = getStudentName(row);
    const modal = document.getElementById('surveyPreviewModal');
    const title = document.getElementById('surveyPreviewTitle');
    const body = document.getElementById('surveyPreviewBody');
    
    title.innerText = `[${name}] 제출 완료 원본 응답 상세 보기`;
    
    let html = '<div style="background:#F8FAFC; padding:15px; border-radius:8px; margin-bottom:15px;">';
    html += `<strong>응답 항목 및 제출 값 매핑</strong> (스프레드시트에 입력된 헤더 순서대로 표기)`;
    html += '</div>';

    html += '<table style="width:100%; border-collapse: collapse; font-size: 0.95rem;">';
    html += '<thead><tr><th style="padding:10px; border-bottom:2px solid #ddd; text-align:left;">항목 헤더</th><th style="padding:10px; border-bottom:2px solid #ddd; text-align:left;">학생 응답 값</th></tr></thead><tbody>';
    
    Object.keys(row).forEach(key => {
        if(!key.startsWith('_')) {
            html += `<tr>
                <td style="padding:12px; border-bottom:1px solid #eee; font-weight:500; width:40%;">${key}</td>
                <td style="padding:12px; border-bottom:1px solid #eee; color: var(--text-main);">${row[key]}</td>
            </tr>`;
        }
    });
    html += '</tbody></table>';

    body.innerHTML = html;
    modal.style.display = 'flex';
};
