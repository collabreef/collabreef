import { FC, useState, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { Upload, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { FileUploadWidgetConfig } from '@/types/widget';
import { FileInfo, uploadFile as uploadFileApi } from '@/api/file';
import useCurrentWorkspaceId from '@/hooks/use-currentworkspace-id';
import Widget from '@/components/widgets/Widget';
import { registerWidget, WidgetProps, WidgetConfigFormProps } from '../widgetRegistry';
import { toast } from '@/stores/toast';

interface FileUploadWidgetProps extends WidgetProps {
  config: FileUploadWidgetConfig;
}

interface UploadingFile {
  file: File;
  progress: number;
  status: 'uploading' | 'success' | 'error';
  error?: string;
  result?: FileInfo;
}

const FileUploadWidget: FC<FileUploadWidgetProps> = ({ config }) => {
  const { t } = useTranslation();
  const workspaceId = useCurrentWorkspaceId();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const maxFileSize = (config.maxFileSize || 10) * 1024 * 1024; // Convert MB to bytes
  const allowedExtensions = config.allowedExtensions || [];

  const validateFile = (file: File): string | null => {
    // Check file size
    if (file.size > maxFileSize) {
      return t('widgets.fileUpload.errors.fileTooLarge', {
        max: config.maxFileSize || 10
      });
    }

    // Check file extension
    if (allowedExtensions.length > 0) {
      const ext = '.' + file.name.split('.').pop()?.toLowerCase();
      if (!allowedExtensions.includes(ext)) {
        return t('widgets.fileUpload.errors.invalidExtension', {
          allowed: allowedExtensions.join(', ')
        });
      }
    }

    return null;
  };

  const uploadFile = async (file: File) => {
    // Add to uploading files list
    const uploadingFile: UploadingFile = {
      file,
      progress: 0,
      status: 'uploading',
    };

    setUploadingFiles(prev => [...prev, uploadingFile]);

    try {
      const response = await uploadFileApi(
        workspaceId,
        file,
        (progress) => {
          setUploadingFiles(prev =>
            prev.map(f =>
              f.file === file ? { ...f, progress } : f
            )
          );
        }
      );

      // Mark as success
      setUploadingFiles(prev =>
        prev.map(f =>
          f.file === file
            ? { ...f, status: 'success', progress: 100, result: response }
            : f
        )
      );

      // Invalidate files query to refresh file list
      queryClient.invalidateQueries({ queryKey: ['files', workspaceId] });

      toast.success(t('widgets.fileUpload.uploadSuccess', { name: file.name }));

      // Remove from list after 3 seconds
      setTimeout(() => {
        setUploadingFiles(prev => prev.filter(f => f.file !== file));
      }, 3000);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || t('common.error');

      setUploadingFiles(prev =>
        prev.map(f =>
          f.file === file
            ? { ...f, status: 'error', error: errorMessage }
            : f
        )
      );

      toast.error(t('widgets.fileUpload.uploadError', { name: file.name }));
    }
  };

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files) return;

    const filesArray = Array.from(files);

    for (const file of filesArray) {
      const error = validateFile(file);
      if (error) {
        toast.error(error);
        continue;
      }
      uploadFile(file);
    }
  }, [workspaceId, config]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
    // Reset input so same file can be uploaded again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const removeUploadingFile = (file: File) => {
    setUploadingFiles(prev => prev.filter(f => f.file !== file));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <Widget>
      <div className="h-full flex flex-col">
        {/* Upload Area */}
        <div
          className={`
            flex-1 border-2 border-dashed rounded-lg p-6
            flex flex-col items-center justify-center gap-3
            cursor-pointer transition-colors
            ${isDragging
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
              : 'border-gray-300 dark:border-neutral-600 hover:border-blue-400 dark:hover:border-blue-500'
            }
          `}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={handleClick}
        >
          <Upload
            size={40}
            className={isDragging ? 'text-blue-500' : 'text-gray-400'}
          />

          <div className="text-center">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('widgets.fileUpload.clickOrDrag')}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {allowedExtensions.length > 0
                ? t('widgets.fileUpload.allowedExtensions', {
                    extensions: allowedExtensions.join(', ')
                  })
                : t('widgets.fileUpload.anyFileType')}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {t('widgets.fileUpload.maxSize', { size: config.maxFileSize || 10 })}
            </p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleFileInput}
            accept={allowedExtensions.length > 0 ? allowedExtensions.join(',') : undefined}
          />
        </div>

        {/* Uploading Files List */}
        {uploadingFiles.length > 0 && (
          <div className="mt-4 space-y-2 max-h-48 overflow-y-auto">
            {uploadingFiles.map((uploadingFile, index) => (
              <div
                key={index}
                className="bg-gray-50 dark:bg-neutral-800 rounded-lg p-3"
              >
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div className="flex-shrink-0 mt-0.5">
                    {uploadingFile.status === 'uploading' && (
                      <Loader2 size={18} className="text-blue-500 animate-spin" />
                    )}
                    {uploadingFile.status === 'success' && (
                      <CheckCircle size={18} className="text-green-500" />
                    )}
                    {uploadingFile.status === 'error' && (
                      <AlertCircle size={18} className="text-red-500" />
                    )}
                  </div>

                  {/* File Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        {uploadingFile.file.name}
                      </p>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeUploadingFile(uploadingFile.file);
                        }}
                        className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        <X size={16} />
                      </button>
                    </div>

                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                      {formatFileSize(uploadingFile.file.size)}
                    </p>

                    {/* Progress Bar */}
                    {uploadingFile.status === 'uploading' && (
                      <div className="w-full bg-gray-200 dark:bg-neutral-700 rounded-full h-1.5">
                        <div
                          className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                          style={{ width: `${uploadingFile.progress}%` }}
                        />
                      </div>
                    )}

                    {/* Error Message */}
                    {uploadingFile.status === 'error' && (
                      <p className="text-xs text-red-500 dark:text-red-400">
                        {uploadingFile.error || t('common.error')}
                      </p>
                    )}

                    {/* Success Message */}
                    {uploadingFile.status === 'success' && (
                      <p className="text-xs text-green-600 dark:text-green-400">
                        {t('widgets.fileUpload.uploadComplete')}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Widget>
  );
};

// Configuration Form Component
export const FileUploadWidgetConfigForm: FC<WidgetConfigFormProps<FileUploadWidgetConfig>> = ({
  config,
  onChange,
}) => {
  const { t } = useTranslation();
  const [extensionInput, setExtensionInput] = useState('');

  const handleAddExtension = () => {
    if (!extensionInput.trim()) return;

    const ext = extensionInput.trim().startsWith('.')
      ? extensionInput.trim()
      : '.' + extensionInput.trim();

    const currentExtensions = config.allowedExtensions || [];
    if (!currentExtensions.includes(ext)) {
      onChange({
        ...config,
        allowedExtensions: [...currentExtensions, ext]
      });
    }
    setExtensionInput('');
  };

  const handleRemoveExtension = (ext: string) => {
    onChange({
      ...config,
      allowedExtensions: (config.allowedExtensions || []).filter(e => e !== ext)
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">
          {t('widgets.fileUpload.config.maxFileSize')}
        </label>
        <input
          type="number"
          min="1"
          max="100"
          value={config.maxFileSize || 10}
          onChange={(e) => onChange({ ...config, maxFileSize: parseInt(e.target.value) || 10 })}
          className="w-full px-3 py-2 rounded-lg border dark:border-neutral-600 bg-white dark:bg-neutral-800"
        />
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {t('widgets.fileUpload.config.maxFileSizeHint')}
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          {t('widgets.fileUpload.config.allowedExtensions')}
        </label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={extensionInput}
            onChange={(e) => setExtensionInput(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddExtension();
              }
            }}
            placeholder=".pdf, .jpg, .png"
            className="flex-1 px-3 py-2 rounded-lg border dark:border-neutral-600 bg-white dark:bg-neutral-800"
          />
          <button
            type="button"
            onClick={handleAddExtension}
            className="px-4 py-2 bg-primary text-white rounded-lg"
          >
            {t('actions.add')}
          </button>
        </div>

        {/* Display added extensions */}
        {(config.allowedExtensions || []).length > 0 && (
          <div className="flex flex-wrap gap-2">
            {(config.allowedExtensions || []).map((ext) => (
              <div
                key={ext}
                className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-neutral-700 rounded text-sm"
              >
                <span>{ext}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveExtension(ext)}
                  className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}

        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          {t('widgets.fileUpload.config.allowedExtensionsHint')}
        </p>
      </div>
    </div>
  );
};

// Register widget
registerWidget({
  type: 'file_upload',
  label: 'widgets.types.fileUpload',
  description: 'widgets.types.fileUploadDesc',
  defaultConfig: {
    maxFileSize: 10,
    allowedExtensions: [],
    showRecentFiles: true,
  },
  Component: FileUploadWidget,
  ConfigForm: FileUploadWidgetConfigForm,
});

export default FileUploadWidget;
