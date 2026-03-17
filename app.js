// Data Constants
const MAPPING_DATA = {
  "행복": {
    "긍정성": { "v1": [1], "v2": [1], "v3": [1, 2] },
    "정서조절": { "v1": [2], "v2": [2], "v3": [3, 4] },
    "안정감": { "v1": [3], "v2": [3], "v3": [5, 6] },
    "관계성": { "v1": [4], "v2": [4], "v3": [7, 8] },
    "유능감": { "v1": [5], "v2": [5], "v3": [9, 10] },
    "자율성": { "v1": [6], "v2": [6], "v3": [11, 12] }
  },
  "MBTI": {
    "E_I": { "v1": [1], "v2": [1, 2], "v3": [1, 2, 3, 4] },
    "S_N": { "v1": [2], "v2": [3, 4], "v3": [5, 6, 7, 8] },
    "T_F": { "v1": [3], "v2": [5, 6], "v3": [9, 10, 11, 12] },
    "J_P": { "v1": [4], "v2": [7, 8], "v3": [13, 14, 15, 16] }
  },
  "다중지능": {
    "언어": { "v1": [1], "v2": [1], "v3": [1, 2] },
    "논리수학": { "v1": [2], "v2": [2], "v3": [3, 4] },
    "공간": { "v1": [5], "v2": [3], "v3": [5, 6] },
    "신체운동": { "v1": [4], "v2": [4], "v3": [7, 8] },
    "음악": { "v1": [3], "v2": [5], "v3": [9, 10] },
    "대인관계": { "v1": [8], "v2": [6], "v3": [11, 12] },
    "자기성찰": { "v1": [7], "v2": [7], "v3": [13, 14] },
    "자연친화": { "v1": [6], "v2": [8], "v3": [15, 16] }
  },
  "학교적응력": {
    "교우관계": { "v1": [1, 2], "v2": [1, 2, 3], "v3": [1, 2, 3, 4] },
    "교사관계": { "v1": [3, 4], "v2": [4, 5, 6], "v3": [5, 6, 7, 8] },
    "학업태도": { "v1": [5, 6], "v2": [7, 8, 9], "v3": [9, 10, 11, 12] },
    "규칙준수": { "v1": [7, 8], "v2": [10, 11, 12], "v3": [13, 14, 15, 16] }
  }
};

