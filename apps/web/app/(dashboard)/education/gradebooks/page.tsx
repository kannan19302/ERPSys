"use client";
import { useState, useEffect } from "react";
import { api } from "@unerp/shared/api";
import { ProtectedComponent } from "@unerp/ui";
import { Plus, Loader2 } from "lucide-react";

export default function EducationGradebooksPage() {
  const [gradebooks, setGradebooks] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGb, setSelectedGb] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    courseId: "",
    name: "",
    weight: "100",
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
        "/ext/education/deep/gradebooks" +
          (courseFilter ? `?courseId=${courseFilter}` : ""),
      );
      setGradebooks(r.data || []);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }
  async function createGradebook() {
    try {
      await api.post("/ext/education/deep/gradebooks", form);
      setShowForm(false);
      loadData();
    } catch (e) {
      console.error(e);
    }
  }
  async function upsertEntry(
    gradebookId: string,
    studentId: string,
    score: number,
  ) {
    try {
      await api.post(`/ext/education/deep/gradebooks/${gradebookId}/entries`, {
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
        <h1 className="ui-page-title">Gradebooks</h1>
        <ProtectedComponent permission="education.grades.create">
          <button
            className="ui-btn ui-btn-primary"
            onClick={() => setShowForm(!showForm)}
          >
            <Plus className="w-4 h-4" /> New Gradebook
          </button>
        </ProtectedComponent>
      </div>
      {showForm && (
        <div className="ui-card p-4 mb-4">
          <h3 className="font-semibold mb-3">Create Gradebook</h3>
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
              <label className="ui-label">Name</label>
              <input
                className="ui-input"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Midterm Exam"
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
            <button className="ui-btn ui-btn-primary" onClick={createGradebook}>
              Create
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
                <th>Gradebook</th>
                <th>Max Score</th>
                <th>Entries</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {gradebooks.map((gb: any) => (
                <tr key={gb.id}>
                  <td>{gb.course?.name}</td>
                  <td className="font-medium">{gb.name}</td>
                  <td>{gb.maxScore}</td>
                  <td>{gb.entries?.length || 0}</td>
                  <td>
                    <button
                      className="ui-btn ui-btn-sm ui-btn-outline"
                      onClick={() =>
                        setSelectedGb(selectedGb?.id === gb.id ? null : gb)
                      }
                    >
                      {selectedGb?.id === gb.id ? "Hide" : "View"} Grades
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {selectedGb && (
            <div className="mt-4 p-4 border-t">
              <h4 className="font-semibold mb-2">
                {selectedGb.name} - Grade Entry
              </h4>
              <table className="ui-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Score</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedGb.entries?.map((e: any) => (
                    <tr key={e.id}>
                      <td>
                        {e.student?.firstName} {e.student?.lastName}
                      </td>
                      <td>
                        <span
                          className={
                            e.score >= selectedGb.maxScore * 0.6
                              ? "text-green-600"
                              : "text-red-600"
                          }
                        >
                          {e.score}/{selectedGb.maxScore}
                        </span>
                      </td>
                      <td>
                        <input
                          className="ui-input w-20"
                          type="number"
                          defaultValue={e.score}
                          onBlur={(ev) =>
                            upsertEntry(
                              selectedGb.id,
                              e.studentId,
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
