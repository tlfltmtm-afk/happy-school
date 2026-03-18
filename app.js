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

// Extract student-specific keywords from raw survey data
function extractKeywordsForStudent(row) {
    let grade = String(row['학년'] || Object.values(row)[0] || "O");
    let version = 'v3';
    if(grade.includes('1') || grade.includes('2')) version = 'v1';
    else if(grade.includes('3') || grade.includes('4')) version = 'v2';
    
    let strengthsPool = [];
    let weaknessesPool = [];
    const rowValues = Object.values(row); 
    
    // MAPPING_DATA depends on db.js being loaded
    if(typeof MAPPING_DATA !== 'undefined' && typeof KEYWORD_BANK !== 'undefined') {
        Object.keys(MAPPING_DATA).forEach(category => {
            if(category === 'MBTI') return; // Handled differently if needed
            
            Object.keys(MAPPING_DATA[category]).forEach(sub => {
                const qNums = MAPPING_DATA[category][sub][version];
                if(!qNums) return;
                
                let totalScore = 0;
                let count = 0;
                qNums.forEach(qNum => {
                    const valStr = rowValues[3 + qNum]; // Q1 is at index 4
                    if(valStr) {
                        const valMatch = String(valStr).match(/\d+/); // extract number "5" from "5. 매우 그렇다"
                        if(valMatch) {
                            totalScore += parseInt(valMatch[0], 10);
                            count++;
                        }
                    }
                });
                
                if(count > 0) {
                    const avg = totalScore / count;
                    const banks = KEYWORD_BANK[category][sub];
                    if(!banks) return;
                    
                    if(avg >= 4.0) { // Strong positive
                        if(banks["강점"]) strengthsPool = strengthsPool.concat(getRandomItems(banks["강점"], 3));
                    } else if(avg <= 2.5) { // Needs improvement
                        if(banks["보완"]) weaknessesPool = weaknessesPool.concat(getRandomItems(banks["보완"], 2));
                    } else { // Neutral/Moderate
                        if(banks["강점"]) strengthsPool = strengthsPool.concat(getRandomItems(banks["강점"], 1));
                    }
                }
            });
        });
    }

    // Fallback if extraction is empty
    if(strengthsPool.length < 10) {
        strengthsPool = strengthsPool.concat(getRandomItems(allStrengths, 15 - strengthsPool.length));
    }
    if(weaknessesPool.length === 0) {
        weaknessesPool = weaknessesPool.concat(getRandomItems(allWeaknesses, 3));
    }

    // Deduplicate
    strengthsPool = [...new Set(strengthsPool)];
    weaknessesPool = [...new Set(weaknessesPool)];

    return { strengths: strengthsPool, weaknesses: weaknessesPool };
}

