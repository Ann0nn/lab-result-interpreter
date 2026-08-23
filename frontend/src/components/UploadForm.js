import React, { useState } from 'react';
import './UploadForm.css';

function UploadForm({ onUpload, loading }) {
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      validateAndUpload(files[0]);
    }
  };

  const handleChange = (e) => {
    const files = e.target.files;
    if (files && files[0]) {
      validateAndUpload(files[0]);
    }
  };

  const validateAndUpload = (file) => {
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      alert('Please upload a PDF or image file (JPEG/PNG)');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB');
      return;
    }
    onUpload(file);
  };

  return (
    <div className="upload-container">
      <form
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`upload-form ${dragActive ? 'active' : ''}`}
      >
        <input
          type="file"
          id="file-input"
          onChange={handleChange}
          disabled={loading}
          accept=".pdf,.jpg,.jpeg,.png"
        />
        <label htmlFor="file-input" className="upload-label">
          <div className="upload-icon">📄</div>
          <h3>Drop your lab report here</h3>
          <p>or click to browse</p>
          <small>PDF · JPEG · PNG — max 10MB</small>
        </label>
      </form>
    </div>
  );
}

export default UploadForm;
