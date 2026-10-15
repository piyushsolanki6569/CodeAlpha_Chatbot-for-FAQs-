"""
chatbot.py
==========
College FAQ Chatbot - NLP Matching Engine

This module provides the natural language processing (NLP) pipeline for an
educational FAQ assistant. It loads questions from a JSON dataset, preprocesses
text (lowercasing, punctuation cleanup, whitespace normalization, negation preservation,
and stopword filtering), vectorizes questions using TF-IDF (Term Frequency-Inverse
Document Frequency), and retrieves the best-matching answer via Cosine Similarity.

Author: BTech CSE AI/ML Student
Project: Task 2 - Chatbot for FAQs
"""

import os
import re
import json
import math
from typing import Dict, List, Any, Optional, Tuple

# Try importing scikit-learn. If not installed in the environment, fallback to
# a pure-Python TF-IDF and cosine similarity implementation with the identical API.
try:
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.metrics.pairwise import cosine_similarity
    SKLEARN_AVAILABLE = True
except ImportError:
    SKLEARN_AVAILABLE = False


# Negation words and important contrastive terms strictly preserved during preprocessing
PRESERVED_WORDS = {
    "not", "no", "never", "without", "none", "neither", "nor", "cannot", "cant"
}

# Standard English stopwords (NLTK-compatible list, excluding negations)
# Filtering conversational fluff (e.g. "how do i", "can you", "what is") ensures that
# the TF-IDF vectors focus on informative domain keywords (e.g. "admission", "fees", "hostel").
STANDARD_STOPWORDS = {
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
}


def preprocess_text(text: Optional[str]) -> str:
    """
    Preprocess raw text for NLP matching.

    Steps:
    1. Validate input type (handle None or non-string inputs safely).
    2. Convert to lowercase.
    3. Remove punctuation while preserving alphanumeric characters and whitespace.
    4. Tokenize and normalize tokens.
    5. Preserve critical negation words ('not', 'no', etc.) while removing
       low-information noise stopwords.
    6. Normalize multiple whitespace characters into single spaces.

    Parameters:
        text (str): The raw string input from user or FAQ dataset.

    Returns:
        str: Cleaned and normalized text representation.
    """
    if text is None:
        return ""
    if not isinstance(text, str):
        text = str(text)

    # 1. Lowercase
    cleaned = text.lower()

    # 2. Replace punctuation with space (keep alphanumeric characters)
    cleaned = re.sub(r"[^\w\s]", " ", cleaned)

    # 3. Tokenize by whitespace
    tokens = cleaned.split()
    if not tokens:
        return ""

    # 4. Filter noise stopwords while strictly preserving negations
    filtered_tokens = []
    for token in tokens:
        if token in PRESERVED_WORDS or token not in STANDARD_STOPWORDS:
            filtered_tokens.append(token)

    # If filtering removed all tokens (e.g., input was "who is it"), keep original tokens
    final_tokens = filtered_tokens if filtered_tokens else tokens

    # 5. Normalize whitespace
    return " ".join(final_tokens).strip()


class PurePythonTfidfVectorizer:
    """
    Lightweight, dependency-free fallback implementation of TfidfVectorizer.
    Employs sublinear TF scaling and standard smooth-IDF calculation.
    Used when scikit-learn is not installed in the runtime environment.
    """

    def __init__(self, ngram_range: Tuple[int, int] = (1, 2)):
        self.ngram_range = ngram_range
        self.vocabulary_: Dict[str, int] = {}
        self.idf_diag_: List[float] = []
        self.doc_count_: int = 0

    def _extract_ngrams(self, text: str) -> List[str]:
        words = text.split()
        ngrams = []
        min_n, max_n = self.ngram_range
        for n in range(min_n, max_n + 1):
            for i in range(len(words) - n + 1):
                ngrams.append(" ".join(words[i : i + n]))
        return ngrams

    def fit_transform(self, raw_documents: List[str]) -> List[List[float]]:
        self.doc_count_ = len(raw_documents)
        doc_ngrams = [self._extract_ngrams(doc) for doc in raw_documents]

        # Build vocabulary
        vocab = {}
        df_counts = {}
        for ngrams in doc_ngrams:
            unique_in_doc = set(ngrams)
            for term in unique_in_doc:
                df_counts[term] = df_counts.get(term, 0) + 1
                if term not in vocab:
                    vocab[term] = len(vocab)

        self.vocabulary_ = vocab

        # Compute smooth IDF: ln((1 + N) / (1 + df)) + 1
        self.idf_diag_ = [0.0] * len(vocab)
        for term, idx in vocab.items():
            df = df_counts.get(term, 0)
            self.idf_diag_[idx] = math.log((1 + self.doc_count_) / (1 + df)) + 1.0

        return self.transform(raw_documents)

    def transform(self, raw_documents: List[str]) -> List[List[float]]:
        matrix = []
        vocab = self.vocabulary_
        idf = self.idf_diag_
        vocab_size = len(vocab)

        for doc in raw_documents:
            ngrams = self._extract_ngrams(doc)
            vector = [0.0] * vocab_size
            for term in ngrams:
                if term in vocab:
                    idx = vocab[term]
                    vector[idx] += 1.0

            # Apply TF-IDF and L2 normalization
            l2_norm = 0.0
            for i in range(vocab_size):
                if vector[i] > 0:
                    # Sublinear TF scaling: 1 + log(tf)
                    tf = 1.0 + math.log(vector[i])
                    vector[i] = tf * idf[i]
                    l2_norm += vector[i] * vector[i]

            l2_norm = math.sqrt(l2_norm)
            if l2_norm > 0:
                vector = [val / l2_norm for val in vector]

            matrix.append(vector)
        return matrix


