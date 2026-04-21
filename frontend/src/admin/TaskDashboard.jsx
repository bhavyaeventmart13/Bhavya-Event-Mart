// frontend/src/admin/TaskDashboard.jsx
import { useEffect, useState } from "react";
import axios from "axios";
import Sidebar from "./Sidebar";
import Navbar from "../component/Navbar.jsx";
import Footer from "../component/Footer";
import "./TaskDashboard.css";

// ─── AUTH CONFIG ──────────────────────────────────────────────
const token = localStorage.getItem("token");
const authConfig = {
  headers: {
    Authorization: `Bearer ${token}`,
  },
};

export default function TaskDashboard() {
  // ─── State ────────────────────────────────────────────────────
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [filter, setFilter] = useState("all");

  // Modals
  const [showCreate, setShowCreate] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [activeTask, setActiveTask] = useState(null);

  // Create task form
  const [form, setForm] = useState({
    title: "", description: "", deadline: "", assignedTo: "",
  });

  // Edit task form
  const [editForm, setEditForm] = useState({
    title: "", description: "", deadline: "", assignedTo: "",
  });

  // Create user form - FIXED ROLE TO STAFF
  const [newUser, setNewUser] = useState({
    name: "", email: "", password: "", role: "staff",
  });

  // ─── Fetch Tasks (FIXED WITH AUTH) ───────────────────────────
  const fetchTasks = async () => {
    try {
      const { data } = await axios.get("/api/tasks/all", authConfig);
      setTasks(data?.tasks || []);
    } catch (err) {
      console.error("fetchTasks error:", err);
      setTasks([]);
    }
  };

  // ─── Fetch Users (FIXED ROUTE & AUTH) ────────────────────────
  const fetchUsers = async () => {
    try {
      const { data } = await axios.get("/api/user/all", authConfig);
      setUsers(data?.users || []);
    } catch (err) {
      console.error("fetchUsers error:", err);
      setUsers([]);
    }
  };

  useEffect(() => {
    fetchTasks();
    fetchUsers();
  }, []);

  // ─── Create Task (FIXED WITH AUTH) ───────────────────────────
  const handleCreate = async () => {
    if (!form.title.trim() || !form.assignedTo) {
      alert("Title and User Assignment are required");
      return;
    }
    try {
      await axios.post("/api/tasks", form, authConfig);
      setShowCreate(false);
      setForm({ title: "", description: "", deadline: "", assignedTo: "" });
      fetchTasks();
    } catch (err) {
      alert("Failed to create task. Check if you are logged in.");
    }
  };

  // ─── Open Edit Modal ──────────────────────────────────────────
  const openEdit = (task, e) => {
    e.stopPropagation();
    setEditForm({
      title: task.title || "",
      description: task.description || "",
      deadline: task.deadline
        ? new Date(task.deadline).toISOString().split("T")[0]
        : "",
      assignedTo: task.assignedTo?._id || "",
    });
    setActiveTask(task);
    setShowEdit(true);
  };

  // ─── Save Edited Task (FIXED WITH AUTH) ──────────────────────
  const handleEdit = async () => {
    if (!editForm.title.trim()) {
      alert("Title is required");
      return;
    }
    try {
      await axios.put(`/api/tasks/${activeTask._id}`, editForm, authConfig);
      setShowEdit(false);
      setActiveTask(null);
      fetchTasks();
    } catch (err) {
      alert("Failed to update task");
    }
  };

  // ─── Delete Task (FIXED WITH AUTH) ───────────────────────────
  const handleDelete = async (id, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this task?")) return;
    try {
      await axios.delete(`/api/tasks/${id}`, authConfig);
      setActiveTask(null);
      setShowEdit(false);
      fetchTasks();
    } catch (err) {
      alert("Failed to delete task");
    }
  };

  // ─── Create User (FIXED ROLE & AUTH) ─────────────────────────
  const handleCreateUser = async () => {
    if (!newUser.name || !newUser.email || !newUser.password) {
      alert("All fields are required");
      return;
    }
    try {
      // Added empty phone fallback as best practice
      await axios.post("/api/user/register", { ...newUser, phone: "" }, authConfig);
      alert(`User "${newUser.name}" created successfully`);
      setShowUserModal(false);
      setNewUser({ name: "", email: "", password: "", role: "staff" });
      fetchUsers();
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to create user");
    }
  };

  // ─── Filter & Split ───────────────────────────────────────────
  const filtered = filter === "all" ? tasks : tasks.filter((t) => t.status === filter);
  const pendingTasks = filtered.filter((t) => t.status === "pending");
  const completedTasks = filtered.filter((t) => t.status === "completed");

  const fmtDate = (d) =>
    d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) : null;

  const formField = (key, val) => setForm((f) => ({ ...f, [key]: val }));
  const editFormField = (key, val) => setEditForm((f) => ({ ...f, [key]: val }));

  return (
    <div className="td-root">
      <Sidebar />
      <div className="td-main">
        <div className="td-content-wrap">
          <Navbar />

          <div className="td-header">
            <div className="td-header-left">
              <h1 className="td-page-title">Tasks</h1>
              <p className="td-page-sub">Create, assign and monitor all tasks</p>
            </div>
            <div className="td-header-actions">
              <button className="td-btn-outline" onClick={() => setShowUserModal(true)}>
                + Create User
              </button>
              <button className="td-btn-gold" onClick={() => setShowCreate(true)}>
                + Create Task
              </button>
            </div>
          </div>

          <div className="td-stats">
            <div className="td-stat-card">
              <div className="td-stat-icon">📋</div>
              <div className="td-stat-info">
                <span className="td-stat-label">Total Tasks</span>
                <span className="td-stat-val">{tasks.length}</span>
              </div>
            </div>
            <div className="td-stat-card">
              <div className="td-stat-icon green">✅</div>
              <div className="td-stat-info">
                <span className="td-stat-label">Completed</span>
                <span className="td-stat-val green">
                  {tasks.filter((t) => t.status === "completed").length}
                </span>
              </div>
            </div>
            <div className="td-stat-card">
              <div className="td-stat-icon amber">⏳</div>
              <div className="td-stat-info">
                <span className="td-stat-label">Pending</span>
                <span className="td-stat-val amber">
                  {tasks.filter((t) => t.status === "pending").length}
                </span>
              </div>
            </div>
          </div>

          <div className="td-filter-row">
            {["all", "pending", "completed"].map((f) => (
              <button
                key={f}
                className={`td-filter-pill ${filter === f ? "active" : ""}`}
                onClick={() => setFilter(f)}
              >
                {f === "all" ? "All Tasks" : f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>

          <div className="td-panels">
            {/* INBOX */}
            <div className="td-panel">
              <div className="td-panel-top">
                <div className="td-panel-label"><span className="td-dot amber" /> Inbox</div>
                <span className="td-pill amber">{pendingTasks.length} Pending</span>
              </div>
              <div className="td-task-list">
                {pendingTasks.length === 0 ? (
                  <div className="td-empty">No pending tasks 🎉</div>
                ) : (
                  pendingTasks.map((task) => (
                    <div key={task._id} className="td-task-row" onClick={() => setActiveTask(task)}>
                      <div className="td-task-info">
                        <p className="td-task-name">{task.title}</p>
                        <p className="td-task-user">{task.assignedTo?.name || "—"}</p>
                        {task.deadline && <p className="td-task-date">📅 {fmtDate(task.deadline)}</p>}
                      </div>
                      <div className="td-task-meta">
                        <span className="td-badge amber">⏳ Pending</span>
                        <div className="td-task-actions">
                          <button className="td-action-btn edit" onClick={(e) => openEdit(task, e)}>✏️</button>
                          <button className="td-action-btn delete" onClick={(e) => handleDelete(task._id, e)}>🗑</button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* OUTBOX */}
            <div className="td-panel">
              <div className="td-panel-top">
                <div className="td-panel-label"><span className="td-dot green" /> Outbox</div>
                <span className="td-pill green">{completedTasks.length} Completed</span>
              </div>
              <div className="td-task-list">
                {completedTasks.length === 0 ? (
                  <div className="td-empty">No completed tasks yet</div>
                ) : (
                  completedTasks.map((task) => (
                    <div key={task._id} className="td-task-row" onClick={() => setActiveTask(task)}>
                      <div className="td-task-info">
                        <p className="td-task-name">{task.title}</p>
                        <p className="td-task-user">{task.assignedTo?.name || "—"}</p>
                      </div>
                      <div className="td-task-meta">
                        <span className="td-badge green">✓ Done</span>
                        <div className="td-task-actions">
                          <button className="td-action-btn edit" onClick={(e) => openEdit(task, e)}>✏️</button>
                          <button className="td-action-btn delete" onClick={(e) => handleDelete(task._id, e)}>🗑</button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>

      {/* POPUPS & MODALS (Kept exactly as requested with minor internal role/auth fixes) */}
      {/* ... Task Detail Popup ... */}
      {activeTask && !showEdit && (
        <div className="td-overlay" onClick={() => setActiveTask(null)}>
           <div className="td-popup" onClick={(e) => e.stopPropagation()}>
             <div className="td-popup-header">
               <h2 className="td-popup-title">{activeTask.title}</h2>
               <button className="td-popup-close" onClick={() => setActiveTask(null)}>✕</button>
             </div>
             <div className="td-popup-section">
               <p className="td-popup-label">Details</p>
               <p className="td-popup-text">{activeTask.description || "—"}</p>
             </div>
             <div className="td-popup-footer">
                <button className="td-btn-outline-red" onClick={(e) => handleDelete(activeTask._id, e)}>🗑 Delete</button>
                <button className="td-btn-outline" onClick={(e) => openEdit(activeTask, e)}>✏️ Edit</button>
             </div>
           </div>
        </div>
      )}

      {/* CREATE USER MODAL - UPDATED WITH STAFF ROLE */}
      {showUserModal && (
        <div className="td-overlay" onClick={() => setShowUserModal(false)}>
          <div className="td-modal" onClick={(e) => e.stopPropagation()}>
            <div className="td-modal-header"><h3>Create New User</h3></div>
            <div className="td-field">
              <label>Full Name *</label>
              <input type="text" value={newUser.name} onChange={(e) => setNewUser({ ...newUser, name: e.target.value })} />
            </div>
            <div className="td-field">
              <label>Email *</label>
              <input type="email" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} />
            </div>
            <div className="td-field">
              <label>Password *</label>
              <input type="password" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} />
            </div>
            <div className="td-field">
              <label>Role</label>
              <select value={newUser.role} onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}>
                <option value="staff">Staff</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className="td-modal-footer">
              <button className="td-btn-ghost" onClick={() => setShowUserModal(false)}>Cancel</button>
              <button className="td-btn-gold" onClick={handleCreateUser}>Create User</button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE TASK MODAL (Auth integrated) */}
      {showCreate && (
        <div className="td-overlay" onClick={() => setShowCreate(false)}>
          <div className="td-modal" onClick={(e) => e.stopPropagation()}>
            <div className="td-modal-header"><h3>Create New Task</h3></div>
            <div className="td-field">
              <label>Task Title *</label>
              <input type="text" value={form.title} onChange={(e) => formField("title", e.target.value)} />
            </div>
            <div className="td-field">
              <label>Assign To *</label>
              <select value={form.assignedTo} onChange={(e) => formField("assignedTo", e.target.value)}>
                <option value="">Select User</option>
                {users.map((u) => <option key={u._id} value={u._id}>{u.name}</option>)}
              </select>
            </div>
            <div className="td-modal-footer">
              <button className="td-btn-ghost" onClick={() => setShowCreate(false)}>Cancel</button>
              <button className="td-btn-gold" onClick={handleCreate}>Create Task</button>
            </div>
          </div>
        </div>
      )}
      
      {/* EDIT TASK MODAL (Auth integrated) */}
      {showEdit && (
        <div className="td-overlay" onClick={() => { setShowEdit(false); setActiveTask(null); }}>
          <div className="td-modal" onClick={(e) => e.stopPropagation()}>
             <div className="td-modal-header"><h3>Edit Task</h3></div>
             <div className="td-field">
               <label>Task Title *</label>
               <input type="text" value={editForm.title} onChange={(e) => editFormField("title", e.target.value)} />
             </div>
             <div className="td-modal-footer">
                <button className="td-btn-gold" onClick={handleEdit}>Save Changes</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}