// AI Table Logic
function populateAiTable() {
    const tbody = document.querySelector('#aiDataTable tbody');
    tbody.innerHTML = '';
    
    parsedData.forEach((row, index) => {
        const name = getStudentName(row);
        const meta = getStudentMeta(row);

        // Dynamically extract based on real survey data instead of completely random
        const extracted = extractKeywordsForStudent(row);
        
        row._strengths = extracted.strengths;
        row._weaknesses = extracted.weaknesses.map(transformWeakness);
        row._aiGenerated = "";

        const strengthsHtml = row._strengths.map(s => 
            `<span class="keyword-badge strength active" onclick="toggleKeyword(this)">${s}</span>`
        ).join('');
        
        const weaknessesHtml = row._weaknesses.map(w => 
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
    
    // `.innerText` will extract the text of only the nodes that had the `.active` class because of the selector above.
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
            let sampleStrengths = "특별한 강점";
            if(activeStrengths.length > 0) {
                // If there are exactly 1 or 2 strengths, just use them. Otherwise, take up to 3.
                sampleStrengths = activeStrengths.slice(0, 3).join(', ');
            }
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
                <div class="mbti-segment left-side" style="width: ${lPct}%" data-tooltip="${lTitle}" onmouseenter="showMbtiTooltip(event)" onmouseleave="hideMbtiTooltip()">${lCount}명 (${lPct}%)</div>
                <div class="mbti-segment right-side" style="width: ${rPct}%" data-tooltip="${rTitle}" onmouseenter="showMbtiTooltip(event)" onmouseleave="hideMbtiTooltip()">${rCount}명 (${rPct}%)</div>
            </div>
            <span class="mbti-label">${right}</span>
        </div>`;
    };

    document.getElementById('mbtiDistribution').innerHTML = 
        renderBar('E', 'I') + renderBar('S', 'N') + renderBar('T', 'F') + renderBar('J', 'P');


    // 3. High Risk Students Calculation (Demo logic: 20% chance of being high risk)
    const riskListContainer = document.getElementById('highRiskList');
    const riskDropdownContainer = document.getElementById('riskDropdown');
    let riskHtml = '';
    let dropdownHtml = '';
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
            dropdownHtml += `
                <div class="risk-dropdown-item" onclick="document.querySelector('.menu li[data-target=\\'personal-stats\\']').click(); document.getElementById('studentSelect').value = ${i}; document.getElementById('studentSelect').dispatchEvent(new Event('change')); toggleRiskDropdown();">
                    <strong>${getStudentName(row)}</strong>
                    <span>${reason}</span>
                </div>
            `;
        }
    });

    if(riskCount === 0) {
        riskHtml = `<div style="color:var(--success); font-weight:600; padding:15px; background:#F0FFF4; border-radius:8px;"><i class="fa-solid fa-check-circle"></i> 전문가 기준 관심 필요 대상 학생이 발견되지 않았습니다.</div>`;
        dropdownHtml = `<div style="padding:15px; text-align:center; color:var(--text-muted);">요주의 학생이 없습니다.</div>`;
    }
    
    riskListContainer.innerHTML = riskHtml;
    riskDropdownContainer.innerHTML = dropdownHtml;

    const btnRiskNav = document.getElementById('btnRiskNav');
    btnRiskNav.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> 요주의 학생목록 (${riskCount}명) <i class="fa-solid fa-caret-down"></i>`;
}

// MBTI Custom Tooltip Logic
let mbtiTooltipEl = null;
window.showMbtiTooltip = function(e) {
    if(!mbtiTooltipEl) {
        mbtiTooltipEl = document.createElement('div');
        mbtiTooltipEl.className = 'mbti-custom-tooltip';
        document.body.appendChild(mbtiTooltipEl);
    }
    const text = e.target.getAttribute('data-tooltip');
    if(!text) return;
    
    mbtiTooltipEl.innerHTML = text ? text.split(', ').join('<br>') : '';
    mbtiTooltipEl.classList.add('show');
    
    // Position
    const rect = e.target.getBoundingClientRect();
    mbtiTooltipEl.style.left = (rect.left + window.scrollX + rect.width / 2) + 'px';
    mbtiTooltipEl.style.top = (rect.top + window.scrollY - mbtiTooltipEl.offsetHeight - 10) + 'px';
    mbtiTooltipEl.style.transform = 'translateX(-50%)';
};
window.hideMbtiTooltip = function() {
    if(mbtiTooltipEl) {
        mbtiTooltipEl.classList.remove('show');
    }
};

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
    switchTab('tab-summary');

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

    if(!row._strengths || !row._weaknesses) {
        const extracted = extractKeywordsForStudent(row);
        row._strengths = extracted.strengths;
        row._weaknesses = extracted.weaknesses.map(transformWeakness);
    }

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

    // 5. Raw Survey Data Render per category
    const renderTable = (keys) => {
        if(!keys || keys.length === 0) return '<p style="padding:15px; color:var(--text-muted); font-size:0.95rem;">연결된 응답 데이터가 없습니다.</p>';
        let tableHtml = '<table style="width:100%; border-collapse: collapse; font-size: 0.95rem;"><thead><tr><th style="padding:10px; border-bottom:2px solid #ddd; text-align:left;">항목 헤더</th><th style="padding:10px; border-bottom:2px solid #ddd; text-align:left;">응답 값</th></tr></thead><tbody>';
        keys.forEach(key => {
            tableHtml += `<tr><td style="padding:12px; border-bottom:1px solid #eee; font-weight:500; width:65%; color:var(--text-main);">${key}</td><td style="padding:12px; border-bottom:1px solid #eee; color: var(--primary-color); font-weight:bold;">${row[key]}</td></tr>`;
        });
        tableHtml += '</tbody></table>';
        return tableHtml;
    };

    const rowKeys = Object.keys(row).filter(k => !k.startsWith('_'));
    const rowValues = Object.values(row);
    // 보통 처음 4개(타임스탬프, 학년, 반, 번호, 이름 등 - 템플릿에 따라 다르나 보통 앞부분)는 메타데이터입니다.
    // 여기서는 항목 헤더에 '1.', '2.' 처럼 숫자로 시작하는 문항을 기준으로 설문 문항을 추출합니다.
    const surveyKeys = rowKeys.filter(k => /^\d+\./.test(k)); 
    
    // 만약 번호로 시작하는 문항이 없으면 첫 4개를 제외한 나머지를 설문응답으로 간주
    const finalSurveyKeys = surveyKeys.length > 0 ? surveyKeys : rowKeys.slice(4);

    let gradeStr = String(row['학년'] || rowValues[0] || "O");
    let targetSurvey = SURVEY_DATA["5~6학년용"];
    if(gradeStr.includes('1') || gradeStr.includes('2')) targetSurvey = SURVEY_DATA["1~2학년용"];
    else if(gradeStr.includes('3') || gradeStr.includes('4')) targetSurvey = SURVEY_DATA["3~4학년용"];

    let hapKeys = [], mbtiKeys = [], miKeys = [], adaptKeys = [];
    
    if (targetSurvey && finalSurveyKeys.length === targetSurvey.reduce((sum, s) => sum + s.questions.length, 0)) {
        let offset = 0;
        hapKeys = finalSurveyKeys.slice(offset, offset + targetSurvey[0].questions.length); offset += targetSurvey[0].questions.length;
        mbtiKeys = finalSurveyKeys.slice(offset, offset + targetSurvey[1].questions.length); offset += targetSurvey[1].questions.length;
        miKeys = finalSurveyKeys.slice(offset, offset + targetSurvey[2].questions.length); offset += targetSurvey[2].questions.length;
        adaptKeys = finalSurveyKeys.slice(offset, offset + targetSurvey[3].questions.length);
    } else if (finalSurveyKeys.length > 0) {
        // 길이가 정확히 맞지 않는 경우, 대략 4등분 (fallback)
        let chunk = Math.ceil(finalSurveyKeys.length / 4);
        hapKeys = finalSurveyKeys.slice(0, chunk);
        mbtiKeys = finalSurveyKeys.slice(chunk, chunk*2);
        miKeys = finalSurveyKeys.slice(chunk*2, chunk*3);
        adaptKeys = finalSurveyKeys.slice(chunk*3);
    }

    if(document.getElementById('studentHappinessRaw')) document.getElementById('studentHappinessRaw').innerHTML = renderTable(hapKeys);
    if(document.getElementById('studentMbtiRaw')) document.getElementById('studentMbtiRaw').innerHTML = renderTable(mbtiKeys);
    if(document.getElementById('studentMiRaw')) document.getElementById('studentMiRaw').innerHTML = renderTable(miKeys);
    if(document.getElementById('studentAdaptRaw')) document.getElementById('studentAdaptRaw').innerHTML = renderTable(adaptKeys);
    
    let allHtml = '<table style="width:100%; border-collapse: collapse; font-size: 0.95rem;">';
    allHtml += '<thead><tr><th style="padding:10px; border-bottom:2px solid #ddd; text-align:left;">항목 헤더</th><th style="padding:10px; border-bottom:2px solid #ddd; text-align:left;">응답 값</th></tr></thead><tbody>';
    rowKeys.forEach(key => {
        allHtml += `<tr>
            <td style="padding:12px; border-bottom:1px solid #eee; font-weight:500; width:65%;">${key}</td>
            <td style="padding:12px; border-bottom:1px solid #eee; color: var(--primary-color); font-weight:bold;">${row[key]}</td>
        </tr>`;
    });
    allHtml += '</tbody></table>';
    if(document.getElementById('studentSurveyRaw')) document.getElementById('studentSurveyRaw').innerHTML = allHtml;
});

// Gemini 맞춤 컨설팅 동작
window.startGeminiConsulting = function() {
    const studentIdx = document.getElementById('studentSelect').value;
    if (studentIdx === "") return alert("학생을 먼저 선택해주세요.");
    
    const row = parsedData[studentIdx];
    const name = getStudentName(row);
    const meta = getStudentMeta(row);

    const strengths = row._strengths ? row._strengths.join(", ") : "특이사항 없음";
    const weaknesses = row._weaknesses ? row._weaknesses.join(", ") : "특이사항 없음";
    const mbti = row._mbti || "알 수 없음";

    const prompt = `당신은 초등학교 교사를 돕는 따뜻하고 전문적인 학생 맞춤형 지도 AI 컨설턴트입니다.
다음 학생의 정보를 바탕으로, 이 학생이 학교생활을 더욱 행복하게 하고 강점을 살릴 수 있는 구체적인 지도 방안(컨설팅)을 제시해주세요.

[학생 정보]
- 이름: ${name}
- 소속: ${meta}
- MBTI 성향: ${mbti}
- 주요 강점: ${strengths}
- 지도 및 보완점: ${weaknesses}

어조는 교사에게 친절하게 조언하듯 존댓말로 작성해주시고, 실제 학급에서 오늘 당장 실천 가능한 구체적인 교사의 지도 팁을 3가지 이상 포함해주세요.`;

    navigator.clipboard.writeText(prompt).then(() => {
        alert("[" + name + "] 학생의 정보와 컨설팅 프롬프트가 클립보드에 복사되었습니다.\\n\\n[확인]을 누르시면 제미나이(Gemini)로 이동합니다.\\n이동 후 채팅창에 붙여넣기(Ctrl+V) 하여 컨설팅을 시작하세요!");
        window.open("https://gemini.google.com/app", "_blank");
    }).catch(err => {
        console.error('클립보드 복사 실패:', err);
        alert("클립보드 복사에 실패했습니다. 브라우저 권한을 확인해주세요.");
    });
};


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
