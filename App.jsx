import { useState, useEffect } from "react";

const PLATFORMS = [
  {
    id: "twitter",
    label: "X / Twitter Thread",
    icon: "𝕏",
    color: "#00ff9d",
    description: "Multi-post thread optimised for virality",
  },
  {
    id: "linkedin",
    label: "LinkedIn Post",
    icon: "in",
    color: "#4fc3f7",
    description: "Professional long-form for security analysts",
  },
  {
    id: "substack",
    label: "Substack Note",
    icon: "S",
    color: "#ff8c42",
    description: "Short note to drive newsletter opens",
  },
  {
    id: "whatsapp",
    label: "WhatsApp Broadcast",
    icon: "W",
    color: "#a8d8a8",
    description: "Swahili & English broadcast message",
  },
];

const SYSTEM_PROMPT = `You are a specialist social media strategist for Ujasusi Blog — a premier intelligence analysis newsletter covering African security affairs, espionage, intelligence services, and geopolitics, run by a former Tanzania Intelligence and Security Service (TISS) officer.

Your task: Transform the provided article content into viral, platform-specific social media posts.

UJASUSI BLOG BRAND VOICE:
- Authoritative, insider-sounding, analytical
- Urgent but measured — like a declassified brief
- Appeals to: policy professionals, journalists, academics, security enthusiasts, Tanzanian diaspora, East Africa watchers
- Hashtags to use where appropriate: #Ujasusi #AfricanIntelligence #EastAfrica #Tanzania #Espionage #OSINT #SecurityAfrica #Intelligence

PLATFORM RULES:
- X/Twitter Thread: Start with a jaw-dropping hook tweet (max 280 chars). Then 4-6 follow-up tweets numbered 2/, 3/ etc. End with CTA to subscribe to Ujasusi Blog. Use emojis strategically. Each tweet separated by "---"
- LinkedIn Post: Open with a bold statement. Use short paragraphs. Include 3 key analytical takeaways. End with a thought-provoking question. Professional hashtags. No fluff.
- Substack Note: 2-3 punchy sentences max. Creates curiosity gap. Ends with "Read the full brief →"
- WhatsApp Broadcast: Bilingual (English then Swahili). Informal but credible. Brief summary + link prompt. Use relevant emojis.

Always make the intelligence angle the HOOK. Reference specific countries, agencies, or operations when present in the article. Never be vague when you can be specific.

Respond ONLY with a JSON object, no markdown fences, in this exact format:
{
  "twitter": "tweet 1 content---tweet 2 content---tweet 3 content",
  "linkedin": "full linkedin post text",
  "substack": "substack note text",
  "whatsapp": "whatsapp message text",
  "suggested_hashtags": ["tag1", "tag2"],
  "viral_score": 85,
  "hook_analysis": "One sentence explaining why this will perform well"
}`;

