const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload temp directory exists
const uploadDir = path.join(__dirname, '..', 'tmp', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer disk storage setup
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir); // Save temporarily to /server/tmp/uploads/
  },
  filename: function (req, file, cb) {
    // Generate unique filename to prevent collisions during simultaneous uploads
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

// Configure upload limits and filters
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 250 * 1024 * 1024, // 250MB max limit per file
    files: 10000 // Allow up to 10000 files for large projects
  },
  fileFilter: (req, file, cb) => {
    // Check file extension — this is the most reliable approach
    const allowedExtensions = /\.(js|jsx|ts|tsx|mjs|cjs|py|pyw|java|cpp|c|cc|h|hpp|hh|cs|php|rb|go|rs|swift|kt|kts|scala|html|htm|css|scss|sass|less|json|xml|yaml|yml|md|mdx|txt|csv|sql|sh|bash|zsh|bat|ps1|vue|svelte|astro|toml|ini|cfg|conf|log|gitignore|gitattributes|editorconfig|eslintrc|prettierrc|babelrc|dockerfile|makefile|cmake|gradle|pom|properties|env|example|lock|sum|mod|prisma|graphql|gql|proto|tf|hcl|r|rmd|jl|lua|dart|ex|exs|erl|hrl|clj|cljs|cljc|edn|hs|lhs|ml|mli|fs|fsx|fsi|lisp|cl|el|scm|rkt|v|sv|vhd|vhdl|asm|s|nasm|wasm|wat|sol)$/i;
    
    const isValidExtension = allowedExtensions.test(file.originalname);
    
    // Also accept text-based MIME types
    const isTextMime = file.mimetype.startsWith('text/') || 
      ['application/json', 'application/xml', 'application/javascript',
       'application/x-javascript', 'application/typescript'].includes(file.mimetype);
    
    // Accept application/octet-stream if the extension is valid (browsers often misidentify code files)
    const isOctetWithValidExt = file.mimetype === 'application/octet-stream' && isValidExtension;
    
    if (isValidExtension || isTextMime || isOctetWithValidExt) {
      cb(null, true);
    } else {
      // Silently skip non-code files (images, binaries etc.) instead of erroring
      console.log(`[Upload] Skipping non-code file: ${file.originalname} (type: ${file.mimetype})`);
      cb(null, false);
    }
  }
});

module.exports = upload;
