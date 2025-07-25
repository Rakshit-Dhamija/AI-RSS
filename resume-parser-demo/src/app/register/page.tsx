"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

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
      background: "#111",
      padding: "1rem"
    }}>
      <div style={{
        width: 420,
        background: "#181818",
        borderRadius: 14,
        boxShadow: "0 4px 32px #0006",
        padding: "2.5rem 2rem",
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
          textAlign: "center"
        }}>Create Account</h2>
        
        <form onSubmit={handleRegister} style={{ 
          width: "100%", 
          display: "flex", 
          flexDirection: "column", 
          gap: 18 
        }}>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Full Name"
            type="text"
            style={{
              width: "100%",
              padding: "12px 14px",
              borderRadius: 7,
              border: "1.5px solid #333",
              background: "#222",
              color: "#fff",
              fontSize: 16,
              outline: "none",
              transition: "border 0.2s"
            }}
            required
            disabled={loading}
          />
          
          <input
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="Email Address"
            type="email"
            style={{
              width: "100%",
              padding: "12px 14px",
              borderRadius: 7,
              border: "1.5px solid #333",
              background: "#222",
              color: "#fff",
              fontSize: 16,
              outline: "none",
              transition: "border 0.2s"
            }}
            required
            disabled={loading}
          />
          
          <select
            value={role}
            onChange={e => setRole(e.target.value)}
            style={{
              width: "100%",
              padding: "12px 14px",
              borderRadius: 7,
              border: "1.5px solid #333",
              background: "#222",
              color: "#fff",
              fontSize: 16,
              outline: "none",
              transition: "border 0.2s"
            }}
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
          
          <input
            value={password}
            onChange={e => setPassword(e.target.value)}
            type="password"
            placeholder="Password (min 6 characters)"
            style={{
              width: "100%",
              padding: "12px 14px",
              borderRadius: 7,
              border: "1.5px solid #333",
              background: "#222",
              color: "#fff",
              fontSize: 16,
              outline: "none",
              transition: "border 0.2s"
            }}
            required
            disabled={loading}
          />
          
          <input
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            type="password"
            placeholder="Confirm Password"
            style={{
              width: "100%",
              padding: "12px 14px",
              borderRadius: 7,
              border: "1.5px solid #333",
              background: "#222",
              color: "#fff",
              fontSize: 16,
              outline: "none",
              transition: "border 0.2s"
            }}
            required
            disabled={loading}
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
            {loading ? "Creating Account..." : "Create Account"}
          </button>
        </form>
        
        <div style={{ 
          marginTop: 18, 
          color: message.includes("successful") ? "#4caf50" : "#e57373", 
          fontWeight: 500, 
          minHeight: 24, 
          textAlign: "center" 
        }}>
          {message}
        </div>
        
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