const KEYWORD_BANK = {
  "행복": {
    "긍정성": {
      "강점": ["낙관적", "회복탄력성 우수", "긍정적 기대감", "도전 정신", "실패 수용력", "밝은 에너지", "희망적 태도", "문제 해결 의지", "쾌활함", "구김살 없음"],
      "보완": ["실패에 대한 두려움", "위축됨", "지속적인 격려 요망", "작은 성공 경험 필요", "부정적 편향", "완벽주의 성향", "결과에 대한 불안감"]
    },
    "정서조절": {
      "강점": ["정서적 안정", "자기 통제력", "차분함", "감정 인식 우수", "평정심 유지", "스트레스 대처 능력", "성숙한 감정 표현", "인내심", "심리적 유연성"],
      "보완": ["감정 기복", "충동적 표현", "짜증", "감정 언어화 부족", "스트레스 취약", "속앓이", "억압", "감정 환기 수단 필요", "즉각적인 반응"]
    },
    "안정감": {
      "강점": ["뚜렷한 소속감", "편안함", "정서적 안전감", "심리적 안정", "교실 내 애착 형성", "여유로움", "환경 신뢰도 높음", "두려움 없는 탐색"],
      "보완": ["낯선 환경 불안", "긴장감", "예민함", "적응 시간 필요", "주변을 맴돎", "정서적 지지 요망", "변화에 대한 경계심", "심리적 안전기지 필요"]
    },
    "관계성": {
      "강점": ["뛰어난 친화력", "깊은 공감 능력", "이타심", "배려", "타협과 양보", "원만한 교우관계", "협동심", "원활한 소통", "포용력", "갈등 중재"],
      "보완": ["소극적 관계 형성", "먼저 다가가기 어려워함", "자기중심적 소통", "타인 시선 의식", "방어적 태도", "좁고 깊은 관계 선호", "상처에 예민함"]
    },
    "유능감": {
      "강점": ["높은 자존감", "자기 확신", "강한 주도성", "높은 성취감", "자신의 강점 인지", "자신감", "효능감", "적극적 참여", "능력에 대한 믿음"],
      "보완": ["자기 과소평가", "타인과의 비교", "잦은 좌절감", "능력 의심", "타인의 칭찬에 민감", "실패 시 빠른 포기", "자기 객관화 훈련 필요"]
    },
    "자율성": {
      "강점": ["자기주도성", "독립심", "강한 책임감", "내적 동기", "스스로 계획 및 실천", "충동 통제력", "주인의식", "능동적 태도", "자립심"],
      "보완": ["의존적 태도", "지속적인 확인 요망", "실천력 부족", "선택 회피", "동기 부여 필요", "세부 계획 조력 필요", "타율적 수동성"]
    }
  },
  "MBTI": {
    "E": ["활동적", "사교적", "에너제틱", "적극적 참여", "분위기 메이커", "외향적 리더십", "외부 소통 중시", "행동 지향적", "발산적 에너지"],
    "I": ["신중함", "깊은 내면 세계", "소수와의 깊은 관계", "몰입과 집중력", "독립적 사고", "자기 성찰", "경청", "차분한 탐색", "응축된 에너지"],
    "S": ["현실적", "꼼꼼함", "세밀한 관찰력", "실용적 접근", "세부 사항 파악 능숙", "규칙 및 순서 준수", "사실 기반 사고", "오감 활용"],
    "N": ["풍부한 상상력", "강한 호기심", "창의적", "아이디어 뱅크", "전체적 시야(숲을 봄)", "미래 지향적", "의미 탐구", "이면의 가치 중시"],
    "T": ["논리적", "객관적", "합리적 판단", "정확한 원인 분석", "공정함 추구", "원칙 중시", "문제 해결 중심", "지적 호기심", "비판적 사고"],
    "F": ["뛰어난 공감 능력", "따뜻한 성품", "배려심", "관계 중시", "조화와 평화 추구", "깊은 감정 이입", "정서적 교감", "타인 존중"],
    "J": ["계획적", "체계적", "정리정돈 우수", "기한 엄수", "강한 책임감", "규칙적 생활", "예측 가능성 선호", "목표 지향적", "결단력"],
    "P": ["유연함", "융통성", "환경 적응력 우수", "순발력", "개방적 태도", "임기응변", "과정 즐김", "자유로움", "즉흥성"]
  },
  "다중지능": {
    "언어": {
      "강점": ["풍부한 어휘력", "독해력", "유창한 표현력", "뛰어난 설득력", "높은 문해력", "토론 우수", "스토리텔링 능숙", "글쓰기 재능"],
      "보완": ["긴 글 읽기 부담", "말문 막힘", "빈약한 어휘", "단답형 대답 선호", "시각 자료 병행 필요", "독서 습관 형성 요망"]
    },
    "논리수학": {
      "강점": ["빠른 연산력", "추론력", "규칙 및 패턴 발견", "분석적 사고", "논리적 문제 해결력", "과학적 탐구심", "원인과 결과 파악"],
      "보완": ["수 개념 부족", "잦은 연산 실수", "복잡한 사고 기피", "정답에 대한 압박감", "생활 속 수 감각 놀이 필요"]
    },
    "공간": {
      "강점": ["시각적 인지 능력", "방향 감각", "입체적 형태 파악", "시각화 능숙", "뛰어난 미술적 감각", "구조 이해도 높음", "도식화"],
      "보완": ["텍스트 이해 한계", "평면적 사고", "시각 매체 의존도 높음", "개념의 구조화 훈련 필요"]
    },
    "신체운동": {
      "강점": ["뛰어난 신체 조절 능력", "유연성", "소근육/대근육 발달", "체험 학습 선호", "동작 모방 능숙", "재빠른 운동 습득력", "손재주"],
      "보완": ["정적 활동 어려움", "착석 유지 곤란", "넘치는 에너지 발산 공간 필요", "신체 통제력 기르기", "조작 활동 병행 학습 요망"]
    },
    "음악": {
      "강점": ["정확한 리듬감", "청각적 예민함", "풍부한 음감", "음악적 표현력", "음악을 통한 감정 승화", "청각 학습 유리", "소리에 대한 민감성"],
      "보완": ["리듬감 결여", "청각 자극 둔감", "특정 소음에 예민함", "리듬을 활용한 암기법 지도 필요"]
    },
    "대인관계": {
      "강점": ["관계 리더십", "타인 감정 인지(눈치)", "갈등 중재 능력", "탁월한 소통 능력", "협동심", "높은 사회성", "타인 이해도"],
      "보완": ["무관심", "갈등 회피", "관계 형성 서툼", "잦은 오해 발생", "타인 감정 읽기 훈련 필요", "모둠 활동 시 조력 필요"]
    },
    "자기성찰": {
      "강점": ["높은 메타인지", "명확한 자아 인식", "강한 내적 동기", "자신의 감정 인지", "독립적 사고", "회복탄력성", "자기 반성 능력"],
      "보완": ["메타인지 낮음", "외부 보상 의존", "군중 심리 휩쓸림", "감정 출석부 활용 등 감정 직면 연습 필요"]
    },
    "자연친화": {
      "강점": ["예리한 관찰력", "생태 감수성", "분류 및 체계화 능력", "환경 문제에 대한 관심", "탐구심", "생명 존중 사상", "야외 활동 선호"],
      "보완": ["자연 현상 무관심", "실내 활동 편중", "인공물 선호", "생태 체험을 통한 감수성 자극 필요"]
    }
  },
  "학교적응력": {
    "교우관계": {
      "강점": ["원만한 어울림", "갈등의 평화적 해결", "신뢰 형성", "양보와 타협", "높은 협동심", "세심한 배려", "긍정적 상호작용", "차별 없는 태도"],
      "보완": ["배타적 무리 형성", "예민한 반응", "이기적 행동", "잦은 다툼", "소극적 어울림", "양보 부족", "역할극을 통한 타인 이해 필요"]
    },
    "교사관계": {
      "강점": ["예의 바른 태도", "교사에 대한 깊은 신뢰", "스스럼없는 소통", "적극적 질문", "피드백 긍정적 수용", "높은 수용성", "심리적 안정감"],
      "보완": ["지나치게 눈치 봄", "방어적 태도", "과도한 의존성", "심리적 거리감", "규칙의 논리적 설명 필요", "긍정적 유대감 형성 요망"]
    },
    "학업태도": {
      "강점": ["흔들림 없는 집중력", "지적 호기심", "자기주도적 학습 태도", "강한 과제 집착력", "꾸준한 성실성", "책임감", "학업 성취욕"],
      "보완": ["산만함", "주의 집중 시간 짧음", "학습 무기력", "잦은 숙제 누락", "심한 학습 편식", "쉬운 과제로 작은 성취감 부여 필요"]
    },
    "규칙준수": {
      "강점": ["투철한 준법정신", "일관된 바른 행동", "타인 배려", "1인 1역 완벽 수행", "높은 도덕성", "기본 생활 습관 정착", "공공예절 준수"],
      "보완": ["충동적 규칙 위반", "감시 유무에 따른 이중적 태도", "책임 회피", "안전 불감증", "질서 의식 부족", "내적 동기 강화 필요"]
    }
  }
};

