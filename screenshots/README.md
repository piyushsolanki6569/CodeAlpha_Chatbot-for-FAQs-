# Screenshots for Internship Submission

This directory stores visual verification screenshots of the **College FAQ Chatbot** for your internship evaluation, academic report, and GitHub presentation.

> **Status:** Pending manual capture by the student after launching the application locally or via the interactive web environment. Follow the instructions below to capture each required screenshot.

---

## Required Screenshots to Capture

### 1. `01_streamlit_homepage.png`
* **Description:** Initial landing view of the chatbot when opened in the web browser (`http://localhost:8501`).
* **What to show:**
  - Header: *"College FAQ Chatbot - Your Smart Assistant for College-Related Questions"*.
  - Welcome greeting message from the assistant.
  - Left sidebar showing loaded FAQ count (e.g., `30 FAQs (90+ question variants)`), similarity slider, and suggested questions.
* **How to capture:** Open the app and capture the full browser viewport before sending any message.

### 2. `02_exact_match_conversation.png`
* **Description:** A direct question matching an FAQ entry.
* **Question to ask:** `What are the college library timings?` or `How can I apply for admission?`
* **What to show:** User message on the right, chatbot reply on the left, and the expanded **"Match Details"** showing Cosine Similarity Score close to `1.0000`.

### 3. `03_alternative_phrasing_match.png`
* **Description:** A question that uses a completely different phrasing than the primary question title.
* **Question to ask:** `Where can I find the admission form?` or `How can I pay my fees online?`
* **What to show:** Accurate answer returned by the bot and the Match Details showing which alternative phrasing variant was recognized.

### 4. `04_fallback_response.png`
* **Description:** The chatbot gracefully rejecting an out-of-domain or irrelevant question.
* **Question to ask:** `How do I bake a chocolate blueberry cake?` or `What is the weather on Mars?`
* **What to show:** Friendly fallback message: *"Sorry, I couldn't find a relevant answer to your question. Please try asking in a different way or contact the college administration."* with score `< 0.30`.

### 5. `05_threshold_adjustment.png`
* **Description:** Modifying the similarity threshold slider in the sidebar.
* **What to show:** The slider adjusted from default `0.30` to `0.50` or `0.60`, illustrating fine-grained control over match strictness.

### 6. `06_terminal_test_suite.png`
* **Description:** Successful execution of the automated unit test suite in your local terminal.
* **Command:** `python -m unittest tests/test_chatbot.py` or `pytest tests/test_chatbot.py`
* **What to show:** Terminal window displaying `Ran 16 tests in ... OK`.

---

## Recommended Dimensions and Formats
- Format: PNG (`.png`)
- Recommended Resolution: At least `1280x720` or crisp retina screenshots.
- Cleanliness: Crop out extraneous personal desktop icons or background browser tabs.
