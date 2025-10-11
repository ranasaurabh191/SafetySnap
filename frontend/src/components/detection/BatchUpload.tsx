import { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, CheckCircle, Loader } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMutation } from '@tanstack/react-query';
import { detectionAPI } from '@/services/api';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import toast from 'react-hot-toast';


export const BatchUpload = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [uploadStatus, setUploadStatus] = useState<Record<string, 'pending' | 'uploading' | 'success' | 'error'>>({});


  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles) => {
      setFiles((prev) => [...prev, ...acceptedFiles]);
      acceptedFiles.forEach((file) => {
        setUploadStatus((prev) => ({ ...prev, [file.name]: 'pending' }));
      });
    },
    accept: { 'image/*': ['.jpeg', '.jpg', '.png'] },
    multiple: true,
  });


  const uploadMutation = useMutation({
    mutationFn: detectionAPI.create,
  });


  const handleBatchUpload = async () => {
    for (const file of files) {
      if (uploadStatus[file.name] !== 'pending') continue;


      setUploadStatus((prev) => ({ ...prev, [file.name]: 'uploading' }));


      try {
        await uploadMutation.mutateAsync({ original_image: file });
        setUploadStatus((prev) => ({ ...prev, [file.name]: 'success' }));
      } catch (error) {
        setUploadStatus((prev) => ({ ...prev, [file.name]: 'error' }));
      }
    }


    const successCount = Object.values(uploadStatus).filter((s) => s === 'success').length;
    toast.success(`${successCount} images analyzed successfully!`);
  };


  const removeFile = (fileName: string) => {
    setFiles((prev) => prev.filter((f) => f.name !== fileName));
    setUploadStatus((prev) => {
      const newStatus = { ...prev };
      delete newStatus[fileName];
      return newStatus;
    });
  };


  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'uploading': return <Loader className="h-5 w-5 text-orange-500 animate-spin" />;
      case 'success': return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error': return <X className="h-5 w-5 text-red-500" />;
      default: return null;
    }
  };


  return (
    <Card padding="lg" className="border-l-4 border-orange-500">
      <motion.div
        {...getRootProps()}
        whileHover={{ scale: 1.01 }}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
          isDragActive 
            ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/10'
            : 'border-gray-300 dark:border-gray-600 hover:border-orange-400 dark:hover:border-orange-500'
        }`}
      >
        <input {...getInputProps()} />
        <motion.div
          animate={isDragActive ? { scale: [1, 1.1, 1] } : {}}
          transition={{ duration: 0.3 }}
        >
          <Upload className="h-16 w-16 mx-auto text-orange-500 mb-4" />
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            {isDragActive ? 'Drop images here' : 'Drag & drop images'}
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            or click to select multiple images
          </p>
        </motion.div>
      </motion.div>

      {/* File List */}
      <AnimatePresence>
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-6 space-y-2"
          >
            <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
              Selected Images ({files.length})
            </h4>
            {files.map((file) => (
              <motion.div
                key={file.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
              >
                <div className="flex items-center gap-3 flex-1">
                  {getStatusIcon(uploadStatus[file.name])}
                  <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
                    {file.name}
                  </span>
                  <span className="text-xs text-gray-500">
                    ({(file.size / 1024).toFixed(1)} KB)
                  </span>
                </div>
                <button
                  onClick={() => removeFile(file.name)}
                  className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                  disabled={uploadStatus[file.name] === 'uploading'}
                >
                  <X className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                </button>
              </motion.div>
            ))}

            <Button
              onClick={handleBatchUpload}
              disabled={files.length === 0 || uploadMutation.isPending}
              className="w-full mt-4"
            >
              {uploadMutation.isPending ? (
                <>
                  <Loader className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Analyze {files.length} Image{files.length > 1 ? 's' : ''}
                </>
              )}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
};
