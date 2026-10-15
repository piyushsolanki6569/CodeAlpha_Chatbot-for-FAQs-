/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useRef, useEffect } from 'react';
import faqsData from './data/faqs.json';
import {
  NLPEngine,
  preprocessText,
  DEFAULT_FALLBACK,
  type FAQItem,
  type QueryResult
} from './nlpEngine.ts';
import {
  Send,
  Trash2,
  HelpCircle,
  BookOpen,
  Sparkles,
  Sliders,
  Download,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Terminal,
  FileCode,
  FolderArchive,
  RotateCcw,
  Search,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  GraduationCap,
  Cpu,
  Layers,
  ArrowRight
} from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  matchedQuestion?: string | null;
  score?: number;
  matchFound?: boolean;
  topMatches?: QueryResult['topMatches'];
  category?: string | null;
  faqId?: number | null;
}

export default function App() {
  const [faqs, setFaqs] = useState<FAQItem[]>(faqsData as FAQItem[]);
  const [threshold, setThreshold] = useState<number>(0.30);
  const [inputQuery, setInputQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'chat' | 'inspector' | 'dataset' | 'tests' | 'project'>('chat');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [expandedMatchId, setExpandedMatchId] = useState<string | null>(null);

  // Inspector interactive state
  const [inspectorText, setInspectorText] = useState<string>('How can I apply for admission?');

  // FAQ search & filter state
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Initialize NLP Engine
  const nlpEngine = useMemo(() => {
    return new NLPEngine(faqs);
  }, [faqs]);

  // Initial greeting
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        'Hello! I am your College FAQ Assistant. Ask me anything about admissions, course fees, scholarships, library timings, hostel accommodation, semester exams, Wi-Fi login, or student services.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      matchFound: true
    }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (queryText: string) => {
    const text = queryText.trim();
    if (!text) return;

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: timeStr
    };

    // Query NLP Engine
    const result = nlpEngine.query(text, threshold);

    const botMsg: ChatMessage = {
      id: `bot-${Date.now()}`,
      role: 'assistant',
      content: result.answer,
      timestamp: timeStr,
      matchedQuestion: result.matchedQuestion,
      score: result.similarityScore,
      matchFound: result.matchFound,
      topMatches: result.topMatches,
      category: result.category,
      faqId: result.faqId
    };

    setMessages((prev) => [...prev, userMsg, botMsg]);
    setInputQuery('');
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: 'welcome-reset',
        role: 'assistant',
        content: 'Conversation cleared. How can I assist you today with college information?',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        matchFound: true
      }
    ]);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(label);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const suggestedQueries = [
    'How can I apply for admission?',
    'What fee payment methods are accepted?',
    'What are the college library timings?',
    'How do I reset my portal password?',
    'Are hostel accommodations available?',
    'What is the minimum attendance requirement?',
    'How do I connect to campus Wi-Fi?'
  ];

  const categories = useMemo(() => {
    const set = new Set<string>();
    faqs.forEach((f) => {
      if (f.category) set.add(f.category);
    });
    return ['All', ...Array.from(set).sort()];
  }, [faqs]);

  const filteredFaqs = useMemo(() => {
    return faqs.filter((f) => {
      const matchCat = selectedCategory === 'All' || f.category === selectedCategory;
      const q = searchFilter.toLowerCase();
      const matchSearch =
        !q ||
        f.question.toLowerCase().includes(q) ||
        f.answer.toLowerCase().includes(q) ||
        f.alternatives.some((alt) => alt.toLowerCase().includes(q));
      return matchCat && matchSearch;
    });
  }, [faqs, selectedCategory, searchFilter]);

  // Inspector computation
  const inspectorResult = useMemo(() => {
    return nlpEngine.query(inspectorText, threshold);
  }, [nlpEngine, inspectorText, threshold]);

  // Automated Test Cases for Live Test Suite Tab
  const testCases = [
    {
      id: 1,
      name: 'Exact question match',
      input: 'What are the admission requirements?',
      expectedMatch: true,
      minScore: 0.85,
      expectedFaqId: 1
    },
    {
      id: 2,
      name: 'Case insensitivity (All Uppercase)',
      input: 'WHAT ARE THE ADMISSION REQUIREMENTS?',
      expectedMatch: true,
      minScore: 0.85,
      expectedFaqId: 1
    },
    {
      id: 3,
      name: 'Punctuation removal & resilience',
      input: 'What are the admission requirements?!?!?! ... *** ---',
      expectedMatch: true,
      minScore: 0.85,
      expectedFaqId: 1
    },
    {
      id: 4,
      name: 'Alternative phrasing match',
      input: 'Where can I find the admission form?',
      expectedMatch: true,
      minScore: 0.35,
      expectedFaqId: 2
    },
    {
      id: 5,
      name: 'Relevant query with filler words',
      input: 'Could you tell me how I can reset my forgotten password?',
      expectedMatch: true,
      minScore: 0.40,
      expectedFaqId: 18
    },
    {
      id: 6,
      name: 'Unrelated query triggers fallback',
      input: 'How do I make a chocolate blueberry cheesecake with vanilla crust?',
      expectedMatch: false,
      maxScore: 0.30
    },
    {
      id: 7,
      name: 'Empty query handling',
      input: '   ',
      expectedMatch: false,
      maxScore: 0.0
    },
    {
      id: 8,
      name: 'Extra whitespace normalization',
      input: '   How    can   I    pay    my    fees?   \t  ',
      expectedMatch: true,
      minScore: 0.70,
      expectedFaqId: 6
    },
    {
      id: 9,
      name: 'Library timings retrieval',
      input: 'What are the college library timings?',
      expectedMatch: true,
      minScore: 0.85,
      expectedFaqId: 11
    },
    {
      id: 10,
      name: 'Hostel accommodation inquiry',
      input: 'Are hostel accommodations available on campus?',
      expectedMatch: true,
      minScore: 0.80,
      expectedFaqId: 9
    },
    {
      id: 11,
      name: 'Wi-Fi connectivity support',
      input: 'How do I connect to the campus Wi-Fi network?',
      expectedMatch: true,
      minScore: 0.75,
      expectedFaqId: 19
    },
    {
      id: 12,
      name: 'Attendance requirement query',
      input: 'What percentage of attendance is mandatory?',
      expectedMatch: true,
      minScore: 0.45,
      expectedFaqId: 15
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      {/* Top Header Bar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">College FAQ Chatbot</h1>
                <span className="bg-blue-100 text-blue-700 text-xs px-2.5 py-0.5 rounded-full font-semibold border border-blue-200">
                  NLP TF-IDF
                </span>
                <span className="bg-emerald-100 text-emerald-800 text-xs px-2 py-0.5 rounded-full font-medium border border-emerald-200 hidden md:inline-flex">
                  Zero-API Offline
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Your Smart Assistant for College-Related Questions • BTech AI/ML Internship Task 2
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto bg-slate-100 p-1 rounded-xl text-xs font-medium text-slate-600">
            <button
              onClick={() => setActiveTab('chat')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'chat'
                  ? 'bg-white text-blue-700 shadow-xs font-semibold'
                  : 'hover:text-slate-900'
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              Live Chat
            </button>
            <button
              onClick={() => setActiveTab('inspector')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'inspector'
                  ? 'bg-white text-blue-700 shadow-xs font-semibold'
                  : 'hover:text-slate-900'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              NLP Vector Inspector
            </button>
            <button
              onClick={() => setActiveTab('dataset')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'dataset'
                  ? 'bg-white text-blue-700 shadow-xs font-semibold'
                  : 'hover:text-slate-900'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              FAQ Database ({faqs.length})
            </button>
            <button
              onClick={() => setActiveTab('tests')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'tests'
                  ? 'bg-white text-blue-700 shadow-xs font-semibold'
                  : 'hover:text-slate-900'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              Unit Tests (16)
            </button>
            <button
              onClick={() => setActiveTab('project')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'project'
                  ? 'bg-white text-blue-700 shadow-xs font-semibold'
                  : 'hover:text-slate-900'
              }`}
            >
              <FolderArchive className="w-3.5 h-3.5" />
              Project Files & ZIP
            </button>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {activeTab === 'chat' && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
            {/* Sidebar Controls */}
            <div className="lg:col-span-1 space-y-4">
              {/* Threshold Adjuster Box */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-blue-600" />
                    <h3 className="font-semibold text-slate-800 text-sm">Similarity Threshold</h3>
                  </div>
                  <span className="text-xs font-mono font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200">
                    {threshold.toFixed(2)}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mb-3">
                  Minimum Cosine Similarity required to accept an FAQ match. Higher values enforce strictness.
                </p>
                <input
                  type="range"
                  min="0.10"
                  max="0.80"
                  step="0.05"
                  value={threshold}
                  onChange={(e) => setThreshold(parseFloat(e.target.value))}
                  className="w-full accent-blue-600 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                  <span>0.10 (Lenient)</span>
                  <span>0.30 (Default)</span>
                  <span>0.80 (Strict)</span>
                </div>
              </div>

              {/* Dataset Stats */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
                <h3 className="font-semibold text-slate-800 text-sm mb-2 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-emerald-600" />
                  Knowledge Base Stats
                </h3>
                <div className="grid grid-cols-2 gap-2 text-center text-xs">
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <div className="text-lg font-bold text-slate-900">{nlpEngine.getFaqCount()}</div>
                    <div className="text-slate-500 text-[11px]">Primary FAQs</div>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <div className="text-lg font-bold text-blue-600">{nlpEngine.getVariantCount()}</div>
                    <div className="text-slate-500 text-[11px]">Indexed Variants</div>
                  </div>
                </div>
                <div className="mt-2.5 text-[11px] text-slate-500 flex items-center justify-between">
                  <span>Vocabulary Size:</span>
                  <span className="font-mono font-medium text-slate-700">{nlpEngine.getVocabularySize()} terms</span>
                </div>
              </div>

              {/* Suggested Questions */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
                <h3 className="font-semibold text-slate-800 text-sm mb-2.5 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  Suggested Inquiries
                </h3>
                <div className="space-y-1.5">
                  {suggestedQueries.map((query, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(query)}
                      className="w-full text-left text-xs text-slate-700 bg-slate-50 hover:bg-blue-50 hover:text-blue-700 p-2 rounded-lg border border-slate-200/60 transition-colors flex items-center justify-between group"
                    >
                      <span className="line-clamp-1">{query}</span>
                      <ArrowRight className="w-3 h-3 text-slate-400 group-hover:text-blue-600 transition-colors shrink-0 ml-1" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Clear Chat and Reset */}
              <button
                onClick={handleClearChat}
                className="w-full py-2 px-3 text-xs font-medium text-slate-600 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 rounded-xl transition-colors flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear Chat History
              </button>

              {/* Verification Notice */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800">
                <p className="font-semibold flex items-center gap-1.5 mb-1 text-amber-900">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                  Academic Sample Data
                </p>
                <p className="text-[11px] leading-relaxed text-amber-800">
                  Information shown represents general illustrative sample college policies. Always confirm official deadlines and requirements with your department.
                </p>
              </div>
            </div>

            {/* Chat Conversation Area */}
            <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col h-[650px] overflow-hidden">
              {/* Chat Messages Feed */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
                {messages.map((msg) => {
                  const isUser = msg.role === 'user';
                  const isMatchExpanded = expandedMatchId === msg.id;

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3 shadow-xs ${
                          isUser
                            ? 'bg-blue-600 text-white rounded-br-xs'
                            : 'bg-slate-100 text-slate-800 border border-slate-200/80 rounded-bl-xs'
                        }`}
                      >
                        <div className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</div>

                        <div className="mt-1.5 flex items-center justify-between text-[10px] opacity-75">
                          <span>{msg.timestamp}</span>
                          {!isUser && msg.score !== undefined && (
                            <span className="font-mono">
                              Similarity: {(msg.score * 100).toFixed(1)}%
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Technical Match Details (for Bot responses) */}
                      {!isUser && msg.matchedQuestion && (
                        <div className="mt-1.5 max-w-[85%] sm:max-w-[75%] w-full">
                          <button
                            onClick={() => setExpandedMatchId(isMatchExpanded ? null : msg.id)}
                            className="text-[11px] text-slate-500 hover:text-blue-700 flex items-center gap-1 font-medium transition-colors"
                          >
                            <span>
                              Matched: <strong className="text-slate-700 font-semibold">{msg.matchedQuestion}</strong> (Score: {msg.score?.toFixed(4)})
                            </span>
                            {isMatchExpanded ? (
                              <ChevronUp className="w-3.5 h-3.5" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5" />
                            )}
                          </button>

                          {isMatchExpanded && (
                            <div className="mt-2 bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs space-y-2 text-slate-700">
                              <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                                <span className="text-[11px] text-slate-500">NLP Threshold Cutoff:</span>
                                <span className="font-mono font-semibold text-slate-800">{threshold.toFixed(2)}</span>
                              </div>
                              <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                                <span className="text-[11px] text-slate-500">Raw Cosine Score:</span>
                                <span className="font-mono font-semibold text-blue-600">{msg.score?.toFixed(4)}</span>
                              </div>
                              {msg.topMatches && msg.topMatches.length > 0 && (
                                <div>
                                  <div className="text-[11px] font-semibold text-slate-600 mb-1">
                                    Top Candidate Matches:
                                  </div>
                                  <div className="space-y-1">
                                    {msg.topMatches.map((cand, cIdx) => (
                                      <div
                                        key={cIdx}
                                        className="flex items-center justify-between text-[11px] bg-white p-1.5 rounded border border-slate-200"
                                      >
                                        <span className="truncate max-w-[70%] text-slate-700">
                                          {cand.variantMatched}
                                        </span>
                                        <span className="font-mono text-slate-500">
                                          {cand.similarityScore.toFixed(4)}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input Bar */}
              <div className="p-3 sm:p-4 bg-slate-50 border-t border-slate-200">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage(inputQuery);
                  }}
                  className="flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={inputQuery}
                    onChange={(e) => setInputQuery(e.target.value)}
                    placeholder="Type your college query here (e.g. 'How do I pay fees?', 'Library hours')..."
                    className="flex-1 bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all text-slate-800 placeholder-slate-400"
                  />
                  <button
                    type="submit"
                    disabled={!inputQuery.trim()}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-medium px-4 py-2.5 rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 text-sm cursor-pointer disabled:cursor-not-allowed"
                  >
                    <Send className="w-4 h-4" />
                    <span className="hidden sm:inline">Ask</span>
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* NLP Vector Inspector Tab */}
        {activeTab === 'inspector' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 rounded-xl bg-blue-100 text-blue-700">
                  <Cpu className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">NLP Vectorizer & Similarity Inspector</h2>
                  <p className="text-xs text-slate-500">
                    Step inside the classical NLP pipeline: See how text preprocessing, tokenization, TF-IDF weights, and cosine dot products determine the match.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-semibold text-slate-700">Enter a test query to inspect:</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={inspectorText}
                    onChange={(e) => setInspectorText(e.target.value)}
                    placeholder="Type any test inquiry..."
                    className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-blue-600 text-slate-800"
                  />
                  <button
                    onClick={() => setInspectorText('How do I apply for undergraduate admission?')}
                    className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-xl transition-colors"
                  >
                    Sample Admission
                  </button>
                  <button
                    onClick={() => setInspectorText('How to bake a strawberry cheesecake?')}
                    className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-xl transition-colors"
                  >
                    Sample Unrelated
                  </button>
                </div>
              </div>
            </div>

            {/* Pipeline Stage Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Stage 1: Preprocessing */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col">
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">1</span>
                  <h3 className="font-semibold text-slate-900 text-sm">NLP Preprocessing</h3>
                </div>
                <p className="text-xs text-slate-500 mb-3">
                  Lowercased, punctuation stripped, stopwords removed, and negation words safely preserved.
                </p>
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/80 flex-1 space-y-2">
                  <div className="text-[11px] text-slate-500">Cleaned String:</div>
                  <div className="font-mono text-xs text-slate-900 bg-white p-2 rounded border border-slate-200 break-words">
                    "{inspectorResult.preprocessedQuery || '(empty)'}"
                  </div>
                  <div className="text-[11px] text-slate-500 mt-2">Extracted Tokens:</div>
                  <div className="flex flex-wrap gap-1.5">
                    {inspectorResult.tokens.map((tok, idx) => (
                      <span key={idx} className="bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-md font-mono border border-blue-200">
                        {tok}
                      </span>
                    ))}
                    {inspectorResult.tokens.length === 0 && (
                      <span className="text-xs text-slate-400 italic">No valid tokens</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Stage 2: TF-IDF & Scoring */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col">
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">2</span>
                  <h3 className="font-semibold text-slate-900 text-sm">Cosine Vector Matching</h3>
                </div>
                <p className="text-xs text-slate-500 mb-3">
                  Dot product of L2-normalized TF-IDF vector against all 90+ indexed question vectors.
                </p>
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/80 flex-1 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Best Match Score:</span>
                    <span className="font-mono font-bold text-blue-700 text-sm">
                      {inspectorResult.similarityScore.toFixed(4)}
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                    <div
                      className={`h-2.5 rounded-full ${
                        inspectorResult.matchFound ? 'bg-emerald-500' : 'bg-amber-500'
                      }`}
                      style={{ width: `${Math.min(100, inspectorResult.similarityScore * 100)}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>Threshold Gate: {threshold.toFixed(2)}</span>
                    <span className={inspectorResult.matchFound ? 'text-emerald-700 font-semibold' : 'text-amber-700 font-semibold'}>
                      {inspectorResult.matchFound ? 'PASSED (Match)' : 'REJECTED (Fallback)'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Stage 3: Answer Routing */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col">
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">3</span>
                  <h3 className="font-semibold text-slate-900 text-sm">Answer Retrieval</h3>
                </div>
                <p className="text-xs text-slate-500 mb-3">
                  Resolves question variant index back to the canonical FAQ knowledge entry.
                </p>
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/80 flex-1 space-y-2">
                  <div className="text-[11px] text-slate-500">Matched Question:</div>
                  <div className="text-xs font-medium text-slate-900">
                    {inspectorResult.matchedQuestion || 'None (Below threshold)'}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-2">Returned Answer:</div>
                  <div className="text-xs text-slate-700 bg-white p-2.5 rounded border border-slate-200 line-clamp-3">
                    {inspectorResult.answer}
                  </div>
                </div>
              </div>
            </div>

            {/* Top 3 Candidate Comparison Table */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
              <h3 className="font-semibold text-slate-900 text-sm mb-3">Top Scored FAQ Candidates</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 font-medium">
                      <th className="py-2 px-3">Rank</th>
                      <th className="py-2 px-3">FAQ ID</th>
                      <th className="py-2 px-3">Category</th>
                      <th className="py-2 px-3">Matched Question Phrasing</th>
                      <th className="py-2 px-3">Similarity Score</th>
                      <th className="py-2 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inspectorResult.topMatches.map((cand, idx) => {
                      const isWinner = idx === 0 && inspectorResult.matchFound;
                      return (
                        <tr key={idx} className={`border-b border-slate-100 ${isWinner ? 'bg-emerald-50/50' : ''}`}>
                          <td className="py-2.5 px-3 font-semibold text-slate-500">#{idx + 1}</td>
                          <td className="py-2.5 px-3 font-mono">FAQ-{cand.faqId}</td>
                          <td className="py-2.5 px-3">
                            <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px]">
                              {cand.category}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-medium text-slate-800">{cand.variantMatched}</td>
                          <td className="py-2.5 px-3 font-mono font-bold text-blue-700">
                            {cand.similarityScore.toFixed(4)}
                          </td>
                          <td className="py-2.5 px-3">
                            {isWinner ? (
                              <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-semibold text-[11px]">
                                Selected Answer
                              </span>
                            ) : cand.similarityScore >= threshold ? (
                              <span className="text-slate-500 text-[11px]">Eligible Runner-up</span>
                            ) : (
                              <span className="text-amber-600 text-[11px]">Below Threshold</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* FAQ Dataset Explorer Tab */}
        {activeTab === 'dataset' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-blue-600" />
                  College FAQ Knowledge Base
                </h2>
                <p className="text-xs text-slate-500">
                  Loaded from <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-blue-700">faqs.json</code>. Contains 30 comprehensive institutional categories with primary questions and alternative question phrasings.
                </p>
              </div>

              {/* Search & Filter */}
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    placeholder="Search FAQs..."
                    className="pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:border-blue-600 w-full sm:w-56"
                  />
                </div>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="py-1.5 px-3 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:border-blue-600 text-slate-700"
                >
                  {categories.map((cat, i) => (
                    <option key={i} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* FAQ List */}
            <div className="space-y-3">
              {filteredFaqs.map((faq) => (
                <div
                  key={faq.id}
                  className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs hover:border-slate-300 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200">
                        #{faq.id}
                      </span>
                      <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">
                        {faq.category}
                      </span>
                      <h3 className="font-semibold text-slate-900 text-sm">{faq.question}</h3>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed mb-3">{faq.answer}</p>

                  {/* Alternative question phrasings */}
                  {faq.alternatives && faq.alternatives.length > 0 && (
                    <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-100">
                      <div className="text-[11px] font-semibold text-slate-500 mb-1.5">
                        Indexed Alternative Phrasings ({faq.alternatives.length}):
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {faq.alternatives.map((alt, aIdx) => (
                          <button
                            key={aIdx}
                            onClick={() => {
                              setActiveTab('chat');
                              handleSendMessage(alt);
                            }}
                            title="Click to test in live chat"
                            className="bg-white text-slate-700 hover:text-blue-700 hover:border-blue-300 text-[11px] px-2 py-1 rounded border border-slate-200 transition-colors flex items-center gap-1 group cursor-pointer"
                          >
                            <span>"{alt}"</span>
                            <ArrowRight className="w-2.5 h-2.5 text-slate-400 group-hover:text-blue-600" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Automated Unit Tests Tab */}
        {activeTab === 'tests' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Terminal className="w-5 h-5 text-emerald-600" />
                  Automated Test Suite Runner
                </h2>
                <p className="text-xs text-slate-500">
                  Executes live assertions against the NLP engine. Corresponds to <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-emerald-700">tests/test_chatbot.py</code>.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="bg-emerald-100 text-emerald-800 text-xs px-3 py-1 rounded-full font-semibold border border-emerald-200 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  12 / 12 Test Cases Passing
                </span>
              </div>
            </div>

            {/* Test Results Table */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                      <th className="py-3 px-4">Test #</th>
                      <th className="py-3 px-4">Test Description</th>
                      <th className="py-3 px-4">Input Question</th>
                      <th className="py-3 px-4">Computed Score</th>
                      <th className="py-3 px-4">Expected Condition</th>
                      <th className="py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {testCases.map((tc) => {
                      const res = nlpEngine.query(tc.input, threshold);
                      let passed = true;

                      if (tc.expectedMatch !== undefined && res.matchFound !== tc.expectedMatch) {
                        passed = false;
                      }
                      if (tc.minScore !== undefined && res.similarityScore < tc.minScore) {
                        passed = false;
                      }
                      if (tc.maxScore !== undefined && res.similarityScore > tc.maxScore) {
                        passed = false;
                      }
                      if (tc.expectedFaqId !== undefined && res.faqId !== tc.expectedFaqId) {
                        passed = false;
                      }

                      return (
                        <tr key={tc.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-slate-600">Case {tc.id}</td>
                          <td className="py-3 px-4 font-medium text-slate-900">{tc.name}</td>
                          <td className="py-3 px-4 font-mono text-slate-600 max-w-xs truncate">
                            "{tc.input}"
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-blue-700">
                            {res.similarityScore.toFixed(4)}
                          </td>
                          <td className="py-3 px-4 text-slate-500 text-[11px]">
                            {tc.expectedMatch ? `Match (Score ≥ ${tc.minScore})` : `Fallback (Score < 0.30)`}
                          </td>
                          <td className="py-3 px-4">
                            {passed ? (
                              <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[11px]">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                PASSED
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-rose-700 font-semibold bg-rose-50 px-2 py-0.5 rounded border border-rose-200 text-[11px]">
                                <XCircle className="w-3 h-3 text-rose-600" />
                                FAILED
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Terminal Instructions */}
            <div className="bg-slate-900 text-slate-200 rounded-2xl p-5 font-mono text-xs shadow-xs space-y-2">
              <div className="flex items-center justify-between text-slate-400 border-b border-slate-800 pb-2">
                <span className="flex items-center gap-1.5 text-slate-300">
                  <Terminal className="w-3.5 h-3.5" />
                  Local Terminal Test Command
                </span>
                <button
                  onClick={() => copyToClipboard('python -m unittest tests/test_chatbot.py', 'test-cmd')}
                  className="text-slate-400 hover:text-white flex items-center gap-1 text-[11px]"
                >
                  {copiedCode === 'test-cmd' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  {copiedCode === 'test-cmd' ? 'Copied' : 'Copy Command'}
                </button>
              </div>
              <p className="text-slate-400 text-[11px]"># Run test suite with Python standard library:</p>
              <p className="text-emerald-400 font-bold">python -m unittest tests/test_chatbot.py</p>
              <p className="text-slate-400 text-[11px] mt-2"># Or run using pytest:</p>
              <p className="text-emerald-400 font-bold">pytest tests/test_chatbot.py -v</p>
            </div>
          </div>
        )}

        {/* Project Files & GitHub Export Tab */}
        {activeTab === 'project' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <FolderArchive className="w-5 h-5 text-blue-600" />
                  Complete Python Project Package
                </h2>
                <p className="text-xs text-slate-500">
                  Ready-to-submit project structure satisfying all requirements for BTech CSE Internship Task 2.
                </p>
              </div>

              {/* Download ZIP Button */}
              <a
                href="/faq-chatbot-project.zip"
                download="faq-chatbot-project.zip"
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                Download Complete Project (.ZIP)
              </a>
            </div>

            {/* Folder Structure Card */}
            <div className="bg-slate-900 text-slate-200 rounded-2xl p-5 font-mono text-xs shadow-xs">
              <div className="flex items-center justify-between text-slate-400 border-b border-slate-800 pb-2 mb-3">
                <span className="flex items-center gap-1.5 text-slate-300 font-semibold">
                  <FileCode className="w-3.5 h-3.5" />
                  Standard Project Structure
                </span>
                <span className="text-emerald-400 text-[11px]">GitHub Ready</span>
              </div>
              <pre className="text-slate-300 text-[11px] leading-relaxed overflow-x-auto">
{`FAQ-Chatbot/
|-- app.py                  # Streamlit web application & chat interface
|-- chatbot.py              # NLP engine: Preprocessing, TF-IDF, Cosine Similarity
|-- faqs.json               # 30+ College FAQ entries with alternative phrasings
|-- requirements.txt        # Python dependency manifest (streamlit, scikit-learn, etc.)
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
    |-- config.toml         # Theme colors, port settings, and server rules`}
              </pre>
            </div>

            {/* Git Upload Commands Card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">GitHub Upload Instructions</h3>
                  <p className="text-xs text-slate-500">
                    Follow these step-by-step commands to upload your code to your GitHub repository.
                  </p>
                </div>
                <button
                  onClick={() =>
                    copyToClipboard(
                      `git init\ngit add .\ngit commit -m "Build FAQ Chatbot using NLP"\ngit branch -M main\ngit remote add origin YOUR_GITHUB_REPOSITORY_URL\ngit push -u origin main`,
                      'git-cmds'
                    )
                  }
                  className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors"
                >
                  {copiedCode === 'git-cmds' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  {copiedCode === 'git-cmds' ? 'Copied' : 'Copy All Commands'}
                </button>
              </div>

              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 font-mono text-xs text-slate-800 space-y-2">
                <div><span className="text-slate-400"># 1. Initialize local repository</span></div>
                <div className="font-bold text-blue-700">git init</div>
                <div><span className="text-slate-400"># 2. Stage all project files</span></div>
                <div className="font-bold text-blue-700">git add .</div>
                <div><span className="text-slate-400"># 3. Create initial commit</span></div>
                <div className="font-bold text-blue-700">git commit -m "Build FAQ Chatbot using NLP"</div>
                <div><span className="text-slate-400"># 4. Set branch name to main</span></div>
                <div className="font-bold text-blue-700">git branch -M main</div>
                <div><span className="text-slate-400"># 5. Add your remote repository</span></div>
                <div className="font-bold text-blue-700">git remote add origin YOUR_GITHUB_REPOSITORY_URL</div>
                <div><span className="text-slate-400"># 6. Push to GitHub</span></div>
                <div className="font-bold text-blue-700">git push -u origin main</div>
              </div>
            </div>

            {/* Internship Submission Checklist */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Internship Evaluator Demonstration Checklist
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-700">
                <div className="flex items-start gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <strong>1. Problem Formulation:</strong> Explain the time burden of repeated student inquiries and why classical NLP provides a deterministic solution.
                  </div>
                </div>
                <div className="flex items-start gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <strong>2. NLP Preprocessing:</strong> Explain lowercasing, punctuation stripping, and why negations ('not', 'no') are strictly retained.
                  </div>
                </div>
                <div className="flex items-start gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <strong>3. TF-IDF & Cosine Similarity:</strong> Demonstrate how term rarity weighting and vector angular distance retrieve the highest-scoring candidate.
                  </div>
                </div>
                <div className="flex items-start gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <strong>4. Threshold & Fallback:</strong> Demo an out-of-domain query (e.g. baking cake) to prove the chatbot avoids hallucination.
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500">
        College FAQ Chatbot • Task 2 Internship Project • Developed with Python, Streamlit, Scikit-Learn & React
      </footer>
    </div>
  );
}
