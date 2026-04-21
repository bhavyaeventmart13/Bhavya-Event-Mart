import { useEffect, useState } from "react";
import axios from "axios";

export default function MyTasks() {
  const [tasks, setTasks] = useState([]);
  const [filter, setFilter] = useState("all");
  const [activeTask, setActiveTask] = useState(null);
  const [reason, setReason] = useState("");

  const fetchTasks = async () => {
    try {
      const { data } = await axios.get("/api/tasks/my");
      setTasks(data?.tasks || []);
    } catch (err) {
      console.error("Error fetching tasks:", err);
      setTasks([]);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleUpdate = async (id, status) => {
    if (status === "pending" && !reason.trim()) {
      alert("Please enter a reason for pending status");
      return;
    }

    try {
      await axios.patch(`/api/tasks/${id}/status`, {
        status,
        pendingReason: status === "pending" ? reason : "",
      });

      setActiveTask(null);
      setReason("");
      fetchTasks();
    } catch (err) {
      alert("Failed to update task");
    }
  };

  const filtered =
    filter === "all" ? tasks : tasks.filter((t) => t.status === filter);

  const total = tasks.length;
  const completed = tasks.filter((t) => t.status === "completed").length;
  const pending = tasks.filter((t) => t.status === "pending").length;

  const fmtDate = (d) =>
    d
      ? new Date(d).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
        })
      : null;

  return (
    <div className="p-6 max-w-3xl mx-auto">

      {/* HEADER */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Hello 👋</h1>
        <p className="text-gray-400 text-sm">Here are your assigned tasks</p>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-white border rounded-xl p-3 text-center">
          <p className="text-xs text-gray-400">Total</p>
          <p className="font-semibold">{total}</p>
        </div>
        <div className="bg-white border rounded-xl p-3 text-center">
          <p className="text-xs text-gray-400">Completed</p>
          <p className="font-semibold text-green-700">{completed}</p>
        </div>
        <div className="bg-white border rounded-xl p-3 text-center">
          <p className="text-xs text-gray-400">Pending</p>
          <p className="font-semibold text-yellow-700">{pending}</p>
        </div>
      </div>

      {/* FILTER */}
      <div className="flex gap-2 mb-4">
        {["all", "pending", "completed"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1 rounded-full text-sm border ${
              filter === f
                ? "bg-green-700 text-white border-green-700"
                : "border-gray-300 text-gray-600"
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* TASK LIST */}
      <div className="space-y-3">
        {filtered.map((task) => (
          <div
            key={task._id}
            className="bg-white border border-gray-200 rounded-xl p-4 cursor-pointer hover:border-green-300"
            onClick={() => {
              setActiveTask(task);
              setReason("");
            }}
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium text-sm">{task.title}</p>

                {task.description && (
                  <p className="text-xs text-gray-400 mt-1">
                    {task.description}
                  </p>
                )}

                {task.pendingReason && (
                  <p className="text-xs text-red-500 mt-1">
                    Reason: {task.pendingReason}
                  </p>
                )}
              </div>

              <div className="flex flex-col items-end gap-1">
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    task.status === "completed"
                      ? "bg-green-100 text-green-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {task.status}
                </span>

                {task.deadline && (
                  <span className="text-xs text-gray-400">
                    Due: {fmtDate(task.deadline)}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL */}
      {activeTask && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-[400px] shadow-lg">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-base">
                {activeTask.title}
              </h3>
              <button
                onClick={() => setActiveTask(null)}
                className="text-gray-400 text-lg"
              >
                ✕
              </button>
            </div>

            {/* META */}
            <div className="flex gap-2 mb-4 flex-wrap">
              {activeTask.deadline && (
                <span className="text-xs bg-orange-50 text-orange-700 border px-2 py-1 rounded-lg">
                  {fmtDate(activeTask.deadline)}
                </span>
              )}
              <span className="text-xs bg-blue-50 text-blue-700 border px-2 py-1 rounded-lg">
                {activeTask.createdBy?.name}
              </span>
            </div>

            {/* DESCRIPTION */}
            {activeTask.description && (
              <div className="mb-4">
                <p className="text-xs text-gray-500 mb-1">Details</p>
                <p className="text-sm">{activeTask.description}</p>
              </div>
            )}

            {/* STATUS */}
            <div className="mb-4">
              <p className="text-xs text-gray-500 mb-1">
                Current Status
              </p>
              <p
                className={`text-sm font-medium ${
                  activeTask.status === "completed"
                    ? "text-green-700"
                    : "text-yellow-700"
                }`}
              >
                {activeTask.status}
              </p>
            </div>

            {/* REASON */}
            <div className="mb-4">
              <label className="text-xs text-gray-500 mb-1 block">
                Reason (required if Pending)
              </label>
              <textarea
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                rows={2}
                placeholder="Enter reason for delay..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>

            {/* ACTIONS */}
            <div className="flex gap-2">
              <button
                onClick={() =>
                  handleUpdate(activeTask._id, "completed")
                }
                className="flex-1 bg-green-700 text-white py-2 rounded-lg text-sm font-medium"
              >
                ✓ Complete
              </button>

              <button
                onClick={() =>
                  handleUpdate(activeTask._id, "pending")
                }
                className="flex-1 border border-gray-300 py-2 rounded-lg text-sm font-medium text-gray-700"
              >
                ⏸ Pending
              </button>

              <button
                onClick={() => setActiveTask(null)}
                className="flex-1 border border-red-200 text-red-500 py-2 rounded-lg text-sm font-medium"
              >
                ⊘ Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}