def pure_cosine_similarity(matrix_a: Any, matrix_b: Any) -> List[List[float]]:
    """Compute pairwise cosine similarity between two 2D matrices."""
    sim_matrix = []
    for row_a in matrix_a:
        row_sims = []
        for row_b in matrix_b:
            dot = sum(a * b for a, b in zip(row_a, row_b))
            row_sims.append(float(dot))
        sim_matrix.append(row_sims)
    return sim_matrix


class FAQChatbot:
    """
    Main FAQ Chatbot Engine.

    Loads questions and answers from a JSON file, preprocesses all text,
    builds a TF-IDF vector matrix for questions and alternative phrasings,
    and calculates cosine similarity to match user inquiries.
    """

    DEFAULT_FALLBACK = (
        "Sorry, I couldn't find a relevant answer to your question. "
        "Please try asking in a different way or contact the college administration."
    )

    def __init__(self, faqs_path: str = "faqs.json", threshold: float = 0.30):
        """
        Initialize the FAQ chatbot.

        Parameters:
            faqs_path (str): Relative or absolute path to the faqs.json file.
            threshold (float): Minimum cosine similarity score (default: 0.30)
                               required to return an answer instead of fallback.
        """
        self.faqs_path = faqs_path
        self.threshold = threshold
        self.faqs: List[Dict[str, Any]] = []
        self.question_variants: List[str] = []
        self.variant_to_faq_idx: List[int] = []
        self.vectorizer = None
        self.tfidf_matrix = None
        self.is_ready = False

        self.load_and_index()

    def load_and_index(self) -> None:
        """
        Load FAQ data from JSON file, validate entries, and build TF-IDF matrix.
        Raises FileNotFoundError if file is missing, ValueError on malformed JSON.
        """
        if not os.path.exists(self.faqs_path):
            raise FileNotFoundError(
                f"FAQ dataset file not found at: '{self.faqs_path}'. "
                "Ensure faqs.json is placed in the project root."
            )

        with open(self.faqs_path, "r", encoding="utf-8") as file:
            try:
                data = json.load(file)
            except json.JSONDecodeError as exc:
                raise ValueError(f"Invalid JSON format in '{self.faqs_path}': {exc}") from exc

        if not isinstance(data, list) or len(data) == 0:
            raise ValueError(f"FAQ file '{self.faqs_path}' must contain a non-empty list of FAQ objects.")

        validated_faqs = []
        question_variants = []
        variant_to_faq_idx = []

        for idx, entry in enumerate(data):
            if not isinstance(entry, dict):
                raise ValueError(f"FAQ entry #{idx} is not a valid JSON dictionary.")
            if "id" not in entry or "question" not in entry or "answer" not in entry:
                raise ValueError(f"FAQ entry #{idx} must have 'id', 'question', and 'answer' fields.")

            validated_faqs.append(entry)
            faq_index = len(validated_faqs) - 1

            # Primary question
            primary_q = entry["question"].strip()
            if primary_q:
                question_variants.append(primary_q)
                variant_to_faq_idx.append(faq_index)

            # Alternative question phrasings
            alternatives = entry.get("alternatives", [])
            if isinstance(alternatives, list):
                for alt in alternatives:
                    if isinstance(alt, str) and alt.strip():
                        question_variants.append(alt.strip())
                        variant_to_faq_idx.append(faq_index)

        if not question_variants:
            raise ValueError("No valid questions found in the FAQ dataset.")

        self.faqs = validated_faqs
        self.question_variants = question_variants
        self.variant_to_faq_idx = variant_to_faq_idx

        # Preprocess all question variants for vectorization
        preprocessed_corpus = [preprocess_text(q) for q in question_variants]

        # Initialize and fit TF-IDF Vectorizer
        if SKLEARN_AVAILABLE:
            self.vectorizer = TfidfVectorizer(
                ngram_range=(1, 2),
                sublinear_tf=True
            )
            self.tfidf_matrix = self.vectorizer.fit_transform(preprocessed_corpus)
        else:
            self.vectorizer = PurePythonTfidfVectorizer(ngram_range=(1, 2))
            self.tfidf_matrix = self.vectorizer.fit_transform(preprocessed_corpus)

        self.is_ready = True

    def get_best_answer(self, user_question: str, threshold: Optional[float] = None) -> Dict[str, Any]:
        """
        Find the most relevant FAQ answer for a user's question.

        Parameters:
            user_question (str): The user input query.
            threshold (float, optional): Custom similarity threshold.
                                         Defaults to self.threshold.

        Returns:
            dict containing:
                - answer (str): Best answer or fallback message.
                - matched_question (str or None): Stored FAQ question with highest score.
                - similarity_score (float): Cosine similarity value between 0.0 and 1.0.
                - match_found (bool): True if score >= threshold, False otherwise.
                - faq_id (int or None): ID of the matched FAQ entry.
                - category (str or None): Category of the matched FAQ.
                - top_matches (list of dict): Top 3 ranked question candidates.
        """
        effective_threshold = self.threshold if threshold is None else threshold

        # 1. Handle empty or whitespace-only inputs
        if not user_question or not isinstance(user_question, str) or not user_question.strip():
            return {
                "answer": "Please ask a question so I can assist you with college information.",
                "matched_question": None,
                "similarity_score": 0.0,
                "match_found": False,
                "faq_id": None,
                "category": None,
                "top_matches": []
            }

        cleaned_user_q = preprocess_text(user_question)
        if not cleaned_user_q:
            return {
                "answer": "Your question did not contain any recognizable keywords. Please ask with more specific words.",
                "matched_question": None,
                "similarity_score": 0.0,
                "match_found": False,
                "faq_id": None,
                "category": None,
                "top_matches": []
            }

        # 2. Transform user question to TF-IDF vector
        if SKLEARN_AVAILABLE:
            user_vector = self.vectorizer.transform([cleaned_user_q])
            similarities = cosine_similarity(user_vector, self.tfidf_matrix)[0]
        else:
            user_vector = self.vectorizer.transform([cleaned_user_q])
            similarities = pure_cosine_similarity(user_vector, self.tfidf_matrix)[0]

        # 3. Find top scoring candidate
        scored_candidates = []
        for idx, score in enumerate(similarities):
            scored_candidates.append((float(score), idx))

        scored_candidates.sort(key=lambda x: x[0], reverse=True)

        # Collect top distinct FAQ matches
        seen_faq_indices = set()
        top_matches = []
        for score, var_idx in scored_candidates:
            faq_idx = self.variant_to_faq_idx[var_idx]
            if faq_idx not in seen_faq_indices:
                seen_faq_indices.add(faq_idx)
                faq_item = self.faqs[faq_idx]
                top_matches.append({
                    "faq_id": faq_item["id"],
                    "question": faq_item["question"],
                    "variant_matched": self.question_variants[var_idx],
                    "similarity_score": round(score, 4),
                    "category": faq_item.get("category", "General")
                })
            if len(top_matches) >= 3:
                break

        best_score, best_var_idx = scored_candidates[0]
        best_score_rounded = round(best_score, 4)

        # 4. Check threshold
        if best_score_rounded >= effective_threshold:
            matched_faq_idx = self.variant_to_faq_idx[best_var_idx]
            matched_faq = self.faqs[matched_faq_idx]
            return {
                "answer": matched_faq["answer"],
                "matched_question": self.question_variants[best_var_idx],
                "primary_question": matched_faq["question"],
                "similarity_score": best_score_rounded,
                "match_found": True,
                "faq_id": matched_faq["id"],
                "category": matched_faq.get("category", "General"),
                "top_matches": top_matches
            }

        # 5. Fallback response for below-threshold query
        return {
            "answer": self.DEFAULT_FALLBACK,
            "matched_question": self.question_variants[best_var_idx] if best_score_rounded > 0 else None,
            "primary_question": None,
            "similarity_score": best_score_rounded,
            "match_found": False,
            "faq_id": None,
            "category": None,
            "top_matches": top_matches
        }


# Convenience function for quick queries
def get_best_answer(
    user_question: str,
    faqs_path: str = "faqs.json",
    threshold: float = 0.30
) -> Dict[str, Any]:
    """Helper function to load chatbot and retrieve best answer in one call."""
    bot = FAQChatbot(faqs_path=faqs_path, threshold=threshold)
    return bot.get_best_answer(user_question)
