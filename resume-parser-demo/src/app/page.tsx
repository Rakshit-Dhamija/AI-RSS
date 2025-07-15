"use client";

import React, { useState, useEffect } from "react";
import ResumeViewer from "./ResumeViewer";

function LoginForm({ onLogin }: { onLogin: () => void }) {
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
        setMessage("Login successful!");
        onLogin();
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
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [parsedResume, setParsedResume] = useState<any>(null);

  useEffect(() => {
    // Check for token in localStorage on mount
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      setIsAuthenticated(!!token);
    }
  }, []);

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

  if (!isAuthenticated) {
    return <LoginForm onLogin={() => setIsAuthenticated(true)} />;
  }

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsAuthenticated(false);
  };

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
