import { useState } from 'react'
import { useDropzone } from 'react-dropzone'
import axios from 'axios'

function DocumentConverter() {
  const [files, setFiles] = useState<File[]>([])
  const [outputFormat, setOutputFormat] = useState('pdf')
  const [isLoading, setIsLoading] = useState(false)
  const [progress, setProgress] = useState('')

  const onDrop = (acceptedFiles: File[]) => {
    setFiles(acceptedFiles)
  }

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index))
  }

  const handleConvert = async () => {
    if (files.length === 0) {
      alert('Please select at least one document to convert')
      return
    }

    const formData = new FormData()
    files.forEach((file) => formData.append('files', file))
    formData.append('target', outputFormat)

    try {
      setIsLoading(true)
      setProgress(`Converting ${files.length} document(s)...`)

      const response = await axios.post('http://localhost:5000/api/convert-documents', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        responseType: 'blob',
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
            setProgress(`Uploading: ${percentCompleted}%`)
          }
        }
      })

      setProgress('Preparing download...')

      // Handle file download
      const blob = new Blob([response.data])
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = downloadUrl

      if (files.length === 1) {
        link.download = `converted.${outputFormat}`
      } else {
        link.download = 'converted-documents.zip'
      }

      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(downloadUrl)

      setProgress('Conversion complete!')
      setTimeout(() => {
        setProgress('')
        setFiles([]) // Clear files after successful conversion
      }, 2000)

    } catch (error) {
      console.error('Error converting documents:', error)
      if (axios.isAxiosError(error)) {
        alert(`Error: ${error.response?.data?.message || 'An error occurred during conversion.'}`)
      } else {
        alert('An unexpected error occurred. Please try again later.')
      }
      setProgress('')
    } finally {
      setIsLoading(false)
    }
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/msword': ['.doc'],
      'application/vnd.ms-powerpoint': ['.ppt'],
      'application/vnd.ms-excel': ['.xls'],
      'text/plain': ['.txt'],
      'application/rtf': ['.rtf'],
      // ⬇ Added image formats
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp'],
      'image/gif': ['.gif'],
      'image/bmp': ['.bmp'],
      'image/tiff': ['.tiff', '.tif']
    },
    multiple: true
  })

  const formatOptions = [
    { value: 'pdf', label: '📄 PDF', description: 'Portable Document Format' },
    { value: 'docx', label: '📝 DOCX', description: 'Microsoft Word Document' },
    { value: 'pptx', label: '📊 PPTX', description: 'PowerPoint Presentation' },
    { value: 'xlsx', label: '📈 XLSX', description: 'Excel Spreadsheet' },
    { value: 'odt', label: '📋 ODT', description: 'OpenDocument Text' },
    { value: 'txt', label: '📄 TXT', description: 'Plain Text File' }
  ]

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase()
    switch (ext) {
      case 'pdf': return '📄'
      case 'docx':
      case 'doc': return '📝'
      case 'pptx':
      case 'ppt': return '📊'
      case 'xlsx':
      case 'xls': return '📈'
      case 'txt': return '📄'
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'bmp':
      case 'tiff':
      case 'tif':
      case 'webp': return '🖼️' // Added for images
      default: return '📋'
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-gray-900 to-teal-900 text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-400 to-teal-400 bg-clip-text text-transparent mb-4">
            📚 Document Converter
          </h1>
          <p className="text-gray-300 text-lg">
            Convert documents between PDF, DOCX, PPTX, and more formats
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-8 shadow-2xl">

            {/* File Drop Zone */}
            <div className="mb-6">
              <label className="block text-sm font-semibold mb-3 text-blue-300">
                📁 Select Documents
              </label>
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-300 ${isDragActive
                  ? 'border-blue-500 bg-blue-500/10'
                  : 'border-gray-600 hover:border-blue-500 hover:bg-blue-500/5'
                  }`}
              >
                <input {...getInputProps()} />
                <div className="text-6xl mb-4">
                  {isDragActive ? '📥' : '📄'}
                </div>
                {isDragActive ? (
                  <p className="text-blue-400 font-medium">Drop the files here...</p>
                ) : (
                  <div>
                    <p className="text-gray-300 font-medium mb-2">
                      Drag & drop documents here, or click to select
                    </p>
                    <p className="text-gray-500 text-sm">
                      Supports PDF, DOCX, PPTX, XLSX, DOC, PPT, XLS, TXT, RTF, and images (JPG, PNG, WebP, GIF, BMP, TIFF)
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* File List */}
            {files.length > 0 && (
              <div className="mb-6">
                <label className="block text-sm font-semibold mb-3 text-blue-300">
                  📋 Selected Files ({files.length})
                </label>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {files.map((file, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-700/50 border border-gray-600 rounded-xl p-3">
                      <div className="flex items-center space-x-3">
                        <span className="text-xl">{getFileIcon(file.name)}</span>
                        <div>
                          <p className="text-sm font-medium text-white truncate max-w-xs">
                            {file.name}
                          </p>
                          <p className="text-xs text-gray-400">
                            {formatFileSize(file.size)}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => removeFile(index)}
                        className="text-red-400 hover:text-red-300 p-1 rounded-full hover:bg-red-500/20 transition-colors"
                        title="Remove file"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Output Format Selection */}
            <div className="mb-6">
              <label className="block text-sm font-semibold mb-3 text-blue-300">
                🎯 Output Format
              </label>
              <div className="grid md:grid-cols-2 gap-3">
                {formatOptions.map((option) => (
                  <label key={option.value} className="flex items-center p-4 rounded-xl bg-gray-700/30 border border-gray-600 hover:bg-gray-700/50 cursor-pointer transition-all">
                    <input
                      type="radio"
                      name="outputFormat"
                      value={option.value}
                      checked={outputFormat === option.value}
                      onChange={(e) => setOutputFormat(e.target.value)}
                      className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 focus:ring-blue-500"
                    />
                    <div className="ml-3">
                      <div className="text-sm font-medium">{option.label}</div>
                      <div className="text-xs text-gray-400">{option.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Progress Display */}
            {isLoading && progress && (
              <div className="mb-6">
                <div className="bg-blue-900/30 border border-blue-500/30 rounded-xl p-4">
                  <div className="flex items-center space-x-3">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-400"></div>
                    <span className="text-sm text-blue-300">{progress}</span>
                  </div>
                  <div className="mt-2 w-full bg-gray-700 rounded-full h-2">
                    <div className="bg-gradient-to-r from-blue-500 to-teal-500 h-2 rounded-full animate-pulse" style={{ width: '100%' }}></div>
                  </div>
                </div>
              </div>
            )}

            {/* Convert Button */}
            <button
              onClick={handleConvert}
              disabled={files.length === 0 || isLoading}
              className="w-full bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition-all duration-300 transform hover:scale-105 disabled:hover:scale-100 shadow-lg"
            >
              {isLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Converting...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-2">
                  <span>🚀</span>
                  <span>
                    Convert {files.length > 0 ? `${files.length} Document${files.length > 1 ? 's' : ''}` : 'Documents'}
                  </span>
                </div>
              )}
            </button>

            {/* Conversion Summary */}
            {files.length > 0 && (
              <div className="mt-6 p-4 bg-gray-700/30 border border-gray-600 rounded-xl">
                <h3 className="font-semibold text-gray-300 mb-2">📋 Conversion Summary:</h3>
                <div className="text-sm text-gray-400 space-y-1">
                  <p>📁 Files: {files.length} document{files.length > 1 ? 's' : ''}</p>
                  <p>🎯 Output Format: {formatOptions.find(f => f.value === outputFormat)?.label}</p>
                  <p>📦 Download: {files.length > 1 ? 'ZIP archive' : 'Single file'}</p>
                  <p>🔄 Total Size: {formatFileSize(files.reduce((total, file) => total + file.size, 0))}</p>
                </div>
              </div>
            )}
          </div>

          {/* Features Info */}
          <div className="mt-8 grid md:grid-cols-3 gap-4">
            <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700 rounded-xl p-6 text-center">
              <div className="text-3xl mb-3">📄</div>
              <h3 className="font-semibold text-blue-300 mb-2">Multiple Formats</h3>
              <p className="text-sm text-gray-400">Convert between PDF, DOCX, PPTX, XLSX and more</p>
            </div>
            <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700 rounded-xl p-6 text-center">
              <div className="text-3xl mb-3">📦</div>
              <h3 className="font-semibold text-blue-300 mb-2">Batch Processing</h3>
              <p className="text-sm text-gray-400">Convert multiple documents at once</p>
            </div>
            <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700 rounded-xl p-6 text-center">
              <div className="text-3xl mb-3">🔒</div>
              <h3 className="font-semibold text-blue-300 mb-2">Secure Processing</h3>
              <p className="text-sm text-gray-400">Files are processed securely and deleted after download</p>
            </div>
          </div>

          {/* Supported Formats Info */}
          <div className="mt-6 bg-gray-800/30 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
            <h3 className="font-semibold text-blue-300 mb-4 text-center">📋 Supported Formats</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div className="text-center p-2">
                <div className="text-xl mb-1">📄</div>
                <div className="text-gray-300">PDF</div>
              </div>
              <div className="text-center p-2">
                <div className="text-xl mb-1">📝</div>
                <div className="text-gray-300">DOCX/DOC</div>
              </div>
              <div className="text-center p-2">
                <div className="text-xl mb-1">📊</div>
                <div className="text-gray-300">PPTX/PPT</div>
              </div>
              <div className="text-center p-2">
                <div className="text-xl mb-1">📈</div>
                <div className="text-gray-300">XLSX/XLS</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DocumentConverter