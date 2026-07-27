"use client";
import { useState, useEffect } from "react";
import { api } from "@unerp/shared/api";
import { ProtectedComponent } from "@unerp/ui";
import { Plus, Loader2 } from "lucide-react";

export default function EducationEnrollmentsPage() {
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    studentId: "",
    courseId: "",
    academicYear: "2026-2027",
    semester: "FALL",
  });
  const [courseFilter, setCourseFilter] = useState("");

  useEffect(() => {
    loadData();
  }, [courseFilter]);
  async function loadData() {
    setLoading(true);
    try {
      const [c, s] = await Promise.all([
        api.get("/ext/education/deep/courses"),
        api.get("/ext/education/deep/students"),
      ]);
      setCourses(c.data || []);
      setStudents(s.data || []);
      const url =
        "/ext/education/deep/enrollments" +
        (courseFilter ? `?courseId=${courseFilter}` : "");
      const r = await api
        .get("/ext/education/deep/courses/" + courseFilter + "/enrollments")
        .catch(() => null);
      if (r?.data) setEnrollments(r.data);
      else {
        const all = await api.get(url).catch(() => ({ data: [] }));
        setEnrollments(all.data || []);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }
  async function createEnrollment() {
    try {
      await api.post("/ext/education/deep/enrollments", form);
      setShowForm(false);
      loadData();
    } catch (e: any) {
      alert(e.message);
    }
  }
  async function updateStatus(id: string, status: string) {
    try {
      await api.patch(`/ext/education/deep/enrollments/${id}/status`, {
        status,
      });
      loadData();
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <div className="ui-page">
      <div className="ui-page-header">
        <h1 className="ui-page-title">Enrollments</h1>
        <ProtectedComponent permission="education.enrollments.create">
          <button
            className="ui-btn ui-btn-primary"
            onClick={() => setShowForm(!showForm)}
          >
            <Plus className="w-4 h-4" /> Enroll Student
          </button>
        </ProtectedComponent>
      </div>
      {showForm && (
        <div className="ui-card p-4 mb-4">
          <h3 className="font-semibold mb-3">New Enrollment</h3>
          <div className="ui-grid-3">
            <div className="ui-form-group">
              <label className="ui-label">Student</label>
              <select
                className="ui-input"
                value={form.studentId}
                onChange={(e) =>
                  setForm({ ...form, studentId: e.target.value })
                }
              >
                <option value="">Select</option>
                {students.map((s: any) => (
                  <option key={s.id} value={s.id}>
                    {s.firstName} {s.lastName} ({s.enrollmentNumber})
                  </option>
                ))}
              </select>
            </div>
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
                    {c.name} ({c.code})
                  </option>
                ))}
              </select>
            </div>
            <div className="ui-form-group">
              <label className="ui-label">Academic Year</label>
              <input
                className="ui-input"
                value={form.academicYear}
                onChange={(e) =>
                  setForm({ ...form, academicYear: e.target.value })
                }
              />
            </div>
            <div className="ui-form-group">
              <label className="ui-label">Semester</label>
              <select
                className="ui-input"
                value={form.semester}
                onChange={(e) => setForm({ ...form, semester: e.target.value })}
              >
                <option value="FALL">Fall</option>
                <option value="SPRING">Spring</option>
                <option value="SUMMER">Summer</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <button
              className="ui-btn ui-btn-primary"
              onClick={createEnrollment}
            >
              Enroll
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
                <th>Student</th>
                <th>Course</th>
                <th>Academic Year</th>
                <th>Semester</th>
                <th>Status</th>
                <th>Enrolled</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {enrollments.map((e: any) => (
                <tr key={e.id}>
                  <td className="font-medium">
                    {e.student?.firstName} {e.student?.lastName}
                  </td>
                  <td>{e.course?.name}</td>
                  <td>{e.academicYear}</td>
                  <td>{e.semester}</td>
                  <td>
                    <span
                      className={`ui-badge ${e.status === "ACTIVE" ? "ui-badge-success" : "ui-badge-info"}`}
                    >
                      {e.status}
                    </span>
                  </td>
                  <td>{new Date(e.enrollmentDate).toLocaleDateString()}</td>
                  <td>
                    <div className="flex gap-1">
                      {e.status === "ACTIVE" && (
                        <button
                          className="ui-btn ui-btn-sm ui-btn-outline"
                          onClick={() => updateStatus(e.id, "COMPLETED")}
                        >
                          Complete
                        </button>
                      )}
                      <button
                        className="ui-btn ui-btn-sm ui-btn-danger"
                        onClick={() => updateStatus(e.id, "DROPPED")}
                      >
                        Drop
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
