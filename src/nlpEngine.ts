/**
 * nlpEngine.ts
 * ============
 * High-fidelity client-side implementation of the College FAQ Chatbot's
 * TF-IDF and Cosine Similarity question-matching engine.
 * Mirrors the exact logic implemented in chatbot.py.
 */

export interface FAQItem {
  id: number;
  category: string;
  question: string;
  answer: string;
  alternatives: string[];
}

export interface MatchCandidate {
  faqId: number;
  question: string;
  variantMatched: string;
  similarityScore: number;
  category: string;
}

export interface QueryResult {
  answer: string;
  matchedQuestion: string | null;
  primaryQuestion: string | null;
  similarityScore: number;
  matchFound: boolean;
  faqId: number | null;
  category: string | null;
  topMatches: MatchCandidate[];
  preprocessedQuery: string;
  tokens: string[];
}

const PRESERVED_WORDS = new Set([
  "not", "no", "never", "without", "none", "neither", "nor", "cannot", "cant"
]);

const STANDARD_STOPWORDS = new Set([
  "i", "me", "my", "myself", "we", "our", "ours", "ourselves", "you", "your",
  "yours", "yourself", "yourselves", "he", "him", "his", "himself", "she",
  "her", "hers", "herself", "it", "its", "itself", "they", "them", "their",
  "theirs", "themselves", "what", "which", "who", "whom", "this", "that",
  "these", "those", "am", "is", "are", "was", "were", "be", "been", "being",
  "have", "has", "had", "having", "do", "does", "did", "doing", "a", "an",
  "the", "and", "but", "if", "or", "because", "as", "until", "while", "of",
  "at", "by", "for", "with", "about", "against", "between", "into", "through",
  "during", "before", "after", "above", "below", "to", "from", "up", "down",
  "in", "out", "on", "off", "over", "under", "again", "further", "then",
  "once", "here", "there", "when", "where", "why", "how", "all", "any",
  "both", "each", "few", "more", "most", "other", "some", "such", "own",
  "same", "so", "than", "too", "very", "s", "t", "can", "will", "just",
  "don", "should", "now", "d", "ll", "m", "o", "re", "ve", "y", "could", "would"
]);

export const DEFAULT_FALLBACK =
  "Sorry, I couldn't find a relevant answer to your question. Please try asking in a different way or contact the college administration.";

export function preprocessText(text: string | null | undefined): string {
  if (!text || typeof text !== "string") {
    return "";
  }

  // 1. Lowercase
  const lower = text.toLowerCase();

  // 2. Remove punctuation
  const cleaned = lower.replace(/[^\w\s]/g, " ");

  // 3. Tokenize by whitespace
  const tokens = cleaned.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) {
    return "";
  }

  // 4. Filter stopwords while preserving negations
  const filtered = tokens.filter(
    (t) => PRESERVED_WORDS.has(t) || !STANDARD_STOPWORDS.has(t)
  );

  const finalTokens = filtered.length > 0 ? filtered : tokens;
  return finalTokens.join(" ").trim();
}

function extractNgrams(text: string, minN: number = 1, maxN: number = 2): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const ngrams: string[] = [];
  for (let n = minN; n <= maxN; n++) {
    for (let i = 0; i <= words.length - n; i++) {
      ngrams.push(words.slice(i, i + n).join(" "));
    }
  }
  return ngrams;
}

export class NLPEngine {
  private faqs: FAQItem[] = [];
  private variants: string[] = [];
  private variantToFaqIdx: number[] = [];
  private vocabulary: Map<string, number> = new Map();
  private idfDiag: number[] = [];
  private tfidfMatrix: number[][] = [];
  private isReady: boolean = false;

  constructor(faqs: FAQItem[]) {
    this.indexFaqs(faqs);
  }

  public indexFaqs(faqs: FAQItem[]) {
    this.faqs = faqs;
    this.variants = [];
    this.variantToFaqIdx = [];

    faqs.forEach((faq, fIdx) => {
      if (faq.question && faq.question.trim()) {
        this.variants.push(faq.question.trim());
        this.variantToFaqIdx.push(fIdx);
      }
      if (Array.isArray(faq.alternatives)) {
        faq.alternatives.forEach((alt) => {
          if (alt && alt.trim()) {
            this.variants.push(alt.trim());
            this.variantToFaqIdx.push(fIdx);
          }
        });
      }
    });

    const preprocessedCorpus = this.variants.map((v) => preprocessText(v));
    const docNgrams = preprocessedCorpus.map((doc) => extractNgrams(doc, 1, 2));

    // Build vocab & document frequencies
    const vocab = new Map<string, number>();
    const dfCounts = new Map<string, number>();

    docNgrams.forEach((ngrams) => {
      const uniqueInDoc = new Set(ngrams);
      uniqueInDoc.forEach((term) => {
        dfCounts.set(term, (dfCounts.get(term) || 0) + 1);
        if (!vocab.has(term)) {
          vocab.set(term, vocab.size);
        }
      });
    });

    this.vocabulary = vocab;
    const N = docNgrams.length;
    const vocabSize = vocab.size;
    this.idfDiag = new Array(vocabSize).fill(0);

    vocab.forEach((idx, term) => {
      const df = dfCounts.get(term) || 0;
      this.idfDiag[idx] = Math.log((1 + N) / (1 + df)) + 1.0;
    });

    // Compute TF-IDF matrix for all variants
    this.tfidfMatrix = preprocessedCorpus.map((doc) => this.vectorizeText(doc));
    this.isReady = true;
  }

