import { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { PageTransition } from '@/components/common/PageTransition';
import { Video, Upload, Camera, StopCircle, Play } from 'lucide-react';
import { useNavigate } from 'react-router-dom'; // Add this import
import axios from 'axios';
import toast from 'react-hot-toast';


const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';


export const VideoMonitor = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>('');
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [webcamActive, setWebcamActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate(); // Add this hook


  useEffect(() => {
    return () => {
      stopWebcam();
    };
  }, []);


  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('video/')) {
        toast.error('Please select a video file');
        return;
      }
      
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreview(url);
      setVideoUrl('');
    }
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


  const captureFrame = async () => {
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
      formData.append('original_image', blob, 'webcam-capture.jpg');


      try {
        setIsProcessing(true);
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


        toast.success('Detection completed!'); // Updated message
        navigate(`/detections/${response.data.id}`); // Add navigation
      } catch (error: any) {
        console.error('Processing failed:', error);
        toast.error(error.response?.data?.error || 'Processing failed');
      } finally {
        setIsProcessing(false);
      }
    }, 'image/jpeg', 0.95);
  };


  const processVideo = async () => {
    if (!selectedFile) {
      toast.error('Please select a video file');
      return;
    }


    toast('Video processing is not yet implemented. Use webcam capture or upload images instead.', {  icon: 'ℹ️',});  };


  return (
    <PageTransition>
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Video Monitor</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Real-time PPE detection from webcam or video
          </p>
        </div>


        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
                      <Video className="h-16 w-16 mx-auto mb-2 opacity-50" />
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
                      onClick={captureFrame}
                      disabled={isProcessing}
                      className="flex-1"
                    >
                      <Camera className="h-4 w-4 mr-2" />
                      {isProcessing ? 'Processing...' : 'Capture & Detect'}
                    </Button>
                  </>
                )}
              </div>
            </div>
          </Card>


          <Card padding="md">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload Video
            </h2>


            <div className="space-y-4">
              <div className="relative bg-gray-900 rounded-lg overflow-hidden aspect-video">
                {preview ? (
                  <video
                    src={preview}
                    controls
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                    <div className="text-center">
                      <Video className="h-16 w-16 mx-auto mb-2 opacity-50" />
                      <p>No video selected</p>
                    </div>
                  </div>
                )}
              </div>


              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                onChange={handleFileSelect}
                className="hidden"
              />


              <div className="flex gap-2">
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  variant="secondary"
                  className="flex-1"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Select Video
                </Button>
                <Button
                  onClick={processVideo}
                  disabled={!selectedFile || isProcessing}
                  className="flex-1"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Process Video
                </Button>
              </div>


              {selectedFile && (
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Selected: {selectedFile.name}
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
              <span><strong>Live Webcam:</strong> Click "Start Webcam" to activate your camera, then click "Capture & Detect" to analyze the current frame.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-orange-600">2.</span>
              <span><strong>Video Upload:</strong> Select a video file to preview it. Full video processing coming soon!</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-orange-600">3.</span>
              <span>Captured frames are processed like uploaded images and saved to your detection history.</span>
            </li>
          </ul>
        </Card>
      </div>
    </PageTransition>
  );
};
