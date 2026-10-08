import { useState, useRef, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Send,
  Mic,
  Sparkles,
  User,
  Bot,
  MapPin,
  RotateCcw,
  CheckCircle2,
  Droplets,
  HelpCircle,
  Code,
  Info,
  Globe,
  Gauge,
} from "lucide-react";
import { useGroundwater } from "../context/GroundwaterContext";
import { api } from "../api/mockClient";
import { getAdvisor, resolveBlockLocation, askAdvisorChat } from "../api/apiClient";
import { BLOCKS_DATA, ADVISOR_SUGGESTED_QUESTIONS } from "../data/mockData";
import PageContainer from "../components/layout/PageContainer";
import RiskBadge from "../components/common/RiskBadge";
import Button from "../components/common/Button";

/**
 * JalDrishti Advisor Page (/advisor)
 * 
 * Clean AI chat interface providing tailored groundwater & irrigation guidance.
 * Displays:
 * - Header: "JalDrishti Advisor"
 * - Subtitle: "Groundwater and irrigation guidance based on available data."
 * - Language selector: English / हिंदी / ਪੰਜਾਬੀ
 * - Suggested question chips:
 *   1. "Should I change my crop?"
 *   2. "Why is groundwater declining?"
 *   3. "What is the current risk?"
 *   4. "How can I reduce irrigation demand?"
 * - User & Assistant message bubbles
 * - Assistant response displays: recommendation, supporting groundwater number, risk level, short explanation
 * - Input field, Send button, Microphone icon (UI only)
 * - Small notice: "Advice is based on available groundwater estimates and assumptions."
 * - Prepared for future POST /advisor integration.
 */
