import React, { useState } from 'react';

interface ProfessionalLoginProps {
  onLogin: (role: string) => void;
}

export default function ProfessionalLogin({ onLogin }: ProfessionalLoginProps) {
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
        setMessage("✅ Login successful!");
        setTimeout(() => onLogin(data.role), 500);
      } else {
        setMessage(data.error || "❌ Login failed");
      }
    } catch (err) {
      setMessage("❌ Network error - please check if backend is running");
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
        maxWidth: 420,
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
            Resume Parser AI
          </h1>
          <p style={{ 
            color: 'rgba(255, 255, 255, 0.6)', 
            fontSize: 16,
            margin: 0 
          }}>
            Universal AI-Powered Resume Matching
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} style={{ 
          display: "flex", 
          flexDirection: "column", 
          gap: 20 
        }}>
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
            <input
              value={password}
              onChange={e => setPassword(e.target.value)}
              type="password"
              placeholder="Password"
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
              gap: 8
            }}
          >
            {loading && <div className="loading-spinner"></div>}
            {loading ? "Signing in..." : "🚀 Sign In"}
          </button>
        </form>

        {/* Status Message */}
        {message && (
          <div className={`fade-in ${message.includes("✅") ? "status-success" : "status-error"}`}>
            {message}
          </div>
        )}

        {/* Demo Account Info */}
        <div className="status-info" style={{ marginTop: 24 }}>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>
            🎯 Demo Account
          </div>
          <div style={{ fontSize: 14, opacity: 0.9 }}>
            <strong>Email:</strong> demo@recruiter.com<br/>
            <strong>Password:</strong> demo123
          </div>
        </div>

        {/* Register Link */}
        <div style={{ 
          marginTop: 24, 
          padding: '16px 0',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          color: 'rgba(255, 255, 255, 0.6)',
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
              fontSize: 14,
              fontWeight: 600
            }}
          >
            Create Account
          </button>
        </div>
      </div>
    </div>
  );
}