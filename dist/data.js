export const regions = { east: '구좌·김녕', west: '한경·한림', south: '서귀포' };
const pending = () => ({ value: null, verification: 'pending', sourceIds: [], reviewedAt: null, reviewDueAt: null });
const fields = ['waterType', 'address', 'coordinates', 'terrain', 'depthAndCurrent', 'rental', 'rentalItems', 'rentalPrice', 'shower', 'showerDetails', 'parking', 'publicTransport', 'lifeguard', 'operatingPeriod', 'localRestrictions'];
export const spots = [['konan', '코난비치', 'east'], ['segial', '세기알해변', 'east'], ['panpo', '판포포구', 'west'], ['wollyeong', '월령포구', 'west'], ['dorippal', '도리빨해변', 'south'], ['gangjeong', '강정천', 'south']].map(([id, name, region]) => ({ id, name, region, editorialStatus: 'candidate', ...Object.fromEntries(fields.map(key => [key, pending()])), media: null }));
export const items = [
  ['lifejacket', '몸에 맞는 구명조끼', '기본', true, '몸에 맞게 착용하고 사용법을 익히세요.'],
  ['mask', '마스크·스노클', '기본', true, '밀착 상태와 호흡 방법을 미리 확인하세요.'],
  ['communication', '연락 수단·방수팩', '기본', false, '동행과 연락 방법을 정하고 방수 상태를 확인하세요.'],
  ['warmth', '체온 유지 물품', '기본', false, '물 밖에서 체온을 유지할 옷을 준비하세요.'],
  ['snack-water', '물·간식', '기본', false, '휴식 중 수분과 에너지를 보충하세요.'],
  ['sun-protection', '자외선 차단 준비', '기본', false, '차단제, 모자 등 활동에 맞게 준비하세요.'],
  ['towel', '수건', '기본', true, '활동 후 물기를 닦을 수건을 챙기세요.'],
  ['aquashoes', '아쿠아슈즈', '조건별', true, '바닥과 출입 구간을 확인한 뒤 준비하세요.'],
  ['fins', '오리발', '조건별', true, '사용 숙련도와 현장 조건을 확인하세요.'],
  ['suit', '스노클링 슈트', '조건별', true, '수온, 활동 시간과 관리자 안내를 확인하세요.'],
  ['mat-shade', '돗자리·그늘 용품', '선택', true, '휴식 공간과 현장 이용 규칙을 확인하세요.'],
  ['raincoat', '우비', '선택', false, '이동 중 비에 대비하는 선택 물품입니다.'],
  ['armtube', '암튜브', '선택', true, '구명조끼의 대체품이 아닙니다.']
].map(([id, name, group, rental, hint]) => ({ id, name, group, rental, hint }));
export const sources = [
  { title: '스노클링 활동 안전 안내', publisher: '동해지방해양경찰청', url: 'https://www.kcg.go.kr/donghaecgh/na/ntt/selectNttInfo.do?mi=2685&nttSn=71416', date: '2026-08-20', type: 'official' },
  { title: '스노클링 안전사고 예방 자료', publisher: '동해지방해양경찰청', url: 'https://www.kcg.go.kr/donghaecgh/na/ntt/selectNttInfo.do?nttSn=70999', date: '2026-08-04', type: 'official' },
  { title: '기상청에서 해상특보 확인', publisher: '기상청 날씨누리', url: 'https://www.weather.go.kr/w/ocean/warning.do', type: 'official' },
  { title: '바다누리에서 해양정보 확인', publisher: '국립해양조사원', url: 'https://www.khoa.go.kr/oceangrid/', type: 'official' },
  { title: '비짓제주 스노클링 검색', publisher: '비짓제주', url: 'https://www.visitjeju.net/kr/search?q=%EC%8A%A4%EB%85%B8%EC%BF%A8%EB%A7%81', type: 'review' },
  { title: '원문에 기재된 후기 1', publisher: '네이버 블로그', url: 'https://blog.naver.com/olivia9532/223986147269', type: 'review' },
  { title: '원문에 기재된 후기 2', publisher: '네이버 블로그', url: 'https://blog.naver.com/cjdtnsrmsu19/223522990513', type: 'review' }
];
export function factStatus(fact) {
  if (!fact || fact.value == null || fact.value === 'unknown') return '확인 필요';
  if (fact.verification === 'stale' || (fact.reviewDueAt && fact.reviewDueAt < new Date().toISOString().slice(0, 10))) return '재확인 필요';
  if (fact.verification !== 'verified' || !fact.reviewedAt || !fact.sourceIds?.length) return '확인 필요';
  const value = fact.value === 'yes' ? '있음' : fact.value === 'no' ? '없음' : Array.isArray(fact.value) ? fact.value.join(', ') : String(fact.value);
  return `${value} · ${fact.reviewedAt.replaceAll('-', '.')} 확인`;
}
export function isConfirmed(fact) { return fact.value === 'yes' && factStatus(fact).startsWith('있음'); }
