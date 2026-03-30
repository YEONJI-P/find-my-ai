const fs = require('fs');

// 프로젝트 데이터 로드
const aiTools = JSON.parse(fs.readFileSync('./data/ai-tools.json', 'utf8'));
const matchingRules = JSON.parse(fs.readFileSync('./data/matching-rules.json', 'utf8'));

const rules = matchingRules.rules;
const weights = matchingRules.weights;
const lifeWeights = matchingRules.lifeWeights;

function getOccupationDetailScore(occupationCategory, occupationDetail, aiId) {
  const categoryRules = rules.occupationDetail[occupationCategory];
  if (!categoryRules) return 0;
  const detailRules = categoryRules[occupationDetail];
  if (!detailRules) return 0;
  return detailRules[aiId] ?? 0;
}

function getFollowUpScore(followUp, aiId) {
  const followUpRules = rules.followUp[followUp];
  if (!followUpRules) return 0;
  return followUpRules[aiId] ?? 0;
}

function getAgeBonus(age, aiId) {
  const ageBonusRules = rules.ageBonus[age];
  if (!ageBonusRules) return 0;
  return ageBonusRules[aiId] ?? 0;
}

function getHobbyScore(hobbies, aiId) {
  const hobbyRules = rules.hobby;
  if (!hobbyRules) return 0;
  const scores = hobbies.map(h => hobbyRules[h]?.[aiId] ?? 0);
  if (scores.length === 0) return 0;
  return scores.reduce((a, b) => a + b, 0) / scores.length;
}

function calculateTopAIs(answers) {
  const isLifeTrack = Array.isArray(answers.hobby) && answers.hobby.length > 0;

  const scores = aiTools.map((tool) => {
    const id = tool.id;
    let score = 0;

    if (isLifeTrack) {
      score += (getHobbyScore(answers.hobby, id) || 0) * lifeWeights.hobby;
      const deviceScore = (tool.matchingWeight.device && tool.matchingWeight.device[answers.device]) || 0;
      score += deviceScore * lifeWeights.device;
      const literacyScore = (tool.matchingWeight.digitalLiteracy && tool.matchingWeight.digitalLiteracy[answers.digital_literacy]) || 0;
      score += literacyScore * lifeWeights.digitalLiteracy;
    } else {
      const occupationScore = (tool.matchingWeight.occupation && tool.matchingWeight.occupation[answers.occupation_category]) || 0;
      score += occupationScore * weights.occupation;

      if (answers.occupation_category && answers.occupation_detail) {
        score += getOccupationDetailScore(answers.occupation_category, answers.occupation_detail, id) * weights.occupationDetail;
      }

      if (answers.follow_up) {
        score += getFollowUpScore(answers.follow_up, id) * weights.followUp;
      }

      const deviceScore = (tool.matchingWeight.device && tool.matchingWeight.device[answers.device]) || 0;
      score += deviceScore * weights.device;

      const literacyScore = (tool.matchingWeight.digitalLiteracy && tool.matchingWeight.digitalLiteracy[answers.digital_literacy]) || 0;
      score += literacyScore * weights.digitalLiteracy;
    }

    if (answers.age) {
      score += getAgeBonus(answers.age, id);
    }

    const literacyScore = (tool.matchingWeight.digitalLiteracy && tool.matchingWeight.digitalLiteracy[answers.digital_literacy]) || 0;
    return { id, score, literacyScore, tool };
  });

  const sorted = scores
    .sort((a, b) => b.score - a.score || b.literacyScore - a.literacyScore)
    .slice(0, 3);

  return sorted.map((s, index) => ({
    rank: index + 1,
    id: s.id,
    name: s.tool.name,
    score: s.score.toFixed(2)
  }));
}

const ages = ['teen', 'twenties', 'thirties', 'forties', 'fifties_plus'];
const occupationCategories = ['student', 'jobseeker', 'office_worker', 'field_worker', 'self_employed_owner', 'freelancer', 'homemaker'];
const devices = ['mobile_only', 'mobile_main', 'pc_main'];
const literacies = ['beginner', 'intermediate', 'advanced', 'expert'];
const hobbiesList = ['media', 'study', 'cooking', 'health', 'travel', 'finance', 'parenting', 'shopping'];

