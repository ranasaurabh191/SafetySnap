import { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { PageTransition } from '@/components/common/PageTransition';
import { Upload as UploadIcon, Image as ImageIcon, CheckCircle, Camera, Play, StopCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export const Upload = () => {
  // ✅ SEPARATE processing states
  const [processingWebcam, setProcessingWebcam] = useState(false);
  const [processingUpload, setProcessingUpload] = useState(false);
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>('');
  const [webcamActive, setWebcamActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const ALLOWED_FORMATS = ['image/jpeg', 'image/jpg', 'image/png', 'image/bmp', 'image/webp', 'image/tiff'];
  const MAX_SIZE = 10 * 1024 * 1024; // 10MB

  useEffect(() => {
    return () => {
      stopWebcam();
    };
  }, []);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_FORMATS.includes(file.type)) {
      toast.error('Unsupported file format. Please use JPG, PNG, BMP, WebP, or TIFF');
      return;
    }

    if (file.size > MAX_SIZE) {
      toast.error('File size must be less than 10MB');
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setWebcamActive(true);
        toast.success('Webcam started');
      }
    } catch (error) {
      console.error('Webcam error:', error);
      toast.error('Failed to access webcam. Please check permissions.');
    }
  };

  const stopWebcam = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setWebcamActive(false);
  };

  // ✅ Webcam capture with separate state
  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0);

    canvas.toBlob(async (blob) => {
      if (!blob) return;

      const formData = new FormData();
      formData.append('original_image', blob, `webcam-capture-${Date.now()}.jpg`);

      try {
        setProcessingWebcam(true); // ✅ Only affects webcam button
        const token = localStorage.getItem('token');

        const response = await axios.post(
          `${API_BASE_URL}/api/ppe/detections/`,
          formData,
          {
            headers: {
              'Authorization': `Token ${token}`,
              'Content-Type': 'multipart/form-data'
            }
          }
        );

        toast.success('Detection completed!');
        navigate(`/detections/${response.data.id}`);
      } catch (error: any) {
        console.error('Processing failed:', error);
        toast.error(error.response?.data?.error || 'Processing failed');
      } finally {
        setProcessingWebcam(false); // ✅ Only affects webcam button
      }
    }, 'image/jpeg', 0.95);
  };

  // ✅ File upload with separate state
  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Please select an image');
      return;
    }

    setProcessingUpload(true); // ✅ Only affects upload button
    const formData = new FormData();
    formData.append('original_image', selectedFile);

    try {
      const token = localStorage.getItem('token');

      const response = await axios.post(
        `${API_BASE_URL}/api/ppe/detections/`,
        formData,
        {
          headers: {
            'Authorization': `Token ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      toast.success('Detection completed!');
      navigate(`/detections/${response.data.id}`);
    } catch (error: any) {
      console.error('Upload failed:', error);

      if (error.response?.data) {
        const errors = error.response.data;
        const errorMessages = Object.entries(errors)
          .map(([key, value]) => `${key}: ${value}`)
          .join(', ');
        toast.error(errorMessages);
      } else {
        toast.error('Upload failed');
      }
    } finally {
      setProcessingUpload(false); // ✅ Only affects upload button
    }
  };

  return (
    <PageTransition>
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Upload Image</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Upload from file or capture from webcam to detect PPE compliance
          </p>
        </div>

        <Card padding="md" className="bg-orange-50 dark:bg-orange-900/10 border-orange-200 dark:border-orange-800">
          <div className="flex gap-3">
            <div className="flex-shrink-0">
              <CheckCircle className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <h3 className="font-bold text-orange-900 dark:text-orange-300 mb-2">
                What We Detect:
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                <div className="flex items-center gap-2 text-orange-800 dark:text-orange-300">
                  <div className="w-3 h-3 bg-green-500 rounded"></div>
                  <span>Safety Hardhat</span>
                </div>
                <div className="flex items-center gap-2 text-orange-800 dark:text-orange-300">
                  <div className="w-3 h-3 bg-green-500 rounded"></div>
                  <span>Safety Vest</span>
                </div>
                <div className="flex items-center gap-2 text-orange-800 dark:text-orange-300">
                  <div className="w-3 h-3 bg-green-500 rounded"></div>
                  <span>Face Mask</span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* LEFT CARD: WEBCAM CAPTURE */}
          <Card padding="md">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Live Webcam
            </h2>

            <div className="space-y-4">
              <div className="relative bg-gray-900 rounded-lg overflow-hidden aspect-video">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                {!webcamActive && (
                  <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                    <div className="text-center">
                      <Camera className="h-16 w-16 mx-auto mb-2 opacity-50" />
                      <p>Webcam not active</p>
                    </div>
                  </div>
                )}
              </div>

              <canvas ref={canvasRef} className="hidden" />

              <div className="flex gap-2">
                {!webcamActive ? (
                  <Button
                    onClick={startWebcam}
                    className="flex-1"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Start Webcam
                  </Button>
                ) : (
                  <>
                    <Button
                      onClick={stopWebcam}
                      variant="danger"
                      className="flex-1"
                    >
                      <StopCircle className="h-4 w-4 mr-2" />
                      Stop
                    </Button>
                    <Button
                      onClick={capturePhoto}
                      disabled={processingWebcam} // ✅ Only webcam state
                      className="flex-1"
                    >
                      {processingWebcam ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Processing...
                        </>
                      ) : (
                        <>
                          <Camera className="h-4 w-4 mr-2" />
                          Capture & Detect
                        </>
                      )}
                    </Button>
                  </>
                )}
              </div>
            </div>
          </Card>

          {/* RIGHT CARD: FILE UPLOAD */}
          <Card padding="md">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
              <UploadIcon className="h-5 w-5" />
              Upload Image
            </h2>

            <div className="space-y-4">
              <div
                className="relative bg-gray-900 rounded-lg overflow-hidden aspect-video cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => !processingUpload && fileInputRef.current?.click()}
              >
                {preview ? (
                  <img
                    src={preview}
                    alt="Preview"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                    <div className="text-center">
                      <ImageIcon className="h-16 w-16 mx-auto mb-2 opacity-50" />
                      <p>No image selected</p>
                      <p className="text-sm mt-1">Click to select</p>
                    </div>
                  </div>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".jpg,.jpeg,.png,.bmp,.webp,.tiff,.tif"
                onChange={handleFileSelect}
                className="hidden"
              />

              <div className="flex gap-2">
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  variant="secondary"
                  className="flex-1"
                  disabled={processingUpload} // ✅ Only upload state
                >
                  <UploadIcon className="h-4 w-4 mr-2" />
                  Select Image
                </Button>
                <Button
                  onClick={handleUpload}
                  disabled={!selectedFile || processingUpload} // ✅ Only upload state
                  className="flex-1"
                >
                  {processingUpload ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Analyze Image
                    </>
                  )}
                </Button>
              </div>

              {selectedFile && (
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Selected: {selectedFile.name} ({((selectedFile.size || 0) / 1024 / 1024).toFixed(2)} MB)
                </div>
              )}
            </div>
          </Card>
        </div>

        <Card padding="lg">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
            How to Use
          </h3>
          <ul className="space-y-2 text-gray-600 dark:text-gray-400">
            <li className="flex items-start gap-2">
              <span className="font-bold text-orange-600">1.</span>
              <span><strong>Webcam Capture:</strong> Click "Start Webcam" to activate your camera, then click "Capture & Detect" to take a photo and analyze it.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-orange-600">2.</span>
              <span><strong>File Upload:</strong> Click "Select Image" to choose an image from your computer (JPG, PNG, BMP, WebP, TIFF). Max 10MB.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-orange-600">3.</span>
              <span>Both methods work independently and save results to your detection history with high-accuracy AI analysis.</span>
            </li>
          </ul>
        </Card>
      </div>
    </PageTransition>
  );
};
