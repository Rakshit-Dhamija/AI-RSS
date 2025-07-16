"use client";

import React, { useState, useEffect } from "react";
import ResumeViewer from "./ResumeViewer";

function LoginForm({ onLogin }: { onLogin: (role: string) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch("http://localhost:4000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (data.token) {
        localStorage.setItem("token", data.token);
        if (data.role) {
          localStorage.setItem("role", data.role);
        }
        setMessage("Login successful!");
        onLogin(data.role); // Pass the role directly!
      } else {
        setMessage(data.error || "Login failed");
      }
    } catch (err) {
      setMessage("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#111",
    }}>
      <div style={{
        width: 380,
        background: "#181818",
        borderRadius: 14,
        boxShadow: "0 4px 32px #0006",
        padding: "2.5rem 2rem 2rem 2rem",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        border: "1.5px solid #232323"
      }}>
        <h2 style={{
          marginBottom: 28,
          fontWeight: 700,
          fontSize: 28,
          color: "#fff",
          letterSpacing: 0.0
        }}>Sign in to Resume Parser</h2>
        <form onSubmit={handleLogin} style={{ width: "100%", display: "flex", flexDirection: "column", gap: 18 }}>
          <input
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="Email"
            type="email"
            style={{
              width: "100%",
              padding: "12px 14px",
              borderRadius: 7,
              border: "1.5px solid #333",
              background: "#222",
              color: "#fff",
              fontSize: 16,
              marginBottom: 6,
              outline: "none",
              transition: "border 0.2s"
            }}
            required
          />
          <input
            value={password}
            onChange={e => setPassword(e.target.value)}
            type="password"
            placeholder="Password"
            style={{
              width: "100%",
              padding: "12px 14px",
              borderRadius: 7,
              border: "1.5px solid #333",
              background: "#222",
              color: "#fff",
              fontSize: 16,
              marginBottom: 6,
              outline: "none",
              transition: "border 0.2s"
            }}
            required
          />
          <button
            type="submit"
            style={{
              width: "100%",
              padding: "12px 0",
              background: loading ? "#444" : "#0070f3",
              color: "#fff",
              border: "none",
              borderRadius: 7,
              fontWeight: 700,
              fontSize: 17,
              cursor: loading ? "not-allowed" : "pointer",
              marginTop: 8,
              boxShadow: "0 2px 8px #0002",
              transition: "background 0.2s"
            }}
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
        <div style={{ marginTop: 18, color: message === "Login successful!" ? "#4caf50" : "#e57373", fontWeight: 500, minHeight: 24, textAlign: "center" }}>{message}</div>
      </div>
    </div>
  );
}

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [role, setRole] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [parsedResume, setParsedResume] = useState<any>(null);
  // Recruiter job upload state
  const [jobTitle, setJobTitle] = useState("");
  const [jobDesc, setJobDesc] = useState("");
  const [jobs, setJobs] = useState<any[]>([]);
  const [jobLoading, setJobLoading] = useState(false);
  const [jobError, setJobError] = useState<string | null>(null);

  useEffect(() => {
    // Check for token and role in localStorage on mount
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      setIsAuthenticated(!!token);
      const storedRole = localStorage.getItem("role");
      setRole(storedRole);
    }
  }, []);

  // Fetch jobs for recruiter
  useEffect(() => {
    const fetchJobs = async () => {
      const token = localStorage.getItem("token");
      if ((role === "job_poster" || role === "admin") && token) {
        setJobLoading(true);
        setJobError(null);
        try {
          const res = await fetch("http://localhost:4000/jobs", {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!res.ok) throw new Error("Failed to fetch jobs");
          const data = await res.json();
          setJobs(data);
        } catch (err: any) {
          setJobError(err.message || "Error fetching jobs");
        } finally {
          setJobLoading(false);
        }
      }
    };
    fetchJobs();
  }, [role, isAuthenticated]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setMessage("");
    setParsedResume(null);
    const formData = new FormData();
    formData.append("resume", file);
    try {
      const res = await fetch("http://localhost:4000/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        setMessage("Resume uploaded and parsed successfully!");
        setParsedResume(data.parsedResume);
      } else {
        setMessage(data.error || "Failed to upload resume.");
      }
    } catch (err) {
      setMessage("Error uploading resume.");
    } finally {
      setUploading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    setIsAuthenticated(false);
    setRole(null);
  };

  // Recruiter job upload handler (POST to backend)
  const handleJobUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobTitle.trim() || !jobDesc.trim()) return;
    const token = localStorage.getItem("token");
    if (!token) return;
    setJobLoading(true);
    setJobError(null);
    try {
      const res = await fetch("http://localhost:4000/jobs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title: jobTitle, description: jobDesc }),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to upload job");
      }
      setJobTitle("");
      setJobDesc("");
      // Refresh jobs list
      const jobsRes = await fetch("http://localhost:4000/jobs", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const jobsData = await jobsRes.json();
      setJobs(jobsData);
    } catch (err: any) {
      setJobError(err.message || "Error uploading job");
    } finally {
      setJobLoading(false);
    }
  };

  if (!isAuthenticated) {
    return <LoginForm onLogin={(roleFromLogin) => {
      setIsAuthenticated(true);
      setRole(roleFromLogin); // Use the role directly!
    }} />;
  }

  // Debug: log the current role
  console.log('Current role:', role);

  // Recruiter dashboard (for job_poster and admin)
  if (role === "job_poster" || role === "admin") {
    return (
      <main style={{ minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", background: "#111", color: "#fff", position: "relative" }}>
        <div style={{ width: "100%", display: "flex", justifyContent: "flex-end", padding: "1rem", position: "absolute", top: 0, left: 0 }}>
          <button
            onClick={handleLogout}
            style={{
              padding: "8px 18px",
              background: "#2d1a1a",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
              fontWeight: 600,
              boxShadow: "0 2px 8px #0002",
              transition: "background 0.2s",
              outline: "none",
            }}
            onMouseOver={e => (e.currentTarget.style.background = '#a94442')}
            onMouseOut={e => (e.currentTarget.style.background = '#2d1a1a')}
          >
            Logout
          </button>
        </div>
        <h1 style={{ marginTop: 80 }}>Recruiter Dashboard</h1>
        <form onSubmit={handleJobUpload} style={{ background: "#181818", padding: 24, borderRadius: 10, boxShadow: "0 2px 8px #0004", margin: "2rem 0", minWidth: 340 }}>
          <h2 style={{ marginBottom: 16 }}>Upload Job Description</h2>
          <input
            value={jobTitle}
            onChange={e => setJobTitle(e.target.value)}
            placeholder="Job Title"
            style={{ width: "100%", padding: 10, marginBottom: 12, borderRadius: 6, border: "1.5px solid #333", background: "#222", color: "#fff" }}
            required
            disabled={jobLoading}
          />
          <textarea
            value={jobDesc}
            onChange={e => setJobDesc(e.target.value)}
            placeholder="Enter the full job description here (you can paste a paragraph or more)"
            rows={10}
            style={{ width: "100%", minHeight: 120, padding: 12, marginBottom: 12, borderRadius: 6, border: "1.5px solid #333", background: "#222", color: "#fff", resize: "vertical", fontSize: 16, lineHeight: 1.5 }}
            required
            disabled={jobLoading}
          />
          <button type="submit" style={{ width: "100%", padding: 12, background: "#0070f3", color: "#fff", border: "none", borderRadius: 7, fontWeight: 700, fontSize: 16, cursor: jobLoading ? "not-allowed" : "pointer" }} disabled={jobLoading}>
            {jobLoading ? "Uploading..." : "Upload Job"}
          </button>
          {jobError && <div style={{ color: "#e57373", marginTop: 10 }}>{jobError}</div>}
        </form>
        <div style={{ width: 400, margin: "0 auto" }}>
          <h3 style={{ marginBottom: 10 }}>Uploaded Jobs</h3>
          {jobLoading && <p style={{ color: "#aaa" }}>Loading jobs...</p>}
          {!jobLoading && jobs.length === 0 && <p style={{ color: "#aaa" }}>No jobs uploaded yet.</p>}
          <ul style={{ listStyle: "none", padding: 0 }}>
            {jobs.map((job, idx) => (
              <li key={job._id || idx} style={{ background: "#232323", marginBottom: 12, padding: 16, borderRadius: 8 }}>
                <strong>{job.title}</strong>
                <p style={{ margin: "8px 0 0 0", color: "#ccc" }}>{job.description}</p>
                <span style={{ fontSize: 12, color: "#888" }}>{job.createdAt ? new Date(job.createdAt).toLocaleString() : ""}</span>
              </li>
            ))}
          </ul>
        </div>
      </main>
    );
  }

  return (
    <main style={{ minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", background: "#111", color: "#fff", position: "relative" }}>
      <div style={{ width: "100%", display: "flex", justifyContent: "flex-end", padding: "1rem", position: "absolute", top: 0, left: 0 }}>
        <button
          onClick={handleLogout}
          style={{
            padding: "8px 18px",
            background: "#2d1a1a",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
            fontWeight: 600,
            boxShadow: "0 2px 8px #0002",
            transition: "background 0.2s",
            outline: "none",
          }}
          onMouseOver={e => (e.currentTarget.style.background = '#a94442')}
          onMouseOut={e => (e.currentTarget.style.background = '#2d1a1a')}
        >
          Logout
        </button>
      </div>
      <h1 style={{ marginTop: 80 }}>Resume Uploader</h1>
      <label htmlFor="file-upload" style={{
        display: "inline-block",
        padding: "12px 28px",
        background: "#222",
        color: "#fff",
        borderRadius: 8,
        fontWeight: 600,
        fontSize: 16,
        cursor: "pointer",
        boxShadow: "0 2px 8px #0002",
        border: "2px solid #444",
        margin: "1rem 0"
      }}>
        Choose PDF File
      <input
          id="file-upload"
        type="file"
        accept="application/pdf"
        onChange={handleFileChange}
        disabled={uploading}
          style={{ display: "none" }}
            />
      </label>
      {uploading && <p>Uploading...</p>}
      {message && <p>{message}</p>}
      {parsedResume && <ResumeViewer resume={parsedResume} />}
      </main>
  );
}
