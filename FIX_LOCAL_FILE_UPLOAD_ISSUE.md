# Fix Local File/Folder Upload Issue - Implementation Guide

## Issue Description
Users can copy-paste GitHub links and access repositories, but local file/folder uploads are not working properly. The upload functionality exists in both frontend and backend but may have configuration or implementation issues.

## Root Cause Analysis
Based on code inspection, the upload functionality is implemented but may have these issues:

1. **Browser Compatibility**: `webkitdirectory` attribute may not work in all browsers
2. **File Size Limits**: Multer configured for 50MB limit may be too restrictive
3. **Directory Permissions**: Temp directories may not have proper permissions
4. **API Key Requirement**: Upload requires API key to be set first
5. **Error Handling**: Poor error messages make debugging difficult

## Implementation Steps

### Step 1: Enhance Upload Middleware
**File:** `server/middleware/upload.middleware.js`

Issues to fix:
- Increase file size limits for larger projects
- Add better file filtering
- Improve error handling

### Step 2: Fix Frontend Upload Handlers
**File:** `client/src/pages/Dashboard.jsx`

Issues to fix:
- Add browser compatibility checks for `webkitdirectory`
- Improve error handling and user feedback
- Add file size validation on frontend

### Step 3: Enhance Backend Upload Routes
**File:** `server/routes/repo.routes.js`

Issues to fix:
- Better error messages
- Add progress tracking
- Improve validation

### Step 4: Add Upload Status Monitoring
**File:** `client/src/services/api.js`

Add upload progress tracking and better error handling.

## Code Changes Needed

### 1. Enhanced Upload Middleware
```javascript
// Increase limits, add better filtering
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB per file
    files: 100 // Max 100 files
  },
  fileFilter: (req, file, cb) => {
    // Accept common code files and documents
    const allowedTypes = [
      'text/', 'application/json', 'application/xml',
      'application/javascript', 'application/x-javascript'
    ];
    const isValid = allowedTypes.some(type => 
      file.mimetype.startsWith(type)
    ) || file.originalname.match(/\.(js|jsx|ts|tsx|py|java|cpp|c|h|cs|php|rb|go|rs|swift|kt|scala|html|css|scss|less|json|xml|yaml|yml|md|txt|sql|sh|bat|ps1)$/i);
    
    cb(null, isValid);
  }
});
```

### 2. Enhanced Frontend Upload Handler
```javascript
const handleFolderUpload = async (e) => {
  const files = Array.from(e.target.files);
  if (files.length === 0) return;

  // Check browser support
  if (!files[0].webkitRelativePath) {
    toast.error('Your browser doesn\'t support folder uploads. Try Chrome or Firefox.');
    return;
  }

  // Validate file sizes
  const totalSize = files.reduce((sum, file) => sum + file.size, 0);
  if (totalSize > 100 * 1024 * 1024) {
    toast.error('Total folder size must be less than 100MB');
    return;
  }

  // Check for API key
  if (!user?.apiKey) {
    toast.error('Please set up your API key first before uploading files.');
    return;
  }

  const formData = new FormData();
  const rootFolderName = files[0].webkitRelativePath.split('/')[0];
  formData.append('projectName', rootFolderName);

  files.forEach((file) => {
    formData.append('project', file, file.webkitRelativePath);
  });

  setUploadLoading(true);
  try {
    const response = await repoService.uploadFolder(formData);
    // Handle success
  } catch (error) {
    console.error('Upload failed:', error);
    toast.error(error.response?.data?.message || 'Upload failed. Please try again.');
  } finally {
    setUploadLoading(false);
  }
};
```

### 3. Enhanced Backend Error Handling
```javascript
router.post('/upload-folder', protect, upload.array('project'), async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ 
      error: 'NO_FILES',
      message: 'No files uploaded. Please select a valid folder.' 
    });
  }

  if (!req.user?.apiKey) {
    return res.status(400).json({
      error: 'API_KEY_REQUIRED',
      message: 'Please add your LLM API key in Dashboard (Backend Security Setup) before uploading.'
    });
  }

  try {
    const repo = await UploadService.processFolderUpload(req.files, projectName, req.user._id);
    res.status(200).json({
      repoId: repo._id,
      name: repo.name,
      status: 'indexing',
      message: 'Folder upload successful! Indexing started...'
    });
  } catch (error) {
    console.error('Folder Upload Error:', error);
    res.status(500).json({ 
      error: 'UPLOAD_FAILED',
      message: error.message || 'Failed to process project folder' 
    });
  }
});
```

## Testing Requirements

### Browser Compatibility Testing
- [ ] Chrome/Chromium (full support)
- [ ] Firefox (full support)
- [ ] Safari (limited support)
- [ ] Edge (full support)

### File Upload Testing
- [ ] Single file upload (< 100MB)
- [ ] Multiple file upload
- [ ] Folder upload with nested structure
- [ ] Large file handling
- [ ] Invalid file type rejection

### Error Scenario Testing
- [ ] No API key set
- [ ] File size exceeded
- [ ] Network interruption
- [ ] Server errors

## Expected Behavior
- ✅ Users can upload individual files up to 100MB
- ✅ Users can upload folders with proper directory structure
- ✅ Clear error messages for common issues
- ✅ Progress indication for large uploads
- ✅ API key validation before upload
- ✅ Browser compatibility checks

## Security Considerations
- File type filtering to prevent malicious uploads
- Size limits to prevent resource exhaustion
- Path traversal protection in file handling
- User-specific upload directories

## Troubleshooting Steps

1. **Check Browser Console**: Look for JavaScript errors
2. **Verify API Key**: Ensure user has set up their LLM API key
3. **Check Server Logs**: Look for multer or file system errors
4. **Test Permissions**: Ensure tmp directories are writable
5. **Network Issues**: Check CORS and request headers

## Files to Modify
1. `server/middleware/upload.middleware.js`
2. `client/src/pages/Dashboard.jsx`
3. `server/routes/repo.routes.js`
4. `client/src/services/api.js`

## Additional Enhancements
- Add upload progress bars
- Implement drag-and-drop interface
- Add file preview functionality
- Implement resume capability for large uploads
