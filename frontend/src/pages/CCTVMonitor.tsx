import { useState } from 'react';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { PageTransition } from '@/components/common/PageTransition';
import { Video, Play, StopCircle, Camera, Settings } from 'lucide-react';
import toast from 'react-hot-toast';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

// ✅ Example RTSP URLs (replace with your cameras)
const CAMERA_PRESETS = [
  {
    id: 'cam1',
    name: 'Camera 1',
    rtsp: 'rtsp://username:password@192.168.1.100:554/stream1'
  },
  {
    id: 'cam2',
    name: 'Camera 2',
    rtsp: 'rtsp://username:password@192.168.1.101:554/stream1'
  },
  {
    id: 'cam3',
    name: 'Camera 3 ',
    rtsp: 'rtsp://username:password@192.168.1.102:554/stream1'
  },
];

export const CCTVMonitor = () => {
  const [selectedCamera, setSelectedCamera] = useState<string>('');
  const [customRTSP, setCustomRTSP] = useState<string>('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamUrl, setStreamUrl] = useState<string>('');
  const token = localStorage.getItem('token');

  const startStream = (cameraId: string, rtspUrl: string) => {
    const encodedRTSP = encodeURIComponent(rtspUrl);
    const url = `${API_BASE_URL}/api/ppe/rtsp-camera-stream/?camera_id=${cameraId}&rtsp_url=${encodedRTSP}&token=${token}&t=${Date.now()}`;
    
    setStreamUrl(url);
    setIsStreaming(true);
    setSelectedCamera(cameraId);
    toast.success(`Streaming from ${cameraId}`);
  };

  const stopStream = () => {
    setStreamUrl('');
    setIsStreaming(false);
    setSelectedCamera('');
    toast('Stream stopped');
  };

  const startCustomStream = () => {
    if (!customRTSP.trim()) {
      toast.error('Please enter RTSP URL');
      return;
    }
    
    startStream('custom', customRTSP);
  };

  return (
    <PageTransition>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">CCTV Monitor</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Real-time PPE detection from IP cameras
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Camera Selection */}
          <Card padding="lg">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Camera Selection
            </h2>

            <div className="space-y-3">
              {CAMERA_PRESETS.map((cam) => (
                <button
                  key={cam.id}
                  onClick={() => startStream(cam.id, cam.rtsp)}
                  disabled={isStreaming}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                    selectedCamera === cam.id
                      ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-orange-300'
                  } ${isStreaming && selectedCamera !== cam.id ? 'opacity-50' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <Camera className="h-5 w-5 text-orange-600" />
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {cam.name}
                      </p>
                      
                    </div>
                  </div>
                </button>
              ))}

              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <p className="text-md font-semibold text-gray-900 dark:text-white mb-2">
                  Custom RTSP URL
                </p>
                <input
                  type="text"
                  value={customRTSP}
                  onChange={(e) => setCustomRTSP(e.target.value)}
                  placeholder="rtsp://user:pass@ip:port/path"
                  disabled={isStreaming}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                />
                <Button
                  onClick={startCustomStream}
                  disabled={isStreaming}
                  className="w-full mt-4"
                  size="md"
                >
                  <Play className="h-5 w-4 mr-2" />
                  Connect
                </Button>
              </div>
            </div>
          </Card>

          {/* Video Stream */}
          <Card padding="lg" className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Video className="h-5 w-5" />
                Live Feed
              </h2>

              {isStreaming && (
                <Button onClick={stopStream} variant="danger">
                  <StopCircle className="h-4 w-4 mr-2" />
                  Stop
                </Button>
              )}
            </div>

            <div className="relative bg-gray-900 rounded-lg overflow-hidden" style={{ aspectRatio: '16/9' }}>
              {isStreaming && streamUrl ? (
                <>
                  <img
                    src={streamUrl}
                    alt="CCTV Feed"
                    className="w-full h-full object-contain"
                    onError={() => {
                      toast.error('Stream error');
                      stopStream();
                    }}
                  />
                  
                  <div className="absolute top-4 right-4 bg-red-600 text-white px-4 py-2 rounded-full flex items-center gap-2 animate-pulse">
                    <div className="w-3 h-3 bg-white rounded-full animate-ping"></div>
                    <span className="text-sm font-bold">LIVE</span>
                  </div>
                </>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                  <div className="text-center">
                    <Camera className="h-20 w-20 mx-auto mb-4 opacity-50" />
                    <p className="text-xl font-semibold mb-2">Select a Camera</p>
                    <p className="text-sm">Choose from presets or enter custom RTSP URL</p>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Instructions */}
        <Card padding="lg">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
            RTSP Camera Setup Guide
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                📹 Finding Your RTSP URL
              </h4>
              <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                <li>• Check camera manufacturer documentation</li>
                <li>• Common format: `rtsp://username:password@ip:port/path`</li>
                <li>• Default port is usually 554</li>
              </ul>
            </div>

            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <h4 className="font-semibold text-green-900 dark:text-green-100 mb-2">
                ✅ Supported Cameras
              </h4>
              <ul className="text-sm text-green-800 dark:text-green-200 space-y-1">
                <li>• Hikvision, Dahua, Axis cameras</li>
                <li>• Most IP cameras with RTSP support</li>
                <li>• NVR/DVR systems with RTSP output</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </PageTransition>
  );
};
