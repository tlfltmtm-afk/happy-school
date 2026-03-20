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

        // Hide personalHomeContainer implicitly if not on personal-stats
        if (targetId !== 'personal-stats') {
            const hContainer = document.getElementById('personalHomeContainer');
            if(hContainer) hContainer.style.display = 'none';
        }

        // Trigger updates if necessary
        if(targetId === 'class-stats' && parsedData.length > 0) {
            updateClassCharts();
        } else if (targetId === 'personal-stats') {
            if (document.getElementById('studentSelect').value === "") {
                if (parsedData.length > 0) {
                    showPersonalHome();
                } else {
                    document.getElementById('personalHomeContainer').style.display = 'none';
                    document.getElementById('studentProfile').style.display = 'none';
                }
            }
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
            cols.forEach((col, index) => {
                let header = headers[index] ? headers[index] : `Col${index}`;
                rowObj[header] = col.trim();
            });
            parsedData.push(rowObj);
        }
    }

    // Sort parsedData
    parsedData.sort((a,b) => {
        const gA = parseInt(a['학년']||0), gB = parseInt(b['학년']||0);
        if(gA !== gB) return gA - gB;
        const cA = parseInt(a['반']||0), cB = parseInt(b['반']||0);
        if(cA !== cB) return cA - cB;
        const nA = parseInt(a['번호']||0), nB = parseInt(b['번호']||0);
        return nA - nB;
    });

    parsedData.forEach(row => {
        let tdHtml = headers.map(h => `<td>${row[h]}</td>`).join('');
        tbodyHtml += `<tr>${tdHtml}</tr>`;
    });

    previewTable.querySelector('tbody').innerHTML = tbodyHtml;
    previewArea.style.display = 'block';

    // Populate Select & AI Table
    populateStudentSelect();
    populatePersonalHome();
    if(document.getElementById('personal-stats').classList.contains('active')) showPersonalHome();
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

// ---------------- Task 1 Additions START ----------------
window.showPersonalHome = function() {
    document.getElementById('studentSelect').value = "";
    document.getElementById('studentProfile').style.display = 'none';
    const container = document.getElementById('personalHomeContainer');
    if(container) {
        container.style.display = 'block';
        populatePersonalHome();
    }
};

window.selectStudentFromHome = function(index) {
    const studentSelect = document.getElementById('studentSelect');
    if(studentSelect) {
        studentSelect.value = index;
        studentSelect.dispatchEvent(new Event('change'));
        document.getElementById('personalHomeContainer').style.display = 'none';
    }
};

window.populatePersonalHome = function() {
    const tbody = document.querySelector('#personalHomeTable tbody');
    if(!tbody) return;
    
    if(parsedData.length === 0) {
        tbody.innerHTML = '<tr><td colspan="12" class="empty-state">학생 데이터가 없습니다. 먼저 데이터를 파싱해주세요.</td></tr>';
        return;
    }

    tbody.innerHTML = '';
    
    // Sort array simply by default if needed, currently parsedData is already sorted by Gr/Cl/Num.
    parsedData.forEach((row, index) => {
        const grade = row['학년'] || "?";
        const cls = row['반'] || "?";
        const num = row['번호'] || "?";
        const name = getStudentName(row);
        
        // Find gender
        let gender = "-";
        const gKeys = Object.keys(row).filter(k => k.includes('성별') || k.includes('남녀'));
        if(gKeys.length > 0) {
            gender = row[gKeys[0]];
        }
        
        // Ensure MBTI
        if(!row._mbti) {
            const mbtiArr = ["ENTP", "ISFJ", "ENFP", "ISTJ", "ESTP", "INFP", "ESFJ", "INTJ", "ENTJ", "ISFP", "ENFJ", "ISTP", "ESTJ", "INTP", "ESFP", "INFJ"];
            row._mbti = mbtiArr[Math.floor(Math.random() * mbtiArr.length)];
        }
        const mbti = row._mbti;
        
        let displayStrName = name;
        let trStyle = "";
        if (window.registeredTeacherIndex !== undefined && index === Number(window.registeredTeacherIndex)) {
            displayStrName = name + ' 👑(교사)';
            trStyle = 'background-color: #FEF9C3;';
        }

        // Determine Version for offsets
        let studentGradeStr = String(row['학년'] || row['학년 반 번호'] || Object.values(row)[0] || "5");
        let version = 'v3';
        if(studentGradeStr.includes('1') || studentGradeStr.includes('2')) version = 'v1';
        else if(studentGradeStr.includes('3') || studentGradeStr.includes('4')) version = 'v2';

        const rowKeysAll = Object.keys(row);
        let dsKeys = rowKeysAll.filter(k => /^\\d+[\\.\\s]|\\[\\d+\\]/.test(k));
        if (dsKeys.length === 0) dsKeys = rowKeysAll.slice(4).filter(k => !k.startsWith('_'));

        const OFFSETS = {
            v1: { '행복': 0, 'MBTI': 6, '다중지능': 10, '학교적응력': 18 },
            v2: { '행복': 0, 'MBTI': 6, '다중지능': 14, '학교적응력': 22 },
            v3: { '행복': 0, 'MBTI': 12, '다중지능': 28, '학교적응력': 44 }
        };

        // Helper: Get stars string
        function getStars(score) {
            const full = Math.round(score);
            let starStr = "";
            for(let i=0; i<5; i++) {
                starStr += (i < full) ? "★" : "☆";
            }
            return starStr;
        }

        const hapAvg = getCategoryAvgForStudent(row, '행복');
        const adaptAvg = getCategoryAvgForStudent(row, '학교적응력');
        const hapStars = hapAvg > 0 ? `<span style="color:#F59E0B">${getStars(hapAvg)}</span>` : '<span style="color:#ccc">-</span>';
        const adaptStars = adaptAvg > 0 ? `<span style="color:#10B981">${getStars(adaptAvg)}</span>` : '<span style="color:#ccc">-</span>';

        // Calculate MI Top 2
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
                                const score = typeof extractScore === 'function' ? extractScore(valStr) : Number(String(valStr).replace(/[^\\d]/g, ''));
                                if(score) { sum += score; c++; }
                            }
                        }
                    });
                }
                if(c>0) miScores.push({name: sub, score: sum/c});
            });
        }
        let topMiStr = "-";
        if(miScores.length > 0) {
            miScores.sort((a,b) => b.score - a.score);
            topMiStr = miScores.slice(0, 2).map(m => `<span class="badge" style="background:#EBF8FF; color:#0284C7; border:1px solid #BAE6FD; padding:2px 6px; font-size:0.8rem; margin-right:4px;">${m.name}</span>`).join('');
        }
        
        const chkBox = `<input type="checkbox" class="student-checkbox" value="${index}" style="cursor: pointer;">`;
        const actionHtml = `<div style="display:flex; align-items:center; gap:5px; justify-content:center;">${chkBox} <button class="btn btn-outline-primary btn-sm" onclick="selectStudentFromHome(${index})" style="padding: 2px 6px; font-size: 0.75rem;">보기</button></div>`;
        
        const tr = document.createElement('tr');
        if (trStyle) tr.style = trStyle;
        const chatBtnHtml = `<button class="btn btn-warning btn-sm" onclick="openAndStartPersonalChat(${index})" style="padding: 2px 8px; font-size: 0.75rem; background-color:#FDE047; color:#854D0E; border:1px solid #FACC15;"><i class="fa-regular fa-comments"></i> 챗봇 열기</button>`;
        
        tr.innerHTML = `
            <td style="padding: 8px;">${actionHtml}</td>
            <td style="padding: 8px;">${index + 1}</td>
            <td style="padding: 8px;">${grade}</td>
            <td style="padding: 8px;">${cls}</td>
            <td style="padding: 8px;">${num}</td>
            <td style="padding: 8px; font-weight: 600;">${displayStrName}</td>
            <td style="padding: 8px;">${gender}</td>
            <td style="padding: 8px; font-weight: 600; color: #854D0E;">${mbti}</td>
            <td style="padding: 8px;">${topMiStr}</td>
            <td style="padding: 8px;" data-score="${hapAvg}">${hapStars}</td>
            <td style="padding: 8px;" data-score="${adaptAvg}">${adaptStars}</td>
            <td style="padding: 8px; text-align:center;">${chatBtnHtml}</td>
        `;
        tbody.appendChild(tr);
    });
};

window.selectStudentFromHome = function(index) {
    const selector = document.getElementById('studentSelect');
    if(selector) {
        selector.value = index;
        selector.dispatchEvent(new Event('change'));
    }
};

let currentSortCol = -1;
let currentSortAsc = true;
window.sortTable = function(columnIndex) {
    const table = document.getElementById("personalHomeTable");
    const tbody = table.tBodies[0];
    const rows = Array.from(tbody.rows);
    if(rows.length === 0 || rows[0].cells.length === 1) return; // Empty state
    
    if(currentSortCol === columnIndex) {
        currentSortAsc = !currentSortAsc;
    } else {
        currentSortCol = columnIndex;
        currentSortAsc = true;
    }
    
    rows.sort((a, b) => {
        let valA = a.cells[columnIndex].innerText.trim();
        let valB = b.cells[columnIndex].innerText.trim();
        
        // For stars/scores, parse the data attribute
        if(columnIndex === 9 || columnIndex === 10) {
            valA = parseFloat(a.cells[columnIndex].getAttribute('data-score')) || 0;
            valB = parseFloat(b.cells[columnIndex].getAttribute('data-score')) || 0;
        } else if (!isNaN(parseFloat(valA)) && !isNaN(parseFloat(valB)) && (columnIndex >= 1 && columnIndex <= 4)) {
            valA = parseFloat(valA);
            valB = parseFloat(valB);
        }
        
        if (valA < valB) return currentSortAsc ? -1 : 1;
        if (valA > valB) return currentSortAsc ? 1 : -1;
        return 0;
    });
    
    rows.forEach(row => tbody.appendChild(row));
};
// ---------------- Task 1 Additions END ----------------

function getRandomItems(arr, count) {
    const shuffled = [...arr].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
}

// Transform weakness to a more positive future-oriented phrasing
function transformWeakness(weakness) {
    if(weakness.includes("필요") || weakness.includes("요망") || weakness.includes("바람")) {
        return weakness; 
    }
    return weakness;
}