const occupationDetails = {
    student: ['middle_high', 'university', 'exam_prep'],
    jobseeker: ['new_grad', 'career_change', 'career_explore'],
    office_worker: ['office', 'professional', 'public', 'manager'],
    field_worker: ['service', 'field', 'transport', 'care'],
    self_employed_owner: ['food', 'retail', 'service', 'craft'],
    freelancer: ['design_video', 'writer', 'creator', 'consultant'],
    homemaker: ['fulltime', 'infant', 'child', 'returning']
};

const followUps = {
    student: ['exam', 'employment', 'thesis', 'language'],
    jobseeker: ['resume', 'interview', 'portfolio', 'career_direction'],
    office_worker: ['document', 'email_comm', 'data', 'presentation'],
    field_worker: ['work_info', 'customer', 'career', 'life'],
    self_employed_owner: ['sns_promo', 'customer', 'content', 'platform'],
    freelancer: ['planning', 'writing', 'visual', 'client'],
    homemaker: ['parenting_info', 'household', 'reemployment', 'selfdev']
};

function getRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

const simulationResults = [];
const stats = {};

for (let i = 0; i < 200; i++) {
  const isLife = Math.random() > 0.5;
  const answers = {
    age: getRandom(ages),
    device: getRandom(devices),
    digital_literacy: getRandom(literacies),
  };

  if (isLife) {
    const numHobbies = Math.floor(Math.random() * 2) + 1;
    const shuffled = [...hobbiesList].sort(() => 0.5 - Math.random());
    answers.hobby = shuffled.slice(0, numHobbies);
    answers.track = '일상';
    answers.desc = `취미: ${answers.hobby.join(', ')}`;
  } else {
    const category = getRandom(occupationCategories);
    const detail = getRandom(occupationDetails[category]);
    const followUp = getRandom(followUps[category]);
    
    answers.occupation_category = category;
    answers.occupation_detail = detail;
    answers.follow_up = followUp;
    answers.track = '업무';
    answers.desc = `${category}(${detail})`;
  }

  const topAIs = calculateTopAIs(answers);
  const top1 = topAIs[0].name;
  
  stats[top1] = (stats[top1] || 0) + 1;

  simulationResults.push({
    no: i + 1,
    track: answers.track,
    age: answers.age,
    desc: answers.desc,
    literacy: answers.digital_literacy,
    top1: top1,
    top2: topAIs[1].name,
    top3: topAIs[2].name,
    score: topAIs[0].score
  });
}

console.log('| 번호 | 트랙 | 나이 | 상세 정보 | 디지털 수준 | Top 1 AI | Top 2 AI | Top 3 AI | 점수 |');
console.log('|---:|:---:|:---:|:---|:---:|:---|:---|:---|:---|');
simulationResults.forEach(r => {
  console.log(`| ${r.no} | ${r.track} | ${r.age} | ${r.desc} | ${r.literacy} | **${r.top1}** | ${r.top2} | ${r.top3} | ${r.score} |`);
});

console.log('\n### AI 선택 통계 (Top 1 기준)');
const sortedStats = Object.entries(stats).sort((a, b) => b[1] - a[1]);
sortedStats.forEach(([name, count]) => {
  console.log(`- **${name}**: ${count}회 (${((count/200)*100).toFixed(1)}%)`);
});

console.log('\n### 주요 선택 패턴 분석');
const patterns = {};
simulationResults.forEach(r => {
    const key = `${r.track} | ${r.desc.split('(')[0]}`;
    if (!patterns[key]) patterns[key] = {};
    patterns[key][r.top1] = (patterns[key][r.top1] || 0) + 1;
});

Object.entries(patterns).forEach(([pattern, ais]) => {
    const topAiForPattern = Object.entries(ais).sort((a,b) => b[1]-a[1])[0];
    console.log(`- **${pattern}** 그룹은 주로 **${topAiForPattern[0]}** (${topAiForPattern[1]}회)를 추천받았습니다.`);
});
