import React from "react";

type Resume = {
  profile?: {
    name?: string;
    email?: string;
    phone?: string;
    location?: string;
    url?: string;
    summary?: string;
  };
  educations?: Array<{
    school?: string;
    degree?: string;
    gpa?: string;
    date?: string;
    descriptions?: string[];
  }>;
  workExperiences?: Array<{
    company?: string;
    jobTitle?: string;
    date?: string;
    descriptions?: string[];
  }>;
  projects?: Array<{
    project?: string;
    date?: string;
    descriptions?: string[];
  }>;
  skills?: {
    featuredSkills?: Array<{ skill?: string }>;
    descriptions?: string[];
  };
  custom?: {
    descriptions?: string[];
  };
};

export default function ResumeViewer({ resume }: { resume: Resume }) {
  if (!resume) return null;
  return (
    <div style={{ width: "100%", maxWidth: 700, margin: "2rem auto", background: "#181818", color: "#fff", borderRadius: 12, boxShadow: "0 2px 12px #0004", padding: 24 }}>
      <h2 style={{ borderBottom: "1px solid #333", paddingBottom: 8 }}>Profile</h2>
      {resume.profile ? (
        <div style={{ marginBottom: 24 }}>
          <div><strong>Name:</strong> {resume.profile.name || <em>—</em>}</div>
          <div><strong>Email:</strong> {resume.profile.email || <em>—</em>}</div>
          <div><strong>Phone:</strong> {resume.profile.phone || <em>—</em>}</div>
          <div><strong>Location:</strong> {resume.profile.location || <em>—</em>}</div>
          <div><strong>URL:</strong> {resume.profile.url || <em>—</em>}</div>
          <div><strong>Summary:</strong> {resume.profile.summary || <em>—</em>}</div>
        </div>
      ) : <em>No profile info</em>}

      <h2 style={{ borderBottom: "1px solid #333", paddingBottom: 8 }}>Education</h2>
      {resume.educations && resume.educations.length > 0 ? (
        <ul style={{ marginBottom: 24 }}>
          {resume.educations.map((edu, i) => (
            <li key={i} style={{ marginBottom: 12 }}>
              <div><strong>School:</strong> {edu.school || <em>—</em>}</div>
              <div><strong>Degree:</strong> {edu.degree || <em>—</em>}</div>
              <div><strong>GPA:</strong> {edu.gpa || <em>—</em>}</div>
              <div><strong>Date:</strong> {edu.date || <em>—</em>}</div>
              {edu.descriptions && edu.descriptions.length > 0 && (
                <ul style={{ marginTop: 4 }}>
                  {edu.descriptions.map((desc, j) => <li key={j}>{desc}</li>)}
                </ul>
              )}
            </li>
          ))}
        </ul>
      ) : <em>No education info</em>}

      <h2 style={{ borderBottom: "1px solid #333", paddingBottom: 8 }}>Work Experience</h2>
      {resume.workExperiences && resume.workExperiences.length > 0 ? (
        <ul style={{ marginBottom: 24 }}>
          {resume.workExperiences.map((work, i) => (
            <li key={i} style={{ marginBottom: 12 }}>
              <div><strong>Company:</strong> {work.company || <em>—</em>}</div>
              <div><strong>Job Title:</strong> {work.jobTitle || <em>—</em>}</div>
              <div><strong>Date:</strong> {work.date || <em>—</em>}</div>
              {work.descriptions && work.descriptions.length > 0 && (
                <ul style={{ marginTop: 4 }}>
                  {work.descriptions.map((desc, j) => <li key={j}>{desc}</li>)}
                </ul>
              )}
            </li>
          ))}
        </ul>
      ) : <em>No work experience info</em>}

      <h2 style={{ borderBottom: "1px solid #333", paddingBottom: 8 }}>Projects</h2>
      {resume.projects && resume.projects.length > 0 ? (
        <ul style={{ marginBottom: 24 }}>
          {resume.projects.map((proj, i) => (
            <li key={i} style={{ marginBottom: 12 }}>
              <div><strong>Project:</strong> {proj.project || <em>—</em>}</div>
              <div><strong>Date:</strong> {proj.date || <em>—</em>}</div>
              {proj.descriptions && proj.descriptions.length > 0 && (
                <ul style={{ marginTop: 4 }}>
                  {proj.descriptions.map((desc, j) => <li key={j}>{desc}</li>)}
                </ul>
              )}
            </li>
          ))}
        </ul>
      ) : <em>No project info</em>}

      <h2 style={{ borderBottom: "1px solid #333", paddingBottom: 8 }}>Skills</h2>
      {resume.skills ? (
        <div style={{ marginBottom: 24 }}>
          <div><strong>Featured Skills:</strong> {resume.skills.featuredSkills && resume.skills.featuredSkills.length > 0 ? resume.skills.featuredSkills.map((s, i) => s.skill).filter(Boolean).join(", ") : <em>—</em>}</div>
          <div><strong>Descriptions:</strong></div>
          {resume.skills.descriptions && resume.skills.descriptions.length > 0 ? (
            <ul>
              {resume.skills.descriptions.map((desc, i) => <li key={i}>{desc}</li>)}
            </ul>
          ) : <em>—</em>}
        </div>
      ) : <em>No skills info</em>}

      <h2 style={{ borderBottom: "1px solid #333", paddingBottom: 8 }}>Raw JSON</h2>
      <pre style={{ background: "#222", color: "#fff", padding: 16, borderRadius: 8, maxWidth: 650, overflowX: "auto" }}>
        {JSON.stringify(resume, null, 2)}
      </pre>
    </div>
  );
} 