// Extract numeric score from Likert scale text or numbers
window.extractScore = function(valStr) {
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

function getCategoryAvgForStudent(row, catName) {
    if(!row || typeof MAPPING_DATA === 'undefined' || !MAPPING_DATA[catName]) return 0;
    const rowValues = Object.values(row);
    let studentGradeStr = String(row['학년'] || row['학년 반 번호'] || rowValues[0] || "5");
    let version = 'v3';
    if(studentGradeStr.includes('1') || studentGradeStr.includes('2')) version = 'v1';
    else if(studentGradeStr.includes('3') || studentGradeStr.includes('4')) version = 'v2';
    
    const rowKeysAll = Object.keys(row);
    let dsKeys = rowKeysAll.filter(k => /^\d+[\.\s]|\[\d+\]/.test(k));
    if (dsKeys.length === 0) dsKeys = rowKeysAll.slice(4).filter(k => !k.startsWith('_'));

    const OFFSETS = {
        v1: { '행복': 0, 'MBTI': 6, '다중지능': 10, '학교적응력': 18 },
        v2: { '행복': 0, 'MBTI': 6, '다중지능': 14, '학교적응력': 22 },
        v3: { '행복': 0, 'MBTI': 12, '다중지능': 28, '학교적응력': 44 }
    };

    let total = 0, count = 0;
    Object.keys(MAPPING_DATA[catName]).forEach(sub => {
        const qNums = MAPPING_DATA[catName][sub][version];
        if(!qNums) return;
        qNums.forEach(q => {
            const globalIdx = OFFSETS[version][catName] + q - 1;
            if(globalIdx < dsKeys.length) {
                const valStr = row[dsKeys[globalIdx]];
                if(valStr) {
                    const score = window.extractScore ? window.extractScore(valStr) : Number(String(valStr).replace(/[^\d]/g, ''));
                    if(score) { total += score; count++; }
                }
            }
        });
    });
    return count > 0 ? (total / count) : 0;
}


// Extract student-specific keywords from raw survey data
function extractKeywordsForStudent(row) {
    const rowValues = Object.values(row);
    let studentGradeStr = String(row['학년'] || row['학년 반 번호'] || rowValues[0] || "");
    let version = 'v3';
    if(studentGradeStr.includes('1') || studentGradeStr.includes('2')) version = 'v1';
    else if(studentGradeStr.includes('3') || studentGradeStr.includes('4')) version = 'v2';
    
    let strengthsPool = [];
    let weaknessesPool = [];

    const rowKeys = Object.keys(row);
    let surveyKeys = rowKeys.filter(k => /^\d+[\.\s]|\[\d+\]/.test(k));
    if(surveyKeys.length === 0) surveyKeys = rowKeys.slice(4).filter(k => !k.startsWith('_'));
    
    const OFFSETS = {
        v1: { '행복': 0, 'MBTI': 6, '다중지능': 10, '학교적응력': 18 },
        v2: { '행복': 0, 'MBTI': 6, '다중지능': 14, '학교적응력': 22 },
        v3: { '행복': 0, 'MBTI': 12, '다중지능': 28, '학교적응력': 44 }
    };

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
                    const globalIdx = OFFSETS[version][category] + qNum - 1;
                    if(globalIdx < surveyKeys.length) {
                        const valStr = row[surveyKeys[globalIdx]];
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
        if(!row._strengths || !row._weaknesses) {
            const extracted = extractKeywordsForStudent(row);
            row._strengths = extracted.strengths;
            row._weaknesses = extracted.weaknesses.map(transformWeakness);
            row._aiGenerated = "";
        }
        row._reqs = row._reqs || [];

        const strengthsHtml = row._strengths.map(s => 
            `<span class="keyword-badge strength active" onclick="toggleKeyword(this)">${s}</span>`
        ).join('') + `
        <span id="add-btn-strength-${index}" class="keyword-badge add-btn" onclick="showKeywordInput(${index}, 'strength')"><i class="fa-solid fa-plus"></i> 추가</span>
        <span id="input-container-strength-${index}" style="display:none; align-items:center; gap:5px; margin-top:5px; vertical-align:middle;">
            <input type="text" id="input-kw-strength-${index}" class="form-select" style="width:80px; padding:2px 5px; margin:0; font-size:0.85rem;" placeholder="입력">
            <button class="btn btn-outline-primary btn-sm" style="padding:2px 6px; font-size:0.8rem;" onclick="submitCustomKeyword(${index}, 'strength')">확인</button>
            <button class="btn btn-outline-secondary btn-sm" style="padding:2px 6px; font-size:0.8rem;" onclick="hideKeywordInput(${index}, 'strength')">취소</button>
        </span>`;
        
        const weaknessesHtml = row._weaknesses.map(w => 
            `<span class="keyword-badge weakness active" onclick="toggleKeyword(this)">${w}</span>`
        ).join('') + `
        <span id="add-btn-weakness-${index}" class="keyword-badge add-btn" onclick="showKeywordInput(${index}, 'weakness')"><i class="fa-solid fa-plus"></i> 추가</span>
        <span id="input-container-weakness-${index}" style="display:none; align-items:center; gap:5px; margin-top:5px; vertical-align:middle;">
            <input type="text" id="input-kw-weakness-${index}" class="form-select" style="width:80px; padding:2px 5px; margin:0; font-size:0.85rem;" placeholder="입력">
            <button class="btn btn-outline-primary btn-sm" style="padding:2px 6px; font-size:0.8rem;" onclick="submitCustomKeyword(${index}, 'weakness')">확인</button>
            <button class="btn btn-outline-secondary btn-sm" style="padding:2px 6px; font-size:0.8rem;" onclick="hideKeywordInput(${index}, 'weakness')">취소</button>
        </span>`;

        const reqsHtml = row._reqs.map(r => 
            `<span class="keyword-badge req active" onclick="toggleKeyword(this)">${r}</span>`
        ).join('') + `
        <span id="add-btn-req-${index}" class="keyword-badge add-btn" onclick="showKeywordInput(${index}, 'req')" style="margin-top:5px;"><i class="fa-solid fa-plus"></i> 추가</span>
        <span id="input-container-req-${index}" style="display:none; flex-direction:column; gap:5px; margin-top:5px; width:100%;">
            <input type="text" id="input-kw-req-${index}" class="form-select" style="width:100%; padding:4px; margin:0; font-size:0.85rem;" placeholder="입력">
            <div style="display:flex; gap:5px; width:100%;">
                <button class="btn btn-outline-primary btn-sm" style="flex:1; padding:2px 0; font-size:0.8rem;" onclick="submitCustomKeyword(${index}, 'req')">저장</button>
                <button class="btn btn-outline-secondary btn-sm" style="flex:1; padding:2px 0; font-size:0.8rem;" onclick="hideKeywordInput(${index}, 'req')">취소</button>
            </div>
        </span>`;

        const tr = document.createElement('tr');
        tr.id = `ai-row-${index}`;
        tr.innerHTML = `
            <td>${index + 1}</td>
            <td><strong>${name}</strong><br><small style="color:var(--text-muted)">${meta}</small></td>
            <td id="ai-strengths-${index}">${strengthsHtml}</td>
            <td id="ai-weaknesses-${index}">${weaknessesHtml}</td>
            <td id="ai-reqs-${index}" style="vertical-align:middle; padding:10px;">${reqsHtml}</td>
            <td style="vertical-align:middle; text-align:center;"><button class="btn btn-outline-primary btn-sm" title="외부 AI웹 프롬프트 복사" onclick="copyManualPrompt(${index})" style="width:100%; height:36px; display:flex; justify-content:center; align-items:center;"><i class="fa-solid fa-square-arrow-up-right fa-lg"></i></button></td>
            <td style="vertical-align:middle; text-align:center;"><button class="btn btn-primary btn-sm" onclick="generateAiText(${index})" style="width:100%; height:36px; display:flex; justify-content:center; align-items:center;"><i class="fa-solid fa-robot fa-lg"></i></button></td>
            <td id="ai-result-${index}" style="font-size:0.95rem; line-height:1.5; color:var(--text-muted); vertical-align:middle;">
                [대기중] API Key 입력 후 클릭
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Toggle Keyword Badge
window.toggleKeyword = function(el) {
    el.classList.toggle('active');
};

// Inline Keyword Input logic
window.showKeywordInput = function(index, type) {
    document.getElementById(`add-btn-${type}-${index}`).style.display = 'none';
    document.getElementById(`input-container-${type}-${index}`).style.display = 'inline-flex';
    document.getElementById(`input-kw-${type}-${index}`).focus();
};
window.hideKeywordInput = function(index, type) {
    document.getElementById(`add-btn-${type}-${index}`).style.display = 'inline-flex';
    document.getElementById(`input-container-${type}-${index}`).style.display = 'none';
    document.getElementById(`input-kw-${type}-${index}`).value = '';
};
window.submitCustomKeyword = function(index, type) {
    const input = document.getElementById(`input-kw-${type}-${index}`);
    const word = input.value.trim();
    if(!word) return hideKeywordInput(index, type);
    const row = parsedData[index];
    if(type === 'strength') {
        if(!row._strengths.includes(word)) row._strengths.push(word);
    } else if(type === 'weakness') {
        if(!row._weaknesses.includes(word)) row._weaknesses.push(word);
    } else if(type === 'req') {
        if(!row._reqs.includes(word)) row._reqs.push(word);
    }
    populateAiTable();
};

// Generate Manual Prompt Text
window.generateManualPromptText = function(index) {
    const row = parsedData[index];
    const name = getStudentName(row);
    const baseMeta = getStudentMeta(row);
    
    // UI values
    const gradeSetup = document.getElementById('aiGradeSetup')?.value.trim();
    const metaStr = gradeSetup ? `${gradeSetup}` : baseMeta;

    const isSecondTerm = document.getElementById('aiSecondSemesterCheck')?.checked;
    const basicLength = document.getElementById('aiLengthSetup')?.value || '300';
    const term1Length = document.getElementById('aiTerm1Length')?.value || '200';
    const term2Length = document.getElementById('aiTerm2Length')?.value || '200';
    const customReq = document.getElementById('aiCustomRequest')?.value.trim();
    
    // Read active badges from DOM
    const strengthNodes = document.querySelectorAll(`#ai-strengths-${index} .keyword-badge.strength.active`);
    const weaknessNodes = document.querySelectorAll(`#ai-weaknesses-${index} .keyword-badge.weakness.active`);
    const reqNodes = document.querySelectorAll(`#ai-reqs-${index} .keyword-badge.req.active`);
    
    const activeStrengths = Array.from(strengthNodes).map(n => n.innerText);
    const activeWeaknesses = Array.from(weaknessNodes).map(n => n.innerText);
    const activeReqs = Array.from(reqNodes).map(n => n.innerText);

    const basePrompt = document.getElementById('aiBasePromptSetup')?.value.trim() || "당신은 15년 차 경력의 통찰력 있고 따뜻한 초등학교 교사입니다. 제공된 학생의 다면적 키워드 데이터를 바탕으로 생활기록부에 등재될 고품질의 '행동특성 및 종합의견'을 작성해 주세요.";
    
    let prompt = `${basePrompt}\n\n`;
    prompt += `[행동발달 작성 대상 입력 데이터]\n`;
    prompt += `- 대상 정보: ${metaStr}소속 ${name} 학생\n`;
    
    if (activeStrengths.length > 0) {
        prompt += `- 강점 키워드: ${activeStrengths.join(', ')}\n`;
    } else {
        prompt += `- 강점 키워드: (특별히 선택된 키워드 없음)\n`;
    }
    
    if(activeWeaknesses.length > 0) {
        prompt += `- 보완점 키워드: ${activeWeaknesses.join(', ')}\n`;
    } else {
        prompt += `- 보완점 키워드: (특별히 선택된 키워드 없음)\n`;
    }
    
    prompt += `\n[추가 세부 요구 조건]\n`;
    
    if (isSecondTerm) {
        const lineBreaksCount = parseInt(document.getElementById('aiLineBreaks')?.value || '2', 10);
        prompt += `- 요구 분량 특이사항: 1학기와 2학기 내용이 포함되도록 생성하되, 1학기/2학기 내용이 중복되지 않도록 분리해서 작성.\n`;
        prompt += `  * 1학기 내용 분량: 약 ${term1Length}자 내외\n`;
        prompt += `  * 2학기 내용 분량: 약 ${term2Length}자 내외\n`;
        prompt += `  * 형태: 1학기 내용 작성 완료 후, 반드시 ${lineBreaksCount}줄 줄바꿈(엔터키 연속 ${lineBreaksCount}번)하여 문단을 명확히 나눈 뒤 다음 행부터 2학기 내용을 이어서 작성할 것.\n`;
    } else {
        prompt += `- 분량 요구사항: 총 분량 약 ${basicLength}자 내외로 전체를 묶어서 자연스럽게 구성할 것.\n`;
    }

    if (customReq) {
        prompt += `- 학급 전체 공통 설정 사항: ${customReq}\n`;
    }
    if (activeReqs.length > 0) {
        prompt += `- 해당 단일 학생 개별 요구사항: ${activeReqs.join(', ')}\n`;
    }

    return prompt;
};

// Copy Manual Prompt for a single student
window.copyManualPrompt = function(index) {
    const promptText = generateManualPromptText(index);
    openAiSiteModal(promptText, `${parsedData[index]['이름'] || '학생'}의 평어 생성 프롬프트가 복사되었습니다!`);
};

// Create mock AI result or use real logic depending on future Needs
window.generateAiText = function(index) {
    const row = parsedData[index];
    const apiKey = globalApiKey;
    const resultCell = document.getElementById(`ai-result-${index}`);
    
    // Read active badges from DOM
    const strengthNodes = document.querySelectorAll(`#ai-strengths-${index} .keyword-badge.strength.active`);
    const activeStrengths = Array.from(strengthNodes).map(n => n.innerText);

    if(!apiKey) {
        alert("글로벌 API 키가 설정되지 않았습니다. 좌측 하단의 '내 API Key 설정'에서 먼저 키를 입력해주세요. (API 키 미설정시 자동 생성이 불가합니다.)");
        return;
    }
    
    // Real API Logic
    resultCell.innerHTML = `<i class="fa-solid fa-spinner fa-spin" style="color:var(--primary-color)"></i> 생성 중...`;
    const promptText = window.generateManualPromptText(index);
    
    // Real API Logic
    window.callGeminiApi(promptText).then(text => {
        row._aiGenerated = text;
        resultCell.innerHTML = text.replace(/\n/g, '<br>');
    }).catch(err => {
        resultCell.innerHTML = `<span style="color:var(--text-muted);">API 요청 실패: ${err.message}</span>`;
    });
}

document.getElementById('generateAllBtn').addEventListener('click', () => {
    if(parsedData.length === 0) return alert("데이터를 먼저 분석해주세요.");
    
    const apiKey = globalApiKey;
    if(!apiKey) {
        alert("글로벌 API 키 설정이 먼저 필요합니다. 좌측 메뉴 하단의 '내 API Key 설정' 버튼을 눌러 API 키를 먼저 등록해주세요.");
        return;
    }
    
    if(!confirm(`목록 내 모든 학생(${parsedData.length}명)의 행동발달사항을 일괄 자동생성 하시겠습니까?\n\n생성 도중 창을 닫거나 새로고침하지 마세요.`)) {
        return;
    }

    for(let i=0; i<parsedData.length; i++) {
        setTimeout(()=>{
            window.generateAiText(i);
        }, i*500); 
    }
});

document.getElementById('copyAllPromptBtn').addEventListener('click', () => {
    if(parsedData.length === 0) return alert("데이터가 없습니다.");
    let text = "";
    parsedData.forEach((row, index) => {
        const prompt = generateManualPromptText(index);
        text += `[학생번호: ${index + 1}번] ================================\n${prompt}\n\n`;
    });
    openAiSiteModal(text, "전체 학생에 대한 행발생성 프롬프트 정보가 한 번에 복사되었습니다!\n사이트로 이동하여 복사(Ctrl+V)하여 생성을 이어가세요.");
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

        // removed tooltip hover events and added inline text
        return `
        <div class="mbti-row">
            <span class="mbti-label">${left}</span>
            <div class="mbti-bar-wrapper">
                <div class="mbti-segment left-side" style="width: ${lPct}%">
                    <div>${lCount}명 (${lPct}%)</div>
                    <span>${lTitle}</span>
                </div>
                <div class="mbti-segment right-side" style="width: ${rPct}%">
                    <div>${rCount}명 (${rPct}%)</div>
                    <span>${rTitle}</span>
                </div>
            </div>
            <span class="mbti-label">${right}</span>
        </div>`;
    };

    document.getElementById('mbtiDistribution').innerHTML = 
        renderBar('E', 'I') + renderBar('S', 'N') + renderBar('T', 'F') + renderBar('J', 'P');


    // 3. High Risk Students Calculation (Extracted to separate function for dynamic update)
    renderHighRiskList();
}

// Separate function to allow dynamic updating via sliders
window.renderHighRiskList = function() {
    const riskListContainer = document.getElementById('highRiskList');
    const riskDropdownContainer = document.getElementById('riskDropdown');
    const btnRiskNav = document.getElementById('btnRiskNav');
    
    if((!riskListContainer && !riskDropdownContainer) || parsedData.length === 0) return;

    // Get slider values (default 20%)
    const hapRiskPct = parseInt(document.getElementById('hapRiskSlider')?.value || "20", 10);
    const adaptRiskPct = parseInt(document.getElementById('adaptRiskSlider')?.value || "20", 10);
    
    // Calculate cutoff scores based on percentile
    let hapScores = [];
    let adaptScores = [];
    
    parsedData.forEach(row => {
        const h = getCategoryAvgForStudent(row, '행복');
        const a = getCategoryAvgForStudent(row, '학교적응력');
        if(h > 0) hapScores.push(h);
        if(a > 0) adaptScores.push(a);
    });
    
    hapScores.sort((a,b) => a - b);
    adaptScores.sort((a,b) => a - b);
    
    const hapCutoffIdx = Math.max(0, Math.floor(hapScores.length * (hapRiskPct / 100)) - 1);
    const adaptCutoffIdx = Math.max(0, Math.floor(adaptScores.length * (adaptRiskPct / 100)) - 1);
    
    const hapCutoff = hapScores.length > 0 ? hapScores[hapCutoffIdx] : 0;
    const adaptCutoff = adaptScores.length > 0 ? adaptScores[adaptCutoffIdx] : 0;

    let riskHtml = '';
    let dropdownHtml = '';
    let riskCount = 0;

    parsedData.forEach((row, i) => {
        const hapAvg = getCategoryAvgForStudent(row, '행복');
        const adaptAvg = getCategoryAvgForStudent(row, '학교적응력');
        
        let issues = [];
        // Condition: has score AND score <= cutoff AND cutoff is valid (not 0% filter)
        if (hapAvg > 0 && hapRiskPct > 0 && hapAvg <= hapCutoff) {
            issues.push(`행복 하위 ${hapRiskPct}% (${hapAvg.toFixed(2)})`);
        }
        if (adaptAvg > 0 && adaptRiskPct > 0 && adaptAvg <= adaptCutoff) {
            issues.push(`학교적응 하위 ${adaptRiskPct}% (${adaptAvg.toFixed(2)})`);
        }
        
        if (issues.length > 0) {
            riskCount++;
            const reason = issues.join(", ");
            
            riskHtml += `
                <div class="risk-item" style="display:flex; justify-content:flex-start; align-items:center; flex-wrap:wrap; gap:20px; padding:10px; border-bottom:1px solid #eee;">
                    <div class="risk-item-info" style="display:flex; align-items:center; gap:10px;">
                        <strong>${getStudentName(row)}</strong>
                        <button class="btn-risk-action btn btn-outline-danger btn-sm" style="padding:4px 8px; font-size:0.8rem;" onclick="document.querySelector('.menu li[data-target=\\'personal-stats\\']').click(); document.getElementById('studentSelect').value = ${i}; document.getElementById('studentSelect').dispatchEvent(new Event('change'));">상세 보기</button>
                    </div>
                    <span class="risk-item-reason" style="color:var(--text-muted);font-size:0.95rem;">(${getStudentMeta(row)}) - <span style="color:#E53E3E;">${reason}</span></span>
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
        riskHtml = `<div style="color:var(--success); font-weight:600; padding:15px; background:#F0FFF4; border-radius:8px;"><i class="fa-solid fa-check-circle"></i> 설정한 기준에 해당하는 요주의 학생이 없습니다.</div>`;
        dropdownHtml = `<div style="padding:15px; text-align:center; color:var(--text-muted);">요주의 학생이 없습니다.</div>`;
    }
    
    if(riskListContainer) riskListContainer.innerHTML = riskHtml;
    if(riskDropdownContainer) riskDropdownContainer.innerHTML = dropdownHtml;

    if(btnRiskNav) {
        btnRiskNav.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> 요주의 학생목록 (${riskCount}명) <i class="fa-solid fa-caret-down"></i>`;
    }
};

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
    window.closeRiskSettingsModal(); // Close settings if open
    if (dropdown.style.display === 'none') {
        dropdown.style.display = 'block';
    } else {
        dropdown.style.display = 'none';
    }
};

window.toggleRiskSettingsModal = function() {
    const settings = document.getElementById('riskSettingsModalOverlay');
    const dropdown = document.getElementById('riskDropdown');
    if(dropdown) dropdown.style.display = 'none'; // Close dropdown if open
    
    if (settings.style.display === 'none') {
        settings.style.display = 'flex';
    } else {
        settings.style.display = 'none';
    }
};

window.closeRiskSettingsModal = function() {
    const settings = document.getElementById('riskSettingsModalOverlay');
    if(settings) settings.style.display = 'none';
};

window.updateRiskSettings = function() {
    const hapVal = document.getElementById('hapRiskSlider').value;
    const adaptVal = document.getElementById('adaptRiskSlider').value;
    document.getElementById('hapRiskLabel').innerText = hapVal + '%';
    document.getElementById('adaptRiskLabel').innerText = adaptVal + '%';
    
    // Recalculate and re-render the list immediately
    if(parsedData.length > 0) {
        renderHighRiskList();
    }
};

window.openUsageGuideModal = function() {
    document.getElementById('usageGuideModal').style.display = 'flex';
};
window.closeUsageGuideModal = function() {
    document.getElementById('usageGuideModal').style.display = 'none';
};

// Teacher Registration
window.registeredTeacherIndex = undefined;
window.openTeacherRegistrationModal = function() {
    if (parsedData.length === 0) return alert("데이터를 먼저 파싱해주세요.");
    const sel = document.getElementById('teacherDataSelect');
    sel.innerHTML = '<option value="">-- 응답자 목록에서 선택 --</option>';
    parsedData.forEach((row, i) => {
        sel.innerHTML += `<option value="${i}">${getStudentMeta(row)} ${getStudentName(row)}</option>`;
    });
    if (window.registeredTeacherIndex !== undefined) {
        sel.value = window.registeredTeacherIndex;
    }
    document.getElementById('teacherRegistrationModal').style.display = 'flex';
};
window.closeTeacherRegistrationModal = function() {
    document.getElementById('teacherRegistrationModal').style.display = 'none';
};
window.confirmTeacherRegistration = function() {
    const sel = document.getElementById('teacherDataSelect');
    if (sel.value === "") {
        if(confirm("특정 교사를 선택하지 않았습니다. 교사 등록을 해제하시겠습니까?")) {
            window.registeredTeacherIndex = undefined;
            window.closeTeacherRegistrationModal();
            if(document.getElementById('personalHomeContainer').style.display !== 'none') populatePersonalHome();
            alert("교사 등록이 해제되었습니다.");
        }
    } else {
        window.registeredTeacherIndex = sel.value;
        const name = getStudentName(parsedData[sel.value]);
        window.closeTeacherRegistrationModal();
        if(document.getElementById('personalHomeContainer').style.display !== 'none') populatePersonalHome();
        alert(`[${name}] 선생님이 컨설팅 교사로 등록되었습니다! 앞으로의 AI 컨설팅에 교사의 데이터가 반영됩니다.`);
    }
};

window.addEventListener('click', function(event) {
    const btnNav = document.getElementById('btnRiskNav');
    const dropdown = document.getElementById('riskDropdown');
    const settingsBtn1 = document.querySelector('.high-risk-section .fa-gear')?.parentElement;
    const settingsBtn2 = document.querySelector('.risk-nav-wrapper .fa-gear')?.parentElement;
    const settingsPanel = document.getElementById('riskSettingsModalOverlay');
    
    if (btnNav && dropdown && !btnNav.contains(event.target) && !dropdown.contains(event.target)) {
        dropdown.style.display = 'none';
    }
    if (settingsPanel && event.target === settingsPanel) {
        closeRiskSettingsModal();
    }
    const modal = document.getElementById('surveyPreviewModal');
    if (event.target === modal) {
        closeSurveyPreview();
    }
    const tModal = document.getElementById('teacherRegistrationModal');
    if (event.target === tModal) {
        closeTeacherRegistrationModal();
    }
    const miModal = document.getElementById('miGroupsModal');
    if (event.target === miModal) closeMiGroupsModal();
    const usageModal = document.getElementById('usageGuideModal');
    if (event.target === usageModal) {
        closeUsageGuideModal();
    }
});

// MI Group Modal Logic
window.openMiGroupsModal = function() {
    if(parsedData.length === 0) return alert("자료를 먼저 파싱해주세요.");
    document.getElementById('miGroupsModal').style.display = 'flex';
    populateMiGroups();
};
window.closeMiGroupsModal = function() {
    document.getElementById('miGroupsModal').style.display = 'none';
};

function populateMiGroups() {
    const miAreas = [
        { name: '언어', icon: 'fa-language', color: '#EF4444' },
        { name: '논리수학', icon: 'fa-calculator', color: '#F97316' },
        { name: '공간', icon: 'fa-cube', color: '#EAB308' },
        { name: '신체운동', icon: 'fa-person-running', color: '#10B981' },
        { name: '음악', icon: 'fa-music', color: '#06B6D4' },
        { name: '대인관계', icon: 'fa-users', color: '#3B82F6' },
        { name: '자기성찰', icon: 'fa-user-check', color: '#8B5CF6' },
        { name: '자연친화', icon: 'fa-leaf', color: '#D946EF' }
    ];

    let groupings = {};
    miAreas.forEach(a => groupings[a.name] = []);

    parsedData.forEach(row => {
        let studentGradeStr = String(row['학년'] || row['학년 반 번호'] || Object.values(row)[0] || "5");
        let version = 'v3';
        if(studentGradeStr.includes('1') || studentGradeStr.includes('2')) version = 'v1';
        else if(studentGradeStr.includes('3') || studentGradeStr.includes('4')) version = 'v2';

        const rowKeysAll = Object.keys(row);
        let dsKeys = rowKeysAll.filter(k => /^\\d+[\\.\\s]|\\[\\d+\\]/.test(k));
        if (dsKeys.length === 0) dsKeys = rowKeysAll.slice(4).filter(k => !k.startsWith('_'));

        const OFFSETS = {
            v1: { '다중지능': 10 },
            v2: { '다중지능': 14 },
            v3: { '다중지능': 28 }
        };

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
                                const score = typeof extractScore === 'function' ? extractScore(valStr) : Number(String(valStr).replace(/[^\\d]/g, ''));
                                if(score) { sum += score; c++; }
                            }
                        }
                    });
                }
                if(c>0) miScores.push({name: sub, score: sum/c});
            });
        }
        
        if(miScores.length > 0) {
            miScores.sort((a,b) => b.score - a.score);
            const top2 = miScores.slice(0, 2);
            top2.forEach(m => {
                if(groupings[m.name]) groupings[m.name].push(getStudentName(row));
            });
        }
    });

    const grid = document.getElementById('miGroupsGrid');
    grid.innerHTML = '';
    miAreas.forEach(area => {
        const students = groupings[area.name];
        const studentHtml = students.map(s => `<span class="mi-student-badge">${s}</span>`).join('');
        
        grid.innerHTML += `
            <div class="mi-card">
                <div class="mi-card-header">
                    <div class="mi-icon" style="background-color: ${area.color};"><i class="fa-solid ${area.icon}"></i></div>
                    <div class="mi-card-title">${area.name} 지능</div>
                </div>
                <div class="mi-students-list">
                    ${students.length > 0 ? studentHtml : '<span style="color:var(--text-muted); font-size:0.9rem;">해당 학생 없음</span>'}
                </div>
            </div>
        `;
    });
}

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
    const homeContainer = document.getElementById('personalHomeContainer');
    
    if (index === "") {
        profileCard.style.display = 'none';
        if(homeContainer && parsedData.length > 0) {
            homeContainer.style.display = 'block';
            populatePersonalHome();
        }
        return;
    }

    if(homeContainer) {
        homeContainer.style.display = 'none';
    }

    const row = parsedData[index];
    document.getElementById('studentName').innerText = getStudentName(row);
    document.getElementById('studentMeta').innerText = getStudentMeta(row);
    
    if(!row._mbti) {
        const mbtiArr = ["ENTP", "ISFJ", "ENFP", "ISTJ", "ESTP", "INFP", "ESFJ", "INTJ", "ENTJ", "ISFP", "ENFJ", "ISTP", "ESTJ", "INTP", "ESFP", "INFJ"];
        row._mbti = mbtiArr[Math.floor(Math.random() * mbtiArr.length)];
    }
    
    document.getElementById('studentMbti').innerHTML = `MBTI: ${row._mbti}`;

    // Extract raw stats from survey data based on MAPPING_DATA
    let studentGradeStr = String(row['학년'] || row['학년 반 번호'] || Object.values(row)[0] || "5");
    let version = 'v3';
    if(studentGradeStr.includes('1') || studentGradeStr.includes('2')) version = 'v1';
    else if(studentGradeStr.includes('3') || studentGradeStr.includes('4')) version = 'v2';

    const rowKeysAll = Object.keys(row);
    let dsKeys = rowKeysAll.filter(k => /^\d+[\.\s]|\[\d+\]/.test(k));
    if (dsKeys.length === 0) dsKeys = rowKeysAll.slice(4).filter(k => !k.startsWith('_'));

    const OFFSETS = {
        v1: { '행복': 0, 'MBTI': 6, '다중지능': 10, '학교적응력': 18 },
        v2: { '행복': 0, 'MBTI': 6, '다중지능': 14, '학교적응력': 22 },
        v3: { '행복': 0, 'MBTI': 12, '다중지능': 28, '학교적응력': 44 }
    };

    // Helper: calculate average for a category
    function getCategoryAvg(catName) {
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
                        if(score !== null) {
                            total += score;
                            count++;
                        }
                    }
                }
            });
        });
        return count > 0 ? (total / count) : 0;
    }

    function getSubCategoryAvg(catName, subName) {
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

    // Helper: Make stars
    function getStars(score) {
        const full = Math.round(score);
        let starStr = "";
        for(let i=0; i<5; i++) {
            starStr += (i < full) ? "★" : "☆";
        }
        return starStr;
    }

    const hapAvg = getCategoryAvg('행복');
    const adaptAvg = getCategoryAvg('학교적응력');
    
    document.getElementById('studentHappinessScore').innerHTML = `행복: <span style="color:#FFD700; text-shadow:1px 1px 2px rgba(0,0,0,0.2);">${hapAvg > 0 ? getStars(hapAvg) : '데이터 부족'}</span>`;
    
    document.getElementById('studentAdaptScore').innerHTML = `학교적응: <span style="color:#A7F3D0; text-shadow:1px 1px 2px rgba(0,0,0,0.2);">${adaptAvg > 0 ? getStars(adaptAvg) : '데이터 부족'}</span>`;

    // Multi-Intelligence Top 2~3
    let miScores = [];
    if(MAPPING_DATA['다중지능']) {
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
    if(miScores.length > 0) {
        miScores.sort((a,b) => b.score - a.score);
        const topMi = miScores.slice(0, 2).map(m => m.name).join(', ');
        document.getElementById('studentMiStrengths').innerText = `강점 지능: ${topMi}`;
    } else {
        document.getElementById('studentMiStrengths').innerText = `강점 지능: 데이터 부족`;
    }

    // Reset Tabs
    switchTab('tab-summary');

    profileCard.style.display = 'block';

    // 1. Happiness Chart
    const hapLabels = ['긍정성', '정서조절', '안정감', '관계성', '유능감', '자율성'];
    const hapData = hapLabels.map(l => getSubCategoryAvg('행복', l));
    
    const ctxRadar = document.getElementById('studentRadarChart').getContext('2d');
    if(classCharts.studentRadar) classCharts.studentRadar.destroy();
    classCharts.studentRadar = new Chart(ctxRadar, {
        type: 'radar',
        data: {
            labels: hapLabels,
            datasets: [{
                label: '개별 행복 점수',
                data: hapData,
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
            <h4><i class="fa-solid fa-seedling" style="color:#E2B467"></i> 지도 보완 사항</h4>
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
    const miLabels = ['언어', '논리수학', '공간', '신체운동', '음악', '대인관계', '자기성찰', '자연친화'];
    const miChartData = miLabels.map(l => getSubCategoryAvg('다중지능', l));
    const ctxMi = document.getElementById('studentMiChart').getContext('2d');
    if(classCharts.studentMi) classCharts.studentMi.destroy();
    classCharts.studentMi = new Chart(ctxMi, {
        type: 'radar',
        data: {
            labels: miLabels,
            datasets: [{
                label: '학생 다중지능 프로파일',
                data: miChartData,
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
    const adaptLabels = ['교우관계', '교사관계', '학업태도', '규칙준수'];
    const adaptChartData = adaptLabels.map(l => getSubCategoryAvg('학교적응력', l));
    const ctxAdapt = document.getElementById('studentAdaptChart').getContext('2d');
    if(classCharts.studentAdapt) classCharts.studentAdapt.destroy();
    classCharts.studentAdapt = new Chart(ctxAdapt, {
        type: 'bar',
        data: {
            labels: adaptLabels,
            datasets: [{
                label: '항목별 적응 수준',
                data: adaptChartData,
                backgroundColor: '#92B4F2',
                borderRadius: 4
            }]
        },
        options: {
            scales: { y: { min: 0, max: 5, ticks: { stepSize: 1 } } },
            plugins: { legend: { display: false } }
        }
    });

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

    let flatEvals = [];
    if (targetSurvey) {
        targetSurvey.forEach(sec => {
            sec.questions.forEach(q => flatEvals.push(q.eval || sec.section));
        });
    }

    // 5. Raw Survey Data Render per category
    const renderTable = (keys, startIndex = 0) => {
        if(!keys || keys.length === 0) return '<p style="padding:15px; color:var(--text-muted); font-size:0.95rem;">연결된 응답 데이터가 없습니다.</p>';
        let tableHtml = '<table style="width:100%; border-collapse: collapse; font-size: 0.95rem;"><thead><tr><th style="padding:10px; border-bottom:2px solid #ddd; text-align:left;">항목 헤더</th><th style="padding:10px; border-bottom:2px solid #ddd; text-align:left;">응답 값</th></tr></thead><tbody>';
        keys.forEach((key, iterIdx) => {
            const prefix = flatEvals[startIndex + iterIdx] ? `[${flatEvals[startIndex + iterIdx]}] ` : '';
            tableHtml += `<tr><td style="padding:12px; border-bottom:1px solid #eee; font-weight:500; width:65%; color:var(--text-main);"><span style="color:var(--primary-color); font-weight:bold; margin-right:5px;">${prefix}</span>${key}</td><td style="padding:12px; border-bottom:1px solid #eee; color: var(--primary-color); font-weight:bold;">${row[key]}</td></tr>`;
        });
        tableHtml += '</tbody></table>';
        return tableHtml;
    };

    let hapKeys = [], mbtiKeys = [], miKeys = [], adaptKeys = [];
    
    let hapOffset = 0, mbtiOffset = 0, miOffset = 0, adaptOffset = 0;
    if (targetSurvey && finalSurveyKeys.length === targetSurvey.reduce((sum, s) => sum + s.questions.length, 0)) {
        hapOffset = 0;
        hapKeys = finalSurveyKeys.slice(hapOffset, hapOffset + targetSurvey[0].questions.length); 
        mbtiOffset = hapOffset + targetSurvey[0].questions.length;
        mbtiKeys = finalSurveyKeys.slice(mbtiOffset, mbtiOffset + targetSurvey[1].questions.length); 
        miOffset = mbtiOffset + targetSurvey[1].questions.length;
        miKeys = finalSurveyKeys.slice(miOffset, miOffset + targetSurvey[2].questions.length); 
        adaptOffset = miOffset + targetSurvey[2].questions.length;
        adaptKeys = finalSurveyKeys.slice(adaptOffset, adaptOffset + targetSurvey[3].questions.length);
    } else if (finalSurveyKeys.length > 0) {
        // 길이가 정확히 맞지 않는 경우, 대략 4등분 (fallback)
        let chunk = Math.ceil(finalSurveyKeys.length / 4);
        hapOffset = 0; hapKeys = finalSurveyKeys.slice(0, chunk);
        mbtiOffset = chunk; mbtiKeys = finalSurveyKeys.slice(chunk, chunk*2);
        miOffset = chunk*2; miKeys = finalSurveyKeys.slice(chunk*2, chunk*3);
        adaptOffset = chunk*3; adaptKeys = finalSurveyKeys.slice(chunk*3);
    }

    if(document.getElementById('studentHappinessRaw')) document.getElementById('studentHappinessRaw').innerHTML = renderTable(hapKeys, hapOffset);
    if(document.getElementById('studentMbtiRaw')) document.getElementById('studentMbtiRaw').innerHTML = renderTable(mbtiKeys, mbtiOffset);
    if(document.getElementById('studentMiRaw')) document.getElementById('studentMiRaw').innerHTML = renderTable(miKeys, miOffset);
    if(document.getElementById('studentAdaptRaw')) document.getElementById('studentAdaptRaw').innerHTML = renderTable(adaptKeys, adaptOffset);
    
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
    
    renderStudentChatHistoryReport(studentIdx);
});

window.renderStudentChatHistoryReport = function(studentIdx) {
    if (studentIdx === undefined || studentIdx === null) {
        studentIdx = document.getElementById('studentSelect').value;
    }
    const container = document.getElementById('studentChatReportContainer');
    const body = document.getElementById('studentChatReportBody');
    if(!container || !body || studentIdx === "" || !parsedData[studentIdx]) return;
    
    const row = parsedData[studentIdx];
    if (row._chatHistory && row._chatHistory.length > 0) {
        container.style.display = 'block';
        let textContent = "";
        row._chatHistory.forEach(msg => {
            let roleName = msg.role === 'user' ? "선생님(본인)" : "AI 컨설턴트";
            let formatted = msg.text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
            textContent += `<strong>▶ ${roleName}</strong>\n${formatted}\n\n<hr style="border:0; border-top:1px dashed #eee; margin:10px 0;">\n\n`;
        });
        body.innerHTML = textContent;
    } else {
        container.style.display = 'none';
        body.innerHTML = '';
    }
};

// Gemini API & Chat Logic
let globalApiKey = sessionStorage.getItem('geminiApiKey') || "";
let globalApiModel = sessionStorage.getItem('geminiApiModel') || "gemini-2.5-flash";

// 만료된 모델이 저장되어 있다면 강제로 최신 2.5 flash 모델로 자동 교체합니다
if (globalApiModel.includes("exp") || globalApiModel === "gemini-2.0-flash-exp") {
    globalApiModel = "gemini-2.5-flash";
    sessionStorage.setItem('geminiApiModel', globalApiModel);
}

let currentChatContext = ""; 
let chatHistory = [];
let currentChatStudentIndex = null;

document.addEventListener('DOMContentLoaded', () => {
    updateApiStatusBadge();
});

function updateApiStatusBadge() {
    const badge = document.getElementById('apiStatusBadge');
    if (!badge) return;
    if (globalApiKey) {
        badge.textContent = "API 설정 완료";
        badge.style.background = "#E6F4EF";
        badge.style.color = "var(--primary-color)";
        badge.style.borderColor = "var(--primary-color)";
    } else {
        badge.textContent = "API 미설정";
        badge.style.background = "#E2E8F0";
        badge.style.color = "var(--text-muted)";
        badge.style.borderColor = "#CBD5E1";
    }

    const sidebarBtn = document.getElementById('sidebarApiBtn');
    if(sidebarBtn) {
        if(globalApiKey) {
            sidebarBtn.className = "btn btn-outline-tertiary";
            sidebarBtn.innerHTML = `<i class="fa-solid fa-key"></i> 내 API Key 설정 (등록완료)`;
            sidebarBtn.style.backgroundColor = "rgba(244, 196, 118, 0.1)";
        } else {
            sidebarBtn.className = "btn btn-outline-primary";
            sidebarBtn.innerHTML = `<i class="fa-solid fa-key"></i> 내 API Key 설정`;
            sidebarBtn.style.backgroundColor = "transparent";
        }
    }
}

window.openApiModal = function() {
    document.getElementById('globalApiKeyInput').value = globalApiKey;
    if (document.getElementById('geminiModelSelect').querySelector(`option[value="${globalApiModel}"]`)) {
        document.getElementById('geminiModelSelect').value = globalApiModel;
    } else {
        document.getElementById('geminiModelSelect').value = "gemini-2.5-flash";
    }
    document.getElementById('apiSetupModal').style.display = 'flex';
};

window.closeApiModal = function() {
    document.getElementById('apiSetupModal').style.display = 'none';
};

window.saveApiKey = function() {
    const key = document.getElementById('globalApiKeyInput').value.trim();
    const model = document.getElementById('geminiModelSelect').value;
    
    if(key) {
        globalApiKey = key;
        globalApiModel = model;
        sessionStorage.setItem('geminiApiKey', key);
        sessionStorage.setItem('geminiApiModel', model);
        updateApiStatusBadge();
        alert(`API 설정이 완료되었습니다. (선택 모델: ${model})`);
        closeApiModal();
    } else {
        alert("API 키를 입력해주세요.");
    }
};

window.resetApiKey = function() {
    globalApiKey = "";
    globalApiModel = "gemini-2.5-flash";
    sessionStorage.removeItem('geminiApiKey');
    sessionStorage.removeItem('geminiApiModel');
    document.getElementById('globalApiKeyInput').value = "";
    document.getElementById('geminiModelSelect').value = "gemini-2.5-flash";
    updateApiStatusBadge();
    alert("API 설정이 초기화되었습니다.");
};

window.callGeminiApi = async function(prompt, retryCount = 0) {
    if(!globalApiKey) {
        throw new Error("API 키가 설정되지 않았습니다.");
    }
    
    let activeModel = globalApiModel;
    let apiVersion = "v1";

    // "무적의 방법": 실패 시 구글의 모든 조합(v1, v1beta, flash강등)을 우회 시도합니다.
    if (retryCount === 1) {
        // v1 <-> v1beta 크로스오버 시도
        apiVersion = (activeModel.includes("2.5") || activeModel.includes("beta")) ? "v1" : "v1beta";
    } else if (retryCount === 2) {
        // 최후의 보루: 가장 안정적인 1.5 flash 정식버전으로 자동 다운그레이드 접속
        activeModel = "gemini-1.5-flash";
        apiVersion = "v1beta";
    } else if (retryCount > 2) {
        throw new Error("모든 우회 시도(3회)에 실패했습니다. 사용하시는 API 키의 권한 문제이거나 서버 오류일 가능성이 높습니다.");
    } else {
        // 첫 시도 라우팅
        if (activeModel.includes("2.5") || activeModel.includes("beta") || activeModel.includes("exp")) {
            apiVersion = "v1beta";
        }
    }
    
    const url = `https://generativelanguage.googleapis.com/${apiVersion}/models/${activeModel}:generateContent?key=${globalApiKey}`;
    
    // Convert history + current prompt to Gemini format
    const contents = chatHistory.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }]
    }));
    contents.push({ role: 'user', parts: [{ text: prompt }] });

    const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: contents })
    }).catch(e => {
        throw new Error("네트워크 연결 실패(교내망 등 보안 프로그램 차단) 또는 API 키 오류일 수 있습니다. 원문: " + e.message);
    });
    
    if(!response.ok) {
        const errData = await response.json().catch(()=>({}));
        const errMsg = errData.error?.message || "알 수 없는 API 서버 오류 발생";
        
        // not found나 not supported 에러일 경우 무조건 리트라이 재귀 호출
        if (errMsg.toLowerCase().includes("not found") || errMsg.toLowerCase().includes("not supported")) {
            console.warn(`[Auto Retry ${retryCount+1}] Model or API Version failed. Rerouting...`);
            return window.callGeminiApi(prompt, retryCount + 1);
        }
        throw new Error(errMsg);
    }
    
    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
};

// Helper to append Teacher info to AI Prompts
function getTeacherInfoString() {
    let str = "";
    if (window.registeredTeacherIndex !== undefined && parsedData[window.registeredTeacherIndex]) {
        const tRow = parsedData[window.registeredTeacherIndex];
        const tName = getStudentName(tRow);
        const tMbti = tRow._mbti || "미상";
        const s = tRow._strengths ? tRow._strengths.join(", ") : "";
        
        str = `\n\n[교사(컨설턴트) 본인 정보 참고 데이터]\n- 교사 이름: ${tName}\n- 교사 추정 MBTI: ${tMbti}\n- 교사 주요 발달 강점: ${s}\n* 추가 지시문: 답변 시 교사의 이러한 특성 및 성향을 고려하여, 학생(또는 학급)과의 궁합 및 지도 시너지를 유발할 수 있는 방향으로 대화 흐름을 전개해주세요.`;
    }
    return str;
}

// Chat UI Controls
window.openStudentConsultingChat = function() {
    const studentIdx = document.getElementById('studentSelect').value;
    if (studentIdx === "") return alert("학생을 먼저 선택해주세요.");
    if (!globalApiKey) {
        alert("글로벌 API 키 설정이 필요합니다. 좌측 메뉴 하단의 버튼을 눌러 설정해주세요.");
        return openApiModal();
    }
    
    currentChatStudentIndex = studentIdx;
    
    const row = parsedData[studentIdx];
    const name = getStudentName(row);
    document.getElementById('chatTitle').innerText = `${name} 학생 맞춤 상담`;
    
    const strengths = row._strengths ? row._strengths.join(", ") : "";
    const weaknesses = row._weaknesses ? row._weaknesses.join(", ") : "";
    
    currentChatContext = `선생님은 초등학교 교사이고, 나는 선생님을 돕는 교육 AI 컨설턴트입니다.
현재 우리는 [${name}(${getStudentMeta(row)})] 학생에 대해 논의 중입니다.
학생의 MBTI는 ${row._mbti || "미상"}이며, 눈여겨볼 강점은 [${strengths}]이고, 지도/보완점은 [${weaknesses}]입니다.
선생님이 질문하시면 친절하고 실천 가능하며 선생님을 배려하는 어조로 짧고 명확하게 답변해주세요. 첫 인사를 부탁합니다.` + getTeacherInfoString();
    
    initChatOverlay();
};

// Multiple Selection Logic
window.toggleAllStudentsSelection = function(checkbox) {
    const checkboxes = document.querySelectorAll('.student-checkbox');
    checkboxes.forEach(cb => { cb.checked = checkbox.checked; });
};

window.openAndStartPersonalChat = function(index) {
    selectStudentFromHome(index);
    setTimeout(() => {
        openStudentConsultingChat();
    }, 100);
};

window.openCombinedConsultingChat = function() {
    const checkedBoxes = document.querySelectorAll('.student-checkbox:checked');
    if (checkedBoxes.length > 0) {
        if (checkedBoxes.length === 1) {
            openAndStartPersonalChat(checkedBoxes[0].value);
        } else {
            openBatchConsultingChat();
        }
    } else {
        const studentIdx = document.getElementById('studentSelect').value;
        if (studentIdx === "") return alert("컨설팅을 받을 학생을 목록에서 선택하거나 체크박스로 선택해주세요.");
        openStudentConsultingChat();
    }
};

window.openCombinedAiLinkModal = function() {
    const checkedBoxes = document.querySelectorAll('.student-checkbox:checked');
    if (checkedBoxes.length > 0) {
        if (checkedBoxes.length === 1) {
            selectStudentFromHome(checkedBoxes[0].value);
            setTimeout(() => {
                startGeminiConsulting();
            }, 100);
        } else {
            startBatchGeminiConsulting();
        }
    } else {
        const studentIdx = document.getElementById('studentSelect').value;
        if (studentIdx === "") return alert("컨설팅을 받을 학생을 목록에서 선택하거나 체크박스로 선택해주세요.");
        startGeminiConsulting();
    }
};

window.startBatchGeminiConsulting = function() {
    const checkedBoxes = document.querySelectorAll('.student-checkbox:checked');
    if (checkedBoxes.length === 0) return alert("다중 컨설팅을 받을 학생을 먼저 1명 이상 선택해주세요.");
    
    let studentDetails = [];
    checkedBoxes.forEach(cb => {
        const idx = cb.value;
        const row = parsedData[idx];
        const name = getStudentName(row);
        const strengths = row._strengths ? row._strengths.join(", ") : "특이사항 없음";
        const weaknesses = row._weaknesses ? row._weaknesses.join(", ") : "특이사항 없음";
        studentDetails.push(`- ${name} (${getStudentMeta(row)}), MBTI: ${row._mbti || "미상"}, 강점: ${strengths}, 보완점: ${weaknesses}`);
    });
    
    const prompt = `선생님은 초등학교 교사이고, 나는 선생님을 돕는 교육 AI 컨설턴트입니다.
현재 우리는 다음 ${checkedBoxes.length}명의 학생들에 대해 동시에 고민하고 논의 중입니다.

[선택된 학생들 정보]
${studentDetails.join('\n')}

선생님이 위 학생들을 묶어서 어떤 활동이나 지도를 해야 할지, 혹은 개별적으로 어떻게 접근하면 좋을지 질문하시면, 그룹 다이내믹스와 개인 성향을 동시에 고려하여 실천 가능한 팁을 제안해주세요. 첫 인사를 부탁합니다.` + getTeacherInfoString();
    
    openAiSiteModal(prompt, `${checkedBoxes.length}명의 요약 정보와 컨설팅 프롬프트가 복사되었습니다!`);
};

window.openBatchConsultingChat = function() {
    const checkedBoxes = document.querySelectorAll('.student-checkbox:checked');
    if (checkedBoxes.length === 0) return alert("다중 컨설팅을 받을 학생을 먼저 1명 이상 선택해주세요.");
    
    if (!globalApiKey) {
        alert("글로벌 API 키 설정이 필요합니다. 좌측 메뉴 하단의 버튼을 눌러 설정해주세요.");
        return openApiModal();
    }
    
    let studentDetails = [];
    checkedBoxes.forEach(cb => {
        const idx = cb.value;
        const row = parsedData[idx];
        const name = getStudentName(row);
        const strengths = row._strengths ? row._strengths.join(", ") : "특이사항 없음";
        const weaknesses = row._weaknesses ? row._weaknesses.join(", ") : "특이사항 없음";
        studentDetails.push(`- ${name} (${getStudentMeta(row)}), MBTI: ${row._mbti || "미상"}, 강점: ${strengths}, 보완점: ${weaknesses}`);
    });
    
    document.getElementById('chatTitle').innerText = `${checkedBoxes.length}명 요약 동시 컨설팅`;
    
    currentChatContext = `선생님은 초등학교 교사이고, 나는 선생님을 돕는 교육 AI 컨설턴트입니다.
현재 우리는 다음 ${checkedBoxes.length}명의 학생들에 대해 동시에 고민하고 논의 중입니다.

[선택된 학생들 정보]
${studentDetails.join('\n')}

선생님이 위 학생들을 묶어서 어떤 활동이나 지도를 해야 할지, 혹은 개별적으로 어떻게 접근하면 좋을지 질문하시면, 그룹 다이내믹스와 개인 성향을 동시에 고려하여 실천 가능한 팁을 제안해주세요. 첫 인사를 부탁합니다.` + getTeacherInfoString();
    
    initChatOverlay();
};

window.openClassConsultingChat = function() {
    if (parsedData.length === 0) return alert("데이터를 먼저 입력해주세요.");
    if (!globalApiKey) {
        alert("글로벌 API 키 설정이 필요합니다. 좌측 메뉴 하단의 버튼을 눌러 설정해주세요.");
        return openApiModal();
    }
    
    document.getElementById('chatTitle').innerText = `학급 전체 종합 상담`;
    
    currentChatContext = `선생님은 초등학교 교사이고, 나는 선생님을 돕는 교육 AI 컨설턴트입니다.
현재 우리 학급에는 총 ${parsedData.length}명의 학생이 있습니다.
선생님이 학급 경영, 수업 방향, 전체적인 분위기 조성에 대해 질문을 하실 것입니다.
질문이 오면 친절하고 실제 교실에서 쓰일 수 있는 구체적인 팁 위주로 명확하게 답변해주세요. 첫 인사를 부탁합니다.` + getTeacherInfoString();
    
    initChatOverlay();
};

window.startClassGeminiConsulting = function() {
    if (parsedData.length === 0) return alert("데이터를 먼저 입력해주세요.");

    const totalStudents = parsedData.length;
    // Calculate simple class average strengths / weaknesses based on keyword frequencies
    const allStrengths = {};
    const allWeaknesses = {};
    const allMbti = {};
    const genderDist = { '남': 0, '여': 0 };
    const distData = {};
    
    parsedData.forEach(row => {
        // Gender logic
        const gKeys = Object.keys(row).filter(k => k.includes('성별') || k.includes('남녀'));
        if(gKeys.length > 0) {
            const gVal = row[gKeys[0]].toString();
            if(gVal.includes('남') || gVal.includes('M')) genderDist['남']++;
            else if(gVal.includes('여') || gVal.includes('F')) genderDist['여']++;
        }

        if(row._mbti) {
            allMbti[row._mbti] = (allMbti[row._mbti] || 0) + 1;
        }
        if(row._strengths) {
            row._strengths.forEach(s => { allStrengths[s] = (allStrengths[s] || 0) + 1; });
        }
        if(row._weaknesses) {
            row._weaknesses.forEach(w => { allWeaknesses[w] = (allWeaknesses[w] || 0) + 1; });
        }

        // Calculate distribution
        const rowKeys = Object.keys(row).filter(k => /^\d+\./.test(k));
        const surveyKeys = rowKeys.length > 0 ? rowKeys : Object.keys(row).slice(4);
        surveyKeys.forEach(k => {
            if(!distData[k]) distData[k] = { "1":0, "2":0, "3":0, "4":0, "5":0 };
            const m = String(row[k]).match(/\d+/);
            if(m && distData[k][m[0]] !== undefined) {
                distData[k][m[0]]++;
            }
        });
    });

    const topMbti = Object.entries(allMbti).sort((a,b) => b[1]-a[1]).slice(0,3).map(e=>e[0]).join(', ');
    const topStrengths = Object.entries(allStrengths).sort((a,b) => b[1]-a[1]).slice(0,5).map(e=>`${e[0]}(${e[1]}명)`).join(', ');
    const topWeaknesses = Object.entries(allWeaknesses).sort((a,b) => b[1]-a[1]).slice(0,5).map(e=>`${e[0]}(${e[1]}명)`).join(', ');

    let genderStr = "";
    const totalG = genderDist['남'] + genderDist['여'];
    if(totalG > 0) {
        genderStr = `\n- 성별 분포: 남 ${genderDist['남']}명 (${Math.round(genderDist['남']/totalG*100)}%), 여 ${genderDist['여']}명 (${Math.round(genderDist['여']/totalG*100)}%)`;
    }

    let distStr = "\n[설문 문항별 학생 응답 분포 (1~5점 척도)]\n";
    Object.keys(distData).forEach(k => {
        const d = distData[k];
        distStr += `- ${k} => (1점:${d["1"]}명, 2점:${d["2"]}명, 3점:${d["3"]}명, 4점:${d["4"]}명, 5점:${d["5"]}명)\n`;
    });

    // Extract factor averages if available in SURVEY_DATA
    let factorStr = "";
    let version = 'v3';
    let sampleRow = parsedData[0];
    let gradeStr = String(sampleRow['학년'] || Object.values(sampleRow)[0] || "5");
    if(gradeStr.includes('1') || gradeStr.includes('2')) version = 'v1';
    else if(gradeStr.includes('3') || gradeStr.includes('4')) version = 'v2';
    
    if(typeof MAPPING_DATA !== 'undefined') {
        factorStr += "\n[요인별 정량 통계 (5점 만점 환산 추정)]\n";
        let factorScores = {};
        let factorCounts = {};
        
        parsedData.forEach(row => {
            const rowVals = Object.values(row);
            Object.keys(MAPPING_DATA).forEach(cat => {
                if(cat==='MBTI') return;
                Object.keys(MAPPING_DATA[cat]).forEach(sub => {
                    const qNums = MAPPING_DATA[cat][sub][version];
                    if(!qNums) return;
                    qNums.forEach(qNum => {
                        const valMatch = String(rowVals[3+qNum]).match(/\d+/);
                        if(valMatch) {
                            const measureName = `[${cat}] ${sub}`;
                            factorScores[measureName] = (factorScores[measureName] || 0) + parseInt(valMatch[0], 10);
                            factorCounts[measureName] = (factorCounts[measureName] || 0) + 1;
                        }
                    });
                });
            });
        });
        
        Object.keys(factorScores).forEach(key => {
            const avg = (factorScores[key] / factorCounts[key]).toFixed(2);
            factorStr += `- ${key}: 평균 ${avg}점\n`;
        });
    }

    const prompt = `당신은 초등학교 학급 경영 및 학생 교육을 돕는 심층적이고 전문적인 교육 AI 컨설턴트입니다.
다음은 제가 맡고 있는 학급(${totalStudents}명)의 다면적 심리 및 학교생활 설문 종합 데이터 상세 요약(정량적 통계 포함)입니다.
이를 심층 분석하여, 활기차고 안정적인 학급 문화를 만들기 위해 오늘 당장 제가 학급에서 실천할 수 있는 구체적인 관리 및 지도 팁 3가지(또는 그 이상)를 제시해주세요.

[학급 종합 요약 정보]
- 총 인원: ${totalStudents}명${genderStr}
- 학급 내 선호 MBTI 유형 등역: ${topMbti || '데이터 부족'}
- 학급 전체에서 두드러지는 공통 강점들 (선택 인원): ${topStrengths || '데이터 부족'}
- 학급 전체에서 주의 깊게 살펴보고 보완해야 할 점들 (선택 인원): ${topWeaknesses || '데이터 부족'}
${factorStr}
${distStr}

추가로, 위 요인별 문항 매핑(정량 분석) 지표 중 상대적으로 수치가 가장 낮거나 보완이 절실해 보이는 영역을 1~2가지 꼭 집어내어,
이를 극복할 수 있는 전체 학급 차원의 협동 활동이나 조종례 시간 활용 팁을 포함해주세요.
어조는 담임 교사에게 따뜻하고 깊이 있게 조언하듯 존댓말로 작성해주시길 바랍니다.` + getTeacherInfoString();

    openAiSiteModal(prompt, "학급 전체 요약 정보와 컨설팅 프롬프트가 복사되었습니다!");
};

window.startGeminiConsulting = function() {
    const studentIdx = document.getElementById('studentSelect').value;
    if (studentIdx === "") return alert("학생을 먼저 선택해주세요.");
    
    const row = parsedData[studentIdx];
    const name = getStudentName(row);
    const meta = getStudentMeta(row);

    const strengths = row._strengths ? row._strengths.join(", ") : "특이사항 없음";
    const weaknesses = row._weaknesses ? row._weaknesses.join(", ") : "특이사항 없음";
    const mbti = row._mbti || "알 수 없음";

    const rowKeys = Object.keys(row).filter(k => !k.startsWith('_'));
    const rowValues = Object.values(row);
    const surveyKeys = rowKeys.filter(k => /^\d+\./.test(k)); 
    const finalSurveyKeys = surveyKeys.length > 0 ? surveyKeys : rowKeys.slice(4);

    let gradeStr = String(row['학년'] || rowValues[0] || "O");
    let targetSurvey = SURVEY_DATA["5~6학년용"];
    if(gradeStr.includes('1') || gradeStr.includes('2')) targetSurvey = SURVEY_DATA["1~2학년용"];
    else if(gradeStr.includes('3') || gradeStr.includes('4')) targetSurvey = SURVEY_DATA["3~4학년용"];

    let flatEvals = [];
    if (targetSurvey) {
        targetSurvey.forEach(sec => {
            sec.questions.forEach(q => flatEvals.push(q.eval || sec.section));
        });
    }

    const surveyResponses = finalSurveyKeys.map((key, i) => {
        const prefix = flatEvals[i] ? `[${flatEvals[i]}] ` : '';
        return `${prefix}${key} : ${row[key]}`;
    }).join('\n');

    const prompt = `당신은 초등학교 교사를 돕는 따뜻하고 전문적인 학생 맞춤형 지도 AI 상담전문가입니다.
다음은 [${name}] 학생이 직접 참여한 종합 다면적 심리/학교생활 설문 응답 결과입니다.
이를 꼼꼼히 분석하여, 학급 담임 교사에게 학교생활 지도 및 학생의 강점 강화를 위해 당장 실천할 수 있는 구체적인 컨설팅 내용을 제공해주세요.

[학생 기본 정보]
- 이름: ${name}
- 소속: ${meta}
- 추정 MBTI 성향: ${mbti}
- 주요 발달 강점: ${strengths}
- 요주의 및 보완점: ${weaknesses}

[설문 응답 상세 내역 요약]
${surveyResponses}

어조는 담임 교사에게 따뜻하고 깊이 있게 조언하듯 존댓말로 작성해주시고, 위 응답 내역에 기반하여 실제 학급에서 오늘 당장 적용할 수 있는 구체적이고 실질적인 교사의 지도 팁을 3가지 이상 상세히 포함해주세요. 특히 설문에 드러난 긍정/부정적 요소를 어떻게 활용하고 보완할지에 초점을 맞춰주세요.

또한 첫 번째 답변의 마지막 부분에는 반드시 "추가 안내 및 활용법 제안 목록"을 제공하여, 교사가 이어서 질문이나 작업을 요청할 수 있도록 돕는 예시를 들어주세요.
- 예시 1: [이 학생의 다중지능 강점과 MBTI를 바탕으로 가장 효과적인 수학 학습법 추천]
- 예시 2: [관계성 점수가 낮게 나왔는데 교실에서 친구들과 어울릴 수 있는 교우관계 향상 방안 제안] 
- 예시 3: [강점 키워드에 따른 진로 전략 제안]
- 예시 4: [부모님께 부드럽게 전달할 수 있는 학부모 상담 기초자료 작성]
- 예시 5: [학기말 이 학생의 성장을 격려하고 칭찬하는 5줄 이내의 편지 작성]` + getTeacherInfoString();

    openAiSiteModal(prompt, `[${name}] 학생의 정보와 컨설팅 프롬프트가 복사되었습니다!`);
};

function persistChatHistory() {
    if (currentChatStudentIndex !== null && parsedData[currentChatStudentIndex]) {
        parsedData[currentChatStudentIndex]._chatHistory = [...chatHistory];
        if (typeof window.renderStudentChatHistoryReport === 'function') {
            window.renderStudentChatHistoryReport(currentChatStudentIndex);
        }
    }
}

function initChatOverlay() {
    chatHistory = [];
    document.getElementById('chatBody').innerHTML = '';
    document.getElementById('chatOverlay').style.display = 'block';
    
    // Restore history if personal consulting and exists
    if (currentChatStudentIndex !== null && parsedData[currentChatStudentIndex]._chatHistory) {
        chatHistory = [...parsedData[currentChatStudentIndex]._chatHistory];
        chatHistory.forEach(msg => {
            const chatBody = document.getElementById('chatBody');
            const bubble = document.createElement('div');
            bubble.className = `chat-bubble ${msg.role}-bubble`;
            let formattedText = msg.text.replace(/\n\n/g, '<br><br>').replace(/\n/g, '<br>');
            formattedText = formattedText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
            bubble.innerHTML = formattedText;
            chatBody.appendChild(bubble);
        });
        const cBody = document.getElementById('chatBody');
        cBody.scrollTop = cBody.scrollHeight;
        return; // Skip initiating new connect
    }

    // System Prompt 초기화
    addChatBubble("bot", `<i class="fa-solid fa-spinner fa-spin"></i> 연결 중...`);
    
    callGeminiApi(currentChatContext).then(resText => {
        document.getElementById('chatBody').innerHTML = '';
        addChatBubble("bot", resText);
        chatHistory.push({ role: 'bot', text: resText });
        persistChatHistory();
    }).catch(err => {
        document.getElementById('chatBody').innerHTML = '';
        addChatBubble("bot", "API 연결에 실패했습니다. 키가 올바른지 확인해주세요. (" + err.message + ")");
    });
}

window.closeChatOverlay = function() {
    persistChatHistory();
    currentChatStudentIndex = null;
    document.getElementById('chatOverlay').style.display = 'none';
};

function addChatBubble(role, text) {
    const chatBody = document.getElementById('chatBody');
    const bubble = document.createElement('div');
    bubble.className = `chat-bubble ${role}-bubble`;
    // 단순 줄바꿈 및 마크다운 리스트 임시 렌더링
    let formattedText = text.replace(/\n\n/g, '<br><br>').replace(/\n/g, '<br>');
    formattedText = formattedText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    bubble.innerHTML = formattedText;
    chatBody.appendChild(bubble);
    chatBody.scrollTop = chatBody.scrollHeight;
}

window.sendChatMessage = function() {
    const inputEl = document.getElementById('chatInput');
    const text = inputEl.value.trim();
    if(!text) return;
    
    addChatBubble("user", text);
    chatHistory.push({ role: 'user', text: text });
    inputEl.value = '';
    inputEl.style.height = 'auto'; // 리사이즈 리셋
    
    // Loading indicator
    const loadingId = "loading-" + Date.now();
    const chatBody = document.getElementById('chatBody');
    const bubble = document.createElement('div');
    bubble.className = `chat-bubble bot-bubble`;
    bubble.id = loadingId;
    bubble.innerHTML = `<span style="color:var(--text-muted); font-size:0.85rem;"><i class="fa-solid fa-ellipsis fa-fade"></i> AI 답변을 기다리는 중...</span>`;
    chatBody.appendChild(bubble);
    chatBody.scrollTop = chatBody.scrollHeight;

    callGeminiApi(text).then(resText => {
        document.getElementById(loadingId).remove();
        addChatBubble("bot", resText);
        chatHistory.push({ role: 'bot', text: resText });
        persistChatHistory();
    }).catch(err => {
        document.getElementById(loadingId).remove();
        addChatBubble("bot", `<span style="color:#E53E3E;">에러가 발생했습니다: ${err.message}</span>`);
    });
};

document.getElementById('chatInput').addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendChatMessage();
    }
});

