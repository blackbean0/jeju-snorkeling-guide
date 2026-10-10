import { spots, regions, items, sources, factStatus, isConfirmed } from './data.js';

const $ = (selector) => document.querySelector(selector);
const escape = (value) => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const key = 'jeju-snorkel:v1';
const initial = () => ({ schemaVersion: 1, selectedSpotId: null, compareSpotIds: [], checklist: {}, memo: '', updatedAt: null });
let state = initial(), storageProblem = '', memoTimer, toastTimer, currentRoute = '', listScroll = 0;
let filters = { query: '', region: '', rental: false, shower: false };
const spotById = id => spots.find(spot => spot.id === id);
try {
  const raw = localStorage.getItem(key);
  if (raw) {
    const saved = JSON.parse(raw);
    if (!saved || saved.schemaVersion !== 1 || typeof saved !== 'object') throw new Error('schema');
    state.selectedSpotId = spotById(saved.selectedSpotId) ? saved.selectedSpotId : null;
    state.compareSpotIds = Array.isArray(saved.compareSpotIds) ? [...new Set(saved.compareSpotIds.filter(id => spotById(id)))].slice(0, 3) : [];
    state.memo = typeof saved.memo === 'string' ? saved.memo.slice(0, 1000) : '';
    for (const item of items) {
      const value = saved.checklist?.[item.id];
      state.checklist[item.id] = value === 'packed' || (item.rental && value === 'rental-planned') ? value : 'unprepared';
    }
  }
} catch {
  storageProblem = '저장된 기록을 불러오지 못했습니다. 기본 상태로 시작합니다.';
}
function warning() {
  $('#storage-warning').hidden = !storageProblem;
  $('#storage-warning').textContent = storageProblem;
}
function save() {
  state.updatedAt = new Date().toISOString();
  try { localStorage.setItem(key, JSON.stringify(state)); storageProblem = ''; }
  catch { storageProblem = '이 브라우저에서는 저장되지 않습니다. 페이지를 닫으면 기록이 사라질 수 있습니다.'; }
  warning();
  if ($('#memo-status')) $('#memo-status').textContent = storageProblem ? '저장되지 않음' : '이 브라우저에 저장됨';
}
function notify(message) {
  clearTimeout(toastTimer);
  $('#toast').textContent = message;
  $('#toast').classList.add('visible');
  toastTimer = setTimeout(() => $('#toast').classList.remove('visible'), 3500);
}
function icon(name) {
  const paths = {
    home: '<path d="m3 10 9-7 9 7v10H3z"/><path d="M9 20v-7h6v7"/>',
    guide: '<path d="M12 5C8 2 4 3 3 4v16c3-2 6-1 9 1 3-2 6-3 9-1V4c-3-2-6-1-9 1zM12 5v16"/>',
    spots: '<path d="M20 10c0 6-8 11-8 11S4 16 4 10a8 8 0 1 1 16 0z"/><circle cx="12" cy="10" r="2.5"/>',
    checklist: '<rect x="5" y="4" width="15" height="17" rx="2"/><path d="M9 3h7v4H9zM9 12l2 2 5-5M9 18h7"/>',
    arrow: '<path d="M4 12h16m-6-6 6 6-6 6"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l2 2m10 10 2 2M5 19l2-2M17 7l2-2"/>',
    wave: '<path d="M2 8q3-5 6 0t6 0 8 0M2 15q3-5 6 0t6 0 8 0"/>',
    shield: '<path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6zM8 12l3 3 5-6"/>',
    search: '<circle cx="10" cy="10" r="6"/><path d="m15 15 6 6"/>',
    bag: '<path d="M4 8h16v13H4zM8 8V6a4 4 0 0 1 8 0v2"/>'
  };
  return `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.wave}</svg>`;
}
const arrow = () => icon('arrow');
const external = source => `<a class="external-link" href="${source.url}" target="_blank" rel="noopener noreferrer">${escape(source.title)} <span aria-hidden="true">↗</span><span class="sr-only"> (새 창)</span></a>`;
const officialLinks = () => `<div class="official-links">${sources.slice(2, 4).map(external).join('')}</div>`;
const badge = () => '<span class="badge">자료 확인 중</span>';
const heading = (eyebrow, title, description) => `<div class="page-heading"><p class="eyebrow">${eyebrow}</p><h1 tabindex="-1">${title}</h1><p>${description}</p></div>`;
const fact = field => `<span class="fact-status">${escape(factStatus(field))}</span>${field.sourceIds?.length ? '<a class="fact-source" href="#/sources">출처 확인</a>' : ''}`;
function progress() {
  return { packed: items.filter(i => i.group === '기본' && state.checklist[i.id] === 'packed').length, rental: items.filter(i => state.checklist[i.id] === 'rental-planned').length };
}
function home() {
  const p = progress();
  return `<section class="hero"><div class="hero-copy"><p class="eyebrow"><span class="tiny-line"></span> YOUR FIRST JEJU SNORKELING</p><h1 tabindex="-1">제주 스노클링,<br>출발 전에<br><span>차근차근.</span></h1><p class="hero-description">처음 만나는 제주 바다, 준비부터 함께해요.<br>장소별 조건을 비교하고 준비물을 점검해 보세요.</p><div class="actions"><a class="button" href="#/spots">장소 살펴보기 ${arrow()}</a><a class="hero-secondary" href="#/guide">처음이라면 사전 안내 ↗</a></div><div class="hero-footnote">${icon('wave')} 바다를 즐기는 첫걸음은, 알아보는 것부터.</div></div><div class="hero-art"><img src="./assets/ocean.svg" width="1000" height="720" alt="해안과 스노클링 장비를 착용한 사람을 그린 안내 일러스트"><span class="art-label">JEJU, BEFORE YOU DIVE</span><div class="art-note"><span class="note-dot"></span> 준비하는 시간도 여행의 일부니까.</div><span class="illustration-credit">안내 일러스트 · 실제 장소 사진이 아닙니다</span></div></section>
  <section class="departure-notice"><div class="notice-symbol">${icon('shield')}</div><div><strong>방문 전, 바다의 오늘을 확인하세요.</strong><p>해상 상태와 현장 이용 조건은 달라질 수 있어요. 출발 전과 현장에서 다시 확인하세요.</p></div><a href="#/guide" class="text-action">확인 방법 보기 ${arrow()}</a></section>
  <section class="home-section"><div class="section-heading"><div><p class="eyebrow">A SIMPLE START</p><h2>제주 바다를 만나는 세 단계</h2></div><p>막막했던 준비를, 하나씩.</p></div><div class="steps">${[['01', 'guide', '먼저, 알아보기', '수영·장비·날씨에 관한 궁금증을<br>사전 안내에서 풀어보세요.', '사전 안내 읽기'], ['02', 'spots', '내게 맞는 장소 찾기', '지역과 시설 확인 상태를 살펴보고<br>같은 기준으로 비교해 보세요.', '장소 비교하기'], ['03', 'checklist', '준비물 점검하기', '챙긴 물품과 대여할 장비를 구분해<br>나만의 준비 기록을 남겨보세요.', '체크리스트 열기']].map(([n, route, title, text, action]) => `<a href="#/${route}" class="step"><div class="step-top"><span>${n}</span>${icon(route)}</div><h3>${title}</h3><p>${text}</p><span class="step-link">${action} ${arrow()}</span></a>`).join('')}</div></section>
  <section class="home-section regions-section"><div class="section-heading"><div><p class="eyebrow">EXPLORE THE ISLAND</p><h2>어느 쪽 바다로 떠날까요?</h2></div><a class="text-action" href="#/spots">전체 장소 보기 ${arrow()}</a></div><p class="section-intro">PDF에 제시된 후보입니다. 장소별 이용 조건을 확인하고 있습니다.</p><div class="region-directory">${Object.entries(regions).map(([id, name], i) => `<a href="#/spots" data-region="${id}" class="region-entry"><span class="region-index">0${i + 1} / ${['EAST', 'WEST', 'SOUTH'][i]}</span><h3>${name}</h3><p>${spots.filter(s => s.region === id).map(s => s.name).join(' · ')}</p><span class="region-arrow">↗</span></a>`).join('')}</div></section>
  <section class="packing-banner"><div class="packing-icon">${icon('bag')}</div><div><p class="eyebrow">READY, ONE BY ONE</p><h2>${p.packed || p.rental || state.memo || state.selectedSpotId ? `기본 준비물 ${p.packed}/7 · 대여 예정 ${p.rental}개` : '설레는 출발, 빠뜨린 건 없을까요?'}</h2><p>준비물부터 이동 메모까지. 이 브라우저에 기록해 두세요.</p></div><a class="button" href="#/checklist">준비물 점검하기 ${arrow()}</a></section>`;
}
function guide() {
  const questions = [
    ['수영을 못해도 가능한가요?', '수영 능력만으로 가능 여부를 판단할 수 없습니다.', '장비 사용 능력, 물에 대한 적응, 현장 관리와 지도 조건을 함께 확인하세요. 구명조끼나 튜브만으로 활동이 보장되지 않습니다.', '혼자 시도하지 말고 현장 관리자 또는 지도자에게 조건을 문의하세요.'],
    ['전문 투어 없이 이용할 수 있나요?', '장소의 운영 규칙과 본인의 경험에 따라 다릅니다.', '출입·활동 통제, 관리 구역, 동행 여부와 비상 연락 방법을 확인하세요. 관리되지 않는 곳에서 혼자 활동하지 마세요.', '장소 상세의 안전 관리·운영 정보를 확인하고 미확인 조건은 운영 주체에 문의하세요.'],
    ['장비 없이 시작할 수 있나요?', '필요한 장비와 사용법을 준비해야 합니다.', '대여 품목·운영·가격은 장소마다 다릅니다. 장비가 실제로 있는지, 몸에 맞는지, 수령할 수 있는지 확인하세요.', '준비물에 대여 계획을 기록하고 수령 후 준비됨으로 체크하세요.'],
    ['렌터카 없이 이동할 수 있나요?', '대중교통 경로와 마지막 도보 구간을 확인해야 합니다.', '노선, 정류장, 시간표와 현장 출입구는 별도 확인이 필요합니다. 현재 교통 정보는 조사 중입니다.', '장소 상세에서 교통 확인 상태를 보고 이동 계획과 돌아오는 교통편을 메모하세요.']
  ];
  return `${heading('BEFORE YOU DIVE', '처음이라면, 사전 안내부터.', '바다에 들어가기 전에 알아둘 것들을 차근차근 살펴보세요.')}<section class="guide-questions"><div class="section-heading"><h2>처음의 궁금증, 네 가지</h2><span class="muted">질문을 눌러 확인하세요</span></div>${questions.map(([q, short, condition, next], i) => `<details class="question"><summary><span class="question-number">0${i + 1}</span><span>${q}</span><span class="plus" aria-hidden="true">+</span></summary><div class="answer"><strong>${short}</strong><p><b>확인할 조건</b><br>${condition}</p><p><b>다음 행동</b><br>${next}</p><a class="text-action" href="#/${i === 2 ? 'checklist' : 'spots'}">${i === 2 ? '준비물 점검하기' : '장소별 조건 확인하기'} ${arrow()}</a></div></details>`).join('')}</section><section class="home-section"><h2>시기보다 중요한 건, 그날의 조건</h2><div class="explain-grid">${[['sun', '시기·수온', '계절만으로 판단하지 마세요.', '수온, 체온 유지, 활동 경험과 시설 운영 기간을 함께 확인하세요.'], ['wave', '날씨·해상 상태', '출발 전과 현장에서 다시 확인.', '바람, 파도, 해상특보와 현장 통제에 따라 계획을 바꾸거나 활동을 중단하세요.'], ['spots', '물때·물살', '장소별 물때와 물살을 확인하세요.', '지형과 조류가 달라 모든 장소에 같은 최적 시간을 적용할 수 없습니다.']].map(([ic, title, sub, text]) => `<article class="explain">${icon(ic)}<h3>${title}</h3><strong>${sub}</strong><p>${text}</p></article>`).join('')}</div></section><section class="safety-panel"><p class="eyebrow">SAFETY FIRST</p><h2>즐거운 바다를 위한 기본 약속</h2><ul class="safety-list"><li>몸에 맞는 구명조끼를 착용하고 장비 사용법을 익히세요.</li><li>혼자 활동하지 말고 동행과 서로의 상태를 확인하세요.</li><li>기상·해상 조건과 관리 구역, 출입 통제를 확인하세요.</li><li>연락 수단과 비상시 도움을 요청할 방법을 준비하세요.</li><li>통제 구역에 들어가지 마세요. 무리하거나 음주 후 활동하지 마세요.</li></ul><p class="muted">해양경찰청 일반 안전 안내를 참고했습니다. 장소별 입수 가능 판정이 아닙니다.</p><a href="#/sources" class="text-action">안전 안내의 출처 확인 ↗</a></section><section class="official-panel"><h2>공식 정보로, 한 번 더 확인</h2><p>이 사이트는 실시간 관측 화면이 아닙니다. 공식 기관의 정보를 새 창에서 확인하세요.</p>${officialLinks()}</section>`;
}
function spotCard(spot) {
  return `<article class="spot-card"><div class="spot-image ${spot.region}"><img src="./assets/shore.svg" alt="해안과 스노클링 장비 안내 일러스트. ${spot.name}의 현장 사진이 아닙니다." width="800" height="500" loading="lazy"><span>안내 일러스트</span></div><div class="spot-body"><div class="spot-meta"><span>${regions[spot.region]}</span>${badge()}</div><h2><a href="#/spots/${spot.id}">${spot.name}</a></h2><dl class="card-facts">${[['대여', 'rental'], ['샤워', 'shower'], ['안전요원', 'lifeguard']].map(([name, field]) => `<div><dt>${name}</dt><dd>${fact(spot[field])}</dd></div>`).join('')}</dl><div class="card-actions"><a href="#/spots/${spot.id}" class="text-action">상세 보기 ${arrow()}</a><label class="compare-check"><input type="checkbox" data-compare="${spot.id}" ${state.compareSpotIds.includes(spot.id) ? 'checked' : ''}> 비교에 추가</label></div></div></article>`;
}
function spotsPage() {
  return `${heading('FIND YOUR PLACE', '어느 바다로 떠날까요?', 'PDF에 제시된 후보입니다. 장소별 이용 조건을 확인하고 있습니다.')}<section class="filters" aria-label="장소 검색과 필터"><label for="spot-search" class="input-label">장소 이름 검색</label><div class="search-field">${icon('search')}<input type="search" id="spot-search" placeholder="예: 판포포구" value="${escape(filters.query)}"></div><fieldset class="region-filters"><legend>지역</legend>${[['', '전체'], ...Object.entries(regions)].map(([id, name]) => `<label class="region-chip"><input type="radio" name="region" value="${id}" ${filters.region === id ? 'checked' : ''}><span>${name}</span></label>`).join('')}</fieldset><fieldset class="facility-filters"><legend>시설 조건</legend><label><input type="checkbox" id="rental-filter" ${filters.rental ? 'checked' : ''}> 대여 확인됨</label><label><input type="checkbox" id="shower-filter" ${filters.shower ? 'checked' : ''}> 샤워 확인됨</label><span class="muted">확인된 시설만 포함됩니다.</span></fieldset></section><div id="spot-results"></div>`;
}
function updateResults() {
  const result = spots.filter(s => s.name.includes(filters.query.trim()) && (!filters.region || filters.region === s.region) && (!filters.rental || isConfirmed(s.rental)) && (!filters.shower || isConfirmed(s.shower)));
  $('#spot-results').innerHTML = `<div class="result-heading"><p role="status" aria-live="polite">총 <strong>${result.length}</strong>곳의 후보</p><span class="muted">원문 목록 순서 · 추천 순위가 아닙니다</span></div>${result.length ? `<div class="spots-grid">${result.map(spotCard).join('')}</div>` : '<div class="empty-state">' + icon('search') + '<h2>조건에 맞는 장소가 없습니다.</h2><p>미확인 시설은 조건에 포함되지 않습니다.<br>현재 여섯 후보의 시설 정보를 확인 중입니다.</p><button class="button secondary" data-action="clear-filters">필터 초기화</button></div>'}`;
}
const detailGroups = [
  ['terrain', '지형·파도·수심', [['바닥·출입 구간', 'terrain'], ['수심·물살', 'depthAndCurrent']]],
  ['rental', '장비 대여·편의 시설', [['대여', 'rental'], ['대여 품목', 'rentalItems'], ['대여 비용', 'rentalPrice']]],
  ['shower', '샤워·사후 편의', [['샤워 시설', 'shower'], ['위치·비용·제공 물품', 'showerDetails']]],
  ['transport', '주차·대중교통', [['주차', 'parking'], ['버스·정류장·도보 구간', 'publicTransport']]],
  ['safety', '안전 관리·운영', [['안전요원', 'lifeguard'], ['운영 기간·시간', 'operatingPeriod'], ['현장 이용 통제', 'localRestrictions']]]
];
function detail(spot) {
  return `<a class="back-link" href="#/spots">← 장소 목록</a><div class="detail-heading"><p class="eyebrow">${regions[spot.region]} / PLACE GUIDE</p><h1 tabindex="-1">${spot.name} ${badge()}</h1><p>원문에 제시된 장소입니다. 현재 이용 조건과 시설 정보를 확인하고 있습니다.</p></div><div class="detail-cover ${spot.region}"><img src="./assets/shore.svg" width="800" height="500" alt="해안과 스노클링 장비를 그린 안내 일러스트"><span>안내 일러스트 · ${spot.name}의 실제 모습이 아닙니다</span></div><div class="detail-layout"><div><nav class="detail-jumps" aria-label="장소 정보 바로가기">${detailGroups.map(([id, title]) => `<button data-jump="detail-${id}">${title.split('·')[0]}</button>`).join('')}</nav>${detailGroups.map(([id, title, rows], index) => `<section id="detail-${id}" class="detail-section"><h2><span>0${index + 1}</span>${title}</h2><dl class="detail-facts">${rows.map(([label, field]) => `<div><dt>${label}</dt><dd>${fact(spot[field])}<small>${spot[field].reviewedAt ? '' : '현재 확인된 자료·확인일 없음'}</small></dd></div>`).join('')}</dl>${id === 'safety' ? '<p>현장 날씨·통제와 관리 조건을 별도로 확인하세요.</p>' + officialLinks() : ''}</section>`).join('')}<div class="source-note"><strong>정보의 출처와 확인 상태</strong><p>후보 이름과 지역은 원문 PDF 4쪽을 기준으로 했습니다. 원문 출처가 있다는 사실이 현재 운영 정보의 검증 완료를 뜻하지 않습니다.</p><a href="#/sources">출처·제작 안내 ↗</a></div></div><aside class="detail-summary"><p class="eyebrow">YOUR NEXT STEP</p><h2>조건을 확인하고,<br>준비를 이어가세요.</h2><a href="#/checklist" data-connect="${spot.id}" class="button">준비물에 연결 ${arrow()}</a><button class="button secondary" data-toggle-compare="${spot.id}">${state.compareSpotIds.includes(spot.id) ? '비교에서 제거' : '비교에 추가'}</button><dl>${[['대여', 'rental'], ['샤워', 'shower'], ['교통', 'publicTransport'], ['안전 관리', 'lifeguard']].map(([name, field]) => `<div><dt>${name}</dt><dd>${fact(spot[field])}</dd></div>`).join('')}</dl><p class="muted">장소 연결은 여행 계획의 참고입니다.<br>예약이나 입수 허가가 아닙니다.</p></aside></div>`;
}
function comparison() {
  const selected = state.compareSpotIds.map(spotById);
  return `${heading('SIDE BY SIDE', '같은 기준으로, 나란히.', '대여·이동·안전 관리 정보를 비교하세요. 미확인은 ‘없음’이 아닙니다.')}<div class="compare-selection"><strong>비교 ${selected.length}/3</strong>${selected.map(s => `<button class="selected-chip" data-remove="${s.id}" aria-label="${s.name} 비교에서 제거">${s.name} ×</button>`).join('')}${selected.length ? '<button class="text-button" data-action="clear-compare">비교 선택 비우기</button>' : ''}</div>${selected.length < 2 ? `<div class="empty-state">${icon('spots')}<h2>비교하려면 두 곳 이상 선택하세요.</h2><p>장소 목록에서 최대 3곳을 선택할 수 있습니다.</p><a class="button" href="#/spots">장소 살펴보기 ${arrow()}</a></div>` : `<p class="muted">좁은 화면에서는 옆으로 밀어 항목을 비교하세요.</p><div class="table-scroll" tabindex="0" role="region" aria-label="장소별 조건 비교표, 가로 스크롤 가능"><table><caption class="sr-only">선택한 장소의 지형, 시설, 이동 및 안전 조건 비교</caption><thead><tr><th scope="col">확인 항목</th>${selected.map(s => `<th scope="col"><span class="muted">${regions[s.region]}</span><a href="#/spots/${s.id}">${s.name} ↗</a>${badge()}</th>`).join('')}</tr></thead><tbody>${[['지형·수심', 'terrain'], ['장비 대여', 'rental'], ['샤워', 'shower'], ['주차', 'parking'], ['대중교통', 'publicTransport'], ['안전요원', 'lifeguard'], ['운영 기간', 'operatingPeriod']].map(([name, field]) => `<tr><th scope="row">${name}</th>${selected.map(s => `<td>${fact(s[field])}${field === 'terrain' ? `<br>${fact(s.depthAndCurrent)}` : ''}</td>`).join('')}</tr>`).join('')}<tr><th scope="row">다음 준비</th>${selected.map(s => `<td><a href="#/checklist" data-connect="${s.id}" class="button secondary">준비물에 연결</a></td>`).join('')}</tr></tbody></table></div><div class="source-note"><p>후보는 원문 PDF 기준이며 현재 이용 조건은 확인 중입니다. 확인일이 없는 사실은 ‘확인 필요’로 표시합니다.</p><a href="#/sources">출처·확인 상태 알아보기 ↗</a></div>`}`;
}
function checklistRow(item) {
  const value = state.checklist[item.id] || 'unprepared';
  return `<div class="checklist-row ${value}" id="item-${item.id}"><label class="item-check"><input type="checkbox" data-item="${item.id}" ${value === 'packed' ? 'checked' : ''}><span><strong>${item.name}</strong><small>${item.hint}</small><span class="item-status">${value === 'packed' ? '준비됨' : value === 'rental-planned' ? '대여 예정 · 수령 후 체크하세요' : '미준비'}</span></span></label>${item.rental ? `<button class="rental-button" data-rental="${item.id}" aria-pressed="${value === 'rental-planned'}">대여 예정</button>` : ''}${value === 'rental-planned' ? '<p class="rental-warning">대여 가능 여부를 확인하세요. 현재 확인된 대여 정보가 없습니다.</p>' : ''}</div>`;
}
function progressMarkup() {
  const { packed, rental } = progress();
  return `<div class="progress-title"><strong>기본 준비물 ${packed}/7</strong><span>대여 예정 ${rental}개</span></div><progress max="7" value="${packed}" aria-label="기본 준비물 준비 완료">${packed}/7</progress><p>${packed === 7 ? '<strong>기본 준비물 점검 완료</strong><br>현장 날씨·통제와 장비 사용 조건은 따로 확인하세요.' : '직접 챙기거나 수령한 물품만 체크하세요.<br>대여 예정은 준비 완료에 포함되지 않습니다.'}</p>`;
}
function checklist() {
  return `${heading('PACK FOR THE SEA', '하나씩 챙기는, 출발 준비.', '챙긴 물품은 체크하고, 대여할 장비는 계획으로 남겨두세요.')}<div class="checklist-layout"><div><section class="spot-select"><label for="selected-spot">이번에 살펴보는 장소</label><select id="selected-spot"><option value="">장소 미선택</option>${spots.map(s => `<option value="${s.id}" ${state.selectedSpotId === s.id ? 'selected' : ''}>${s.name} · ${regions[s.region]}</option>`).join('')}</select><p id="selected-spot-note" class="muted">${selectedSpotNote()}</p></section><div class="mobile-progress" id="mobile-progress">${progressMarkup()}</div>${['기본', '조건별', '선택'].map((group, i) => `<section class="checklist-group"><div class="group-heading"><h2>${group} 준비물 <span>${items.filter(item => item.group === group).length}</span></h2><p>${['출발 전, 먼저 점검하세요.', '현장 조건에 따라 준비하세요.', '계획에 맞게 더해보세요.'][i]}</p></div>${items.filter(item => item.group === group).map(checklistRow).join('')}</section>`).join('')}</div><aside class="checklist-aside"><section class="progress-panel"><p class="eyebrow">MY PREPARATION</p><h2>나의 준비 현황</h2><div id="desktop-progress">${progressMarkup()}</div>${icon('bag')}</section><section class="memo-panel"><label for="memo"><h2>개인 메모</h2></label><p>이동 계획이나 추가로 확인할 내용을 남겨두세요.</p><textarea id="memo" maxlength="1000" rows="8" placeholder="돌아오는 교통편, 대여 문의할 내용…">${escape(state.memo)}</textarea><div class="memo-status"><span id="memo-count">${state.memo.length}/1000</span><span id="memo-status" role="status">${storageProblem ? '저장되지 않음' : '이 브라우저에 저장됨'}</span></div></section><div class="local-note">${icon('shield')}<p>준비 기록은 이 브라우저에 저장됩니다. 다른 기기와 자동으로 공유되지 않습니다.</p></div><button class="reset-button" data-action="reset">내 준비 기록 초기화</button></aside></div>`;
}
function selectedSpotNote() {
  return state.selectedSpotId ? `${spotById(state.selectedSpotId).name}의 대여 정보는 확인 필요 상태입니다. 실제 대여 가능 여부를 문의하세요. 장소를 바꿔도 체크·메모는 유지됩니다.` : '장소를 연결하면 대여 정보의 확인 상태를 함께 볼 수 있습니다.';
}
function sourcePage() {
  const row = (s, reviewed) => `<article class="source-row"><div><h3>${s.title}</h3><p>${s.publisher}${s.date ? ` · 게시 ${s.date}` : ''}</p><small>${reviewed ? '제공된 기획 문서의 검토일: 2026-10-10 · 장소별 사실 검증과 별개' : '조사 참고 자료 · 링크 내용 검토 및 장소 사실 검증 미완료'}</small></div>${external({ ...s, title: '자료 열기' })}</article>`;
  return `${heading('ABOUT THIS GUIDE', '출처와 확인 상태를 투명하게.', '원문 기획을 이용자용 웹 가이드로 옮겼습니다. 출처 존재와 사실 검증은 구분합니다.')}<section class="source-section"><h2>01. 원문</h2><article class="source-row"><div><h3>기업실무예시.pdf</h3><p>제품 목적·타깃·콘텐츠 항목·후보 목록 / 1~7쪽</p><small>첨부 PRD·디자인 문서에서 인용한 원문입니다. PDF 파일 자체는 이 사이트에 제공되지 않았습니다.</small></div></article><p>후보 이름과 지역은 원문 4쪽 기준입니다. 현재 명칭·위치·운영 조건은 검토가 필요합니다. 원문 작성팀을 웹 운영 주체로 표기하지 않습니다.</p></section><section class="source-section"><h2>02. 일반 안전·해상 정보</h2>${sources.filter(s => s.type === 'official').map(s => row(s, true)).join('')}</section><section class="source-section"><h2>03. 장소별 자료</h2><div class="source-note"><strong>여섯 후보의 현재 이용 조건을 확인하고 있습니다.</strong><p>판포포구를 포함해 지형·대여·샤워·이동·안전 관리 정보는 검증 전입니다. 확인되지 않은 가격, 수심, 노선과 운영 시간을 게시하지 않았습니다.</p></div><div class="status-legend"><p><span class="badge">자료 확인 중</span> 장소 단위의 조사 미완료</p><p><span class="fact-status">확인 필요</span> 사실이 미확인되었거나 확인일·출처가 없는 상태</p><p><span class="fact-status">재확인 필요</span> 재검토 일정이 지났거나 이전 정보인 상태</p></div></section><section class="source-section"><h2>04. 조사 참고</h2>${sources.filter(s => s.type === 'review').map(s => row(s, false)).join('')}</section><section class="source-section"><h2>이미지·개인정보 안내</h2><p>이 사이트의 바다·장비 이미지는 프로젝트에서 독립 제작한 SVG 안내 일러스트입니다. 실제 장소나 현재 해상 상태를 보여주는 사진이 아닙니다.</p><p>준비물, 메모, 연결한 장소, 비교 선택만 이 브라우저에 저장합니다. 로그인·개인정보 수집·외부 분석 도구·위치 추적은 사용하지 않습니다. 다른 기기와 자동으로 공유되지 않습니다.</p></section>`;
}
function notFound(title) { return `${heading('PAGE NOT FOUND', title, '주소를 다시 확인하거나 아래 메뉴에서 준비를 이어가세요.')}<div class="actions"><a class="button" href="#/spots">장소 목록으로 ${arrow()}</a><a class="button secondary" href="#/home">홈으로</a></div>`; }
function updateBar() {
  const show = /^#\/spots(?:\/|$)/.test(currentRoute) && state.compareSpotIds.length;
  document.body.classList.toggle('has-comparison', !!show);
  $('#comparison-bar').innerHTML = show ? `<div class="comparison-bar"><strong>비교 ${state.compareSpotIds.length}/3</strong><div class="bar-chips">${state.compareSpotIds.map(id => `<button class="selected-chip" data-remove="${id}" aria-label="${spotById(id).name} 비교에서 제거">${spotById(id).name} ×</button>`).join('')}</div><div class="bar-action">${state.compareSpotIds.length < 2 ? '<span>두 곳 이상 선택하세요</span><button class="button" disabled>비교하기</button>' : '<a class="button" href="#/compare">비교하기 →</a>'}</div></div>` : '';
}
function toggleCompare(id) {
  if (state.compareSpotIds.includes(id)) state.compareSpotIds = state.compareSpotIds.filter(value => value !== id);
  else if (state.compareSpotIds.length < 3) state.compareSpotIds.push(id);
  else notify('최대 3곳까지 비교할 수 있습니다.');
  save(); updateBar();
  document.querySelectorAll('[data-compare]').forEach(input => input.checked = state.compareSpotIds.includes(input.dataset.compare));
  document.querySelectorAll('[data-toggle-compare]').forEach(button => button.textContent = state.compareSpotIds.includes(button.dataset.toggleCompare) ? '비교에서 제거' : '비교에 추가');
  if (currentRoute === '#/compare') render(false);
}
function render(moveFocus = true) {
  if (memoTimer) { clearTimeout(memoTimer); memoTimer = null; save(); }
  const route = location.hash || '#/home';
  if (currentRoute === '#/spots' && route !== currentRoute) listScroll = window.scrollY;
  const oldRoute = currentRoute;
  currentRoute = route;
  let html, title, active = route.split('/')[1];
  if (route === '#/home') { html = home(); title = '홈'; }
  else if (route === '#/guide') { html = guide(); title = '사전 안내'; }
  else if (route === '#/spots') { html = spotsPage(); title = '장소 찾기'; }
  else if (route.startsWith('#/spots/')) { const spot = spotById(route.slice(8)); html = spot ? detail(spot) : notFound('장소를 찾을 수 없습니다.'); title = spot?.name || '장소 오류'; }
  else if (route === '#/compare') { html = comparison(); title = '장소 비교'; active = 'spots'; }
  else if (route === '#/checklist') { html = checklist(); title = '준비물'; }
  else if (route === '#/sources') { html = sourcePage(); title = '출처·제작 안내'; }
  else { html = notFound('페이지를 찾을 수 없습니다.'); title = '페이지 오류'; }
  document.title = `${title} | 제주 스노클링 가이드`;
  $('#main').innerHTML = `<div class="container ${route === '#/home' ? 'home-container' : 'page-container'}">${html}</div>`;
  $('#navigation').innerHTML = [['home', '홈'], ['guide', '사전 안내'], ['spots', '장소'], ['checklist', '준비물']].map(([id, name]) => `<a href="#/${id}" ${active === id ? 'aria-current="page"' : ''}>${icon(id)}<span>${name}</span></a>`).join('');
  if (route === '#/spots') updateResults();
  warning(); updateBar();
  if (moveFocus) {
    $('#main h1')?.focus({ preventScroll: true });
    window.scrollTo(0, route === '#/spots' && oldRoute.startsWith('#/spots/') ? listScroll : 0);
  }
}
document.addEventListener('click', event => {
  const el = event.target.closest('[data-action], [data-region], [data-connect], [data-remove], [data-toggle-compare], [data-rental], [data-jump]');
  if (!el) return;
  if (el.dataset.region) { filters = { query: '', region: el.dataset.region, rental: false, shower: false }; listScroll = 0; }
  if (el.dataset.connect) { state.selectedSpotId = el.dataset.connect; save(); }
  if (el.dataset.remove) toggleCompare(el.dataset.remove);
  if (el.dataset.toggleCompare) toggleCompare(el.dataset.toggleCompare);
  if (el.dataset.jump) { const section = document.getElementById(el.dataset.jump); section.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' }); }
  if (el.dataset.rental) {
    const id = el.dataset.rental;
    state.checklist[id] = state.checklist[id] === 'rental-planned' ? 'unprepared' : 'rental-planned';
    updateItem(id, 'rental');
  }
  if (el.dataset.action === 'clear-filters') { filters = { query: '', region: '', rental: false, shower: false }; render(false); $('#spot-search').focus(); }
  if (el.dataset.action === 'clear-compare') { state.compareSpotIds = []; save(); render(false); $('#main h1').focus(); }
  if (el.dataset.action === 'reset') { $('#reset-dialog').showModal(); $('#reset-cancel').focus(); }
});
function updateItem(id, focusType) {
  save();
  const row = document.getElementById(`item-${id}`);
  row.outerHTML = checklistRow(items.find(i => i.id === id));
  document.querySelector(`#item-${id} [data-${focusType}]`)?.focus({ preventScroll: true });
  $('#mobile-progress').innerHTML = progressMarkup();
  $('#desktop-progress').innerHTML = progressMarkup();
}
document.addEventListener('change', event => {
  const el = event.target;
  if (el.dataset.compare) toggleCompare(el.dataset.compare);
  if (el.dataset.item) { state.checklist[el.dataset.item] = el.checked ? 'packed' : 'unprepared'; updateItem(el.dataset.item, 'item'); }
  if (el.name === 'region') { filters.region = el.value; updateResults(); }
  if (el.id === 'rental-filter' || el.id === 'shower-filter') { filters[el.id.split('-')[0]] = el.checked; updateResults(); }
  if (el.id === 'selected-spot') { state.selectedSpotId = el.value || null; save(); $('#selected-spot-note').textContent = selectedSpotNote(); }
});
document.addEventListener('input', event => {
  if (event.target.id === 'spot-search') { filters.query = event.target.value; updateResults(); }
  if (event.target.id === 'memo') {
    state.memo = event.target.value.slice(0, 1000);
    $('#memo-count').textContent = `${state.memo.length}/1000`;
    $('#memo-status').textContent = '저장 중';
    clearTimeout(memoTimer);
    memoTimer = setTimeout(() => { memoTimer = null; save(); }, 500);
  }
});
$('#reset-cancel').addEventListener('click', () => $('#reset-dialog').close());
$('#reset-confirm').addEventListener('click', () => {
  state.checklist = {}; state.memo = ''; state.selectedSpotId = null;
  save(); $('#reset-dialog').close(); render(false); notify('준비 기록을 초기화했습니다. 비교 선택은 유지됩니다.');
});
$('#reset-dialog').addEventListener('close', () => $('[data-action="reset"]')?.focus({ preventScroll: true }));
$('#skip').addEventListener('click', event => { event.preventDefault(); $('#main').focus(); });
window.addEventListener('hashchange', () => render());
window.addEventListener('pagehide', () => { if (memoTimer) save(); });
render();
