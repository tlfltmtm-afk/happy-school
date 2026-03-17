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

        const strengths = getRandomItems(allStrengths, 2);
        const rawWeakness = getRandomItems(allWeaknesses, 1)[0];
        const weakness = transformWeakness(rawWeakness);

        row._strengths = strengths;
        row._weaknesses = [weakness];
        row._aiGenerated = "";

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${index + 1}</td>
            <td><strong>${name}</strong><br><small style="color:var(--text-muted)">${meta}</small></td>
            <td><span class="badge" style="background:var(--success);color:white">${strengths.join(', ')}</span></td>
            <td><span class="badge" style="background:#E2B467;color:white">${rawWeakness}</span></td>
            <td id="ai-result-${index}" style="font-size:0.95rem; line-height:1.5; color:var(--text-muted);">
                [AI 생성 버튼을 눌러주세요]
            </td>
            <td><button class="btn btn-primary btn-sm" onclick="generateAiText(${index})"><i class="fa-solid fa-robot"></i> 생성</button></td>
        `;
        tbody.appendChild(tr);
    });
}

window.generateAiText = function(index) {
    const row = parsedData[index];
    const name = getStudentName(row);
    const resultCell = document.getElementById(`ai-result-${index}`);
    
    resultCell.innerHTML = `<i class="fa-solid fa-spinner fa-spin" style="color:var(--primary-color)"></i> 생성 중...`;
    resultCell.style.color = "var(--text-main)";
    
    // Mock API Delay
    setTimeout(() => {
        const promptText = `평소 ${row._strengths.join(' 및 ')}하는 모습이 보이며 학급 일에 솔선수범함. 교우들과 사이좋게 지내며 ${row._strengths[0]} 장점을 활용해 학급 분위기를 밝게 만듦. ${row._weaknesses[0]}하며, 긍정적인 태도 덕분에 앞으로의 학교 생활에서 본인의 잠재력을 충분히 발휘하며 더 큰 성장이 기대됨.`;
        
        row._aiGenerated = promptText;
        resultCell.innerText = promptText;
    }, 800 + Math.random() * 700);
}

document.getElementById('generateAllBtn').addEventListener('click', () => {
    if(parsedData.length === 0) return alert("데이터를 먼저 입력해주세요.");
    for(let i=0; i<parsedData.length; i++) {
        setTimeout(()=>{
            window.generateAiText(i);
        }, i*500); // 0.5초 간격으로 생성
    }
});

document.getElementById('copyAllBtn').addEventListener('click', () => {
    let text = "이름\tAI 평어\n";
    let hasData = false;
    parsedData.forEach((row) => {
        if(row._aiGenerated) {
            text += `${getStudentName(row)}\t${row._aiGenerated}\n`;
            hasData = true;
        }
    });
    if(hasData) {
        navigator.clipboard.writeText(text).then(() => alert("전체 평어가 엑셀 붙여넣기 형태로 클립보드에 복사되었습니다."));
    } else {
        alert("아직 생성된 AI 평어가 없습니다.");
    }
});

document.getElementById('downloadExcelBtn').addEventListener('click', () => {
    alert("준비 중인 기능입니다. 현재는 [전체 복사] 후 엑셀에 붙여넣어 사용해주세요.");
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
    
    riskListContainer.innerHTML = riskHtml;
}

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
    
    document.getElementById('studentMbti').innerHTML = `<span style="font-size: 1.2rem; font-weight: 800; color: #333;">MBTI: <span style="color:var(--primary-color)">${row._mbti}</span></span>`;

    let buttonHtml = `<button onclick="showStudentRawData(${index})" class="btn btn-outline-primary btn-sm" style="margin-top:15px;"><i class="fa-solid fa-file-lines"></i> 원본 응답 조회</button>`;
    
    // Check if button already exists, if not prepend it
    let infoDiv = document.querySelector('.profile-header .info');
    let oldBtn = infoDiv.querySelector('button');
    if(oldBtn) oldBtn.remove();
    infoDiv.insertAdjacentHTML('beforeend', buttonHtml);

    profileCard.style.display = 'block';

    const ctx = document.getElementById('studentRadarChart').getContext('2d');
    if(classCharts.studentRadar) classCharts.studentRadar.destroy();

    classCharts.studentRadar = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: ['긍정성', '정서조절', '안정감', '관계성', '유능감', '자율성'],
            datasets: [{
                label: '학생 개별 역량 점수',
                data: [
                    2.5 + Math.random()*2.5, 
                    2.5 + Math.random()*2.5, 
                    2.5 + Math.random()*2.5, 
                    2.5 + Math.random()*2.5, 
                    2.5 + Math.random()*2.5, 
                    2.5 + Math.random()*2.5
                ],
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

    if(!row._strengths) {
        row._strengths = getRandomItems(allStrengths, 4); // Increased keywords
    }
    if(!row._weaknesses) {
        row._weaknesses = [transformWeakness(getRandomItems(allWeaknesses, 1)[0]), transformWeakness(getRandomItems(allWeaknesses, 1)[0])]; // 2 weaknesses
    }

    document.getElementById('studentSummary').innerHTML = `
        <div class="summary-box">
            <h4><i class="fa-solid fa-thumbs-up" style="color:var(--primary-color)"></i> 학생의 주요 강점 키워드</h4>
            <div style="margin-top:10px; display:flex; flex-wrap:wrap; gap:8px;">
                ${row._strengths.map(s => `<span class="badge" style="background:#E6F4EF; color:var(--primary-color)">${s}</span>`).join('')}
            </div>
        </div>
         <div class="summary-box">
            <h4><i class="fa-solid fa-seedling" style="color:#E2B467"></i> 지도 보완 및 기대 가능성</h4>
            <ul style="margin-top:10px; padding-left:20px; color:var(--text-muted); font-size:0.95rem;">
                ${row._weaknesses.map(w => `<li>${w}</li>`).join('')}
            </ul>
        </div>
    `;
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
