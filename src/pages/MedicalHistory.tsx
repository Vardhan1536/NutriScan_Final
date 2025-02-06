import React, { useState, useEffect } from "react";
import { Card } from "../components/Card";
import { FileUp, ClipboardList, Edit2, Trash, Download } from "lucide-react";
import { MedicalSurvey } from "../components/medical/MedicalSurvey";
import { UserProfile } from "../components/medical/UserProfile";
import { Button } from "../components/Button";
import { useLocation } from "react-router-dom";
import { useNavigate } from 'react-router-dom';

export const MedicalHistory: React.FC = () => {
  const location = useLocation();
  const newReport = location.state?.newReport;
  const [mode, setMode] = useState<"choose" | "survey" | "upload">("choose");
  const [reports, setReports] = useState<any[]>([]);

  const [editingReportId, setEditingReportId] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // Load reports from localStorage when the component mounts
    const storedReports = localStorage.getItem("reports");
    if (storedReports) {
      setReports(JSON.parse(storedReports));
    }
  }, []);

  useEffect(() => {
    // Fetch user-specific files when the component mounts
    const fetchUserFiles = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          return;
        }
  
        const response = await fetch("http://localhost:8000/get-user-files", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
  
        if (!response.ok) {
          throw new Error("Failed to fetch user files");
        }
  
        const filesData = await response.json();
        const userFiles = filesData.files.map((file) => ({
          id: file.file_id,
          title: file.filename,
          date: new Date(file.upload_date).toLocaleDateString(),
          type: "Uploaded Report",
          fileId: file.file_id,
        }));
  
        setReports(userFiles);
        localStorage.setItem("reports", JSON.stringify(userFiles));
      } catch (error) {
        console.error(error);
      }
    };
  
    fetchUserFiles();
  }, []);

  useEffect(() => {
    // Update localStorage whenever the reports state changes
    if (reports.length > 0) {
      localStorage.setItem("reports", JSON.stringify(reports));
    }
  }, [reports]);

  if (newReport && !reports.find((report) => report.id === newReport.id)) {
    setReports((prevReports) => [...prevReports, newReport]);
  }

  const handleDelete = async (fileId: string) => {
    const token = localStorage.getItem("token");

    if (!token) {
    console.error("No authentication token found!");
    return;
    }

    try {
      // Send a DELETE request to the backend to delete the file
      const response = await fetch(`http://localhost:8000/delete-medical-report/${fileId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`,  
        },
      });

  
      if (!response.ok) {
        throw new Error("Failed to delete file from the database");
      }
  
      // Remove the report from the local state
      const updatedReports = reports.filter((report) => report.id !== fileId);
      setReports(updatedReports);
  
      // Update localStorage
      localStorage.setItem("reports", JSON.stringify(updatedReports));
    } catch (error) {
      setError("Failed to delete file. Please try again.");
    }
  };

  const handleEdit = (id: string, title: string) => {
    setEditingReportId(id);
    setNewTitle(title);
  };

  const handleSaveEdit = (id: string) => {
    const updatedReports = reports.map((report) =>
      report.id === id ? { ...report, title: newTitle } : report
    );
    setReports(updatedReports);
    setEditingReportId(null);
    setNewTitle("");
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setUploadedFile(event.target.files[0]);
      setError(""); // Reset any previous error
    }
  };

  const navigate = useNavigate();
  const handleUpload = async () => {
    if (!uploadedFile) {
      setError("Please select a file to upload.");
      return;
    }
  
    setLoading(true);
  
    const formData = new FormData();
    formData.append("file", uploadedFile);
  
    try {
    setLoading(true);
    const token = localStorage.getItem("token");

    const formData = new FormData();
    formData.append("file", uploadedFile); // Ensure file is correctly appended

    const response = await fetch("http://localhost:8000/upload-medical-report", {
      method: "POST",
      body: formData,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to upload file");
    }

    const result = await response.json();
    const fileId = result.file_id;

    const newReport = {
      id: fileId,
      title: uploadedFile.name,
      date: new Date().toLocaleDateString(),
      type: "Uploaded Report",
      fileId: fileId,
    };

    console.log(fileId)

    // Update state and localStorage properly
    setReports((prevReports) => {
      const updatedReports = [...prevReports, newReport];
      localStorage.setItem("reports", JSON.stringify(updatedReports));
      return updatedReports;
    });

    setUploadedFile(null);
    setLoading(false);
    setMode("choose");
    
    navigate("/scan", { state: { medicalFile: uploadedFile } });
  } catch (error) {
    setError("Failed to upload file. Please try again.");
    setLoading(false);
  }
};

  
const handleDownload = async (fileId: string, fileName: string) => {
  const token = localStorage.getItem("token");

  if (!token) {
    console.error("No authentication token found!");
    return;
  }

  try {
    const response = await fetch(`http://localhost:8000/download-medical-report/${fileId}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,  // ✅ Include Authorization token
      },
    });

    if (!response.ok) {
      throw new Error("Failed to download file");
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Download failed:", error);
  }
};


  if (mode === "survey") {
    return <MedicalSurvey onBack={() => setMode("choose")} />;
  }

  if (mode === "upload") {
    return (
      <div className="p-6 border-2 border-dashed rounded-lg hover:border-[#646cff] transition-colors">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleUpload();
          }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          <h1 className="text-lg font-semibold mb-4 text-center">
            Upload Health Report
          </h1>

          {/* File input */}
          <input
            type="file"
            onChange={handleFileChange}
            className="border border-gray-300 p-2 rounded w-full mb-4"
            accept=".pdf,image/*"
          />

          {/* Error message */}
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}

          {/* Submit button */}
          <button
            type="submit"
            className={`p-6 border-2 border-dashed rounded-lg hover:border-[#646cff] transition-colors ${loading ? "bg-gray-400 cursor-not-allowed" : "bg-blue-500 hover:bg-blue-600"
              } text-white w-full`}
            disabled={loading}
          >
            <FileUp className="h-12 w-12 mx-auto mb-4 text-[#646cff]" />
            {loading ? "Uploading..." : "Upload"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <UserProfile
        user={{
          name: "John Doe",
          age: 32,
          bloodGroup: "O+",
          height: "175 cm",
          weight: "70 kg",
          lastCheckup: "March 15, 2024",
        }}
      />

      <Card>
        <h3 className="text-xl font-semibold mb-6">Previous Reports</h3>
        <div className="space-y-4">
          {reports.map((report) => (
            <div
              key={report.id}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center space-x-4">
                <FileUp className="h-5 w-5 text-[#646cff]" />
                <div>
                  {editingReportId === report.id ? (
                    <input
                      type="text"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      className="border rounded p-1 text-sm"
                    />
                  ) : (
                    <h4 className="font-medium">{report.title}</h4>
                  )}
                  <p className="text-sm text-gray-600">
                    {report.date} • {report.type}
                  </p>
                </div>
              </div>
              <div className="flex space-x-2">
                {editingReportId === report.id ? (
                  <Button
                    variant="secondary"
                    onClick={() => handleSaveEdit(report.id)}
                  >
                    Save
                  </Button>
                ) : (
                  <Button
                    variant="secondary"
                    onClick={() => handleEdit(report.id, report.title)}
                  >
                    <Edit2 className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                )}
                <Button
                  variant="secondary"
                  onClick={() => handleDelete(report.id)}
                  className="text-red-500 hover:text-red-600"
                >
                  <Trash className="h-4 w-4 mr-1" />
                  Delete
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => handleDownload(report.fileId, report.title)}
                  className="text-green-500 hover:text-green-600"
                >
                  <Download className="h-4 w-4 mr-1" />
                  Download
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <h2 className="text-2xl font-bold mb-6">Update Medical History</h2>
        <p className="text-gray-600 mb-8">
          Choose how you'd like to provide your medical information for better
          personalized recommendations.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <button
            onClick={() => setMode("upload")}
            className="p-6 border-2 border-dashed rounded-lg hover:border-[#646cff] transition-colors"
          >
            <FileUp className="h-12 w-12 mx-auto mb-4 text-[#646cff]" />
            <h3 className="text-lg font-semibold mb-2">
              Upload Medical Reports
            </h3>
            <p className="text-gray-600 text-sm">
              Upload your existing medical reports for accurate analysis
            </p>
          </button>
          <button
            onClick={() => setMode("survey")}
            className="p-6 border-2 border-dashed rounded-lg hover:border-[#646cff] transition-colors"
          >
            <ClipboardList className="h-12 w-12 mx-auto mb-4 text-[#646cff]" />
            <h3 className="text-lg font-semibold mb-2">Fill out Survey</h3>
            <p className="text-gray-600 text-sm">
              Fill out a survey for health data collection
            </p>
          </button>
        </div>
      </Card>
    </div>
  );
};

