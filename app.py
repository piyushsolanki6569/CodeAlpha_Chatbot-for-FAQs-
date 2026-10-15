"""
app.py
======
Streamlit Web Application for College FAQ Chatbot.

Provides a modern, interactive, and responsive web chat interface.
Users can submit inquiries, select from suggested questions, adjust
the similarity matching threshold, inspect NLP match scores, and clear
conversation history.

Run with:
    streamlit run app.py
"""

import os
import streamlit as st
from chatbot import FAQChatbot

# Page configuration
st.set_page_config(
    page_title="College FAQ Chatbot",
    page_icon="🎓",
    layout="wide",
    initial_sidebar_state="expanded",
)

# Custom CSS for modern styling
st.markdown(
    """
    <style>
    .main-header {
        font-size: 2.25rem;
        font-weight: 700;
        color: #1e3a8a;
        margin-bottom: 0.25rem;
    }
    .sub-header {
        font-size: 1.05rem;
        color: #475569;
        margin-bottom: 1.5rem;
    }
    .badge-tag {
        display: inline-block;
        background-color: #e0e7ff;
        color: #3730a3;
        padding: 0.2rem 0.6rem;
        border-radius: 9999px;
        font-size: 0.8rem;
        font-weight: 600;
        margin-right: 0.5rem;
    }
    .disclaimer-box {
        background-color: #fef3c7;
        border-left: 4px solid #f59e0b;
        padding: 0.75rem 1rem;
        border-radius: 4px;
        font-size: 0.85rem;
        color: #92400e;
        margin-top: 1rem;
    }
    .stChatMessage {
        border-radius: 12px;
        padding: 0.75rem 1rem;
        margin-bottom: 0.75rem;
    }
    </style>
    """,
    unsafe_allow_html=True,
)


@st.cache_resource(show_spinner="Loading FAQ Knowledge Base & Vectorizer...")
def get_chatbot_instance(dataset_path: str, threshold: float) -> FAQChatbot:
    """Load and cache the chatbot instance to avoid re-vectorizing on every run."""
    return FAQChatbot(faqs_path=dataset_path, threshold=threshold)


def main():
    # Header Section
    st.markdown('<div class="main-header">🎓 College FAQ Chatbot</div>', unsafe_allow_html=True)
    st.markdown(
        '<div class="sub-header">Your Smart Assistant for College-Related Questions</div>',
        unsafe_allow_html=True,
    )

    # Locate faqs.json
    possible_paths = ["faqs.json", "FAQ-Chatbot/faqs.json", "../faqs.json"]
    faqs_path = None
    for p in possible_paths:
        if os.path.exists(p):
            faqs_path = p
            break

    if faqs_path is None:
        st.error(
            "⚠️ **FAQ dataset file (`faqs.json`) not found.** "
            "Please ensure `faqs.json` is located in the application directory."
        )
        st.stop()

    # Sidebar
    with st.sidebar:
        st.header("⚙️ Configuration & Info")

        # Threshold slider
        threshold = st.slider(
            "Similarity Threshold",
            min_value=0.10,
            max_value=0.90,
            value=0.30,
            step=0.05,
            help="Minimum cosine similarity required to accept an answer. Higher values require closer matches.",
        )

        try:
            bot = get_chatbot_instance(faqs_path, threshold)
            bot.threshold = threshold  # Update threshold dynamically
            faq_count = len(bot.faqs)
            variants_count = len(bot.question_variants)
            st.success(f"✅ Loaded **{faq_count}** FAQs ({variants_count} question variants)")
        except Exception as e:
            st.error(f"Failed to initialize chatbot engine: {e}")
            st.stop()

        st.markdown("---")
        st.subheader("💡 Suggested Inquiries")
        suggested_queries = [
            "How can I apply for admission?",
            "What fee payment methods are accepted?",
            "What are the college library timings?",
            "How do I reset my portal password?",
            "Are hostel accommodations available?",
            "What is the minimum attendance requirement?",
            "How do I connect to campus Wi-Fi?",
            "What placement assistance is provided?",
        ]

        for q in suggested_queries:
            if st.button(q, key=f"btn_{q}", use_container_width=True):
                st.session_state["pending_input"] = q

        st.markdown("---")
        st.subheader("📖 How It Works")
        st.markdown(
            """
            1. **NLP Preprocessing:** Converts text to lowercase, strips punctuation, and retains key terms and negations.
            2. **TF-IDF Vectorization:** Represents questions as term frequency-inverse document frequency vectors.
            3. **Cosine Similarity:** Computes angle similarity between user query and stored FAQ vectors.
            4. **Threshold Gatekeeper:** Returns the answer if score ≥ threshold, or a polite fallback if uncertain.
            """
        )

        st.markdown("---")
        st.subheader("🛠️ Tech Stack")
        st.markdown(
            """
            - **Language:** Python 3.10+
            - **Vectorization:** TF-IDF (`scikit-learn`)
            - **Matching:** Cosine Similarity (`scikit-learn`)
            - **UI Framework:** Streamlit
            - **Storage:** JSON (`faqs.json`)
            """
        )

        # Clear Chat History Button
        st.markdown("---")
        if st.button("🗑️ Clear Conversation", use_container_width=True):
            st.session_state.messages = []
            st.rerun()

        # Disclaimer
        st.markdown(
            """
            <div class="disclaimer-box">
            <strong>Notice:</strong> Sample answers are provided for educational demonstration.
            Always consult your institution's official handbook for current regulations.
            </div>
            """,
            unsafe_allow_html=True,
        )

    # Initialize session state for messages
    if "messages" not in st.session_state:
        st.session_state.messages = [
            {
                "role": "assistant",
                "content": (
                    "Hello! I am your College FAQ Assistant. Ask me anything about admissions, "
                    "fees, library hours, hostel accommodations, exams, Wi-Fi, or student services."
                ),
                "matched_question": None,
                "score": None,
                "match_found": True,
            }
        ]

    # Display conversation history
    for msg in st.session_state.messages:
        with st.chat_message(msg["role"]):
            st.write(msg["content"])
            if msg.get("matched_question") and msg.get("score") is not None:
                with st.expander("🔍 Match Details"):
                    st.write(f"**Matched FAQ:** {msg['matched_question']}")
                    st.write(f"**Cosine Similarity Score:** `{msg['score']:.4f}`")
                    st.write(f"**Threshold:** `{threshold:.2f}`")
                    if msg.get("top_matches"):
                        st.write("**Top Candidates:**")
                        for cand in msg["top_matches"]:
                            st.write(
                                f"- `{cand['similarity_score']:.4f}`: {cand['variant_matched']} "
                                f"*(Category: {cand['category']})*"
                            )

    # Handle input (either from chat_input or clicked suggested button)
    user_query = st.chat_input("Type your question here (e.g., 'How can I pay my fees?')...")
    if "pending_input" in st.session_state and st.session_state["pending_input"]:
        user_query = st.session_state.pop("pending_input")

    if user_query:
        # Validate empty string
        if not user_query.strip():
            st.warning("Please enter a valid question.")
            st.stop()

        # Append user message
        st.session_state.messages.append({"role": "user", "content": user_query})

        # Process through NLP engine
        result = bot.get_best_answer(user_query, threshold=threshold)

        # Append assistant response
        st.session_state.messages.append(
            {
                "role": "assistant",
                "content": result["answer"],
                "matched_question": result.get("matched_question"),
                "score": result.get("similarity_score"),
                "match_found": result.get("match_found"),
                "top_matches": result.get("top_matches", []),
            }
        )

        st.rerun()


if __name__ == "__main__":
    main()
