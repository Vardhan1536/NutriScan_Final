import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Upload, Camera, Bot, Stethoscope } from 'lucide-react';
import { SuggestionModal } from '../components/scan/SuggestionModal';
import axios from 'axios';
import { useLocation } from 'react-router-dom';

interface ExtractedData {
  result: string;
}

export const Scan: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const medicalFile = location.state?.medicalFile;

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [medicalReport, setMedicalReport] = useState<Blob | null>(null); // Store the medical report from DB

  // Load extracted data from localStorage if available
  useEffect(() => {
    const savedData = localStorage.getItem('extractedData');
    if (savedData) {
      setExtractedData(JSON.parse(savedData));
    }
  
    // Fetch medical report from the backend (if it exists)
    const fetchMedicalReport = async () => {
      try {
        const token = localStorage.getItem('token');  // Ensure the token is saved in localStorage
        const response = await axios.get('http://127.0.0.1:8000/medical-report', {
          headers: {
            Authorization: `Bearer ${token}`, // Include the token in the request headers
          },
          responseType: 'blob',
        });
        console.log(response.data)

        if (!response || !response.data) {
          throw new Error("No data received from server");
        }
        const blob = new Blob([response.data], { type: response.headers["content-type"] });
         // Extract filename from headers (if available)
        const contentDisposition = response.headers["content-disposition"];
        let extractedFileName = "medical_report.jpg"; // Default name

        if (contentDisposition) {
          const match = contentDisposition.match(/filename="(.+)"/);
          if (match) {
            extractedFileName = match[1];
          }
        }

        setMedicalReport(blob);
      
        console.log("Fetched and stored medical report:", extractedFileName);
      } catch (error) {
        console.error('Error fetching medical report:', error.response ? error.response.data : error.message);
      }
    };
  
    fetchMedicalReport();
  }, []);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleUploadFoodLabel = async () => {
    if (!file) {
      alert('Please upload an image first.');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);

      // Add medical report to the request only if it exists
      if (medicalReport) {
        formData.append('medical', medicalReport);
        
      }

      const response = await axios.post<ExtractedData>('http://127.0.0.1:8000/food-scan', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setExtractedData(response.data);
      // Save the extracted data to localStorage
      localStorage.setItem('extractedData', JSON.stringify(response.data));
    } catch (error) {
      console.error('Error during upload:', error);
      alert('Failed to process the image. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDoctorSuggestion = () => {
    navigate('/doctors/chat');
  };

  return (
    <div className="space-y-6">
      <Card>
        <h2 className="text-2xl font-bold mb-6">Scan Food</h2>
        <div className="space-y-4">
          <div
            className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const droppedFile = e.dataTransfer.files[0];
              if (droppedFile) {
                setFile(droppedFile);
                const reader = new FileReader();
                reader.onloadend = () => {
                  setPreview(reader.result as string);
                };
                reader.readAsDataURL(droppedFile);
              }
            }}
          >
            {preview ? (
              <img src={preview} alt="Preview" className="max-h-64 mx-auto rounded-lg" />
            ) : (
              <div className="space-y-4">
                <Upload className="h-12 w-12 mx-auto text-gray-400" />
                <p className="text-gray-600">Drag and drop an image here or click to upload</p>
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
              id="file-upload"
            />
          </div>
          <div className="flex justify-center space-x-4">
            <Button variant="secondary" onClick={() => document.getElementById('file-upload')?.click()}>
              <Upload className="h-4 w-4 mr-2" />
              Upload Image
            </Button>
            <Button>
              <Camera className="h-4 w-4 mr-2" />
              Take Photo
            </Button>
          </div>
        </div>
      </Card>

      {medicalFile && (
        <Card>
          <h2 className="text-2xl font-bold mb-6">Medical Report Uploaded</h2>
          <p>File uploaded: {medicalFile.name}</p>
        </Card>
      )}

      {preview && (
        <>
          {loading ? (
            <Button disabled>Processing...</Button>
          ) : (
            <Button onClick={handleUploadFoodLabel}>Extract Text and Fetch Details</Button>
          )}

          {extractedData && (
            <Card>
              <h3 className="text-xl font-semibold mb-4">Extracted Data</h3>
              <div className="space-y-4">
                <div className="max-w-full overflow-hidden">
                  <div className="whitespace-pre-wrap break-words text-sm text-gray-800">
                    {extractedData.result.split("\n").map((line, index) => {
                      if (line.startsWith("**")) {
                        return (
                          <p key={index} className="font-bold mb-2">{line.replace(/(\*\*)/g, '')}</p>
                        );
                      }
                      else if (line.startsWith("*")) {
                        return (
                          <p key={index} className="mb-2">{line.replace(/(\*)/g, '')}</p>
                        );
                      }
                      return (
                        <p key={index} className="mb-2">{line}</p>
                      );
                    })}
                  </div>
                </div>
              </div>
            </Card>
          )}

          <Card>
            <h3 className="text-xl font-semibold mb-4">Get Suggestions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button onClick={() => navigate('/chat')}>
                <Bot className="h-4 w-4 mr-2" />
                AI Suggestions
              </Button>
              <Button variant="secondary" onClick={handleDoctorSuggestion}>
                <Stethoscope className="h-4 w-4 mr-2" />
                Ask Your Doctor
              </Button>
            </div>
          </Card>
        </>
      )}

      <SuggestionModal isOpen={showSuggestions} onClose={() => setShowSuggestions(false)} />
    </div>
  );
};
