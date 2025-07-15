"use client";

import Image from "next/image";
import React, { useState } from "react";
import ResumeViewer from "./ResumeViewer";

export default function Home() {
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [parsedResume, setParsedResume] = useState<any>(null);

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

  return (
    <main style={{ minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", background: "#111", color: "#fff" }}>
      <h1>Resume Uploader</h1>
      <input
        type="file"
        accept="application/pdf"
        onChange={handleFileChange}
        disabled={uploading}
        style={{ margin: "1rem 0" }}
            />
      {uploading && <p>Uploading...</p>}
      {message && <p>{message}</p>}
      {parsedResume && (
        <ResumeViewer resume={parsedResume} />
      )}
      </main>
  );
}
