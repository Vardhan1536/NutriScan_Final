import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { uploadHealthReportAPI } from "../components/auth/api";

export const UploadReport: React.FC = () => {
  const [formData, setFormData] = useState<FormData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Handle file input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null); // Reset error message
    if (e.target.files) {
      const file = e.target.files[0];

      // Check if file size exceeds 5MB
      if (file.size > 5 * 1024 * 1024) {
        setError("File size should not exceed 5MB.");
        return;
      }

      // Check if the file is either PDF or an image
      if (!file.type.includes("pdf") && !file.type.includes("image")) {
        setError("Only PDF or image files are allowed.");
        return;
      }

      const data = new FormData();
      data.append("file", file);
      data.append("title", file.name);
      data.append("date", new Date().toLocaleDateString());
      data.append("type", "Uploaded Report");
      console.log("FormData:", Array.from(data.entries()));
      setFormData(data); // Store the form data
    }
  };

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!formData) {
    setError("Please upload a file before submitting.");
    return;
  }

  setLoading(true);
  setError(null); 

  try {
    // Call the API to upload the file
    const response = await uploadHealthReportAPI(formData);

    console.log("✅ Upload Response:", response.data);

    // Extract `file_id` from the API response
    const file_id = response.data.file_id;
    
    if (!file_id) {
      throw new Error("File ID not received from API.");
    }

    // Store file_id in localStorage
    localStorage.setItem("uploaded_file_id", file_id);

    // Create a new report object
    const newReport = {
      id: file_id,
      title: formData.get("title") as string,
      date: formData.get("date") as string,
      type: formData.get("type") as string,
      fileUrl: `http://localhost:8000/download/${file_id}`, // Assuming download API
    };

    console.log("Navigating to Medical History with report:", newReport);
    
    // Redirect to Medical History page and pass new report data
    navigate("/medical-history", { state: { newReport } });
  } catch (error: any) {
    console.error("❌ Upload Failed:", error);
    setError(error.message || "An unexpected error occurred.");
  } finally {
    setLoading(false);
  }
};


  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form onSubmit={handleSubmit} className="space-y-4 w-96 bg-white p-6 rounded-lg shadow-md">
        <h1 className="text-lg font-bold mb-4">Upload Health Report</h1>

        {/* File input */}
        <input
          type="file"
          onChange={handleFileChange}
          className="border border-gray-300 p-2 rounded w-full"
          accept=".pdf,image/*"
        />

        {/* Error message */}
        {error && <p className="text-red-500 text-sm">{error}</p>}

        {/* Submit button */}
        <button
          type="submit"
          className={`p-2 w-full rounded ${
            loading ? "bg-gray-400 cursor-not-allowed" : "bg-blue-500 hover:bg-blue-600"
          } text-white`}
          disabled={loading}
        >
          {loading ? "Uploading..." : "Upload"}
        </button>
      </form>
    </div>
  );
};