// Flatten strengths and weaknesses
let allStrengths = [];
let allWeaknesses = [];

Object.keys(KEYWORD_BANK).forEach(category => {
  if (category === "MBTI") {
      Object.keys(KEYWORD_BANK["MBTI"]).forEach(key => {
          allStrengths = allStrengths.concat(KEYWORD_BANK["MBTI"][key]);
      });
  } else {
     Object.keys(KEYWORD_BANK[category]).forEach(sub => {
         if(KEYWORD_BANK[category][sub]["강점"]) {
             allStrengths = allStrengths.concat(KEYWORD_BANK[category][sub]["강점"]);
         }
         if(KEYWORD_BANK[category][sub]["보완"]) {
             allWeaknesses = allWeaknesses.concat(KEYWORD_BANK[category][sub]["보완"]);
         }
     });
  }
});

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
    return `${grade}학년 ${ban}반 ${num}번`;
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


// Chart.js Setup
function updateClassCharts() {
    const ctxRadar = document.getElementById('classRadarChart').getContext('2d');
    const ctxBar = document.getElementById('classBarChart').getContext('2d');

    if(classCharts.radar) classCharts.radar.destroy();
    if(classCharts.bar) classCharts.bar.destroy();

    Chart.defaults.font.family = "'Noto Sans KR', sans-serif";

    classCharts.radar = new Chart(ctxRadar, {
        type: 'radar',
        data: {
            labels: ['긍정성', '정서조절', '안정감', '관계성', '유능감', '자율성'],
            datasets: [{
                label: '학급 평균 점수 (5점 만점)',
                data: [4.2, 3.8, 4.0, 4.5, 3.9, 4.1],
                backgroundColor: 'rgba(123, 197, 174, 0.2)',
                borderColor: '#7BC5AE',
                pointBackgroundColor: '#7BC5AE',
                borderWidth: 2
            }]
        },
        options: {
            scales: { r: { min: 0, max: 5, ticks: { stepSize: 1 } } }
        }
    });

    classCharts.bar = new Chart(ctxBar, {
        type: 'bar',
        data: {
            labels: ['교우관계', '교사관계', '학업태도', '규칙준수'],
            datasets: [{
                label: '적응력 항목별 점수',
                data: [4.5, 4.2, 3.8, 4.0],
                backgroundColor: '#92B4F2',
                borderRadius: 4
            }]
        },
        options: {
            scales: { y: { min: 0, max: 5, ticks: { stepSize: 1 } } }
        }
    });
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
    
    const mbtiArr = ["ENTP", "ISFJ", "ENFP", "ISTJ", "ESTP", "INFP", "ESFJ", "INTJ"];
    document.getElementById('studentMbti').innerText = `MBTI 등급: ${mbtiArr[Math.floor(Math.random() * mbtiArr.length)]}`;

    profileCard.style.display = 'block';

    const ctx = document.getElementById('studentRadarChart').getContext('2d');
    if(classCharts.studentRadar) classCharts.studentRadar.destroy();

    classCharts.studentRadar = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: ['긍정성', '정서조절', '안정감', '관계성', '유능감', '자율성'],
            datasets: [{
                label: '학생 개별 요소 점수',
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
            scales: { r: { min: 0, max: 5, ticks: { stepSize: 1 } } }
        }
    });

    document.getElementById('studentSummary').innerHTML = `
        <div class="summary-box">
            <h4><i class="fa-solid fa-thumbs-up" style="color:var(--primary-color)"></i> 학생의 주요 강점 키워드</h4>
            <p style="margin-top:5px; font-weight:500;">${row._strengths ? row._strengths.join(', ') : '데이터 없음'}</p>
        </div>
         <div class="summary-box">
            <h4><i class="fa-solid fa-seedling" style="color:#E2B467"></i> 지도 보완 및 기대 가능성</h4>
            <p style="margin-top:5px; font-weight:500;">${row._weaknesses ? row._weaknesses[0] : '데이터 없음'}</p>
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