  private vectorizeText(preprocessedText: string): number[] {
    const ngrams = extractNgrams(preprocessedText, 1, 2);
    const vocabSize = this.vocabulary.size;
    const vector = new Array(vocabSize).fill(0);

    for (const term of ngrams) {
      const idx = this.vocabulary.get(term);
      if (idx !== undefined) {
        vector[idx] += 1.0;
      }
    }

    let l2Norm = 0.0;
    for (let i = 0; i < vocabSize; i++) {
      if (vector[i] > 0) {
        // Sublinear TF: 1 + log(tf)
        const tf = 1.0 + Math.log(vector[i]);
        vector[i] = tf * this.idfDiag[i];
        l2Norm += vector[i] * vector[i];
      }
    }

    l2Norm = Math.sqrt(l2Norm);
    if (l2Norm > 0) {
      for (let i = 0; i < vocabSize; i++) {
        vector[i] /= l2Norm;
      }
    }

    return vector;
  }

  public query(userQuestion: string, threshold: number = 0.30): QueryResult {
    if (!userQuestion || !userQuestion.trim()) {
      return {
        answer: "Please ask a question so I can assist you with college information.",
        matchedQuestion: null,
        primaryQuestion: null,
        similarityScore: 0.0,
        matchFound: false,
        faqId: null,
        category: null,
        topMatches: [],
        preprocessedQuery: "",
        tokens: []
      };
    }

    const preprocessed = preprocessText(userQuestion);
    const tokens = preprocessed.split(/\s+/).filter(Boolean);

    if (!preprocessed || tokens.length === 0) {
      return {
        answer: "Your question did not contain any recognizable keywords. Please ask with more specific words.",
        matchedQuestion: null,
        primaryQuestion: null,
        similarityScore: 0.0,
        matchFound: false,
        faqId: null,
        category: null,
        topMatches: [],
        preprocessedQuery: preprocessed,
        tokens
      };
    }

    const userVec = this.vectorizeText(preprocessed);

    // Compute cosine similarity with all variants
    const scores: { score: number; varIdx: number }[] = [];
    for (let i = 0; i < this.tfidfMatrix.length; i++) {
      const variantVec = this.tfidfMatrix[i];
      let dot = 0.0;
      for (let j = 0; j < userVec.length; j++) {
        dot += userVec[j] * variantVec[j];
      }
      scores.push({ score: dot, varIdx: i });
    }

    scores.sort((a, b) => b.score - a.score);

    // Aggregate top distinct FAQs
    const seenFaqIndices = new Set<number>();
    const topMatches: MatchCandidate[] = [];

    for (const item of scores) {
      const fIdx = this.variantToFaqIdx[item.varIdx];
      if (!seenFaqIndices.has(fIdx)) {
        seenFaqIndices.add(fIdx);
        const faq = this.faqs[fIdx];
        topMatches.push({
          faqId: faq.id,
          question: faq.question,
          variantMatched: this.variants[item.varIdx],
          similarityScore: Number(item.score.toFixed(4)),
          category: faq.category || "General"
        });
      }
      if (topMatches.length >= 3) break;
    }

    const bestScore = Number(scores[0].score.toFixed(4));
    const bestVarIdx = scores[0].varIdx;

    if (bestScore >= threshold) {
      const fIdx = this.variantToFaqIdx[bestVarIdx];
      const matchedFaq = this.faqs[fIdx];
      return {
        answer: matchedFaq.answer,
        matchedQuestion: this.variants[bestVarIdx],
        primaryQuestion: matchedFaq.question,
        similarityScore: bestScore,
        matchFound: true,
        faqId: matchedFaq.id,
        category: matchedFaq.category || "General",
        topMatches,
        preprocessedQuery: preprocessed,
        tokens
      };
    }

    return {
      answer: DEFAULT_FALLBACK,
      matchedQuestion: bestScore > 0 ? this.variants[bestVarIdx] : null,
      primaryQuestion: null,
      similarityScore: bestScore,
      matchFound: false,
      faqId: null,
      category: null,
      topMatches,
      preprocessedQuery: preprocessed,
      tokens
    };
  }

  public getFaqCount(): number {
    return this.faqs.length;
  }

  public getVariantCount(): number {
    return this.variants.length;
  }

  public getVocabularySize(): number {
    return this.vocabulary.size;
  }
}
