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

        <div style={{
          marginTop: 20,
          textAlign: "center",
          color: "#aaa",
          fontSize: 14
        }}>
          Don't have an account?{" "}
          <button
            onClick={() => window.location.href = "/register"}
            style={{
              background: "none",
              border: "none",
              color: "#0070f3",
              cursor: "pointer",
              textDecoration: "underline",
              fontSize: 14
            }}
          >
            Create Account
          </button>
        </div>
      </div>
    </div>
  );
}

// Helper functions for score colors
function getScoreColor(score: number | undefined): string {
  if (!score) return '#666';
  if (score >= 0.8) return '#4caf50'; // Green - Excellent
  if (score >= 0.6) return '#8bc34a'; // Light Green - Good
  if (score >= 0.4) return '#ffc107'; // Yellow - Moderate
  if (score >= 0.2) return '#ff9800'; // Orange - Poor
  return '#f44336'; // Red - Very Poor
}

function getSkillMatchColor(skillCount: number | undefined): string {
  if (!skillCount) return '#666';
  if (skillCount >= 3) return '#4caf50'; // Green - Many skills
  if (skillCount >= 2) return '#8bc34a'; // Light Green - Good skills
  if (skillCount >= 1) return '#ffc107'; // Yellow - Some skills
  return '#f44336'; // Red - No skills
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
  const [matches, setMatches] = useState<{ [jobId: string]: any[] }>({});
  const [matchesLoading, setMatchesLoading] = useState<{ [jobId: string]: boolean }>({});
  const [matchesError, setMatchesError] = useState<{ [jobId: string]: string | null }>({});
  const [expandedResumes, setExpandedResumes] = useState<{ [key: string]: boolean }>({});
  const [sortBy, setSortBy] = useState<string>('overall');

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

  const handleShowMatches = async (jobId: string) => {
    setMatchesLoading(prev => ({ ...prev, [jobId]: true }));
    setMatchesError(prev => ({ ...prev, [jobId]: null }));
    try {
      const res = await fetch(`http://localhost:4000/jobs/${jobId}/match`);
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to fetch matches');
      }
      const data = await res.json();
      setMatches(prev => ({ ...prev, [jobId]: data }));
    } catch (err: any) {
      setMatchesError(prev => ({ ...prev, [jobId]: err.message || 'Error fetching matches' }));
    } finally {
      setMatchesLoading(prev => ({ ...prev, [jobId]: false }));
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
                <div style={{ marginTop: 10 }}>
                  <button
                    onClick={() => handleShowMatches(job._id)}
                    style={{ padding: "6px 16px", background: "#0070f3", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: 600 }}
                    disabled={matchesLoading[job._id]}
                  >
                    {matchesLoading[job._id] ? "Loading..." : "Show Matches"}
                  </button>
                </div>
                {matchesError[job._id] && <div style={{ color: "#e57373", marginTop: 8 }}>{matchesError[job._id]}</div>}
                {matches[job._id] && (
                  <div style={{ marginTop: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <strong style={{ fontSize: 18, color: '#fff' }}>Top Matches:</strong>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 14, color: '#aaa' }}>Sort by:</span>
                        <select
                          value={sortBy}
                          onChange={(e) => setSortBy(e.target.value)}
                          style={{
                            background: '#333',
                            color: '#fff',
                            border: '1px solid #555',
                            borderRadius: 4,
                            padding: '4px 8px',
                            fontSize: 12
                          }}
                        >
                          <option value="overall">🎯 Best Overall Match</option>
                          <option value="semantic">🧠 AI Job Fit</option>
                          <option value="skills">⚡ Tech Skills Match</option>
                          <option value="content">📋 Resume Quality</option>
                        </select>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 8 }}>
                      {matches[job._id].length === 0 && <div style={{ color: "#aaa" }}>No matches found.</div>}
                      {(() => {
                        // Sort matches based on selected criteria
                        const sortedMatches = [...matches[job._id]].sort((a, b) => {
                          switch (sortBy) {
                            case 'semantic':
                              return (b.embeddingScore || 0) - (a.embeddingScore || 0);
                            case 'skills':
                              return (b.skillOverlap || 0) - (a.skillOverlap || 0);
                            case 'content':
                              return (b.contentScore || 0) - (a.contentScore || 0);
                            case 'overall':
                            default:
                              return (b.score || 0) - (a.score || 0);
                          }
                        });

                        return sortedMatches.map((match, i) => {
                          const resume = match.resume?.parsedResume || {};
                          const isTop = i === 0;
                          const resumeKey = `${job._id}-${i}`;
                          const expanded = expandedResumes[resumeKey] || false;

                          const toggleExpanded = () => {
                            setExpandedResumes(prev => ({
                              ...prev,
                              [resumeKey]: !prev[resumeKey]
                            }));
                          };

                          return (
                            <div key={i} style={{
                              background: isTop ? "#1e2a3a" : "#181818",
                              border: isTop ? "2px solid #0070f3" : "1px solid #333",
                              borderRadius: 10,
                              boxShadow: isTop ? "0 4px 16px #0070f344" : "0 2px 8px #0002",
                              padding: 18,
                              color: '#fff',
                              position: 'relative',
                            }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ fontWeight: 700, fontSize: 17 }}>
                                  {resume.name || <em>Unnamed Candidate</em>}
                                  {isTop && <span style={{ marginLeft: 8, color: '#0070f3', fontWeight: 600, fontSize: 14 }}>(Best Match)</span>}
                                </div>
                                <button
                                  style={{ background: '#0070f3', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 14px', fontWeight: 600, cursor: 'pointer' }}
                                  onClick={() => alert('Shortlist feature coming soon!')}
                                >
                                  Shortlist
                                </button>
                              </div>
                              {/* Creative Score Display with Visual Indicators */}
                              <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 14 }}>
                                <div style={{ background: '#1a1a2e', padding: 8, borderRadius: 6, border: '1px solid #16213e' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                                    <span>🎯</span>
                                    <strong>Best Overall Match</strong>
                                  </div>
                                  <div style={{ fontSize: 18, fontWeight: 'bold', color: getScoreColor(match.score) }}>
                                    {(match.score * 100).toFixed(1)}%
                                  </div>
                                  <div style={{ fontSize: 11, color: '#aaa' }}>Combined AI + Skills + Quality</div>
                                </div>

                                <div style={{ background: '#1a2e1a', padding: 8, borderRadius: 6, border: '1px solid #213e21' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                                    <span>🧠</span>
                                    <strong>AI Job Fit</strong>
                                  </div>
                                  <div style={{ fontSize: 18, fontWeight: 'bold', color: getScoreColor(match.embeddingScore) }}>
                                    {match.embeddingScore ? (match.embeddingScore * 100).toFixed(1) + '%' : 'N/A'}
                                  </div>
                                  <div style={{ fontSize: 11, color: '#aaa' }}>How well content matches role</div>
                                </div>

                                <div style={{ background: '#2e1a1a', padding: 8, borderRadius: 6, border: '1px solid #3e2121' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                                    <span>⚡</span>
                                    <strong>Tech Skills Match</strong>
                                  </div>
                                  <div style={{ fontSize: 18, fontWeight: 'bold', color: getSkillMatchColor(match.skillOverlap) }}>
                                    {match.skillOverlap || 0} skills
                                  </div>
                                  <div style={{ fontSize: 11, color: '#aaa' }}>
                                    {match.matchingSkills && match.matchingSkills.length > 0
                                      ? match.matchingSkills.slice(0, 2).join(', ') + (match.matchingSkills.length > 2 ? '...' : '')
                                      : 'No matching skills found'
                                    }
                                  </div>
                                </div>

                                <div style={{ background: '#1a1a2e', padding: 8, borderRadius: 6, border: '1px solid #21213e' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                                    <span>📋</span>
                                    <strong>Resume Quality</strong>
                                  </div>
                                  <div style={{ fontSize: 18, fontWeight: 'bold', color: getScoreColor(match.contentScore) }}>
                                    {match.contentScore ? (match.contentScore * 100).toFixed(0) + '%' : 'N/A'}
                                  </div>
                                  <div style={{ fontSize: 11, color: '#aaa' }}>Completeness & detail level</div>
                                </div>
                              </div>
                              <div style={{ marginTop: 6, fontSize: 15 }}>
                                <strong>Skills:</strong> {
                                  resume.skills ? (
                                    typeof resume.skills === 'string' ? resume.skills :
                                      resume.skills.featuredSkills ?
                                        resume.skills.featuredSkills.map((s: any) => s.skill || s).filter(Boolean).join(', ') :
                                        resume.skills.descriptions ?
                                          resume.skills.descriptions.join(', ') :
                                          JSON.stringify(resume.skills)
                                  ) : <em>—</em>
                                }
                              </div>
                              <div style={{ marginTop: 6, fontSize: 15 }}><strong>Experience:</strong> {resume.experience || <em>—</em>}</div>
                              {resume.email && <div style={{ marginTop: 6, fontSize: 15 }}><strong>Email:</strong> {resume.email}</div>}
                              <button
                                style={{ marginTop: 10, background: '#232323', color: '#fff', border: 'none', borderRadius: 6, padding: '5px 12px', fontWeight: 500, cursor: 'pointer', fontSize: 14 }}
                                onClick={toggleExpanded}
                              >
                                {expanded ? 'Hide Full Resume' : 'View Full Resume'}
                              </button>
                              {expanded && (
                                <pre style={{ marginTop: 10, background: '#10151a', color: '#fff', borderRadius: 6, padding: 12, fontSize: 13, overflowX: 'auto' }}>
                                  {JSON.stringify(match.resume, null, 2)}
                                </pre>
                              )}
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>
                )}
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
