# College FAQ Chatbot Using NLP (TF-IDF & Cosine Similarity)

[![Python 3.10+](https://img.shields.io/badge/Python-3.10%2B-blue.svg)](https://www.python.org/)
[![Streamlit](https://img.shields.io/badge/Streamlit-1.30%2B-red.svg)](https://streamlit.io/)
[![scikit-learn](https://img.shields.io/badge/scikit--learn-1.3%2B-orange.svg)](https://scikit-learn.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

An automated question-answering assistant for higher education institutions built using classical Natural Language Processing (NLP) techniques: **Text Preprocessing, TF-IDF Vectorization, and Cosine Similarity Matching**.

---

## 1. Project Title
**College FAQ Chatbot Using NLP**  
*Task 2: Chatbot for FAQs – AI/ML Internship Portfolio Project*

---

## 2. Project Overview
The **College FAQ Chatbot** is a lightweight, accurate, and offline-capable natural language assistant designed to answer frequent inquiries from college students, prospective applicants, and parents. Operating on a curated knowledge base of 30+ official academic categories, the system eliminates the need for expensive Large Language Model (LLM) APIs, external tokens, or internet connections while maintaining deterministic and verifiable answers.

---

## 3. Problem Statement
> *"Many educational institutions receive repeated questions about admissions, fees, examinations, library services, hostel facilities, and student support. Answering these questions manually can require considerable time and effort.*
>
> *The objective of this project is to develop a Python-based FAQ chatbot that automatically responds to common user questions using Natural Language Processing techniques. The chatbot preprocesses user input, represents text using TF-IDF, compares questions using cosine similarity, and returns the answer associated with the most relevant FAQ.*
>
> *The application also includes a fallback response for questions that cannot be matched confidently and a Streamlit-based interface for user interaction."*

---

## 4. Project Objectives
1. **Automated Student Inquiries:** Provide instant answers 24/7 for college policies, deadlines, and procedures.
2. **Deterministic NLP Matching:** Implement TF-IDF vectorization and cosine similarity to match user inputs against primary and alternative question phrasings.
3. **Safe Out-of-Domain Rejection:** Implement a configurable similarity threshold (default: `0.30`) to reject irrelevant questions with a polite fallback rather than hallucinating incorrect answers.
4. **Interactive Web Interface:** Deploy an easy-to-use Streamlit web chat with conversation history, suggested prompts, and NLP match inspections.
5. **Decoupled Architecture & Testing:** Maintain the FAQ dataset separately in JSON, write fully modular Python code, and implement an automated 16-case test suite (`unittest` / `pytest`).

---

## 5. Key Features
- **30+ Comprehensive College FAQs:** Covers admissions, tuition fees, scholarships, hostel accommodations, exams, attendance rules, Wi-Fi, placements, and more.
- **Multiple Question Variants:** Each FAQ stores 3 to 4 natural alternative phrasings (over 90 total variants indexed) to understand varied student phrasing.
- **Robust NLP Preprocessing:** Converts text to lowercase, strips punctuation, tokenizes, removes conversational stopword noise, and preserves critical negation terms (`not`, `no`, `never`, `without`).
- **Configurable Similarity Threshold:** Dynamic threshold slider allows administrators to tune match sensitivity between strict precision and broad recall.
- **Match Inspector:** Expandable inspection widget shows the exact matched FAQ variant, top-3 ranked alternatives, and raw cosine similarity scores.
- **Clickable Question Suggestions:** Quick-action prompt buttons for high-frequency inquiries.
- **Zero API Dependency:** 100% self-contained Python application without OpenAI, Anthropic, or paid cloud APIs.

---

## 6. Technologies Used
| Component | Technology | Purpose |
| :--- | :--- | :--- |
| **Language** | Python 3.10+ | Core development language |
| **NLP & Tokenization** | Python `re`, String processing | Cleaning, normalizing, and negation preservation |
| **Vectorization** | `TfidfVectorizer` (`scikit-learn`) | Term Frequency-Inverse Document Frequency matrix generation |
| **Similarity Metric** | `cosine_similarity` (`scikit-learn`)| Vector angle comparison between query and corpus |
| **Web Interface** | `Streamlit` | Modern, responsive web chat application |
| **Data Storage** | JSON (`faqs.json`) | Human-readable, non-technical editable FAQ database |
| **Automated Testing** | `unittest` / `pytest` | Regression and behavior verification |
| **Version Control** | Git & GitHub | Source tracking and project distribution |

---

## 7. How the Chatbot Works
```
+-------------------------------------------------------------+
|                     User Submits Query                      |
|         "How can I pay my college tuition fees?"            |
+-------------------------------------------------------------+
                               |
                               v
+-------------------------------------------------------------+
|                   Step 1: NLP Preprocessing                 |
|  - Convert to lowercase                                     |
|  - Strip punctuation and symbols                            |
|  - Tokenize and remove conversational stopwords             |
|  - Preserve negation words ('not', 'no', etc.)              |
|  Result: "pay college tuition fees"                         |
+-------------------------------------------------------------+
                               |
                               v
+-------------------------------------------------------------+
|             Step 2: TF-IDF Vector Generation                |
|  - Transform token sequence into numerical vector           |
|  - Weight rare domain terms higher, common terms lower      |
+-------------------------------------------------------------+
                               |
                               v
+-------------------------------------------------------------+
|         Step 3: Cosine Similarity Vector Comparison         |
|  - Compute dot products with pre-indexed FAQ corpus vectors |
|  - Rank stored questions by similarity score (0.0 to 1.0)   |
+-------------------------------------------------------------+
                               |
                               v
+-------------------------------------------------------------+
|              Step 4: Threshold Gatekeeper Check             |
|                  Is Score >= Threshold (0.30)?              |
+-------------------------------------------------------------+
               /                               \
         [YES]                                   [NO]
           v                                       v
+-----------------------------------+   +----------------------------+
| Return Matched FAQ Answer         |   | Return Polite Fallback:    |
| e.g. "Tuition and semester fees   |   | "Sorry, I couldn't find a  |
| can be paid online through ERP..."|   | relevant answer. Please..."|
+-----------------------------------+   +----------------------------+
```

---

## 8. System Architecture
The application is structured into decoupled modules:
- **Presentation Layer (`app.py`):** Renders the chat feed, collects inputs, handles sidebar sliders, and executes UI updates.
- **Engine Layer (`chatbot.py`):** Contains the `FAQChatbot` class, text sanitization logic, vectorizer instances, and vector calculation.
- **Data Layer (`faqs.json`):** Independent JSON data file containing all questions, answers, and category mappings.
- **Verification Layer (`tests/test_chatbot.py`):** Automated tests covering corner cases, malformed data, and boundary thresholds.

---

## 9. Project Folder Structure
```text
FAQ-Chatbot/
|
|-- app.py                  # Streamlit web application & chat interface
|-- chatbot.py              # NLP engine: Preprocessing, TF-IDF, Cosine Similarity
|-- faqs.json               # 30+ College FAQ entries with alternative phrasings
|-- requirements.txt        # Python dependency manifest
|-- README.md               # Complete project documentation and submission guide
|-- .gitignore              # Git ignore rules for virtualenvs and temporary files
|
|-- screenshots/            # Submission screenshot storage
|   |-- README.md           # Instructions on capturing verification screenshots
|
|-- tests/                  # Automated test suite
|   |-- test_chatbot.py     # 16 unit tests covering all matching scenarios
|
|-- .streamlit/             # Streamlit visual configuration
    |-- config.toml         # Theme colors, port settings, and server rules
```

---

## 10. Installation Requirements
- **Operating System:** Windows 10/11, macOS, or Linux (Ubuntu, Debian, Fedora, Arch)
- **Python Version:** Python 3.10, 3.11, or 3.12
- **Memory & Storage:** 200 MB free RAM, 100 MB free disk space

---

## 11. Installation Steps

### 1. Clone or Download the Repository
```bash
git clone YOUR_GITHUB_REPOSITORY_URL
cd FAQ-Chatbot
```

### 2. Create and Activate a Python Virtual Environment
**On Linux / macOS:**
```bash
python3 -m venv venv
source venv/bin/activate
```

**On Windows (Command Prompt):**
```cmd
python -m venv venv
venv\Scripts\activate.bat
```

**On Windows (PowerShell):**
```powershell
python -m venv venv
venv\Scripts\Activate.ps1
```

### 3. Install Required Dependencies
```bash
pip install -r requirements.txt
```

---

## 12. How to Run the Application
Launch the Streamlit web server:
```bash
streamlit run app.py
```
After execution, your default web browser will automatically open:
```text
Local URL: http://localhost:8501
Network URL: http://192.168.x.x:8501
```

---

## 13. How to Use the Chatbot
1. **Type a Question:** Enter your query into the text box at the bottom of the page (e.g., *"How do I reset my portal password?"*).
2. **Press Enter or Click Send:** The assistant processes the query and displays the official response on the left.
3. **Inspect NLP Match Details:** Click on **"🔍 Match Details"** under any response to view the matched FAQ question, the similarity score, and the runner-up question candidates.
4. **Use Suggested Prompts:** Click any of the pre-configured buttons in the sidebar for rapid queries.
5. **Adjust Sensitivity:** Slide the **"Similarity Threshold"** slider in the sidebar to test how strict or lenient the matching should be.
6. **Clear Conversation:** Click the **"🗑️ Clear Conversation"** button in the sidebar to reset the session.

---

## 14. Example Questions and Answers

| Query Category | Example User Question | Matched FAQ Title | Sample Answer Summary |
| :--- | :--- | :--- | :--- |
| **Admissions** | *"How can I enroll in college?"* | *How can I apply for admission?* | Apply online via student portal by filling credentials and paying application fee. |
| **Fees** | *"Can I pay fees using UPI or net banking?"* | *What fee payment methods are accepted?* | Fees accepted via Net Banking, Debit/Credit Card, UPI, or NEFT/RTGS bank transfer. |
| **Library** | *"Until what time is the library open?"* | *What are the college library timings?* | Monday through Saturday 8:00 AM to 9:00 PM; 24-hr during exams. |
| **IT Services** | *"I forgot my ERP password, what should I do?"*| *How do I reset my student portal password?* | Click 'Forgot Password' on portal or visit IT Helpdesk with student ID. |
| **Campus Housing** | *"Are dormitory rooms available for outstation students?"* | *Are hostel accommodations available on campus?* | Separate hostels for male and female students with mess and 24/7 security. |
| **Out-of-Domain** | *"How do I bake a chocolate cake?"* | *(None - Score < 0.30)* | Fallback: *"Sorry, I couldn't find a relevant answer to your question..."* |

---

## 15. NLP Preprocessing Explanation
Raw human input contains noise, differing cases, and extraneous characters that disrupt vector calculations. The `preprocess_text()` function executes the following pipeline:
1. **Type Validation:** Safely casts inputs and rejects `None` or non-string inputs.
2. **Case Folding:** Converts all letters to lowercase so `"Admission"` and `"admission"` produce identical tokens.
3. **Punctuation Stripping:** Regular expressions (`re.sub(r"[^\w\s]", " ", text)`) remove commas, question marks, exclamation marks, and hyphens.
4. **Stopword Elimination:** Filters non-distinctive conversational words (e.g., `"what"`, `"is"`, `"the"`, `"can"`, `"you"`).
5. **Negation Preservation:** Words that invert semantic intent (e.g., `"not"`, `"no"`, `"never"`, `"without"`) are explicitly protected from stopword removal.
6. **Whitespace Normalization:** Compresses multi-space artifacts and strips boundary spaces.

---

## 16. TF-IDF Explanation
**Term Frequency-Inverse Document Frequency (TF-IDF)** converts text strings into numerical vectors based on statistical rarity:
$$\text{TF-IDF}(t, d, D) = \text{TF}(t, d) \times \text{IDF}(t, D)$$
- **Term Frequency ($\text{TF}$):** How often term $t$ appears in document $d$. Sublinear scaling ($1 + \ln(\text{tf})$) dampens repeated words.
- **Inverse Document Frequency ($\text{IDF}$):** Measures how informative a term is across the entire collection $D$:
$$\text{IDF}(t, D) = \ln\left(\frac{1 + |D|}{1 + \text{DF}(t)}\right) + 1$$
Terms common across every question (e.g., *"college"*) receive lower weights, while specialized terms (e.g., *"transcript"*, *"hostel"*, *"attendance"*) receive higher weights.

---

## 17. Cosine Similarity Explanation
Once two texts are converted to vectors $\mathbf{A}$ and $\mathbf{B}$, **Cosine Similarity** evaluates the cosine of the angle between them:
$$\text{Cosine Similarity}(\mathbf{A}, \mathbf{B}) = \frac{\mathbf{A} \cdot \mathbf{B}}{\|\mathbf{A}\|_2 \|\mathbf{B}\|_2}$$
- **Score = 1.0:** Identical orientation (exact match).
- **Score = 0.0:** Orthogonal vectors (zero shared vocabulary).
Cosine similarity evaluates directional alignment rather than document length, making it ideal for matching short queries against concise FAQ entries.

---

## 18. Similarity Threshold Explanation
Lexical matching can sometimes assign non-zero scores to loosely overlapping words. A **similarity threshold** acts as an acceptance gate:
- If $\text{Score} \ge \text{Threshold}$: Accept the candidate as a true match and display the answer.
- If $\text{Score} < \text{Threshold}$: Reject the candidate and return the fallback message.
A threshold of **0.30** offers an optimal balance between recognizing paraphrased questions and avoiding false positives.

---

## 19. Dataset Customization
To customize the knowledge base for your specific college or university, open `faqs.json` in any text editor:
```json
{
  "id": 31,
  "category": "Admissions",
  "question": "What is the scholarship percentage for sports achievers?",
  "answer": "National-level medalists receive a 50% tuition waiver upon verification.",
  "alternatives": [
    "Do athletes get fee concessions?",
    "Is there a sports quota scholarship?"
  ]
}
```
**Rules for editing `faqs.json`:**
1. Ensure `id` is unique.
2. Provide a clear primary `question` and an accurate `answer`.
3. Add 2 to 4 diverse `alternatives` representing different ways students might ask.
4. Save the file. When Streamlit reloads, the new entries are automatically indexed!

---

## 20. Automated Testing
Run the automated test suite using Python's standard `unittest` module:
```bash
python -m unittest tests/test_chatbot.py
```
Or run with `pytest`:
```bash
pytest tests/test_chatbot.py -v
```
All 16 test cases verify exact matches, capitalization, punctuation, alternative phrasings, negations, empty strings, missing files, corrupted JSON, and out-of-domain rejections.

---

## 21. Known Limitations
- **Lexical Overlap Dependence:** Traditional TF-IDF requires some shared vocabulary or n-grams. Questions using rare synonyms not present in `faqs.json` may score below the threshold.
- **Single-Turn Context:** The engine answers questions individually and does not maintain multi-turn conversational coreference (e.g., *"How much is it?"* following an admission question).
- **Spelling Mistakes:** Severe typographical errors (e.g., *"admishun"* instead of *"admission"*) reduce the similarity score unless accounted for.

---

## 22. Future Improvements
1. **Dense Semantic Embeddings:** Incorporating `Sentence-Transformers` (`all-MiniLM-L6-v2`) for conceptual semantic similarity.
2. **Spelling Correction:** Integrating SymSpell or Levenshtein distance preprocessing for typo tolerance.
3. **Multilingual Support:** Supporting queries in regional languages.
4. **Analytics Dashboard:** Logging unanswered queries to help university administrators discover new FAQ topics.
5. **Database Backend:** Transitioning `faqs.json` to PostgreSQL / SQLite with an administrative CRUD portal.

---

## 23. Screenshots
See the [`screenshots/README.md`](screenshots/README.md) file for the complete capture checklist:
1. `01_streamlit_homepage.png` - Application welcome view
2. `02_exact_match_conversation.png` - Exact question match
3. `03_alternative_phrasing_match.png` - Alternative phrasing match
4. `04_fallback_response.png` - Out-of-domain query triggering fallback
5. `05_threshold_adjustment.png` - Sidebar threshold customization
6. `06_terminal_test_suite.png` - Terminal execution showing `Ran 16 tests in ... OK`

---

## 24. GitHub Upload Instructions
To publish your project on GitHub:

```bash
# 1. Initialize Git repository
git init

# 2. Stage all project files
git add .

# 3. Create initial commit
git commit -m "Build FAQ Chatbot using NLP"

# 4. Set default branch to main
git branch -M main

# 5. Connect to your GitHub repository (replace with your actual repository URL)
git remote add origin https://github.com/YOUR_USERNAME/FAQ-Chatbot.git

# 6. Push code to GitHub
git push -u origin main
```

*(Note: Replace `https://github.com/YOUR_USERNAME/FAQ-Chatbot.git` with your actual repository URL created on github.com).*

---

## 25. License
This project is licensed under the **MIT License** - see the LICENSE file for details. Free for academic, educational, and commercial adaptation.
