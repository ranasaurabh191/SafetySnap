import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

interface ImageUploadProps {
  onImageSelect: (file: File) => void;
  maxSize?: number;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({ onImageSelect, maxSize = 10 }) => {
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      // Check file size
      if (file.size > maxSize * 1024 * 1024) {
        toast.error(`File size must be less than ${maxSize}MB`);
        return;
      }

      // Create preview
      const reader = new FileReader();
      reader.onload = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      setSelectedFile(file);
      onImageSelect(file);
    },
    [maxSize, onImageSelect]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.bmp'],
    },
    multiple: false,
    maxSize: maxSize * 1024 * 1024,
  });

  const clearImage = () => {
    setPreview(null);
    setSelectedFile(null);
  };

  return (
    <div className="w-full">
      <AnimatePresence mode="wait">
        {!preview ? (
          <motion.div
            key="dropzone"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all
              ${isDragActive 
                ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/10' 
                : 'border-gray-300 dark:border-gray-600 hover:border-orange-400 dark:hover:border-orange-500 hover:bg-gray-50 dark:hover:bg-gray-800'
              }
            `}
          >
            <input {...getInputProps()} />
            <motion.div
              animate={isDragActive ? { scale: [1, 1.1, 1] } : {}}
              transition={{ duration: 0.3 }}
            >
              <Upload className={`mx-auto h-16 w-16 mb-4 transition-colors ${
                isDragActive ? 'text-orange-500' : 'text-gray-400'
              }`} />
            </motion.div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {isDragActive ? 'Drop image here' : 'Upload Safety Image'}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Drag and drop or click to select an image
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Supported formats: JPG, PNG, BMP (Max {maxSize}MB)
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="preview"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="relative rounded-xl overflow-hidden border-2 border-orange-300 dark:border-orange-600"
          >
            <img src={preview} alt="Preview" className="w-full h-auto max-h-96 object-contain bg-gray-100 dark:bg-gray-800" />
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={clearImage}
              className="absolute top-4 right-4 p-2 bg-white dark:bg-gray-800 rounded-full shadow-lg hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 transition-colors"
            >
              <X className="h-5 w-5 text-gray-700 dark:text-gray-300" />
            </motion.button>
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
              <div className="flex items-center text-white">
                <ImageIcon className="h-5 w-5 mr-2" />
                <span className="text-sm font-medium truncate">{selectedFile?.name}</span>
                <span className="ml-auto text-xs">
                  {((selectedFile?.size || 0) / 1024 / 1024).toFixed(2)} MB
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
