import React, { useEffect, useState, useRef, useCallback } from "react";
import { io } from "socket.io-client";
import Sidebar from "./Sidebar";
import Navbar from "../component/Navbar";
import Footer from "../component/Footer";
import "./Communication.css";

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────
const getChannelColor = (ch) => {
  if (ch === "instagram") return "#e1306c";
  if (ch === "messenger") return "#0084ff";
  return "#25d366";
};

const getChannelIcon = (ch) => {
  if (ch === "instagram") return "📸";
  if (ch === "messenger") return "💬";
  return "💚";
};

const getInitials = (name = "") =>
  name.length < 1 ? "?" : name.slice(0, 2).toUpperCase();

const getAvatarBg = (ch) => {
  if (ch === "instagram") return "#3a1a2a";
  if (ch === "messenger") return "#1a2a3a";
  return "#1a2e1a";
};

/** Short time for conversation list (HH:MM or DD Mon) */
const formatListTime = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  return d.toLocaleDateString([], { day: "2-digit", month: "short" });
};

/** Full timestamp for chat bubbles — "03 Apr 2025, 09:16 AM" */
const formatFullTime = (dateStr) => {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleString([], {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

/** Date separator label — "Today", "Yesterday", or "03 April 2025" */
const formatDateSeparator = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const now = new Date();
  const yesterday = new Date();
  yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === now.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString([], {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

const isSameDay = (a, b) =>
  a && b && new Date(a).toDateString() === new Date(b).toDateString();

// ─────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────
const Communication = () => {
  // ── State ──────────────────────────────────
  const [conversations, setConversations]             = useState([]);
  const [loading, setLoading]                         = useState(true);
  const [searchTerm, setSearchTerm]                   = useState("");
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [replyMessage, setReplyMessage]               = useState("");
  const [sending, setSending]                         = useState(false);
  const [filter, setFilter]                           = useState("all");
  const [admins, setAdmins]                           = useState([]);
  const [selectedAdmin, setSelectedAdmin]             = useState("");
  const [keywords, setKeywords]                       = useState([]);
  const [newKeyword, setNewKeyword]                   = useState("");
  const [newReply, setNewReply]                       = useState("");
  const [analytics, setAnalytics]                     = useState(null);
  const [channelFilter, setChannelFilter]             = useState("all");
  const [timeFilter, setTimeFilter]                   = useState("all");
  const [showKeywordModal, setShowKeywordModal]       = useState(false);
  const [loadingMessages, setLoadingMessages]         = useState(false);

  const token       = localStorage.getItem("token");
  const API         = import.meta.env.VITE_API_URL;
  const socketRef   = useRef();
  const messagesEnd = useRef(null);

  // ─────────────────────────────────────────────
  // FETCH — removed limit=100 cap so ALL chats load
  // This ensures conversation count matches analytics
  // ─────────────────────────────────────────────
  const fetchConversations = useCallback(async () => {
    try {
      setLoading(true);
      const statusQuery =
        filter === "unread"   ? "&unreadOnly=true"  :
        filter === "assigned" ? "&status=assigned"  :
        filter === "closed"   ? "&status=closed"    : "";

      const res  = await fetch(
        `${API}/api/communication/conversations?limit=10000${statusQuery}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      if (data.success) setConversations(data.conversations || []);
    } catch (err) {
      console.error("fetchConversations:", err);
    } finally {
      setLoading(false);
    }
  }, [API, filter, token]);

  const fetchAdmins = useCallback(async () => {
    try {
      const res  = await fetch(`${API}/api/user/admins`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setAdmins(data.admins || []);
    } catch (err) {
      console.error("fetchAdmins:", err);
    }
  }, [API, token]);

  const fetchKeywords = useCallback(async () => {
    try {
      const res  = await fetch(`${API}/api/keywords`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setKeywords(data.keywords || []);
    } catch (err) {
      console.error("fetchKeywords:", err);
    }
  }, [API, token]);

  const fetchAnalytics = useCallback(async () => {
    try {
      const res  = await fetch(`${API}/api/analytics/lead-dashboard`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setAnalytics(data.analytics);
    } catch (err) {
      console.error("fetchAnalytics:", err);
    }
  }, [API, token]);

  // ── Effects ────────────────────────────────
  useEffect(() => { fetchConversations(); }, [fetchConversations]);

  useEffect(() => {
    fetchAdmins();
    fetchKeywords();
    fetchAnalytics();

    socketRef.current = io(API);
    socketRef.current.on("newMessage", () => {
      fetchConversations();
      if (selectedConversation?._id) {
        openConversation(selectedConversation._id, false);
      }
    });

    return () => socketRef.current?.disconnect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [API]);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedConversation?.messages?.length]);

  // ─────────────────────────────────────────────
  // ACTIONS
  // ─────────────────────────────────────────────
  const openConversation = async (id, showLoader = true) => {
    try {
      if (showLoader) setLoadingMessages(true);
      const res  = await fetch(`${API}/api/communication/conversations/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setSelectedConversation(data.conversation);
        setReplyMessage("");
        setSelectedAdmin(data.conversation?.leadId?.assignedTo || "");
      }
    } catch (err) {
      console.error("openConversation:", err);
    } finally {
      setLoadingMessages(false);
    }
  };

  const assignLead = async () => {
    if (!selectedAdmin || !selectedConversation) return;
    try {
      const res  = await fetch(`${API}/api/communication/assign`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          conversationId: selectedConversation._id,
          userId: selectedAdmin,
        }),
      });
      const data = await res.json();
      if (data.success) { alert("Lead assigned successfully"); fetchConversations(); }
    } catch { alert("Assignment failed"); }
  };

  const closeConversation = async () => {
    if (!selectedConversation) return;
    if (!window.confirm("Close this conversation?")) return;
    try {
      const res  = await fetch(`${API}/api/communication/close`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ conversationId: selectedConversation._id }),
      });
      const data = await res.json();
      if (data.success) {
        alert("Conversation closed");
        setSelectedConversation(null);
        fetchConversations();
      }
    } catch { alert("Failed to close conversation"); }
  };

  const handleSendReply = async () => {
    if (!replyMessage.trim() || sending) return;
    try {
      setSending(true);
      const res  = await fetch(`${API}/api/communication/reply`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          conversationId: selectedConversation._id,
          message: replyMessage.trim(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setReplyMessage("");
        openConversation(selectedConversation._id, false);
      }
    } catch { alert("Failed to send reply"); }
    finally { setSending(false); }
  };

  const createKeyword = async () => {
    if (!newKeyword.trim() || !newReply.trim()) return;
    try {
      const res  = await fetch(`${API}/api/keywords`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ keyword: newKeyword, replyText: newReply }),
      });
      const data = await res.json();
      if (data.success) { setNewKeyword(""); setNewReply(""); fetchKeywords(); }
    } catch (err) { console.error("createKeyword:", err); }
  };

  const deleteKeyword = async (id) => {
    if (!window.confirm("Delete this keyword?")) return;
    try {
      const res  = await fetch(`${API}/api/keywords/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) fetchKeywords();
    } catch (err) { console.error("deleteKeyword:", err); }
  };

  // ─────────────────────────────────────────────
  // FILTER — client-side
  // ─────────────────────────────────────────────
  const filtered = conversations.filter((c) => {
    const combined = [
      c?.lead?.name || "",
      c?.lead?.phone || "",
      c?.lastMessage?.text || "",
    ].join(" ").toLowerCase();

    if (!combined.includes(searchTerm.toLowerCase())) return false;
    if (channelFilter !== "all" && c.channel !== channelFilter) return false;

    if (timeFilter !== "all") {
      const updated = new Date(c.updatedAt);
      const now     = new Date();
      if (timeFilter === "today" && updated.toDateString() !== now.toDateString()) return false;
      if (timeFilter === "week"  && now - updated > 7  * 86400000) return false;
      if (timeFilter === "month" && now - updated > 30 * 86400000) return false;
    }
    return true;
  });

  // ─────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────
  return (
    <div className="communication-page">
      <Sidebar />

      <div className="crm-main">
        <Navbar />

        {/* ── ANALYTICS BAR ─────────────────────────── */}
        {analytics && (
          <div className="analytics-bar">
            <span className="analytics-bar-title">Lead Dashboard</span>
            <div className="analytics-pills">
              <div className="analytics-pill">
                <span className="pill-label">Total Leads</span>
                <span className="pill-value">{analytics.totalLeads}</span>
              </div>
              {analytics.platformStats?.map((src, i) => (
                <div className="analytics-pill" key={i}>
                  <span className="pill-label">
                    {src._id
                      ? src._id.charAt(0).toUpperCase() + src._id.slice(1)
                      : "Unknown"}{" "}Leads
                  </span>
                  <span className="pill-value">{src.count}</span>
                </div>
              ))}
              {/* Shows total loaded chats so user can verify match */}
              <div className="analytics-pill">
                <span className="pill-label">Loaded Chats</span>
                <span className="pill-value">{conversations.length}</span>
              </div>
            </div>
          </div>
        )}

        {/* ── CHAT LAYOUT ───────────────────────────── */}
        <div className="chat-layout">

          {/* ════════ LEFT PANEL — Conversation list ════════ */}
          <div className="left-panel">

            {/* Search + Filters */}
            <div className="left-panel-header">
              <div className="search-row">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"/>
                  <path d="m21 21-4.35-4.35"/>
                </svg>
                <input
                  placeholder="Search by name, phone, or message..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="filter-row">
                <select className="filter-select" value={filter}
                  onChange={(e) => setFilter(e.target.value)}>
                  <option value="all">All Conversations</option>
                  <option value="unread">Unread</option>
                  <option value="assigned">Assigned</option>
                  <option value="closed">Closed</option>
                </select>

                <select className="filter-select" value={channelFilter}
                  onChange={(e) => setChannelFilter(e.target.value)}>
                  <option value="all">All Channels</option>
                  <option value="whatsapp">WhatsApp</option>
                  <option value="instagram">Instagram</option>
                  <option value="messenger">Messenger</option>
                </select>

                <select className="filter-select" value={timeFilter}
                  onChange={(e) => setTimeFilter(e.target.value)}>
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                </select>

                <button className="keyword-btn"
                  onClick={() => setShowKeywordModal(true)}>
                  🔑 Keywords
                </button>
              </div>
            </div>

            {/* Count bar */}
            <div className="conv-count-bar">
              <span>
                {filter === "all" ? "All" : filter.charAt(0).toUpperCase() + filter.slice(1)} Conversations
              </span>
              <strong>{filtered.length} results</strong>
            </div>

            {/* Scrollable conversation list */}
            <div className="conv-list">
              {loading ? (
                <div className="empty-state">
                  <div className="spinner" />
                  <span>Loading conversations…</span>
                </div>
              ) : filtered.length === 0 ? (
                <div className="empty-state">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="1.2">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                  </svg>
                  <span>No conversations found</span>
                </div>
              ) : (
                filtered.map((conv) => {
                  const name     = conv?.lead?.name || conv?.lead?.phone || "Unknown";
                  const isActive = selectedConversation?._id === conv._id;
                  const chColor  = getChannelColor(conv.channel);

                  return (
                    <div
                      key={conv._id}
                      className={`conv-item${isActive ? " active" : ""}`}
                      onClick={() => openConversation(conv._id)}
                    >
                      <div className="avatar"
                        style={{ background: getAvatarBg(conv.channel) }}>
                        <span style={{ color: chColor }}>{getInitials(name)}</span>
                        <div className="channel-dot"
                          style={{ background: chColor }} title={conv.channel} />
                      </div>

                      <div className="conv-info">
                        <div className="conv-name-row">
                          <span className="conv-name">{name}</span>
                          <span className="conv-time">
                            {formatListTime(conv.updatedAt)}
                          </span>
                        </div>
                        <div className="conv-preview">
                          {conv?.lastMessage?.text?.slice(0, 48) || "No messages yet"}
                        </div>
                      </div>

                      {conv.unreadCount > 0 && (
                        <div className="unread-badge">{conv.unreadCount}</div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
          {/* end .left-panel */}

          {/* ════════ RIGHT PANEL — Chat window ════════ */}
          <div className="right-panel">
            {!selectedConversation ? (
              <div className="no-chat-placeholder">
                <svg width="80" height="80" viewBox="0 0 24 24" fill="none"
                  stroke="#f5c518" strokeWidth="0.8">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
                <p>Select a conversation to start chatting</p>
              </div>
            ) : (
              <>
                {/* Chat Header */}
                <div className="chat-header">
                  <div className="avatar" style={{
                    width: 38, height: 38, fontSize: 12,
                    background: getAvatarBg(selectedConversation.channel),
                  }}>
                    <span style={{ color: getChannelColor(selectedConversation.channel) }}>
                      {getInitials(
                        selectedConversation?.leadId?.name ||
                        selectedConversation?.leadId?.phone || "?"
                      )}
                    </span>
                  </div>

                  <div className="chat-header-info">
                    <div className="chat-header-name">
                      {selectedConversation?.leadId?.name ||
                        selectedConversation?.leadId?.phone || "Unknown"}
                    </div>
                    <div className="chat-header-sub">
                      <span>{selectedConversation?.leadId?.phone}</span>
                      <span className="channel-tag" style={{
                        color: getChannelColor(selectedConversation.channel),
                        borderColor: getChannelColor(selectedConversation.channel) + "44",
                        background: getChannelColor(selectedConversation.channel) + "11",
                      }}>
                        {getChannelIcon(selectedConversation.channel)}&nbsp;
                        {(selectedConversation.channel || "whatsapp").charAt(0).toUpperCase() +
                          (selectedConversation.channel || "whatsapp").slice(1)}
                      </span>
                    </div>
                  </div>

                  <div className="chat-header-actions">
                    {admins.length > 0 && (
                      <>
                        <select className="assign-select" value={selectedAdmin}
                          onChange={(e) => setSelectedAdmin(e.target.value)}>
                          <option value="">Assign to…</option>
                          {admins.map((a) => (
                            <option key={a._id} value={a._id}>{a.name}</option>
                          ))}
                        </select>
                        <button className="btn-assign" onClick={assignLead}>Assign</button>
                      </>
                    )}
                    <button className="btn-close-conv" onClick={closeConversation}>
                      Close Chat
                    </button>
                  </div>
                </div>

                {/* Messages area */}
                {loadingMessages ? (
                  <div className="messages-loading">
                    <div className="spinner" />
                    <span>Loading messages…</span>
                  </div>
                ) : (
                  <div className="chat-messages-area">
                    {(selectedConversation?.messages || []).length === 0 ? (
                      <div style={{
                        textAlign: "center", color: "#444",
                        fontSize: "13px", marginTop: "40px",
                      }}>
                        No messages yet
                      </div>
                    ) : (
                      selectedConversation.messages.map((msg, i) => {
                        const isOutgoing = msg.sender === "admin" || msg.sender === "bot";
                        const prevMsg    = selectedConversation.messages[i - 1];
                     const showSep = i === 0 || !isSameDay(prevMsg?.timestamp, msg.timestamp);

                        return (
                          <React.Fragment key={i}>
                            {/* Date separator */}
                            {showSep && (
                              <div className="date-separator">
                                <span>{formatDateSeparator(msg.timestamp)}</span>
                              </div>
                            )}

                            {/* Message bubble */}
                            <div className={`msg-wrapper ${isOutgoing ? "outgoing" : "incoming"}`}>
                              <div className="msg-bubble">{msg.text}</div>
                              <div className="msg-meta">
                                {isOutgoing && (
                                  <span className="msg-sender-label">
                                    {msg.sender === "bot" ? "Bot" : "Admin"}
                                  </span>
                                )}
                                {/* Full timestamp on right side as requested */}
                                <span className="msg-time">
                                 {formatFullTime(msg.timestamp)}
                                </span>
                              </div>
                            </div>
                          </React.Fragment>
                        );
                      })
                    )}
                    <div ref={messagesEnd} className="scroll-anchor" />
                  </div>
                )}

                {/* Reply box */}
                <div className="reply-box">
                  <input
                    className="reply-input"
                    type="text"
                    placeholder="Type a message…"
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendReply()}
                  />
                  <button
                    className="send-btn"
                    onClick={handleSendReply}
                    disabled={sending || !replyMessage.trim()}
                    title="Send"
                  >
                    {sending ? (
                      <div className="spinner" style={{ width: 14, height: 14 }} />
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M2 21l21-9L2 3v7l15 2-15 2v7z"/>
                      </svg>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
          {/* end .right-panel */}

        </div>
        {/* end .chat-layout */}
      </div>
      {/* end .crm-main */}

      {/* ════════ KEYWORD MODAL ════════ */}
      {showKeywordModal && (
        <div className="kw-modal-overlay" onClick={() => setShowKeywordModal(false)}>
          <div className="kw-modal-box" onClick={(e) => e.stopPropagation()}>

            <div className="kw-modal-header">
              <h3>🔑 Keyword Auto Replies</h3>
              <button className="kw-close-btn" onClick={() => setShowKeywordModal(false)}>×</button>
            </div>

            <div className="kw-add-row">
              <input
                placeholder="Keyword (e.g. price, hello)"
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
              />
              <input
                placeholder="Auto reply text"
                value={newReply}
                onChange={(e) => setNewReply(e.target.value)}
              />
              <button className="kw-add-btn" onClick={createKeyword}>Add</button>
            </div>

            <div className="kw-table-wrap">
              {keywords.length === 0 ? (
                <p className="kw-empty">No keywords yet. Add one above.</p>
              ) : (
                <table className="kw-table">
                  <thead>
                    <tr>
                      <th>Keyword</th>
                      <th>Auto Reply</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {keywords.map((k) => (
                      <tr key={k._id}>
                        <td>{k.keyword}</td>
                        <td>{k.replyText}</td>
                        <td>
                          <button className="kw-del-btn"
                            onClick={() => deleteKeyword(k._id)}>
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Communication;
