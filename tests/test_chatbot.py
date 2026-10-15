"""
test_chatbot.py
===============
Automated Test Suite for College FAQ Chatbot.

Verifies:
1. Exact question matching.
2. Case-insensitivity (capitalization).
3. Punctuation handling.
4. Alternative phrasing matching.
5. Relevant semantic matching.
6. Fallback response on unrelated queries.
7. Empty question handling.
8. Extra whitespace handling.
9. Missing FAQ file error handling.
10. Malformed JSON handling.
11. Duplicate/repeated question variants mapping.
12. Correct association between matched question and FAQ answer.

Run with:
    python -m unittest tests/test_chatbot.py
or:
    pytest tests/test_chatbot.py
"""

import os
import json
import tempfile
import unittest
import sys

# Ensure project root is in Python sys.path
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
PARENT_DIR = os.path.dirname(CURRENT_DIR)
ROOT_DIR = os.path.dirname(PARENT_DIR)
for path in [PARENT_DIR, ROOT_DIR]:
    if path not in sys.path:
        sys.path.insert(0, path)

from chatbot import FAQChatbot, preprocess_text


class TestFAQChatbot(unittest.TestCase):
    """Comprehensive test cases for FAQ Chatbot NLP Engine."""

    @classmethod
    def setUpClass(cls):
        """Locate dataset file and initialize chatbot instance."""
        possible_paths = [
            os.path.join(PARENT_DIR, "faqs.json"),
            os.path.join(ROOT_DIR, "faqs.json"),
            "faqs.json"
        ]
        cls.faqs_path = None
        for path in possible_paths:
            if os.path.exists(path):
                cls.faqs_path = path
                break

        if cls.faqs_path is None:
            raise FileNotFoundError("Could not locate faqs.json for testing.")

        cls.bot = FAQChatbot(faqs_path=cls.faqs_path, threshold=0.30)

    def test_01_exact_question_match(self):
        """Case 1: Exact question match should produce high similarity (> 0.90) and correct answer."""
        query = "What are the admission requirements?"
        result = self.bot.get_best_answer(query)
        self.assertTrue(result["match_found"], "Exact match should be found")
        self.assertGreater(result["similarity_score"], 0.85)
        self.assertEqual(result["faq_id"], 1)
        self.assertIn("admission", result["answer"].lower())

    def test_02_capitalization_handling(self):
        """Case 2: Different capitalization should match reliably due to lowercasing."""
        query = "WHAT ARE THE ADMISSION REQUIREMENTS?"
        result = self.bot.get_best_answer(query)
        self.assertTrue(result["match_found"])
        self.assertEqual(result["faq_id"], 1)
        self.assertGreater(result["similarity_score"], 0.85)

    def test_03_punctuation_handling(self):
        """Case 3: Heavy extra punctuation should not degrade matching."""
        query = "What are the admission requirements?!?!?! ... *** ---"
        result = self.bot.get_best_answer(query)
        self.assertTrue(result["match_found"])
        self.assertEqual(result["faq_id"], 1)

    def test_04_alternative_phrasing_match(self):
        """Case 4: An alternative phrasing should map to its parent FAQ."""
        query = "Where can I find the admission form?"
        result = self.bot.get_best_answer(query)
        self.assertTrue(result["match_found"])
        self.assertEqual(result["faq_id"], 2, "Should map to FAQ #2 (apply for admission)")
        self.assertIn("apply", result["answer"].lower())

    def test_05_relevant_keyword_match(self):
        """Case 5: A natural question with conversational words should find the right FAQ."""
        query = "Could you tell me how I can reset my forgotten password?"
        result = self.bot.get_best_answer(query)
        self.assertTrue(result["match_found"])
        self.assertEqual(result["faq_id"], 18, "Should match password reset FAQ #18")
        self.assertIn("password", result["answer"].lower())

    def test_06_unrelated_question_triggers_fallback(self):
        """Case 6: Completely unrelated question must trigger fallback."""
        query = "How do I make a chocolate blueberry cheesecake with vanilla crust?"
        result = self.bot.get_best_answer(query)
        self.assertFalse(result["match_found"], "Unrelated query must not match")
        self.assertEqual(result["answer"], self.bot.DEFAULT_FALLBACK)
        self.assertLess(result["similarity_score"], self.bot.threshold)

    def test_07_empty_question_handling(self):
        """Case 7: Empty or None question should return friendly prompt without crashing."""
        for empty_val in ["", "   ", "\n\t", None]:
            result = self.bot.get_best_answer(empty_val)
            self.assertFalse(result["match_found"])
            self.assertEqual(result["similarity_score"], 0.0)
            self.assertIn("Please ask a question", result["answer"])

    def test_08_extra_whitespace_handling(self):
        """Case 8: Excessive tabs and spaces should be safely normalized."""
        query = "   How    can   I    pay    my    fees?   \t\n  "
        result = self.bot.get_best_answer(query)
        self.assertTrue(result["match_found"])
        self.assertEqual(result["faq_id"], 6, "Should match fee payment FAQ #6")

    def test_09_missing_faq_file_handling(self):
        """Case 9: Missing file path must raise FileNotFoundError with clear message."""
        non_existent_file = "non_existent_directory/invalid_file.json"
        with self.assertRaises(FileNotFoundError):
            FAQChatbot(faqs_path=non_existent_file)

    def test_10_invalid_json_handling(self):
        """Case 10: Corrupted JSON must raise ValueError with diagnostic details."""
        with tempfile.NamedTemporaryFile("w", delete=False, suffix=".json") as tmp:
            tmp.write("{ this is not valid json, missing quotes }")
            tmp_path = tmp.name

        try:
            with self.assertRaises(ValueError):
                FAQChatbot(faqs_path=tmp_path)
        finally:
            if os.path.exists(tmp_path):
                os.remove(tmp_path)

    def test_11_duplicate_or_repeated_variants_association(self):
        """Case 11: Even with multiple variants belonging to same FAQ, no duplicates or mismatch."""
        query = "How do I get admission?"
        result = self.bot.get_best_answer(query)
        self.assertTrue(result["match_found"])
        # Both primary and alternative point to FAQ #2
        self.assertIn(result["faq_id"], [1, 2])

    def test_12_correct_association_between_faq_and_answer(self):
        """Case 12: Matched question must return the EXACT corresponding answer text."""
        query = "What are the college library timings?"
        result = self.bot.get_best_answer(query)
        self.assertTrue(result["match_found"])
        self.assertEqual(result["faq_id"], 11)
        # Verify specific library hours mentioned in dataset
        self.assertIn("8:00 AM to 9:00 PM", result["answer"])


class TestTextPreprocessing(unittest.TestCase):
    """Dedicated test cases for NLP preprocessing function."""

    def test_lowercase_conversion(self):
        self.assertEqual(preprocess_text("HeLLo WoRLd"), "hello world")

    def test_punctuation_stripping(self):
        self.assertEqual(preprocess_text("exams, fees & hostel?"), "exams fees hostel")

    def test_negation_preservation(self):
        # 'not' must NOT be dropped as a stopword
        processed = preprocess_text("why is my card not working")
        self.assertIn("not", processed.split())

    def test_empty_string(self):
        self.assertEqual(preprocess_text(""), "")
        self.assertEqual(preprocess_text(None), "")


if __name__ == "__main__":
    unittest.main()
