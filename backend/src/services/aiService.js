import axios from 'axios';

const HF_API_BASE = 'https://api-inference.huggingface.co/models';
const CATEGORIES = ['academic', 'administrative', 'urgent', 'homework help', 'parent concern'];
const CATEGORY_MAP = {
  academic: 'ACADEMIC',
  administrative: 'ADMINISTRATIVE',
  urgent: 'URGENT',
  'homework help': 'HOMEWORK_HELP',
  'parent concern': 'PARENT_CONCERN',
};

const hfHeaders = () => ({
  Authorization: `Bearer ${process.env.HF_API_KEY}`,
  'Content-Type': 'application/json',
});

/**
 * Categorizes a message using zero-shot classification.
 * Falls back to keyword heuristics if the HF API key is missing or the
 * request fails, so the feature still works without external dependency.
 */
export async function categorizeMessage(content) {
  if (!process.env.HF_API_KEY) {
    return keywordFallbackCategory(content);
  }

  try {
    const { data } = await axios.post(
      `${HF_API_BASE}/facebook/bart-large-mnli`,
      { inputs: content, parameters: { candidate_labels: CATEGORIES } },
      { headers: hfHeaders(), timeout: 8000 }
    );

    const topLabel = data.labels?.[0];
    const topScore = data.scores?.[0] ?? 0.5;
    return {
      category: CATEGORY_MAP[topLabel] || 'ACADEMIC',
      confidence: topScore,
    };
  } catch (err) {
    console.warn('[ai] Categorization fallback (HF unavailable):', err.message);
    return keywordFallbackCategory(content);
  }
}

function keywordFallbackCategory(content) {
  const text = content.toLowerCase();
  if (/urgent|emergency|asap|immediately|right now/.test(text)) {
    return { category: 'URGENT', confidence: 0.6 };
  }
  if (/homework|assignment|problem set|exercise|question \d|how do i solve/.test(text)) {
    return { category: 'HOMEWORK_HELP', confidence: 0.55 };
  }
  if (/fee|admission|form|document|certificate|transfer|schedule|timing/.test(text)) {
    return { category: 'ADMINISTRATIVE', confidence: 0.55 };
  }
  if (/worried|concerned|upset|struggling|behavior|bullying/.test(text)) {
    return { category: 'PARENT_CONCERN', confidence: 0.55 };
  }
  return { category: 'ACADEMIC', confidence: 0.5 };
}

/**
 * Translates text using Google Translate's free web endpoint (no API key,
 * generous practical limits for an MVP). For production scale, swap to the
 * official Cloud Translation API.
 */
export async function translateText(text, targetLanguage = 'en') {
  try {
    const { data } = await axios.get('https://translate.googleapis.com/translate_a/single', {
      params: {
        client: 'gtx',
        sl: 'auto',
        tl: targetLanguage,
        dt: 't',
        q: text,
      },
      timeout: 6000,
    });
    const translatedText = data[0].map((chunk) => chunk[0]).join('');
    return { translatedText, detectedLanguage: data[2] };
  } catch (err) {
    console.error('[ai] Translation failed:', err.message);
    return { translatedText: text, detectedLanguage: null, failed: true };
  }
}

/**
 * Homework helper — suggests resources and a conceptual nudge, not the
 * direct answer, preserving academic integrity per the product spec.
 */
export async function getHomeworkHelp(question) {
  const summary = await summarizeWithFallback(question);
  return {
    summary: summary || `Here's a way to think about this: break "${truncate(question, 60)}" into smaller steps — what do you already know, and what's the very first thing you'd need to figure out?`,
    resources: [
      { title: 'Khan Academy — search this topic', url: `https://www.khanacademy.org/search?page_search_query=${encodeURIComponent(question)}` },
      { title: 'Search worked examples on YouTube', url: `https://www.youtube.com/results?search_query=${encodeURIComponent(question + ' explained step by step')}` },
    ],
    practiceProblems: [
      'Try restating the problem in your own words before solving it.',
      'Identify which formula or rule from class applies here.',
    ],
  };
}

async function summarizeWithFallback(text) {
  if (!process.env.HF_API_KEY) return null;
  try {
    const { data } = await axios.post(
      `${HF_API_BASE}/facebook/bart-large-cnn`,
      { inputs: text },
      { headers: hfHeaders(), timeout: 8000 }
    );
    return data[0]?.summary_text || null;
  } catch {
    return null;
  }
}

function truncate(str, n) {
  return str.length > n ? str.slice(0, n) + '…' : str;
}
