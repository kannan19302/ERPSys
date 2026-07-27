"use client";
import { useState, useEffect } from "react";
import { ProtectedComponent } from "@unerp/ui";

const BASE = process.env.NEXT_PUBLIC_API_URL || "/api/v1";
const api = {
  get: async (p: string) => { const r = await fetch(`${BASE}${p}`, { credentials: "include" }); if (!r.ok) throw new Error(await r.text()); return r.json(); },
  post: async (p: string, b?: unknown) => { const r = await fetch(`${BASE}${p}`, { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: b ? JSON.stringify(b) : undefined }); if (!r.ok) throw new Error(await r.text()); return r.json(); },
};
import { Plus, Loader2 } from "lucide-react";

export default function EducationExamsPage() {
  const [exams, setExams] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedExam, setSelectedExam] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    courseId: "",
    title: "",
    examDate: "",
    startTime: "",
    endTime: "",
    room: "",
    maxScore: "100",
  });
  const [courseFilter, setCourseFilter] = useState("");

  useEffect(() => {
    loadData();
  }, [courseFilter]);
  async function loadData() {
    setLoading(true);
    try {
      const c = await api.get("/ext/education/deep/courses");
      setCourses(c.data || []);
      const r = await api.get(
        "/ext/education/deep/exams" +
          (courseFilter ? `?courseId=${courseFilter}` : ""),
      );
      setExams(r.data || []);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }
  async function createExam() {
    try {
      await api.post("/ext/education/deep/exams", form);
      setShowForm(false);
      loadData();
    } catch (e) {
      console.error(e);
    }
  }
  async function addResult(examId: string, studentId: string, score: number) {
    try {
      await api.post(`/ext/education/deep/exams/${examId}/results`, {
        studentId,
        score,
      });
      loadData();
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <div className="ui-page">
      <div className="ui-page-header">
        <h1 className="ui-page-title">Exam Schedules</h1>
        <ProtectedComponent permission="education.exams.create">
          <button
            className="ui-btn ui-btn-primary"
            onClick={() => setShowForm(!showForm)}
          >
            <Plus className="w-4 h-4" /> New Exam
          </button>
        </ProtectedComponent>
      </div>
      {showForm && (
        <div className="ui-card p-4 mb-4">
          <h3 className="font-semibold mb-3">Schedule Exam</h3>
          <div className="ui-grid-3">
            <div className="ui-form-group">
              <label className="ui-label">Course</label>
              <select
                className="ui-input"
                value={form.courseId}
                onChange={(e) => setForm({ ...form, courseId: e.target.value })}
              >
                <option value="">Select</option>
                {courses.map((c: any) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="ui-form-group">
              <label className="ui-label">Title</label>
              <input
                className="ui-input"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>
            <div className="ui-form-group">
              <label className="ui-label">Date</label>
              <input
                className="ui-input"
                type="date"
                value={form.examDate}
                onChange={(e) => setForm({ ...form, examDate: e.target.value })}
              />
            </div>
            <div className="ui-form-group">
              <label className="ui-label">Start Time</label>
              <input
                className="ui-input"
                type="time"
                value={form.startTime}
                onChange={(e) =>
                  setForm({ ...form, startTime: e.target.value })
                }
              />
            </div>
            <div className="ui-form-group">
              <label className="ui-label">Room</label>
              <input
                className="ui-input"
                value={form.room}
                onChange={(e) => setForm({ ...form, room: e.target.value })}
              />
            </div>
            <div className="ui-form-group">
              <label className="ui-label">Max Score</label>
              <input
                className="ui-input"
                type="number"
                value={form.maxScore}
                onChange={(e) => setForm({ ...form, maxScore: e.target.value })}
              />
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <button className="ui-btn ui-btn-primary" onClick={createExam}>
              Schedule
            </button>
            <button
              className="ui-btn ui-btn-ghost"
              onClick={() => setShowForm(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      <div className="mb-4">
        <select
          className="ui-input w-56"
          value={courseFilter}
          onChange={(e) => setCourseFilter(e.target.value)}
        >
          <option value="">All Courses</option>
          {courses.map((c: any) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      {loading ? (
        <div className="flex justify-center p-8">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      ) : (
        <div className="ui-card">
          <table className="ui-table">
            <thead>
              <tr>
                <th>Course</th>
                <th>Title</th>
                <th>Date</th>
                <th>Time</th>
                <th>Room</th>
                <th>Max</th>
                <th>Results</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {exams.map((ex: any) => (
                <tr key={ex.id}>
                  <td>{ex.course?.name}</td>
                  <td className="font-medium">{ex.title}</td>
                  <td>{new Date(ex.examDate).toLocaleDateString()}</td>
                  <td>
                    {ex.startTime}-{ex.endTime}
                  </td>
                  <td>{ex.room || "-"}</td>
                  <td>{ex.maxScore}</td>
                  <td>{ex.results?.length || 0}</td>
                  <td>
                    <button
                      className="ui-btn ui-btn-sm ui-btn-outline"
                      onClick={() =>
                        setSelectedExam(selectedExam?.id === ex.id ? null : ex)
                      }
                    >
                      {selectedExam?.id === ex.id ? "Hide" : "Results"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {selectedExam && (
            <div className="mt-4 p-4 border-t">
              <h4 className="font-semibold mb-2">
                {selectedExam.title} - Results
              </h4>
              <table className="ui-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Score</th>
                    <th>Passed</th>
                    <th>Enter Score</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedExam.results?.map((r: any) => (
                    <tr key={r.id}>
                      <td>
                        {r.student?.firstName} {r.student?.lastName}
                      </td>
                      <td>
                        {r.score}/{selectedExam.maxScore}
                      </td>
                      <td>
                        {r.isPassed ? (
                          <span className="ui-badge ui-badge-success">
                            Pass
                          </span>
                        ) : (
                          <span className="ui-badge ui-badge-danger">Fail</span>
                        )}
                      </td>
                      <td>
                        <input
                          className="ui-input w-20"
                          type="number"
                          onBlur={(ev) =>
                            addResult(
                              selectedExam.id,
                              r.studentId,
                              parseFloat(ev.target.value),
                            )
                          }
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
