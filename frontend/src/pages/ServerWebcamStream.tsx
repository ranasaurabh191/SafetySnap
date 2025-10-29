import { useState } from 'react';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Video, Play, StopCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export const ServerWebcamStream = () => {
  const [isStreaming, setIsStreaming] = useState(false);
  const token = localStorage.getItem('token');

  const startStream = () => {
    setIsStreaming(true);
    toast.success('Server webcam stream started');
  };

  const stopStream = () => {
    setIsStreaming(false);
    toast('Stream stopped');
  };

  return (
    <Card padding="md">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Video className="h-5 w-5" />
          Server Webcam Stream (OpenCV)
        </h2>
        
        {!isStreaming ? (
          <Button onClick={startStream} size="sm">
            <Play className="h-4 w-4 mr-2" />
            Start Stream
          </Button>
        ) : (
          <Button onClick={stopStream} variant="danger" size="sm">
            <StopCircle className="h-4 w-4 mr-2" />
            Stop Stream
          </Button>
        )}
      </div>

      <div className="relative bg-gray-900 rounded-lg overflow-hidden aspect-video">
        {isStreaming ? (
          <>
            <img
              src={`${API_BASE_URL}/api/ppe/live-webcam-stream/?token=${token}`}
              alt="Live Webcam Stream"
              className="w-full h-full object-contain"
              onError={() => {
                toast.error('Stream failed. Ensure webcam is connected to server.');
                setIsStreaming(false);
              }}
            />
            
            <div className="absolute top-4 right-4 bg-red-600 text-white px-3 py-1 rounded-full flex items-center gap-2 animate-pulse">
              <div className="w-2 h-2 bg-white rounded-full animate-ping"></div>
              <span className="text-sm font-semibold">LIVE</span>
            </div>
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-gray-400">
            <div className="text-center">
              <Video className="h-16 w-16 mx-auto mb-2 opacity-50" />
              <p className="text-lg">Server Webcam Not Active</p>
              <p className="text-sm mt-2">Click "Start Stream" to begin</p>
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 rounded">
        <p className="text-sm text-yellow-800 dark:text-yellow-200">
          <strong>⚠️ Important:</strong> This stream uses the webcam connected to the <strong>server</strong>, 
          not your browser. It only works when running Django locally with a webcam attached.
        </p>
      </div>
    </Card>
  );
};
