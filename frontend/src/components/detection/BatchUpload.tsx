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
      case 'uploading': return <Loader className="h-5 w-5 text-orange-500 animate-spin" />; // Changed to orange
      case 'success': return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error': return <X className="h-5 w-5 text-red-500" />;
      default: return null;
    }
  };

  return (
    <Card padding="lg" className="border-l-4 border-orange-500"> {/* Added orange border */}
      <motion.div
        {...getRootProps()}
        whileHover={{ scale: 1.01 }}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
          isDragActive 
            ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/10' // Changed to orange
            : 'border-gray-300 dark:border-gray-600 hover:border-orange-400 dark:hover:border-orange-500' // Changed to orange
        }`}
      >
        <input {...getInputProps()} />
        <motion.div
          animate={isDragActive ? { scale: [1, 1.1, 1] } : {}}
          transition={{ duration: 0.3 }}
