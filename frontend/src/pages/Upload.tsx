import { useState } from 'react';
import { Upload as UploadIcon, Image as ImageIcon, CheckCircle } from 'lucide-react';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { PageTransition } from '@/components/common/PageTransition';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export const Upload = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const navigate = useNavigate();

  const ALLOWED_FORMATS = ['image/jpeg', 'image/jpg', 'image/png', 'image/bmp', 'image/webp', 'image/tiff'];
  const MAX_SIZE = 10 * 1024 * 1024; // 10MB

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file type
    if (!ALLOWED_FORMATS.includes(file.type)) {
      toast.error('Unsupported file format. Please use JPG, PNG, BMP, WebP, or TIFF');
      return;
    }

    // Check file size
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
  
  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Please select an image');
      return;
    }

    setUploading(true);
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
      setUploading(false);
    }
  };

  return (
    <PageTransition>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Upload Image</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Upload a construction site image to detect PPE compliance
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card padding="lg">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Select Image
            </h2>

            <div
              className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center hover:border-orange-500 dark:hover:border-orange-400 transition-colors cursor-pointer"
              onClick={() => document.getElementById('file-input')?.click()}
            >
              {preview ? (
                <div className="space-y-4">
                  <img
                    src={preview}
                    alt="Preview"
                    className="max-h-64 mx-auto rounded-lg"
                  />
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {selectedFile?.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {((selectedFile?.size || 0) / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <ImageIcon className="h-16 w-16 text-gray-400 mx-auto" />
                  <div>
                    <p className="text-gray-600 dark:text-gray-400 mb-2">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-500">
                      JPG, PNG, BMP, WebP, TIFF (Max 10MB)
                    </p>
                  </div>
                </div>
              )}
            </div>

            <input
              id="file-input"
              type="file"
              accept=".jpg,.jpeg,.png,.bmp,.webp,.tiff,.tif"
              onChange={handleFileSelect}
              className="hidden"
            />

            <div className="mt-4 flex gap-3">
              <Button
                onClick={handleUpload}
                disabled={!selectedFile || uploading}
                className="flex-1"
              >
                {uploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <UploadIcon className="h-4 w-4 mr-2" />
                    Analyze Image
                  </>
                )}
              </Button>

              {selectedFile && (
                <Button
                  variant="secondary"
                  onClick={() => {
                    setSelectedFile(null);
                    setPreview('');
                  }}
                >
                  Clear
                </Button>
              )}
            </div>
          </Card>

          <Card padding="lg">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Supported Formats
            </h2>

            <div className="space-y-3">
              <div className="p-3 bg-green-50 dark:bg-green-900/10 rounded-lg border border-green-200 dark:border-green-800">
                <p className="font-medium text-green-900 dark:text-green-300 mb-1">✓ Supported:</p>
                <p className="text-sm text-green-800 dark:text-green-300">
                  JPEG (.jpg, .jpeg), PNG (.png), BMP (.bmp), WebP (.webp), TIFF (.tiff, .tif)
                </p>
              </div>

              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="font-medium text-gray-900 dark:text-white mb-2">Best Practices:</p>
                <ul className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
                  <li className="flex items-start gap-2">
                    <span className="text-orange-600">•</span>
                    <span>Use high-quality images (1920x1080 or higher)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-600">•</span>
                    <span>Ensure good lighting conditions</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-600">•</span>
                    <span>Workers should be clearly visible</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-600">•</span>
                    <span>Avoid overly compressed images</span>
                  </li>
                </ul>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </PageTransition>
  );
};