export default function AdvisorChat() {
  const [searchParams] = useSearchParams();
  const { blocks, selectedBlockId } = useGroundwater();

  // All blocks
  const allBlocks = useMemo(() => (blocks?.length ? blocks : BLOCKS_DATA), [blocks]);

  // Read URL query params or defaults
  const queryBlockId = searchParams.get("blockId") || selectedBlockId || "PB-TLW-01";
  const [activeBlockId, setActiveBlockId] = useState(queryBlockId);

  // Active block
  const activeBlock = useMemo(() => {
    return (
      allBlocks.find((b) => b.id.toLowerCase() === activeBlockId.toLowerCase()) ||
      allBlocks[0]
    );
  }, [allBlocks, activeBlockId]);

  // Language selector state: "English" | "हिंदी" | "ਪੰਜਾਬੀ"
  const [language, setLanguage] = useState("English");

  // Input & message states
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [micNotice, setMicNotice] = useState(false);
  const [showApiContract, setShowApiContract] = useState(false);
  const messagesEndRef = useRef(null);

  // Suggested questions localized based on language
  const localizedQuestions = useMemo(() => {
    return ADVISOR_SUGGESTED_QUESTIONS.map((item) => {
      if (language === "हिंदी") return { id: item.id, text: item.hi, queryText: item.hi };
      if (language === "ਪੰਜਾਬੀ") return { id: item.id, text: item.pa, queryText: item.pa };
      return { id: item.id, text: item.en, queryText: item.en };
    });
  }, [language]);

  // Initial greeting message depending on selected language
  const getInitialMessage = (lang, block) => {
    if (lang === "हिंदी") {
      return {
        id: `init-${Date.now()}`,
        sender: "bot",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        content: {
          recommendation: `अटल भूजल योजना व फसल विविधीकरण दिशा-निर्देशों के अनुसार ${block.name} के लिए जल संरक्षण योजना तैयार करें।`,
          groundwaterNumber: `वर्तमान जलस्तर: ${block.currentDepthMeters} मी. bgl | वार्षिक गिरावट: ${block.depthTrendMetersPerYear} मी/वर्ष | दोहन स्तर: ${block.stageOfExtraction}%`,
          riskLevel: block.riskLevel || "Critical",
          explanation: `नमस्ते! मैं जलदृष्टि एडवाइजर हूँ। आप ${block.name} (${block.district}, ${block.state}) के लिए फसल परिवर्तन, गिरते भूजल स्तर या सरकारी सब्सिडी पर प्रश्न पूछ सकते हैं।`,
          apiContract: {
            endpoint: "POST /api/advisor/chat",
            requestPayload: {
              query: "Initial greeting",
              language: "हिंदी",
              state: block.state,
              district: block.district,
              block: block.name,
            },
          },
        },
      };
    }
    if (lang === "ਪੰਜਾਬੀ") {
      return {
        id: `init-${Date.now()}`,
        sender: "bot",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        content: {
          recommendation: `ਅਟਲ ਭੂਜਲ ਯੋਜਨਾ ਅਧੀਨ ${block.name} ਲਈ ਤੁਪਕਾ ਸਿੰਚਾਈ ਅਤੇ ਫ਼ਸਲੀ ਵਿਭਿੰਨਤਾ ਯੋਜਨਾ ਲਾਗੂ ਕਰੋ।`,
          groundwaterNumber: `ਪਾਣੀ ਦਾ ਪੱਧਰ: ${block.currentDepthMeters} ਮੀਟਰ | ਸਾਲਾਨਾ ਗਿਰਾਵਟ: ${block.depthTrendMetersPerYear} ਮੀਟਰ/ਸਾਲ | ਨਿਕਾਸੀ: ${block.stageOfExtraction}%`,
          riskLevel: block.riskLevel || "Critical",
          explanation: `ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ! ਮੈਂ ਜਲਦ੍ਰਿਸ਼ਟੀ ਸਲਾਹਕਾਰ ਹਾਂ। ਤੁਸੀਂ ${block.name} (${block.district}, ਪੰਜਾਬ) ਲਈ ਫ਼ਸਲ ਬਦਲਣ, ਡਿੱਗ ਰਹੇ ਪਾਣੀ ਦੇ ਪੱਧਰ ਜਾਂ ਸਬਸਿਡੀਆਂ ਬਾਰੇ ਸਵਾਲ ਪੁੱਛ ਸਕਦੇ ਹੋ।`,
          apiContract: {
            endpoint: "POST /api/advisor/chat",
            requestPayload: {
              query: "Initial greeting",
              language: "ਪੰਜਾਬੀ",
              state: block.state,
              district: block.district,
              block: block.name,
            },
          },
        },
      };
    }
    return {
      id: `init-${Date.now()}`,
      sender: "bot",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      content: {
        recommendation: `Formulate a sustainable demand-side water security plan for ${block.name} following PMKSY and Atal Bhujal Yojana norms.`,
        groundwaterNumber: `Current Depth: ${block.currentDepthMeters} m bgl | Annual Drawdown: ${block.depthTrendMetersPerYear} m/yr | Stage of Extraction: ${block.stageOfExtraction}%`,
        riskLevel: block.riskLevel || "Critical",
        explanation: `Welcome! I am the JalDrishti Agro-Hydrological Advisor. Ask me anything about crop diversification, tubewell drawdown, or irrigation demand reduction in ${block.name} (${block.district}, ${block.state}).`,
        apiContract: {
          endpoint: "POST /api/advisor/chat",
          requestPayload: {
            query: "Initial greeting",
            language: "English",
            state: block.state,
            district: block.district,
            block: block.name,
          },
        },
      },
    };
  };

  // Chat message thread
  const [messages, setMessages] = useState(() => [getInitialMessage(language, activeBlock)]);

  // Scroll to bottom on new messages or typing state change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // When block or language changes, optionally add a system notice or reset thread
  const handleLanguageChange = (newLang) => {
    setLanguage(newLang);
    // Append or reset with initial greeting in that language
    setMessages([getInitialMessage(newLang, activeBlock)]);
  };

  const handleBlockChange = (newBlockId) => {
    setActiveBlockId(newBlockId);
    const targetBlock = allBlocks.find((b) => b.id === newBlockId) || activeBlock;
    setMessages([getInitialMessage(language, targetBlock)]);
  };

  // Clear thread
  const resetChat = () => {
    setMessages([getInitialMessage(language, activeBlock)]);
  };

  /**
   * Dispatches query to backend Advisor Conversational API:
   * POST /api/advisor/chat
   * Grounded in real JalDrishti CGWB telemetry, crops, canals, and multi-turn context.
   */
  const handleSend = async (queryText) => {
    const text = queryText || inputMessage;
    if (!text || !text.trim() || isTyping) return;

    const userMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      text: text.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setIsTyping(true);

    try {
      const loc = resolveBlockLocation(activeBlock?.id, allBlocks);
      const reqState = loc.state || activeBlock.state || "Punjab";
      const reqDistrict = loc.district || activeBlock.district || "Bathinda";
      const reqBlock = loc.block || activeBlock.name || "Talwandi Sabo";

      // Formulate multi-turn conversation history from prior messages
      const conversationHistory = messages
        .filter((m) => m && (m.text || m.content))
        .map((m) => ({
          sender: m.sender,
          text:
            m.sender === "user"
              ? m.text || ""
              : m.content?.explanation || m.content?.recommendation || m.text || "",
        }))
        .filter((m) => Boolean(m.text && m.text.trim()));

      const chatPayload = {
        query: text.trim(),
        state: reqState,
        district: reqDistrict,
        block: reqBlock,
        language,
        messages: conversationHistory,
      };

      const botResponse = await askAdvisorChat(chatPayload);

      const botMessage = {
        id: `bot-${Date.now()}`,
        sender: "bot",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        content: botResponse,
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (err) {
      console.error("Advisor error:", err);
      // Fallback message in selected language
      const fallbackByLang = {
        हिंदी: {
          recommendation: "तात्कालिक मार्गदर्शन के लिए स्थानीय कृषि विज्ञान केंद्र (KVK) से संपर्क करें।",
          groundwaterNumber: `वर्तमान जलस्तर: ${activeBlock.currentDepthMeters} m bgl`,
          riskLevel: activeBlock.riskLevel,
          explanation: "सलाहकार मॉडल प्रतिक्रिया प्राप्त नहीं कर सका। कृपया पुनः प्रयास करें।",
        },
        ਪੰਜਾਬੀ: {
          recommendation: "ਤੁਰੰਤ ਮਾਰਗਦਰਸ਼ਨ ਲਈ ਸਥਾਨਕ ਕ੍ਰਿਸ਼ੀ ਵਿਗਿਆਨ ਕੇਂਦਰ (KVK) ਨਾਲ ਸੰਪਰਕ ਕਰੋ।",
          groundwaterNumber: `ਪਾਣੀ ਦਾ ਪੱਧਰ: ${activeBlock.currentDepthMeters} m bgl`,
          riskLevel: activeBlock.riskLevel,
          explanation: "ਸਲਾਹਕਾਰ ਜਵਾਬ ਪ੍ਰਾਪਤ ਨਹੀਂ ਕਰ ਸਕਿਆ। ਕਿਰਪਾ ਕਰਕੇ ਦੁਬਾਰਾ ਕੋਸ਼ਿਸ਼ ਕਰੋ।",
        },
        English: {
          recommendation: "Consult local Krishi Vigyan Kendra (KVK) for immediate localized guidance.",
          groundwaterNumber: `Current Depth: ${activeBlock.currentDepthMeters} m bgl`,
          riskLevel: activeBlock.riskLevel,
          explanation: "Could not retrieve advisory model response. Please check scenario parameters or try again.",
        },
      };

      setMessages((prev) => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          sender: "bot",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          content: fallbackByLang[language] || fallbackByLang.English,
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  // Mic click handler (UI only)
  const handleMicClick = () => {
    setMicNotice(true);
    setTimeout(() => {
      setMicNotice(false);
    }, 3500);
  };

  // Dynamic placeholders
  const inputPlaceholder = {
    English: `Ask about crops, groundwater risk, or irrigation in ${activeBlock.name}...`,
    हिंदी: `${activeBlock.name} में फसलों, भूजल जोखिम या सिंचाई के बारे में पूछें...`,
    ਪੰਜਾਬੀ: `${activeBlock.name} ਵਿੱਚ ਫ਼ਸਲਾਂ, ਪਾਣੀ ਦੇ ਜੋਖਮ ਜਾਂ ਸਿੰਚਾਈ ਬਾਰੇ ਪੁੱਛੋ...`,
  }[language] || `Ask about crops, groundwater risk, or irrigation in ${activeBlock.name}...`;

  return (
    <PageContainer
      title="JalDrishti Advisor"
      subtitle="Groundwater and irrigation guidance based on available data."
      badge={
        <span className="px-2.5 py-1 text-xs font-bold rounded-md bg-teal-50 text-[#0d9488] border border-teal-200">
          AI Advisory Engine
        </span>
      }
      actions={
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Target Block Selector */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-300 rounded-md px-2 py-1 shadow-2xs">
            <MapPin size={13} className="text-[#0d9488]" />
            <span className="text-xs text-slate-500 font-semibold">Block:</span>
            <select
              aria-label="Active block for advisor consultation"
              value={activeBlockId}
              onChange={(e) => handleBlockChange(e.target.value)}
              className="text-xs font-bold text-[#0f2942] bg-white border border-slate-300 rounded px-2 py-0.5 focus:outline-hidden cursor-pointer"
            >
              {allBlocks.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.state}) &bull; {b.riskLevel}
                </option>
              ))}
            </select>
          </div>

          {/* Reset Thread Action */}
          <button
            type="button"
            onClick={resetChat}
            className="text-xs text-slate-600 hover:text-[#0f2942] bg-white border border-slate-300 hover:border-slate-400 rounded-md px-2.5 py-1.5 flex items-center gap-1 font-semibold transition-colors shadow-2xs cursor-pointer"
            title="Reset conversation thread"
          >
            <RotateCcw size={12} />
            <span>Clear</span>
          </button>
        </div>
      }
    >
      <div className="max-w-4xl mx-auto space-y-4">
        {/* Top Header Card: Language Selector & Block Status */}
        <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-2xs flex flex-wrap items-center justify-between gap-3">
          {/* Language Selector */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-xs font-bold text-slate-700">
              <Globe size={14} className="text-[#0d9488]" />
              <span>Language:</span>
            </div>
            <div className="inline-flex rounded-md border border-slate-300 bg-slate-50 p-0.5">
              {[
                { code: "English", label: "English" },
                { code: "हिंदी", label: "हिंदी" },
                { code: "ਪੰਜਾਬੀ", label: "ਪੰਜਾਬੀ" },
              ].map((lang) => (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => handleLanguageChange(lang.code)}
                  className={`px-3 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                    language === lang.code
                      ? "bg-[#0f2942] text-white shadow-2xs"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                  }`}
                >
                  {lang.label}
                </button>
              ))}
            </div>
          </div>

          {/* Active Context Indicators */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500 font-medium">Active Zone:</span>
            <span className="font-bold text-[#0f2942]">
              {activeBlock.name}, {activeBlock.district}
            </span>
            <RiskBadge level={activeBlock.riskLevel} size="sm" />
          </div>
        </div>

        {/* Suggested Question Chips */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-slate-500 px-1">
            <span className="font-semibold flex items-center gap-1 text-slate-600">
              <HelpCircle size={13} className="text-[#0d9488]" />
              Suggested Questions:
            </span>
            <span className="text-[11px] text-slate-400">Click any chip to consult the model</span>
          </div>

          <div className="flex flex-wrap gap-2">
            {localizedQuestions.map((q) => (
              <button
                key={q.id}
                type="button"
                onClick={() => handleSend(q.queryText)}
                className="text-xs font-semibold text-slate-700 hover:text-[#0f2942] bg-white hover:bg-teal-50/50 border border-slate-300 hover:border-teal-400 rounded-full px-3.5 py-1.5 transition-all shadow-2xs hover:shadow-xs cursor-pointer flex items-center gap-1.5 group"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#0d9488] group-hover:scale-125 transition-transform"></span>
                <span>"{q.text}"</span>
              </button>
            ))}
          </div>
        </div>

        {/* Chat Thread Container */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 sm:p-6 min-h-[460px] max-h-[580px] overflow-y-auto space-y-4 shadow-inner">
          {messages.map((msg) => {
            // USER MESSAGE BUBBLE
            if (msg.sender === "user") {
              return (
                <div key={msg.id} className="flex justify-end items-start gap-2.5">
                  <div className="max-w-xl bg-[#0f2942] text-white rounded-2xl rounded-tr-xs px-4 py-3 shadow-xs text-xs sm:text-sm">
                    <div className="flex items-center justify-between gap-4 mb-1 border-b border-blue-900/60 pb-1 text-[11px] text-slate-300">
                      <span className="font-semibold">Agricultural Planner</span>
                      <span className="font-mono">{msg.timestamp}</span>
                    </div>
                    <p className="leading-relaxed font-normal">{msg.text}</p>
                  </div>
                  <div
                    className="w-8 h-8 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center text-slate-700 shrink-0 mt-0.5 shadow-2xs"
                    aria-label="User Avatar"
                  >
                    <User size={15} />
                  </div>
                </div>
              );
            }

            // ASSISTANT MESSAGE BUBBLE
            const { content } = msg;
            return (
              <div key={msg.id} className="flex justify-start items-start gap-2.5">
                <div
                  className="w-8 h-8 rounded-full bg-[#0d9488] text-white flex items-center justify-center shrink-0 shadow-xs mt-1"
                  aria-label="JalDrishti Bot Avatar"
                >
                  <Bot size={17} />
                </div>

                <div className="max-w-2xl bg-white border border-slate-200 rounded-2xl rounded-tl-xs p-4 sm:p-5 shadow-xs space-y-3.5 text-xs sm:text-sm">
                  {/* Bot Header with Risk Badge */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
                    <div className="flex items-center gap-1.5">
                      <Sparkles size={14} className="text-[#0d9488]" />
                      <span className="font-bold text-[#0f2942] text-xs sm:text-sm">
                        JalDrishti Agro-Hydrological Advisory
                      </span>
                    </div>
                    {content.riskLevel && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                          Risk Level:
                        </span>
                        <RiskBadge level={content.riskLevel} size="sm" />
                      </div>
                    )}
                  </div>

                  {/* 1. RECOMMENDATION CARD */}
                  {content.recommendation && (
                    <div className="p-3 bg-teal-50/70 border border-teal-200/80 rounded-lg space-y-1">
                      <div className="flex items-center gap-1.5 text-[#0d9488] font-bold text-xs uppercase tracking-wider">
                        <CheckCircle2 size={14} className="text-[#0d9488] shrink-0" />
                        <span>Recommendation:</span>
                      </div>
                      <p className="font-bold text-[#0f2942] text-xs sm:text-sm leading-relaxed pl-5">
                        {content.recommendation}
                      </p>
                    </div>
                  )}

                  {/* 2. SUPPORTING GROUNDWATER NUMBER */}
                  {content.groundwaterNumber && (
                    <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                      <div className="flex items-center gap-1.5 text-slate-500 font-bold text-[11px] uppercase tracking-wider">
                        <Droplets size={13} className="text-[#0f2942] shrink-0" />
                        <span>Supporting Groundwater Data:</span>
                      </div>
                      <p className="font-mono font-bold text-slate-800 text-xs sm:text-[13px] pl-5 bg-white py-1 px-2 rounded border border-slate-200/80 w-max max-w-full overflow-x-auto">
                        {content.groundwaterNumber}
                      </p>
                    </div>
                  )}

                  {/* 3. SHORT EXPLANATION */}
                  {content.explanation && (
                    <div className="space-y-1 pt-0.5">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                        Short Explanation:
                      </span>
                      <p className="text-slate-700 leading-relaxed text-xs sm:text-sm">
                        {content.explanation}
                      </p>
                    </div>
                  )}

                  {/* Metadata and Timestamp */}
                  <div className="text-[10px] text-slate-400 pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                    <span>Source: CGWB Groundwater Dynamic Model & PMKSY Norms</span>
                    <span className="font-mono">{msg.timestamp}</span>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex items-center gap-2.5 text-slate-500 text-xs p-3 bg-white border border-slate-200 rounded-xl w-max shadow-xs">
              <Sparkles size={14} className="text-[#0d9488] animate-spin" />
              <span>Evaluating aquifer balance and policy incentives...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Microphone Notice Toast (UI only feedback) */}
        {micNotice && (
          <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 flex items-center justify-between gap-2 animate-fade-in">
            <span className="flex items-center gap-1.5">
              <Info size={14} className="text-amber-600 shrink-0" />
              <strong>Voice input is a demo UI feature.</strong> Please select a suggested question chip or type in the input field.
            </span>
            <button
              type="button"
              onClick={() => setMicNotice(false)}
              className="text-amber-700 hover:text-amber-900 font-bold px-1"
            >
              ✕
            </button>
          </div>
        )}

        {/* Input Bar & Controls */}
        <div className="space-y-2">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2 bg-white p-2 border border-slate-300 rounded-xl shadow-xs focus-within:ring-2 focus-within:ring-[#0d9488] focus-within:border-[#0d9488] transition-all"
          >
            {/* Input Field */}
            <input
              type="text"
              aria-label="Type your groundwater or irrigation question"
              placeholder={inputPlaceholder}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              disabled={isTyping}
              className="flex-1 px-3 py-2 text-xs sm:text-sm text-slate-800 bg-transparent focus:outline-hidden"
            />

            {/* Microphone Icon Button (UI ONLY) */}
            <button
              type="button"
              onClick={handleMicClick}
              title="Voice input (UI demo only)"
              aria-label="Activate voice input (UI demo only)"
              className="p-2 text-slate-400 hover:text-[#0f2942] hover:bg-slate-100 rounded-lg transition-colors cursor-pointer shrink-0"
            >
              <Mic size={18} />
            </button>

            {/* Send Button */}
            <Button
              type="submit"
              variant="primary"
              size="md"
              icon={Send}
              disabled={!inputMessage.trim() || isTyping}
              className="font-bold shrink-0 bg-[#0f2942] hover:bg-[#163b5e]"
            >
              Send
            </Button>
          </form>

          {/* Small Mandatory Notice */}
          <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 px-2 gap-2">
            <p className="flex items-center gap-1">
              <Info size={12} className="text-[#0d9488] shrink-0" />
              <span>
                <strong>Notice:</strong> Advice is based on available groundwater estimates and assumptions.
              </span>
            </p>

            {/* Toggle Backend API Contract Preview */}
            <button
              type="button"
              onClick={() => setShowApiContract(!showApiContract)}
              className="text-slate-500 hover:text-[#0f2942] underline cursor-pointer flex items-center gap-1 font-medium"
            >
              <Code size={12} />
              <span>{showApiContract ? "Hide API Contract" : "API: POST /api/advisor/chat"}</span>
            </button>
          </div>

          {/* Collapsible API Contract Payload Preview */}
          {showApiContract && (
            <div className="bg-slate-900 text-slate-200 rounded-lg p-3 text-xs font-mono space-y-1.5 border border-slate-800">
              <div className="flex items-center justify-between text-slate-400 pb-1 border-b border-slate-800">
                <span className="text-emerald-400 font-bold">FastAPI Conversational Contract</span>
                <span>Active: POST /api/advisor/chat</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Incoming queries dispatch with the following schema:
              </p>
              <pre className="text-emerald-300 text-[11px] overflow-x-auto pt-1">
{JSON.stringify(
  {
    endpoint: "POST /api/advisor/chat",
    headers: { "Content-Type": "application/json" },
    payload: {
      query: inputMessage.trim() || "Should I change my crop?",
      state: activeBlock.state,
      district: activeBlock.district,
      block: activeBlock.name,
      language,
      messages: "[ChatMessageModel(sender, text), ...]",
    },
  },
  null,
  2
)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </PageContainer>
  );
}
