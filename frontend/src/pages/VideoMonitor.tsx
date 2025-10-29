import { useState, useEffect } from 'react';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { PageTransition } from '@/components/common/PageTransition';
import { Video, Play, StopCircle, Monitor, AlertTriangle, CheckCircle, TrendingUp, Activity } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export const VideoMonitor = () => {
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamUrl, setStreamUrl] = useState<string>('');
  const token = localStorage.getItem('token');

  useEffect(() => {
    return () => {
      if (isStreaming) {
        stopStream();
      }
    };
  }, [isStreaming]);

  const startStream = () => {
    const url = `${API_BASE_URL}/api/ppe/live-webcam-stream/?token=${token}&t=${Date.now()}`;
    setStreamUrl(url);
    setIsStreaming(true);
    toast.success('Stream started');
  };

  const stopStream = async () => {
    setStreamUrl('');
    setIsStreaming(false);
    
    try {
      await axios.post(`${API_BASE_URL}/api/ppe/stop-camera/`);
      console.log('[CAMERA] Stop signal sent');
    } catch (error) {
      console.error('[CAMERA] Stop failed:', error);
    }
    
    toast.success('Stream stopped!');
  };

  return (
    <PageTransition>
      <div className="space-y-4 sm:space-y-6">
        {/* ✅ Responsive Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            Live Video Monitoring
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
            Real-time PPE detection 
          </p>
        </div>

        {/* ✅ Main Stream Card */}
        <Card padding="md" className="sm:p-6 lg:p-8">
          {/* ✅ Responsive Card Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Monitor className="h-5 w-5" />
              Live Webcam Stream
            </h2>
            
            {/* ✅ Responsive Button */}
            <div className="flex gap-2">
              {!isStreaming ? (
                <Button onClick={startStream} className="w-full sm:w-auto">
                  <Play className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                  <span className="text-sm sm:text-base">Start Detection</span>
                </Button>
              ) : (
                <Button onClick={stopStream} variant="danger" className="w-full sm:w-auto">
                  <StopCircle className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                  <span className="text-sm sm:text-base">Stop Stream</span>
                </Button>
              )}
            </div>
          </div>

          {/* ✅ Responsive Video Container */}
          <div className="relative bg-gray-900 rounded-lg overflow-hidden" style={{ aspectRatio: '16/9' }}>
            {isStreaming && streamUrl ? (
              <>
                <img
                  src={streamUrl}
                  alt="Live Stream"
                  className="w-full h-full object-contain"
                  onLoad={() => console.log('[STREAM] Connected')}
                  onError={(e) => {
                    console.error('[STREAM] Error');
                    toast.error('Stream error - check server camera');
                    setIsStreaming(false);
                    setStreamUrl('');
                  }}
                />
                
                {/* ✅ Responsive LIVE Badge */}
                <div className="absolute top-2 sm:top-4 right-2 sm:right-4 bg-red-600 text-white px-2 sm:px-4 py-1 sm:py-2 rounded-full flex items-center gap-1 sm:gap-2 shadow-lg animate-pulse">
                  <div className="w-2 h-2 sm:w-3 sm:h-3 bg-white rounded-full animate-ping"></div>
                  <span className="text-xs sm:text-sm font-bold tracking-wider">LIVE</span>
                </div>

                {/* ✅ Responsive FPS Badge */}
                <div className="absolute top-2 sm:top-4 left-2 sm:left-4 bg-black/70 text-white px-2 sm:px-3 py-1 sm:py-2 rounded-lg backdrop-blur-sm">
                  <span className="text-xs sm:text-sm font-mono">30 FPS</span>
                </div>
              </>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-gray-400 p-4">
                <div className="text-center">
                  <Video className="h-12 w-12 sm:h-16 sm:w-16 lg:h-20 lg:w-20 mx-auto mb-3 sm:mb-4 opacity-50" />
                  <p className="text-base sm:text-xl font-semibold mb-1 sm:mb-2">Server Webcam Ready</p>
                  <p className="text-xs sm:text-sm">Click "Start Detection" to begin monitoring</p>
                </div>
              </div>
            )}
          </div>

          {/* ✅ Info Alert */}
          <div className="mt-4 p-3 sm:p-4 bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 rounded-lg flex items-start gap-2 sm:gap-3">
            <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm text-yellow-800 dark:text-yellow-200">
              <p className="font-semibold mb-1">Server-Side Processing</p>
              <p className="hidden sm:block">
                Uses webcam connected to Django server. Works best when running locally with a webcam attached.
              </p>
              <p className="sm:hidden">
                Uses server webcam. Requires local setup with camera.
              </p>
            </div>
          </div>
        </Card>

        {/* ✅ Responsive Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <Card padding="md" className="border-l-4 border-green-500">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                <Activity className="h-5 w-5 sm:h-6 sm:w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white">Real-Time</h3>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Instant violation alerts</p>
              </div>
            </div>
          </Card>

          <Card padding="md" className="border-l-4 border-blue-500">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white">High Performance</h3>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">30+ FPS processing</p>
              </div>
            </div>
          </Card>

          <Card padding="md" className="border-l-4 border-orange-500 sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                <Monitor className="h-5 w-5 sm:h-6 sm:w-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white">AI Powered</h3>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">YOLO detection</p>
              </div>
            </div>
          </Card>
        </div>

        
      </div>
    </PageTransition>
  );
};
