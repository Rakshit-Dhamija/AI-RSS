"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import "../../styles/globals.css";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const roles = [
    { value: "user", label: "Job Seeker" },
    { value: "job_poster", label: "Recruiter/HR" },
    { value: "admin", label: "Administrator" },
    { value: "interviewer", label: "Interviewer" }
  ];

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    
    // Validation
    if (!email || !password || !role || !name) {
      setMessage("All fields are required");
      return;
    }
    
    if (password !== confirmPassword) {
      setMessage("Passwords do not match");
      return;
    }
    
    if (password.length < 6) {
      setMessage("Password must be at least 6 characters long");
      return;
    }

    setLoading(true);
    setMessage("");
    
    try {
      const res = await fetch("http://localhost:4000/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, role, name }),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setMessage("Registration successful! Redirecting to login...");
        setTimeout(() => {
          router.push("/");
        }, 2000);
      } else {
        setMessage(data.error || "Registration failed");
      }
    } catch (err) {
      setMessage("Network error. Please try again.");
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
      padding: "20px"
    }}>
      <div className="card fade-in" style={{
        width: "100%",
        maxWidth: 450,
        textAlign: "center"
      }}>
        {/* Logo and Title */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🎯</div>
          <h1 style={{ 
            fontSize: 28, 
            fontWeight: 700, 
            marginBottom: 8,
            background: 'linear-gradient(135deg, #0070f3 0%, #00d4ff 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Create Account
          </h1>
          <p style={{ 
            color: 'rgba(255, 255, 255, 0.6)', 
            fontSize: 16,
            margin: 0 
          }}>
            Join Resume Parser AI Platform
          </p>
        </div>
        
        <form onSubmit={handleRegister} style={{ 
          display: "flex", 
          flexDirection: "column", 
          gap: 20 
        }}>
          <div>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Full Name"
              type="text"
              className="input-field"
              required
              disabled={loading}
            />
          </div>
          
          <div>
            <input
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Email Address"
              type="email"
              className="input-field"
              required
              disabled={loading}
            />
          </div>
          
          <div>
            <select
              value={role}
              onChange={e => setRole(e.target.value)}
              className="input-field"
              required
              disabled={loading}
            >
              <option value="">Select Your Role</option>
              {roles.map(roleOption => (
                <option key={roleOption.value} value={roleOption.value}>
                  {roleOption.label}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <input
              value={password}
              onChange={e => setPassword(e.target.value)}
              type="password"
              placeholder="Password (min 6 characters)"
              className="input-field"
              required
              disabled={loading}
            />
          </div>
          
          <div>
            <input
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              type="password"
              placeholder="Confirm Password"
              className="input-field"
              required
              disabled={loading}
            />
          </div>
          
          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
            style={{ 
              fontSize: 16,
              padding: '14px 24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              marginTop: 8
            }}
          >
            {loading && <div className="loading-spinner"></div>}
            {loading ? "Creating Account..." : "🚀 Create Account"}
          </button>
        </form>
        
        {message && (
          <div className={`fade-in ${message.includes("successful") ? "status-success" : "status-error"}`}>
            {message}
          </div>
        )}
        
        <div style={{ 
          marginTop: 20, 
          textAlign: "center",
          color: "#aaa",
          fontSize: 14
        }}>
          Already have an account?{" "}
          <button
            onClick={() => router.push("/")}
            style={{
              background: "none",
              border: "none",
              color: "#0070f3",
              cursor: "pointer",
              textDecoration: "underline",
              fontSize: 14
            }}
          >
            Sign In
          </button>
        </div>
      </div>
    </div>
  );
}