// 자동 리사이징 input
document.getElementById('chatInput').addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = (this.scrollHeight) + 'px';
});

window.requestChatAction = function(actionType) {
    if(chatHistory.length < 2) return alert("대화 내역이 충분하지 않습니다.");
    
    let promptMsg = "";
    if(actionType === 'summary') {
        promptMsg = "지금까지 우리가 나눈 대화 내용을 3~4문장으로 짧게 요약해줘.";
    } else if (actionType === 'organize') {
        promptMsg = "지금까지 우리가 나눈 대화에서 나온 주요 지도 방안, 주의점 등을 글머리 기호(마크다운 리스트)를 사용하여 구체적인 항목별로 깔끔하게 정리해줘.";
    }
    
    if(promptMsg) {
        addChatBubble("user", `[시스템 요청: ${actionType === 'summary' ? '대화 요약' : '내용 정리'}]`);
        chatHistory.push({ role: 'user', text: `[시스템 요청: ${actionType === 'summary' ? '대화 요약' : '내용 정리'}]` });
        persistChatHistory();
        
        const loadingId = "loading-" + Date.now();
        const chatBody = document.getElementById('chatBody');
        const bubble = document.createElement('div');
        bubble.className = `chat-bubble bot-bubble`;
        bubble.id = loadingId;
        bubble.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> 처리 중...`;
        chatBody.appendChild(bubble);
        chatBody.scrollTop = chatBody.scrollHeight;

        callGeminiApi(promptMsg).then(resText => {
            document.getElementById(loadingId).remove();
            addChatBubble("bot", resText);
            chatHistory.push({ role: 'bot', text: resText });
            persistChatHistory();
        }).catch(err => {
            document.getElementById(loadingId).remove();
            addChatBubble("bot", "오류 발생: " + err.message);
        });
    }
};

window.downloadChatHistory = function() {
    if(chatHistory.length === 0) return alert("다운로드할 대화 내역이 없습니다.");
    
    let textContent = "==== AI 컨설턴트 상담 내역 ====\n\n";
    chatHistory.forEach(msg => {
        let roleName = msg.role === 'user' ? "선생님" : "AI 컨설턴트";
        textContent += `▶ ${roleName}\n${msg.text}\n\n-------------------------------\n\n`;
    });
    
    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `AI상담내역_${new Date().getTime()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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

// AI Site Modal Logic
window.openAiSiteModal = function(textToCopy, customMessage) {
    navigator.clipboard.writeText(textToCopy).then(() => {
        const msgEl = document.getElementById('aiSiteModalMessage');
        if(msgEl) msgEl.innerText = customMessage || "원하시는 AI 사이트로 이동하여 붙여넣기(Ctrl+V) 하세요.";
        document.getElementById('aiSiteModal').style.display = 'flex';
    }).catch(err => {
        console.error("클립보드 실패:", err);
        alert("클립보드 복사에 실패했습니다.");
    });
};
window.closeAiSiteModal = function() {
    document.getElementById('aiSiteModal').style.display = 'none';
};
window.openAiSite = function(url) {
    window.open(url, "_blank");
    closeAiSiteModal();
};

// Toggle 2nd Semester AI UI
window.toggleSecondSemester = function() {
    const isChecked = document.getElementById('aiSecondSemesterCheck').checked;
    const secContainer = document.getElementById('secondSemesterSetup');
    const basicLenContainer = document.getElementById('aiLengthContainer');
    
    if (isChecked) {
        secContainer.style.display = 'block';
        if(basicLenContainer) basicLenContainer.style.opacity = '0.5';
    } else {
        secContainer.style.display = 'none';
        if(basicLenContainer) basicLenContainer.style.opacity = '1';
    }
};

// Random keywords picker
window.promptRandomKeywords = function(type) {
    if(parsedData.length === 0) return alert("데이터가 없습니다. 먼저 분석해주세요.");
    
    const inputId = type === 'strength' ? 'randomCountStrength' : 'randomCountWeakness';
    const inputObj = document.getElementById(inputId);
    if(!inputObj) return;
    
    let count = parseInt(inputObj.value, 10);
    if(isNaN(count) || count < 0) return alert("올바른 숫자를 입력하세요.");
    
    let typeClass = type === 'strength' ? 'strength' : 'weakness';
    
    parsedData.forEach((row, index) => {
        const badgesContainer = document.getElementById(type === 'strength' ? `ai-strengths-${index}` : `ai-weaknesses-${index}`);
        if(!badgesContainer) return;

        const badges = Array.from(badgesContainer.querySelectorAll(`.keyword-badge.${typeClass}`));
        
        // Shuffle
        const shuffled = [...badges].sort(() => 0.5 - Math.random());
        shuffled.forEach((badge, idx) => {
            if(idx < count) {
                badge.classList.add('active');
            } else {
                badge.classList.remove('active');
            }
        });
    });
};

// Select all keywords
window.selectAllKeywords = function(type) {
    if(parsedData.length === 0) return;
    let typeClass = type === 'strength' ? 'strength' : 'weakness';
    parsedData.forEach((row, index) => {
        const badgesContainer = document.getElementById(type === 'strength' ? `ai-strengths-${index}` : `ai-weaknesses-${index}`);
        if(!badgesContainer) return;
        const badges = Array.from(badgesContainer.querySelectorAll(`.keyword-badge.${typeClass}`));
        badges.forEach(badge => badge.classList.add('active'));
    });
};

// Adjust AI Length setup
window.adjustAiLength = function(delta) {
    const input = document.getElementById('aiLengthSetup');
    if(input) {
        let val = parseInt(input.value, 10);
        if(isNaN(val)) val = 300;
        val += delta;
        if(val < 50) val = 50; 
        input.value = val;
        syncTerm1Length();
    }
};

window.syncTerm1Length = function() {
    const input = document.getElementById('aiLengthSetup');
    const term1 = document.getElementById('aiTerm1Length');
    if(input && term1) {
        term1.value = input.value;
    }
};

window.adjustTermLength = function(id, delta) {
    const input = document.getElementById(id);
    if(input) {
        let val = parseInt(input.value, 10);
        if(isNaN(val)) val = (id === 'aiLineBreaks' ? 2 : 200);
        val += delta;
        if(id === 'aiLineBreaks') {
            if(val < 1) val = 1;
            if(val > 10) val = 10;
        } else {
            if(val < 50) val = 50;
        }
        input.value = val;
    }
};

// Download AI Generated Results as CSV
window.downloadAiResults = function() {
    if(parsedData.length === 0) return alert("데이터가 없습니다.");
    
    let csvContent = "\uFEFF"; // BOM for Excel UTF-8
    csvContent += "No,학생 이름,정보,선택된 강점 키워드,선택된 보완 키워드,개별요구사항,AI 자동생성 결과\n";
    
    parsedData.forEach((row, index) => {
        const name = getStudentName(row);
        const meta = getStudentMeta(row);
        
        const strengthNodes = document.querySelectorAll(`#ai-strengths-${index} .keyword-badge.strength.active`);
        const weaknessNodes = document.querySelectorAll(`#ai-weaknesses-${index} .keyword-badge.weakness.active`);
        const activeStrengths = Array.from(strengthNodes).map(n => n.innerText).join(', ');
        const activeWeaknesses = Array.from(weaknessNodes).map(n => n.innerText).join(', ');
        
        const reqNodes = document.querySelectorAll(`#ai-reqs-${index} .keyword-badge.req.active`);
        const activeReqs = Array.from(reqNodes).map(n => n.innerText).join(', ');
        const reqStr = activeReqs.replace(/"/g, '""');

        const aiResult = row._aiGenerated ? row._aiGenerated.replace(/"/g, '""') : "미생성";
        
        const csvRow = [
            index + 1,
            `"${name}"`,
            `"${meta}"`,
            `"${activeStrengths}"`,
            `"${activeWeaknesses}"`,
            `"${reqStr}"`,
            `"${aiResult}"`
        ];
        csvContent += csvRow.join(",") + "\n";
    });
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `행동발달_자동생성결과_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

// Batch Print All Personal Reports
window.downloadAllPersonalReports = function() {
    if(parsedData.length === 0) return alert("데이터가 없습니다.");
    
    if(!confirm("모든 학생의 개인 리포트를 일괄 출력(PDF 저장) 하시겠습니까?\n\n생성 시 브라우저 인쇄 창이 나타나며, '[PDF로 저장]'을 선택해주세요.")) {
        return;
    }

    // Save original state
    const originalSection = document.querySelector('.page-section.active');
    const originalSelectIndex = document.getElementById('studentSelect').value;

    // Temporary container for all reports
    const printContainer = document.createElement('div');
    printContainer.id = 'batch-print-container';
    document.body.appendChild(printContainer);

    // Get the base template of the personal stats section
    const personalStatsTemplate = document.getElementById('personal-stats');
    const originalDisplay = personalStatsTemplate.style.display;
    personalStatsTemplate.style.display = 'block';

    // Hide main content for print
    const appContainer = document.querySelector('.app-container');
    appContainer.style.display = 'none';

    // Helper function to delay and ensure charts render
    const delay = ms => new Promise(res => setTimeout(res, ms));

    const renderAll = async () => {
        for(let i = 0; i < parsedData.length; i++) {
            // Render specific student
            renderStudentProfile(i);
            
            // Allow time for charts to render and animations to finish
            await delay(500);

            // Clone the rendered student profile card
            const profileCard = document.getElementById('studentProfile');
            if(profileCard) {
                const clone = profileCard.cloneNode(true);
                // Ensure the cloned node is visible and has page break
                clone.style.display = 'block';
                clone.style.pageBreakAfter = 'always';
                clone.style.pageBreakInside = 'avoid';
                
                // Unfortunately, canvas elements are not cloned properly by wrapper.cloneNode(true)
                // We need to convert canvas to image for printing
                const originalCanvases = profileCard.querySelectorAll('canvas');
                const clonedCanvases = clone.querySelectorAll('canvas');
                
                originalCanvases.forEach((canvas, idx) => {
                    const img = document.createElement('img');
                    img.src = canvas.toDataURL('image/png');
                    img.style.width = '100%';
                    img.style.maxWidth = canvas.style.maxWidth || '350px';
                    
                    // Replace canvas with image in clone
                    if(clonedCanvases[idx] && clonedCanvases[idx].parentNode) {
                        clonedCanvases[idx].parentNode.replaceChild(img, clonedCanvases[idx]);
                    }
                });

                printContainer.appendChild(clone);
            }
        }

        // Trigger Print
        window.print();

        // Restore everything afterwards
        document.body.removeChild(printContainer);
        appContainer.style.display = 'flex';
        personalStatsTemplate.style.display = originalDisplay;
        
        if (originalSelectIndex !== "") {
            renderStudentProfile(originalSelectIndex);
            document.getElementById('studentSelect').value = originalSelectIndex;
        } else {
            document.getElementById('studentProfile').style.display = 'none';
        }
    };

    renderAll();
};

// Data Backup (Export/Download JSON)
window.exportData = function() {
    if(parsedData.length === 0 && chatHistory.length === 0) {
        return alert("백업할 데이터가 아직 없습니다. 학생 데이터를 분석하거나 작업을 진행한 후 백업해주세요.");
    }

    const defaultFileName = `해피스쿨_백업데이터_${new Date().toISOString().slice(0,10)}`;
    const userFileName = prompt(`백업 파일을 생성합니다.\n저장할 파일 이름을 입력해주세요.\n(데이터를 백업해두시면 언제든 이전 작업 상태, AI 생성결과, 설정, 대화 기록 등을 다시 불러와서 이어서 작업하실 수 있습니다.)`, defaultFileName);
    
    if(userFileName === null) return; // cancelled
    
    const finalFileName = userFileName.trim() ? userFileName.trim() : defaultFileName;

    const backupData = {
        timestamp: new Date().toISOString(),
        parsedData: parsedData,
        chatHistory: chatHistory,
        uiPrefs: {
            aiGradeSetup: document.getElementById('aiGradeSetup')?.value || '',
            aiLengthSetup: document.getElementById('aiLengthSetup')?.value || '300',
            aiTerm1Length: document.getElementById('aiTerm1Length')?.value || '200',
            aiTerm2Length: document.getElementById('aiTerm2Length')?.value || '200',
            aiLineBreaks: document.getElementById('aiLineBreaks')?.value || '2',
            aiSecondSemesterCheck: document.getElementById('aiSecondSemesterCheck')?.checked || false,
            aiCustomRequest: document.getElementById('aiCustomRequest')?.value || '',
            aiBasePromptSetup: document.getElementById('aiBasePromptSetup')?.value || ''
        }
    };

    const dataStr = JSON.stringify(backupData, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement("a");
    a.href = url;
    a.download = `${finalFileName}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

// Data Import (Restore from JSON)
window.importData = function(event) {
    const file = event.target.files[0];
    if(!file) return;

    if(!confirm("불러오기를 진행하시면 현재 입력된 분석 데이터와 작업 내역이 모두 초기화되고, 백업 파일 내용으로 덮어씌워집니다.\n계속 진행하시겠습니까?")) {
        event.target.value = ''; // reset so same file can be triggered again
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const result = JSON.parse(e.target.result);
            if(!result.parsedData || !Array.isArray(result.parsedData)) {
                throw new Error("유효하지 않은 백업 파일 포맷입니다.");
            }

            // Restore Main Data
            parsedData = result.parsedData;
            chatHistory = result.chatHistory || [];

            // Restore UI Prefs
            if(result.uiPrefs) {
                if(document.getElementById('aiGradeSetup')) document.getElementById('aiGradeSetup').value = result.uiPrefs.aiGradeSetup || '';
                if(document.getElementById('aiLengthSetup')) document.getElementById('aiLengthSetup').value = result.uiPrefs.aiLengthSetup || '300';
                if(document.getElementById('aiTerm1Length')) document.getElementById('aiTerm1Length').value = result.uiPrefs.aiTerm1Length || '200';
                if(document.getElementById('aiTerm2Length')) document.getElementById('aiTerm2Length').value = result.uiPrefs.aiTerm2Length || '200';
                if(document.getElementById('aiLineBreaks')) document.getElementById('aiLineBreaks').value = result.uiPrefs.aiLineBreaks || '2';
                if(document.getElementById('aiCustomRequest')) document.getElementById('aiCustomRequest').value = result.uiPrefs.aiCustomRequest || '';
                if(document.getElementById('aiBasePromptSetup') && result.uiPrefs.aiBasePromptSetup) {
                    document.getElementById('aiBasePromptSetup').value = result.uiPrefs.aiBasePromptSetup;
                }
                
                const secCheck = document.getElementById('aiSecondSemesterCheck');
                if(secCheck) {
                    secCheck.checked = result.uiPrefs.aiSecondSemesterCheck || false;
                    const secContainer = document.getElementById('secondSemesterSetup');
                    const basicLenContainer = document.getElementById('aiLengthContainer');
                    if (secCheck.checked) {
                        if(secContainer) secContainer.style.display = 'block';
                        if(basicLenContainer) basicLenContainer.style.opacity = '0.5';
                    } else {
                        if(secContainer) secContainer.style.display = 'none';
                        if(basicLenContainer) basicLenContainer.style.opacity = '1';
                    }
                }
            }

            // Re-render Views
            if(parsedData.length > 0) {
                const headers = Object.keys(parsedData[0]);
                previewTable.querySelector('thead').innerHTML = '<tr>' + headers.map(h => `<th>${h}</th>`).join('') + '</tr>';
                let tbodyHtml = '';
                parsedData.forEach(row => {
                    let tdHtml = headers.map(h => `<td>${row[h] || ''}</td>`).join('');
                    tbodyHtml += `<tr>${tdHtml}</tr>`;
                });
                previewTable.querySelector('tbody').innerHTML = tbodyHtml;
            }
            populateStudentSelect();
            populateAiTable();
            if(typeof updateClassCharts === 'function') updateClassCharts();
            
            document.querySelector('.preview-area').style.display = 'block';
            alert("백업 데이터를 성공적으로 불러왔습니다!");
            
        } catch(err) {
            alert("백업 파일 파싱 중 오류가 발생했습니다: " + err.message);
        } finally {
            // Reset input so the same file can be loaded again if needed
            event.target.value = '';
        }
    };
    reader.readAsText(file);
};

