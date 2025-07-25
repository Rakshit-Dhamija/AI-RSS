import React, { useState } from 'react';

interface Job {
  _id: string;
  title: string;
  description: string;
  createdAt: string;
}

interface JobManagementProps {
  jobs: Job[];
  onJobUpload: (title: string, description: string) => Promise<void>;
  onShowMatches: (jobId: string) => void;
  jobLoading: boolean;
  jobError: string | null;
  matchesLoading: { [jobId: string]: boolean };
  matchesError: { [jobId: string]: string | null };
}

export default function JobManagement({
  jobs,
  onJobUpload,
  onShowMatches,
  jobLoading,
  jobError,
  matchesLoading,
  matchesError
}: JobManagementProps) {
  const [jobTitle, setJobTitle] = useState("");
  const [jobDesc, setJobDesc] = useState("");
  const [showForm, setShowForm] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobTitle.trim() || !jobDesc.trim()) return;
    
    await onJobUpload(jobTitle, jobDesc);
    setJobTitle("");
    setJobDesc("");
    setShowForm(false);
  };

  return (
    <div className="slide-up" style={{ maxWidth: 1200, margin: '0 auto', padding: '0 20px' }}>
      {/* Header with Add Job Button */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: 32
      }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, margin: 0, marginBottom: 4 }}>
            Job Postings
          </h2>
          <p style={{ color: 'rgba(255, 255, 255, 0.6)', margin: 0 }}>
            Manage your job postings and find the best candidates
          </p>
        </div>
        
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: 8 }}
        >
          {showForm ? '❌ Cancel' : '➕ Add New Job'}
        </button>
      </div>

      {/* Job Upload Form */}
      {showForm && (
        <div className="card fade-in" style={{ marginBottom: 32 }}>
          <div className="card-header">
            <h3 style={{ fontSize: 20, fontWeight: 600, margin: 0 }}>
              🚀 Create New Job Posting
            </h3>
            <p style={{ color: 'rgba(255, 255, 255, 0.6)', margin: '4px 0 0 0', fontSize: 14 }}>
              AI will enhance your job description for better candidate matching
            </p>
          </div>
          
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: 8, 
                fontWeight: 600,
                color: 'rgba(255, 255, 255, 0.9)'
              }}>
                Job Title *
              </label>
              <input
                value={jobTitle}
                onChange={e => setJobTitle(e.target.value)}
                placeholder="e.g., Senior Software Engineer, Marketing Manager, ICU Nurse"
                className="input-field"
                required
                disabled={jobLoading}
              />
            </div>
            
            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: 8, 
                fontWeight: 600,
                color: 'rgba(255, 255, 255, 0.9)'
              }}>
                Job Description *
              </label>
              <textarea
                value={jobDesc}
                onChange={e => setJobDesc(e.target.value)}
                placeholder="Describe the role, requirements, skills needed, experience level, and responsibilities..."
                rows={8}
                className="input-field"
                style={{ 
                  resize: 'vertical', 
                  minHeight: 120,
                  lineHeight: 1.5
                }}
                required
                disabled={jobLoading}
              />
              <div style={{ 
                fontSize: 12, 
                color: 'rgba(255, 255, 255, 0.5)', 
                marginTop: 4 
              }}>
                💡 Tip: Include specific skills, experience requirements, and key responsibilities for better AI matching
              </div>
            </div>
            
            <button 
              type="submit" 
              className="btn-primary"
              disabled={jobLoading || !jobTitle.trim() || !jobDesc.trim()}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                gap: 8,
                fontSize: 16
              }}
            >
              {jobLoading && <div className="loading-spinner"></div>}
              {jobLoading ? "🤖 Processing with AI..." : "🚀 Create Job Posting"}
            </button>
          </form>
          
          {jobError && (
            <div className={jobError.includes("✅") ? "status-success" : "status-error"}>
              {jobError}
            </div>
          )}
        </div>
      )}

      {/* Jobs List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {jobLoading && jobs.length === 0 && (
          <div className="card" style={{ textAlign: 'center', padding: 40 }}>
            <div className="loading-spinner" style={{ margin: '0 auto 16px' }}></div>
            <p style={{ color: 'rgba(255, 255, 255, 0.6)' }}>Loading jobs...</p>
          </div>
        )}
        
        {!jobLoading && jobs.length === 0 && (
          <div className="card" style={{ textAlign: 'center', padding: 40 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
            <h3 style={{ marginBottom: 8, color: 'rgba(255, 255, 255, 0.8)' }}>
              No job postings yet
            </h3>
            <p style={{ color: 'rgba(255, 255, 255, 0.6)', marginBottom: 20 }}>
              Create your first job posting to start finding the perfect candidates
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="btn-primary"
            >
              ➕ Create First Job
            </button>
          </div>
        )}
        
        {jobs.map((job) => (
          <div key={job._id} className="card fade-in">
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'flex-start',
              marginBottom: 16
            }}>
              <div style={{ flex: 1 }}>
                <h3 style={{ 
                  fontSize: 20, 
                  fontWeight: 600, 
                  margin: '0 0 8px 0',
                  color: '#fff'
                }}>
                  {job.title}
                </h3>
                <div style={{ 
                  fontSize: 12, 
                  color: 'rgba(255, 255, 255, 0.5)',
                  marginBottom: 12
                }}>
                  📅 Posted {job.createdAt ? new Date(job.createdAt).toLocaleDateString() : 'Recently'}
                </div>
              </div>
              
              <button
                onClick={() => onShowMatches(job._id)}
                className="btn-primary"
                disabled={matchesLoading[job._id]}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 8,
                  minWidth: 160
                }}
              >
                {matchesLoading[job._id] && <div className="loading-spinner"></div>}
                {matchesLoading[job._id] ? "🤖 AI Matching..." : "🎯 Find Matches"}
              </button>
            </div>
            
            <div style={{ 
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 8,
              padding: 16,
              marginBottom: 16
            }}>
              <p style={{ 
                color: 'rgba(255, 255, 255, 0.8)', 
                lineHeight: 1.6,
                margin: 0,
                fontSize: 14
              }}>
                {job.description.length > 300 
                  ? `${job.description.substring(0, 300)}...` 
                  : job.description
                }
              </p>
            </div>
            
            {matchesError[job._id] && (
              <div className="status-error">
                {matchesError[job._id]}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}