export default function UjasusiViralGenerator() {
  const [apiKey, setApiKey] = useState(() => sessionStorage.getItem("ujasusi_key") || "");
  const [showKey, setShowKey] = useState(false);
  const [keyConfirmed, setKeyConfirmed] = useState(() => !!sessionStorage.getItem("ujasusi_key"));
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [activePlatform, setActivePlatform] = useState("twitter");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(null);
  const [scanLine, setScanLine] = useState(0);
  const [glitch, setGlitch] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => setScanLine((p) => (p + 1) % 100), 50);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (loading) {
      const g = setInterval(() => {
        setGlitch(true);
        setTimeout(() => setGlitch(false), 100);
      }, 2000);
      return () => clearInterval(g);
    }
  }, [loading]);

  const confirmKey = () => {
    if (apiKey.startsWith("sk-ant-")) {
      sessionStorage.setItem("ujasusi_key", apiKey);
      setKeyConfirmed(true);
      setError(null);
    } else {
      setError("Invalid key format. Anthropic API keys begin with sk-ant-");
    }
  };

  const generatePosts = async () => {
    if (!content.trim() || !apiKey) return;
    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
        },
        body: JSON.stringify({
          model: "claude-opus-4-5",
          max_tokens: 1500,
          system: SYSTEM_PROMPT,
          messages: [
            {
              role: "user",
              content: `ARTICLE TITLE: ${title || "Untitled"}\n\nARTICLE CONTENT:\n${content}\n\nGenerate viral social media posts for all four platforms as specified.`,
            },
          ],
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error?.message || `HTTP ${response.status}`);
      }

      const data = await response.json();
      const raw = data.content?.find((b) => b.type === "text")?.text || "";
      const clean = raw.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      setResults(parsed);
      setActivePlatform("twitter");
    } catch (err) {
      setError("SIGNAL LOST — " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const getActivePlatformContent = () => {
    if (!results) return "";
    const raw = results[activePlatform] || "";
    if (activePlatform === "twitter") {
      return raw.split("---").join("\n\n─────────────────\n\n");
    }
    return raw;
  };

  const handleCopy = () => {
    const raw = results?.[activePlatform] || "";
    const text = activePlatform === "twitter" ? raw.split("---").join("\n\n") : raw;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const activePlatformData = PLATFORMS.find((p) => p.id === activePlatform);

  const inputStyle = {
    width: "100%",
    boxSizing: "border-box",
    background: "rgba(0,30,0,0.8)",
    border: "1px solid #1a4a1a",
    color: "#c8ffc8",
    padding: "10px 12px",
    fontFamily: "'Courier New', monospace",
    fontSize: 13,
    outline: "none",
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#050a05",
      fontFamily: "'Courier New', monospace",
      color: "#c8ffc8",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Scanline */}
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none", zIndex: 50,
        background: `linear-gradient(transparent ${scanLine}%, rgba(0,255,80,0.015) ${scanLine + 1}%, transparent ${scanLine + 2}%)`,
      }} />
      {/* Grid */}
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
        backgroundImage: "linear-gradient(rgba(0,255,80,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,80,0.03) 1px, transparent 1px)",
        backgroundSize: "40px 40px",
      }} />

      <div style={{ position: "relative", zIndex: 10, maxWidth: 900, margin: "0 auto", padding: "24px 20px" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{
            display: "inline-block", border: "1px solid #00ff9d",
            padding: "4px 16px", fontSize: 10, letterSpacing: 4,
            color: "#00ff9d", marginBottom: 12, textTransform: "uppercase",
          }}>
            ▸ CLASSIFIED SYSTEM ◂ UJASUSI INTEL OPS ▸ ACTIVE
          </div>
          <div style={{
            fontSize: 28, fontWeight: 700, letterSpacing: 2, color: "#fff",
            textShadow: glitch ? "3px 0 #f00, -3px 0 #0ff" : "0 0 20px rgba(0,255,80,0.4)",
            fontFamily: "'Courier New', monospace",
          }}>
            UJASUSI<span style={{ color: "#00ff9d" }}>:</span>VIRAL_OPS
          </div>
          <div style={{ fontSize: 11, color: "#4a7c4a", letterSpacing: 3, marginTop: 4 }}>
            INTELLIGENCE CONTENT AMPLIFICATION SYSTEM v2.0
          </div>
        </div>

        {/* API Key Panel */}
        <div style={{
          border: `1px solid ${keyConfirmed ? "#1a3a1a" : "#4a2a00"}`,
          background: "rgba(0,20,0,0.6)",
          padding: 20, marginBottom: 20, position: "relative",
        }}>
          <div style={{
            position: "absolute", top: -1, left: 20,
            background: "#050a05", padding: "0 8px",
            fontSize: 10, color: keyConfirmed ? "#00ff9d" : "#ff8c42", letterSpacing: 2,
          }}>
            ▸ {keyConfirmed ? "API AUTHORISATION — ACTIVE ✓" : "API AUTHORISATION REQUIRED"}
          </div>
          {!keyConfirmed ? (
            <div>
              <div style={{ fontSize: 11, color: "#a8a860", lineHeight: 1.6, marginBottom: 12 }}>
                Enter your Anthropic API key to activate the system. Your key is stored only in this browser session and sent directly to Anthropic — never logged or stored on any server.
                <br />
                <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener noreferrer"
                  style={{ color: "#ff8c42", textDecoration: "none" }}>
                  → Get your API key from console.anthropic.com
                </a>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  type={showKey ? "text" : "password"}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && confirmKey()}
                  placeholder="sk-ant-api03-..."
                  style={{ ...inputStyle, flex: 1 }}
                />
                <button onClick={() => setShowKey(!showKey)} style={{
                  padding: "10px 14px", background: "transparent",
                  border: "1px solid #1a4a1a", color: "#4a7c4a",
                  fontFamily: "'Courier New', monospace", fontSize: 11, cursor: "pointer",
                }}>
                  {showKey ? "HIDE" : "SHOW"}
                </button>
                <button onClick={confirmKey} style={{
                  padding: "10px 20px", background: "rgba(255,140,66,0.1)",
                  border: "1px solid #ff8c42", color: "#ff8c42",
                  fontFamily: "'Courier New', monospace", fontSize: 11,
                  letterSpacing: 2, cursor: "pointer",
                }}>
                  AUTHORISE
                </button>
              </div>
              {error && <div style={{ color: "#ff4444", fontSize: 11, marginTop: 8 }}>⚠ {error}</div>}
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ fontSize: 11, color: "#4a7c4a" }}>
                Key loaded: {apiKey.slice(0, 14)}••••••••••••
              </div>
              <button onClick={() => { setKeyConfirmed(false); sessionStorage.removeItem("ujasusi_key"); }} style={{
                padding: "6px 14px", background: "transparent",
                border: "1px solid #1a3a1a", color: "#2a5a2a",
                fontFamily: "'Courier New', monospace", fontSize: 10, cursor: "pointer",
              }}>
                CHANGE KEY
              </button>
            </div>
          )}
        </div>

        {/* Input Panel */}
        <div style={{
          border: "1px solid #1a3a1a", background: "rgba(0,20,0,0.6)",
          padding: 24, marginBottom: 20, position: "relative",
        }}>
          <div style={{
            position: "absolute", top: -1, left: 20,
            background: "#050a05", padding: "0 8px",
            fontSize: 10, color: "#00ff9d", letterSpacing: 2,
          }}>
            ▸ INTELLIGENCE INPUT
          </div>

          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 10, color: "#4a7c4a", letterSpacing: 2, marginBottom: 6 }}>
              ARTICLE TITLE / CLASSIFICATION:
            </div>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Tanzania TISS Conducts Covert Operations Against Opposition..."
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 10, color: "#4a7c4a", letterSpacing: 2, marginBottom: 6 }}>
              ARTICLE CONTENT — PASTE FULL TEXT OR KEY EXCERPTS:
            </div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Paste your Ujasusi Blog article content here. The more detail you provide — agency names, operations, countries, analytical conclusions — the sharper the viral posts will be..."
              rows={8}
              style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6 }}
            />
            <div style={{ fontSize: 10, color: "#2a5a2a", marginTop: 4, textAlign: "right" }}>
              {content.length} chars
            </div>
          </div>

          <button
            onClick={generatePosts}
            disabled={loading || !content.trim() || !keyConfirmed}
            style={{
              width: "100%", padding: "14px",
              background: loading ? "transparent" : "rgba(0,255,80,0.1)",
              border: `1px solid ${loading || !keyConfirmed ? "#1a4a1a" : "#00ff9d"}`,
              color: loading || !keyConfirmed ? "#2a6a2a" : "#00ff9d",
              fontFamily: "'Courier New', monospace",
              fontSize: 13, letterSpacing: 3,
              cursor: loading || !keyConfirmed ? "not-allowed" : "pointer",
              textTransform: "uppercase", transition: "all 0.2s",
            }}
          >
            {loading
              ? "▸ PROCESSING INTELLIGENCE... GENERATING VIRAL OPS..."
              : !keyConfirmed
              ? "▸ AUTHORISE API KEY FIRST"
              : "▸ GENERATE VIRAL POSTS"}
          </button>

          {error && !loading && keyConfirmed && (
            <div style={{
              marginTop: 12, padding: "10px 12px",
              border: "1px solid #4a0000", color: "#ff4444", fontSize: 11, letterSpacing: 1,
            }}>
              ⚠ {error}
            </div>
          )}
        </div>

        {/* Results */}
        {results && (
          <div>
            {/* Viral score */}
            <div style={{
              border: "1px solid #1a3a1a", background: "rgba(0,20,0,0.6)",
              padding: "16px 20px", marginBottom: 16,
              display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap",
            }}>
              <div>
                <div style={{ fontSize: 9, color: "#4a7c4a", letterSpacing: 2, marginBottom: 4 }}>
                  VIRAL POTENTIAL SCORE
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 160, height: 6, background: "#0a1a0a", border: "1px solid #1a3a1a", borderRadius: 3 }}>
                    <div style={{
                      width: `${results.viral_score}%`, height: "100%",
                      background: results.viral_score > 75 ? "#00ff9d" : results.viral_score > 50 ? "#ff8c42" : "#ff4444",
                      borderRadius: 3, boxShadow: `0 0 8px ${results.viral_score > 75 ? "#00ff9d" : "#ff8c42"}`,
                      transition: "width 1s ease",
                    }} />
                  </div>
                  <span style={{ color: "#00ff9d", fontSize: 18, fontWeight: 700 }}>{results.viral_score}</span>
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 9, color: "#4a7c4a", letterSpacing: 2, marginBottom: 4 }}>SIGNAL ANALYSIS</div>
                <div style={{ fontSize: 12, color: "#a8e6a8", lineHeight: 1.4 }}>{results.hook_analysis}</div>
              </div>
              {results.suggested_hashtags?.length > 0 && (
                <div>
                  <div style={{ fontSize: 9, color: "#4a7c4a", letterSpacing: 2, marginBottom: 6 }}>TOP HASHTAGS</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                    {results.suggested_hashtags.slice(0, 5).map((tag) => (
                      <span key={tag} style={{
                        background: "rgba(0,255,80,0.08)", border: "1px solid #1a4a1a",
                        padding: "2px 8px", fontSize: 10, color: "#6aaa6a",
                      }}>
                        #{tag.replace("#", "")}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Platform tabs */}
            <div style={{ display: "flex", gap: 4, marginBottom: 0, flexWrap: "wrap" }}>
              {PLATFORMS.map((p) => (
                <button key={p.id} onClick={() => setActivePlatform(p.id)} style={{
                  padding: "10px 16px",
                  background: activePlatform === p.id ? "rgba(0,40,0,0.8)" : "rgba(0,15,0,0.6)",
                  border: `1px solid ${activePlatform === p.id ? p.color : "#1a3a1a"}`,
                  borderBottom: activePlatform === p.id ? "1px solid #050a05" : "1px solid #1a3a1a",
                  color: activePlatform === p.id ? p.color : "#4a7c4a",
                  fontFamily: "'Courier New', monospace", fontSize: 11,
                  letterSpacing: 1, cursor: "pointer", transition: "all 0.2s",
                }}>
                  <span style={{ marginRight: 6 }}>{p.icon}</span>{p.label}
                </button>
              ))}
            </div>

            {/* Content */}
            <div style={{
              border: `1px solid ${activePlatformData?.color || "#1a3a1a"}`,
              background: "rgba(0,15,0,0.7)", padding: 24, position: "relative", minHeight: 200,
            }}>
              <div style={{
                position: "absolute", top: -1, left: 20,
                background: "#050a05", padding: "0 8px",
                fontSize: 9, color: activePlatformData?.color, letterSpacing: 2,
              }}>
                ▸ {activePlatformData?.label.toUpperCase()} — {activePlatformData?.description.toUpperCase()}
              </div>
              <pre style={{
                whiteSpace: "pre-wrap", wordBreak: "break-word",
                fontFamily: "'Courier New', monospace", fontSize: 13,
                color: "#d8f8d8", lineHeight: 1.7, margin: 0,
              }}>
                {getActivePlatformContent()}
              </pre>
              <div style={{ marginTop: 20, display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button onClick={handleCopy} style={{
                  padding: "8px 20px",
                  background: copied ? "rgba(0,255,80,0.2)" : "transparent",
                  border: `1px solid ${copied ? "#00ff9d" : "#1a4a1a"}`,
                  color: copied ? "#00ff9d" : "#4a7c4a",
                  fontFamily: "'Courier New', monospace", fontSize: 11,
                  letterSpacing: 2, cursor: "pointer", transition: "all 0.2s",
                }}>
                  {copied ? "✓ COPIED TO CLIPBOARD" : "▸ COPY POST"}
                </button>
              </div>
            </div>

            {/* Quick view grid */}
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 9, color: "#2a5a2a", letterSpacing: 3, marginBottom: 10 }}>
                ▸ ALL PLATFORM OUTPUTS — CLICK TAB TO EXPAND & COPY
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {PLATFORMS.map((p) => (
                  <div key={p.id} onClick={() => setActivePlatform(p.id)} style={{
                    border: "1px solid #0f2a0f",
                    background: activePlatform === p.id ? "rgba(0,30,0,0.8)" : "rgba(0,10,0,0.4)",
                    padding: "12px 14px", cursor: "pointer", transition: "all 0.2s",
                  }}>
                    <div style={{ fontSize: 10, color: p.color, letterSpacing: 1, marginBottom: 4 }}>
                      {p.icon} {p.label}
                    </div>
                    <div style={{ fontSize: 11, color: "#4a6a4a", lineHeight: 1.4, overflow: "hidden", maxHeight: 44 }}>
                      {(results[p.id] || "").slice(0, 80)}…
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div style={{ marginTop: 32, textAlign: "center", fontSize: 9, color: "#1a3a1a", letterSpacing: 3 }}>
          UJASUSI VIRAL OPS ▸ POWERED BY CLAUDE AI ▸ ujasusiblog.com
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        * { scrollbar-width: thin; scrollbar-color: #1a4a1a #050a05; }
        *::-webkit-scrollbar { width: 4px; }
        *::-webkit-scrollbar-track { background: #050a05; }
        *::-webkit-scrollbar-thumb { background: #1a4a1a; }
      `}</style>
    </div>
  );
}
