import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import './FileUploader.css';

const FileUploader = ({ onFileSelected }) => {
  const [file, setFile] = useState(null);

  const onDrop = useCallback(acceptedFiles => {
    if (acceptedFiles && acceptedFiles.length > 0) {
      const selected = acceptedFiles[0];
      setFile(selected);
      onFileSelected(selected);
    }
  }, [onFileSelected]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    },
    maxFiles: 1
  });

  return (
    <div 
      {...getRootProps()} 
      className={`file-uploader ${isDragActive ? 'drag-active' : ''} ${file ? 'has-file' : ''}`}
    >
      <input {...getInputProps()} />
      <div className="uploader-content">
        <div className="upload-icon">
          {file ? '✅' : '☁️'}
        </div>
        
        {file ? (
          <div className="file-info fade-in">
            <h3>{file.name}</h3>
            <p>{(file.size / 1024).toFixed(1)} KB</p>
          </div>
        ) : (
          <div className="upload-prompt">
            <h3>{isDragActive ? 'Drop it here!' : 'Drop your Excel file here'}</h3>
            <p>or click to browse (.xlsx, .xls)</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FileUploader;
