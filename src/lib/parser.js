const MONTHS = [
  'january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december',
];

const MONTH_DAY_PATTERN = new RegExp(
  `\\b(${MONTHS.join('|')})\\s+(\\d{1,2})(?:,?\\s*(\\d{4}))?\\b`,
  'i'
);
const NUMERIC_DATE_PATTERN = /\b(\d{1,2})\/(\d{1,2})\/?(\d{2,4})?\b/;
const DURATION_PATTERN = /\b(\d+(?:\.\d+)?)\s*(min|mins|minutes|m|hr|hrs|hours|h)\b/i;

function extractDate(text, referenceYear) {
  let m = text.match(MONTH_DAY_PATTERN);
  if (m) {
    const month = MONTHS.indexOf(m[1].toLowerCase());
    const day = parseInt(m[2], 10);
    const year = m[3] ? parseInt(m[3], 10) : referenceYear;
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }
  m = text.match(NUMERIC_DATE_PATTERN);
  if (m) {
    const month = parseInt(m[1], 10);
    const day = parseInt(m[2], 10);
    const year = m[3] ? (m[3].length === 2 ? 2000 + parseInt(m[3], 10) : parseInt(m[3], 10)) : referenceYear;
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }
  return null;
}

function extractDuration(text) {
  const m = text.match(DURATION_PATTERN);
  return m ? `${m[1]} ${m[2]}` : '';
}

function guessMatterId(text, matters) {
  const lower = text.toLowerCase();
  let best = null;
  let bestScore = 0;
  for (const matter of matters) {
    if (matter.isPotentialClient) continue;
    const words = matter.name.toLowerCase().split(/\s+/).filter((w) => w.length > 2);
    const score = words.filter((w) => lower.includes(w)).length;
    if (score > bestScore) {
      bestScore = score;
      best = matter;
    }
  }
  return bestScore > 0 ? best.id : null;
}

export function parsePastedText(text, matters, referenceYear = new Date().getFullYear()) {
  const blocks = text
    .split(/\n\s*\n/)
    .map((b) => b.trim())
    .filter(Boolean);
  const source = blocks.length > 0 ? blocks : [text.trim()];

  return source.map((block) => {
    const date = extractDate(block, referenceYear);
    const timeSpent = extractDuration(block);
    const matterId = guessMatterId(block, matters);
    const firstLine = block.split('\n')[0];
    const task = firstLine.slice(0, 60);
    return {
      date: date || '',
      matterId,
      task,
      detailDescription: block,
      timeSpent,
    };
  });
}
