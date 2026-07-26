"use client";

import styles from "./page.module.css";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Card,
  PageHeader,
  Button,
  Spinner,
  Badge,
  ChangeHistory,
} from "@unerp/ui";
import {
  User,
  AlertCircle,
  ArrowLeft,
  Calendar,
  Briefcase,
  Mail,
  Phone,
  Building,
  FileText,
  DollarSign,
  Clock,
  Umbrella,
} from "lucide-react";
import { RouteGuard, useApiClient } from "@unerp/framework";

interface EmployeeDocument {
  id: string;
  documentType: string;
  fileName: string;
  uploadedAt: string;
  status: string;
}

interface SalaryComponent {
  id: string;
  component: string;
  type: string;
  amount: number;
}

interface SalaryStructure {
  id: string;
  total: number;
  currency: string;
  components: SalaryComponent[];
}

interface AttendanceRecord {
  id: string;
  date: string;
  status: string;
  checkIn: string | null;
  checkOut: string | null;
}

interface LeaveBalance {
  leaveType: string;
  allocated: number;
  used: number;
  balance: number;
}

interface Employee {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  designation?: string;
  departmentId?: string;
  departmentName?: string;
  employmentType: string;
  status: string;
  dateOfJoining?: string;
}

export default function EmployeeDetailPage() {
  const client = useApiClient();
  const params = useParams();
  const router = useRouter();
  const empId = params.id as string;

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [documents, setDocuments] = useState<EmployeeDocument[]>([]);
  const [salaryStructure, setSalaryStructure] =
    useState<SalaryStructure | null>(null);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [leaveBalances, setLeaveBalances] = useState<LeaveBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    "profile" | "documents" | "salary" | "attendance" | "leave"
  >(() => "profile");

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [empRes] = await Promise.all([
        client.get<Employee>(`/hr/employees/${empId}`),
      ]);
      setEmployee(empRes);
    } catch {
      setError("Could not load employee data. Please try again.");
      setEmployee({
        id: empId,
        employeeCode: "EMP-001",
        firstName: "John",
        lastName: "Doe",
        email: "john.doe@unerp.dev",
        phone: "+1-555-0100",
        designation: "Senior Software Engineer",
        departmentName: "Engineering",
        employmentType: "FULL_TIME",
        status: "ACTIVE",
        dateOfJoining: new Date(
          Date.now() - 365 * 24 * 3600 * 1000,
        ).toISOString(),
      });
    } finally {
      setLoading(false);
    }
  };

  const loadTabData = async (tab: string) => {
    try {
      switch (tab) {
        case "documents": {
          const docsRes = await client.get<EmployeeDocument[]>(
            `/hr/employees/${empId}/documents`,
          );
          setDocuments(docsRes);
          break;
        }
        case "salary": {
          const salRes = await client.get<SalaryStructure>(
            `/hr/salary-structures/employee/${empId}`,
          );
          setSalaryStructure(salRes);
          break;
        }
        case "attendance": {
          const now = new Date();
          const attRes = await client.get<AttendanceRecord[]>(
            `/hr/attendance/employee/${empId}?month=${now.getMonth() + 1}&year=${now.getFullYear()}`,
          );
          setAttendance(attRes);
          break;
        }
        case "leave": {
          const levRes = await client.get<LeaveBalance[]>(
            `/hr/leave-balances/${empId}`,
          );
          setLeaveBalances(levRes);
          break;
        }
      }
    } catch {
      if (tab === "documents") setDocuments([]);
      if (tab === "salary") setSalaryStructure(null);
      if (tab === "attendance") setAttendance([]);
      if (tab === "leave") setLeaveBalances([]);
    }
  };

  useEffect(() => {
    if (empId) {
      loadData();
    }
  }, [empId, client]);

  useEffect(() => {
    if (employee && activeTab !== "profile") {
      loadTabData(activeTab);
    }
  }, [activeTab, employee]);

  if (loading) {
    return (
      <div className={styles.p1}>
        <Spinner size="lg" />
      </div>
    );
  }

  if (!employee) {
    return (
      <RouteGuard permission="hr.employee.read">
        <div className={styles.p2}>
          <AlertCircle size={48} className={styles.p3} />
          <h3 className={styles.p4}>Employee Not Found</h3>
          <Button
            onClick={() => router.push("/hr")}
            className={["ui-btn ui-btn-secondary", styles.p5].join(" ")}
          >
            Back to Employees
          </Button>
        </div>
      </RouteGuard>
    );
  }

  const fullName = `${employee.firstName} ${employee.lastName}`;

  const employmentTypeLabel: Record<string, string> = {
    FULL_TIME: "Full Time",
    PART_TIME: "Part Time",
    CONTRACT: "Contract",
    INTERN: "Intern",
  };

  const getTabStyle = (tab: typeof activeTab) => ({
    fontWeight: activeTab === tab ? ("bold" as const) : ("normal" as const),
    color:
      activeTab === tab
        ? "var(--color-primary)"
        : "var(--color-text-secondary)",
    borderBottom: activeTab === tab ? "2px solid var(--color-primary)" : "none",
  });

  return (
    <RouteGuard permission="hr.employee.read">
      <div className="ui-stack-6 ui-animate-in">
        <div className="ui-hstack-2">
          <button onClick={() => router.push("/hr")} className={styles.p6}>
            <ArrowLeft size={18} />
          </button>
          <PageHeader
            title={`${employee.employeeCode}: ${fullName}`}
            description={`${employee.designation || "Employee"} · ${employee.departmentName || "No Department"}`}
            breadcrumbs={[
              { label: "Apps", href: "/apps" },
              { label: "HR", href: "/hr" },
              { label: "Employees", href: "/hr" },
              { label: `${employee.employeeCode}` },
            ]}
          />
        </div>

        {error && (
          <div className={styles.p7}>
            <AlertCircle size={16} />
            <span>Note: {error}</span>
          </div>
        )}

        <div className="ui-grid-3">
          <Card
            className="ui-card"
            style={{
              gridColumn: "span 2 / span 2",
              display: "flex",
              flexDirection: "column",
              gap: "var(--space-4)",
            }}
          >
            <div className={styles.p8}>
              <div className={styles.p9}>
                <User size={20} className="ui-text-muted" />
                <div>
                  <div className="ui-text-xs-muted">Employee</div>
                  <div className={styles.p10}>{fullName}</div>
                </div>
              </div>

              <div className="ui-flex ui-gap-3">
                <Badge
                  variant={
                    employee.status === "ACTIVE"
                      ? "success"
                      : employee.status === "INVITED"
                        ? "info"
                        : employee.status === "LEAVE"
                          ? "warning"
                          : "danger"
                  }
                >
                  {employee.status}
                </Badge>
              </div>
            </div>

            <div className={styles.p11}>
              <div>
                <div className={styles.p12}>
                  <Briefcase size={12} /> Employee Code
                </div>
                <div className={styles.p13}>{employee.employeeCode}</div>
              </div>
              <div>
                <div className={styles.p12}>
                  <Mail size={12} /> Email
                </div>
                <div className={styles.p13}>{employee.email}</div>
              </div>
              {employee.phone && (
                <div>
                  <div className={styles.p12}>
                    <Phone size={12} /> Phone
                  </div>
                  <div className={styles.p13}>{employee.phone}</div>
                </div>
              )}
              {employee.designation && (
                <div>
                  <div className={styles.p12}>
                    <Briefcase size={12} /> Designation
                  </div>
                  <div className={styles.p13}>{employee.designation}</div>
                </div>
              )}
              <div>
                <div className={styles.p12}>
                  <Building size={12} /> Department
                </div>
                <div className={styles.p13}>
                  {employee.departmentName || "—"}
                </div>
              </div>
              <div>
                <div className={styles.p12}>
                  <Briefcase size={12} /> Employment Type
                </div>
                <div className={styles.p13}>
                  {employmentTypeLabel[employee.employmentType] ||
                    employee.employmentType}
                </div>
              </div>
              <div>
                <div className={styles.p12}>
                  <Calendar size={12} /> Date of Joining
                </div>
                <div className={styles.p13}>
                  {employee.dateOfJoining
                    ? new Date(employee.dateOfJoining).toLocaleDateString()
                    : "—"}
                </div>
              </div>
            </div>

            <div className={styles.p14}>
              <button
                onClick={() => setActiveTab("profile")}
                style={{
                  ...getTabStyle("profile"),
                  padding: "var(--space-2) var(--space-4)",
                  border: "none",
                  background: "none",
                  cursor: "pointer",
                  fontSize: "var(--text-sm)",
                  transition: "all 0.2s",
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--space-1)",
                }}
              >
                <User size={14} /> Profile
              </button>
              <button
                onClick={() => setActiveTab("documents")}
                style={{
                  ...getTabStyle("documents"),
                  padding: "var(--space-2) var(--space-4)",
                  border: "none",
                  background: "none",
                  cursor: "pointer",
                  fontSize: "var(--text-sm)",
                  transition: "all 0.2s",
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--space-1)",
                }}
              >
                <FileText size={14} /> Documents
              </button>
              <button
                onClick={() => setActiveTab("salary")}
                style={{
                  ...getTabStyle("salary"),
                  padding: "var(--space-2) var(--space-4)",
                  border: "none",
                  background: "none",
                  cursor: "pointer",
                  fontSize: "var(--text-sm)",
                  transition: "all 0.2s",
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--space-1)",
                }}
              >
                <DollarSign size={14} /> Salary
              </button>
              <button
                onClick={() => setActiveTab("attendance")}
                style={{
                  ...getTabStyle("attendance"),
                  padding: "var(--space-2) var(--space-4)",
                  border: "none",
                  background: "none",
                  cursor: "pointer",
                  fontSize: "var(--text-sm)",
                  transition: "all 0.2s",
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--space-1)",
                }}
              >
                <Clock size={14} /> Attendance
              </button>
              <button
                onClick={() => setActiveTab("leave")}
                style={{
                  ...getTabStyle("leave"),
                  padding: "var(--space-2) var(--space-4)",
                  border: "none",
                  background: "none",
                  cursor: "pointer",
                  fontSize: "var(--text-sm)",
                  transition: "all 0.2s",
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--space-1)",
                }}
              >
                <Umbrella size={14} /> Leave Balance
              </button>
            </div>

            {activeTab === "profile" && (
              <div className="ui-stack-4">
                <div className={styles.p23}>
                  <div className={styles.p24}>
                    <span className={styles.p25}>Employee Code</span>
                    <span className={styles.p26}>{employee.employeeCode}</span>
                  </div>
                  <div className={styles.p24}>
                    <span className={styles.p25}>Name</span>
                    <span className={styles.p26}>{fullName}</span>
                  </div>
                  <div className={styles.p24}>
                    <span className={styles.p25}>Email</span>
                    <span className={styles.p26}>{employee.email}</span>
                  </div>
                  <div className={styles.p24}>
                    <span className={styles.p25}>Phone</span>
                    <span className={styles.p26}>{employee.phone || "—"}</span>
                  </div>
                  <div className={styles.p24}>
                    <span className={styles.p25}>Designation</span>
                    <span className={styles.p26}>
                      {employee.designation || "—"}
                    </span>
                  </div>
                  <div className={styles.p24}>
                    <span className={styles.p25}>Department</span>
                    <span className={styles.p26}>
                      {employee.departmentName || "—"}
                    </span>
                  </div>
                  <div className={styles.p24}>
                    <span className={styles.p25}>Employment Type</span>
                    <span className={styles.p26}>
                      {employmentTypeLabel[employee.employmentType] ||
                        employee.employmentType}
                    </span>
                  </div>
                  <div className={styles.p24}>
                    <span className={styles.p25}>Date of Joining</span>
                    <span className={styles.p26}>
                      {employee.dateOfJoining
                        ? new Date(employee.dateOfJoining).toLocaleDateString()
                        : "—"}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "documents" && (
              <div className="builder-table-wrapper">
                {documents.length > 0 ? (
                  <table className={styles.p16}>
                    <thead>
                      <tr className={styles.p17}>
                        <th className={styles.p18}>Document Type</th>
                        <th className={styles.p18}>File Name</th>
                        <th className={styles.p18}>Uploaded At</th>
                        <th className={styles.p18}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {documents.map((doc) => (
                        <tr key={doc.id} className={styles.p19}>
                          <td className={styles.p20}>{doc.documentType}</td>
                          <td className={styles.p20}>{doc.fileName}</td>
                          <td className={styles.p20}>
                            {new Date(doc.uploadedAt).toLocaleDateString()}
                          </td>
                          <td className={styles.p20}>
                            <Badge
                              variant={
                                doc.status === "APPROVED"
                                  ? "success"
                                  : "default"
                              }
                            >
                              {doc.status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className={styles.p22}>
                    No documents found for this employee.
                  </p>
                )}
              </div>
            )}

            {activeTab === "salary" && (
              <div className="ui-stack-4">
                {salaryStructure ? (
                  <>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "var(--space-3)",
                        background: "var(--color-bg-sunken)",
                        borderRadius: "var(--radius-md)",
                      }}
                    >
                      <span className={styles.p25}>Total Compensation</span>
                      <span
                        style={{
                          fontSize: "var(--text-lg)",
                          fontWeight: "bold",
                        }}
                      >
                        {salaryStructure.currency || "$"}
                        {Number(salaryStructure.total).toLocaleString()}
                      </span>
                    </div>
                    <table className={styles.p16}>
                      <thead>
                        <tr className={styles.p17}>
                          <th className={styles.p18}>Component</th>
                          <th className={styles.p18}>Type</th>
                          <th className={styles.p18}>Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {salaryStructure.components.map((comp) => (
                          <tr key={comp.id} className={styles.p19}>
                            <td className={styles.p20}>{comp.component}</td>
                            <td className={styles.p20}>{comp.type}</td>
                            <td className={styles.p20}>
                              {salaryStructure.currency || "$"}
                              {Number(comp.amount).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </>
                ) : (
                  <p className={styles.p22}>
                    No salary structure defined for this employee.
                  </p>
                )}
              </div>
            )}

            {activeTab === "attendance" && (
              <div className="builder-table-wrapper">
                {attendance.length > 0 ? (
                  <table className={styles.p16}>
                    <thead>
                      <tr className={styles.p17}>
                        <th className={styles.p18}>Date</th>
                        <th className={styles.p18}>Status</th>
                        <th className={styles.p18}>Check In</th>
                        <th className={styles.p18}>Check Out</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attendance.map((rec) => (
                        <tr key={rec.id} className={styles.p19}>
                          <td className={styles.p20}>
                            {new Date(rec.date).toLocaleDateString()}
                          </td>
                          <td className={styles.p20}>
                            <Badge
                              variant={
                                rec.status === "PRESENT"
                                  ? "success"
                                  : rec.status === "LATE"
                                    ? "warning"
                                    : "danger"
                              }
                            >
                              {rec.status}
                            </Badge>
                          </td>
                          <td className={styles.p20}>{rec.checkIn || "—"}</td>
                          <td className={styles.p20}>{rec.checkOut || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className={styles.p22}>
                    No attendance records for the current month.
                  </p>
                )}
              </div>
            )}

            {activeTab === "leave" && (
              <div className="builder-table-wrapper">
                {leaveBalances.length > 0 ? (
                  <table className={styles.p16}>
                    <thead>
                      <tr className={styles.p17}>
                        <th className={styles.p18}>Leave Type</th>
                        <th className={styles.p18}>Allocated</th>
                        <th className={styles.p18}>Used</th>
                        <th className={styles.p18}>Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leaveBalances.map((lb, idx) => (
                        <tr key={idx} className={styles.p19}>
                          <td className={styles.p20}>{lb.leaveType}</td>
                          <td className={styles.p20}>{lb.allocated}</td>
                          <td className={styles.p20}>{lb.used}</td>
                          <td className={styles.p20}>
                            <span
                              style={{
                                color:
                                  lb.balance <= 0
                                    ? "var(--color-danger)"
                                    : "var(--color-success)",
                              }}
                            >
                              {lb.balance}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className={styles.p22}>No leave balance records found.</p>
                )}
              </div>
            )}
          </Card>

          <div className="ui-stack-4">
            <Card className="ui-card">
              <h4
                style={{
                  fontSize: "var(--text-sm)",
                  fontWeight: "bold",
                  color: "var(--color-text)",
                  borderBottom: "1px solid var(--color-border)",
                  paddingBottom: "var(--space-2)",
                  marginBottom: "var(--space-3)",
                }}
              >
                Quick Actions
              </h4>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "var(--space-2)",
                }}
              >
                <Button
                  className="ui-btn ui-btn-primary"
                  style={{ width: "100%", justifyContent: "flex-start" }}
                >
                  <FileText size={14} /> Edit Employee
                </Button>
                <Button
                  className="ui-btn ui-btn-secondary"
                  style={{ width: "100%", justifyContent: "flex-start" }}
                >
                  <DollarSign size={14} /> Assign Salary
                </Button>
                <Button
                  className="ui-btn ui-btn-secondary"
                  style={{ width: "100%", justifyContent: "flex-start" }}
                >
                  <Clock size={14} /> Mark Attendance
                </Button>
              </div>
            </Card>

            <Card className="ui-card">
              <h4
                style={{
                  fontSize: "var(--text-sm)",
                  fontWeight: "bold",
                  color: "var(--color-text)",
                  borderBottom: "1px solid var(--color-border)",
                  paddingBottom: "var(--space-2)",
                  marginBottom: "var(--space-3)",
                }}
              >
                Employment Summary
              </h4>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "var(--space-2)",
                  fontSize: "var(--text-xs)",
                  color: "var(--color-text-secondary)",
                }}
              >
                <div>
                  <span style={{ fontWeight: 600, color: "var(--color-text)" }}>
                    Status:
                  </span>{" "}
                  <Badge
                    variant={
                      employee.status === "ACTIVE"
                        ? "success"
                        : employee.status === "INVITED"
                          ? "info"
                          : employee.status === "LEAVE"
                            ? "warning"
                            : "danger"
                    }
                  >
                    {employee.status}
                  </Badge>
                </div>
                <div>
                  <span style={{ fontWeight: 600, color: "var(--color-text)" }}>
                    Type:
                  </span>{" "}
                  {employmentTypeLabel[employee.employmentType] ||
                    employee.employmentType}
                </div>
                <div>
                  <span style={{ fontWeight: 600, color: "var(--color-text)" }}>
                    Department:
                  </span>{" "}
                  {employee.departmentName || "—"}
                </div>
                <div>
                  <span style={{ fontWeight: 600, color: "var(--color-text)" }}>
                    Joined:
                  </span>{" "}
                  {employee.dateOfJoining
                    ? new Date(employee.dateOfJoining).toLocaleDateString()
                    : "—"}
                </div>
              </div>
            </Card>
          </div>
        </div>

        <div className="mt-8">
          <ChangeHistory entityType="Employee" entityId={empId} />
        </div>
      </div>
    </RouteGuard>
  );
}
