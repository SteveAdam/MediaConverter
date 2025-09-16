# Universal Converter API

A powerful Node.js API for converting YouTube videos, documents, and images with high-quality output and batch processing support.

## Features

- 🎥 **YouTube Video/Playlist Downloads** - Download single videos or entire playlists
- 📁 **High Quality Media Conversion** - MP3/MP4 conversion with customizable quality settings
- 🖼️ **Image Format Conversion** - Support for JPEG, PNG, WebP, AVIF, TIFF, BMP, GIF, ICO
- 📄 **Document Processing** - Convert between PDF, DOCX, PPTX, XLSX, ODT, TXT
- 🔄 **Batch Processing** - Handle multiple files simultaneously
- 📦 **Automatic ZIP Creation** - Multiple file outputs automatically zipped
- 🎛️ **Image Resizing** - Resize images during conversion with aspect ratio control

## Project Structure

```
universal-converter-api/
├── src/
│   ├── config/
│   │   └── index.js                 # Configuration management
│   ├── controllers/
│   │   ├── documentController.js    # Document conversion logic
│   │   ├── healthController.js      # Health check endpoints
│   │   ├── imageController.js       # Image conversion logic
│   │   └── mediaController.js       # Media conversion logic
│   ├── middleware/
│   │   ├── errorHandler.js          # Error handling middleware
│   │   └── upload.js                # File upload middleware
│   ├── routes/
│   │   ├── documents.js             # Document conversion routes
│   │   ├── health.js                # Health check routes
│   │   ├── images.js                # Image conversion routes
│   │   └── media.js                 # Media conversion routes
│   ├── services/
│   │   ├── documentService.js       # Document conversion business logic
│   │   ├── fileService.js           # File operations (ZIP creation, etc.)
│   │   ├── imageService.js          # Image processing business logic
│   │   ├── mediaService.js          # Media conversion business logic
│   │   └── youtubeService.js        # YouTube-specific operations
│   ├── utils/
│   │   ├── cleanup.js               # File cleanup utilities
│   │   ├── directories.js           # Directory setup utilities
│   │   ├── fileTypes.js             # File type detection utilities
│   │   └── shutdown.js              # Graceful shutdown utilities
│   └── server.js                    # Main application entry point
├── .env.example                     # Environment variables template
├── .gitignore                       # Git ignore rules
├── package.json                     # Project dependencies and scripts
└── README.md                        # Project documentation
```

## Prerequisites

Before running the application, make sure you have the following installed:

- **Node.js** (v18 or higher)
- **FFmpeg** - For media conversion
- **yt-dlp** - For YouTube downloads: `pip install yt-dlp`
- **LibreOffice** - For document conversion

## Installation

1. **Clone the repository:**
   ```bash
   git clone <your-repo-url>
   cd universal-converter-api
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your preferred settings
   ```

4. **Create required directories:**
   The application will automatically create the required directories on startup.

## Usage

### Development
```bash
npm run dev
```

### Production
```bash
npm start
```

The server will start on `http://localhost:5000` by default.

## API Endpoints

### Health Check
- `GET /api/health` - Check system status and service availability

### Media Conversion
- `POST /api/media/convert` - Convert YouTube videos/playlists or uploaded media
- `POST /api/media/playlist-info` - Get YouTube playlist information

### Document Conversion
- `POST /api/documents/convert` - Convert documents between formats

### Image Conversion
- `POST /api/images/convert` - Convert images between formats

## Configuration

The application uses environment variables for configuration. Key settings include:

- `PORT` - Server port (default: 5000)
- `NODE_ENV` - Environment mode (development/production)
- `CORS_ORIGIN` - Allowed CORS origin
- `MAX_FILE_SIZE` - Maximum upload file size
- `MAX_FILES` - Maximum number of files per request

## Supported Formats

### Media
- **Input:** Any video/audio format supported by FFmpeg
- **Output:** MP3, MP4
- **Quality:** High (320kbps MP3, CRF 18 MP4), Medium, Low
- **YouTube:** Single videos and full playlists

### Images
- **Input:** JPEG, PNG, WebP, GIF, BMP, TIFF, SVG, ICO, AVIF, HEIC, HEIF
- **Output:** JPEG, PNG, WebP, AVIF, TIFF, BMP, GIF, ICO
- **Features:** Quality control, resizing, aspect ratio preservation

### Documents
- **Input/Output:** PDF, DOCX, PPTX, XLSX, ODT, TXT
- **Special:** Image to document conversion supported

## Example Usage

### Convert YouTube Video to MP3
```bash
curl -X POST http://localhost:5000/api/media/convert \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://www.youtube.com/watch?v=VIDEO_ID",
    "format": "mp3",
    "quality": "high"
  }'
```

### Convert Images
```bash
curl -X POST http://localhost:5000/api/images/convert \
  -F "files=@image1.jpg" \
  -F "files=@image2.png" \
  -F "format=webp" \
  -F "quality=90" \
  -F "resize=true" \
  -F "width=800" \
  -F "height=600"
```

### Convert Documents
```bash
curl -X POST http://localhost:5000/api/documents/convert \
  -F "files=@document.docx" \
  -F "target=pdf"
```

## Architecture

The application follows a clean architecture pattern with clear separation of concerns:

- **Routes** - Define API endpoints and handle HTTP requests
- **Controllers** - Handle request/response logic and coordinate services
- **Services** - Contain business logic for specific domains
- **Middleware** - Handle cross-cutting concerns like error handling and file uploads
- **Utils** - Provide utility functions for common operations
- **Config** - Centralized configuration management

## Error Handling

The application includes comprehensive error handling:

- File size and count limits
- Unsupported format detection
- Service availability checks
- Graceful cleanup on errors
- Detailed error messages in development mode

## Security Features

- CORS configuration
- Helmet.js security headers
- File type validation
- Size limits on uploads
- Automatic file cleanup

## Performance Optimizations

- Streaming file operations
- Efficient ZIP compression
- Quality-based encoding settings
- Resource cleanup after operations
- Graceful shutdown handling

## Development

### Adding New Converters

1. Create a new service in `src/services/`
2. Add controller logic in `src/controllers/`
3. Define routes in `src/routes/`
4. Update the main server file to include new routes
5. Add configuration options if needed

### Testing

```bash
# Add your test framework here
npm test
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Troubleshooting

### Common Issues

1. **yt-dlp not found**: Install with `pip install yt-dlp`
2. **FFmpeg not available**: Install FFmpeg for your system
3. **LibreOffice errors**: Ensure LibreOffice is installed and accessible
4. **Permission errors**: Check directory permissions for uploads/downloads/temp

### Logs

The application logs important operations and errors to the console. In production, consider using a proper logging solution.

## Deployment

### Docker (Optional)

Create a `Dockerfile`:

```dockerfile
FROM node:18-alpine

# Install system dependencies
RUN apk add --no-cache ffmpeg libreoffice python3 py3-pip
RUN pip3 install yt-dlp

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 5000

CMD ["npm", "start"]
```

### Environment Variables for Production

```env
NODE_ENV=production
PORT=5000
CORS_ORIGIN=https://your-frontend-domain.com
MAX_FILE_SIZE=104857600
```

## Support

For issues and questions:
1. Check the troubleshooting section
2. Review the logs for error details
3. Create an issue in the repository