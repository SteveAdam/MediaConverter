import { useState } from 'react'
import { useDropzone } from 'react-dropzone'
import axios from 'axios'
import apiUrls from '../apiurls'

function ImageConverter() {
    const [files, setFiles] = useState<File[]>([])
    const [format, setFormat] = useState('jpg')
    const [quality, setQuality] = useState('90')
    const [resize, setResize] = useState(false)
    const [width, setWidth] = useState('')
    const [height, setHeight] = useState('')
    const [maintainAspect, setMaintainAspect] = useState(true)
    const [isLoading, setIsLoading] = useState(false)
    const [progress, setProgress] = useState('')

    const onDrop = (acceptedFiles: File[]) => {
        setFiles([...files, ...acceptedFiles])
    }

    const removeFile = (index: number) => {
        setFiles(files.filter((_, i) => i !== index))
    }

    const clearAllFiles = () => {
        setFiles([])
    }

    const handleConvert = async () => {
        if (files.length === 0) {
            alert('Please select at least one image to convert')
            return
        }

        const formData = new FormData()
        files.forEach((file) => formData.append('files', file))
        formData.append('format', format)
        formData.append('quality', quality)
        formData.append('resize', resize.toString())
        if (resize) {
            formData.append('width', width)
            formData.append('height', height)
            formData.append('maintainAspect', maintainAspect.toString())
        }

        try {
            setIsLoading(true)
            setProgress(`Converting ${files.length} image(s) to ${format.toUpperCase()}...`)

            const response = await axios.post(apiUrls.images.convert, formData, {
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

            // Get filename from Content-Disposition header
            const contentDisposition = response.headers['content-disposition']
            let serverFilename

            if (contentDisposition) {
                const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/)
                if (filenameMatch && filenameMatch[1]) {
                    serverFilename = filenameMatch[1].replace(/['"]/g, '')
                }
            }

            // Handle file download
            const blob = new Blob([response.data])
            const downloadUrl = window.URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = downloadUrl

            // Prioritize server-provided filename, then fallback
            if (serverFilename) {
                link.download = serverFilename
            } else if (files.length === 1) {
                const originalName = files[0].name.split('.')[0]
                link.download = `${originalName}.${format}`
            } else {
                link.download = 'converted-images.zip'
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
            console.error('Error converting images:', error)
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
            'image/*': ['.jpeg', '.jpg', '.png', '.webp', '.gif', '.bmp', '.tiff', '.tif', '.svg', '.ico', '.avif', '.heic', '.heif']
        },
        multiple: true
    })

    const formatOptions = [
        { value: 'jpg', label: '📸 JPEG', description: 'Best for photos, smaller file size' },
        { value: 'png', label: '🖼️ PNG', description: 'Lossless, supports transparency' },
        { value: 'webp', label: '🌐 WebP', description: 'Modern format, excellent compression' },
        { value: 'avif', label: '⭐ AVIF', description: 'Next-gen format, best compression' },
        { value: 'bmp', label: '🎨 BMP', description: 'Uncompressed bitmap' },
        { value: 'tiff', label: '📄 TIFF', description: 'High quality, good for printing' },
        { value: 'gif', label: '🎬 GIF', description: 'Animated images, limited colors' }
    ]

    const qualityOptions = [
        { value: '100', label: '💎 Maximum (100%)', description: 'Highest quality, largest files' },
        { value: '90', label: '🔥 High (90%)', description: 'Excellent quality, balanced size' },
        { value: '80', label: '⚡ Good (80%)', description: 'Good quality, smaller files' },
        { value: '70', label: '💾 Medium (70%)', description: 'Decent quality, small files' },
        { value: '50', label: '📱 Low (50%)', description: 'Lower quality, very small files' }
    ]

    const getFileIcon = (fileName: string) => {
        const ext = fileName.split('.').pop()?.toLowerCase()
        switch (ext) {
            case 'jpg':
            case 'jpeg': return '📸'
            case 'png': return '🖼️'
            case 'webp': return '🌐'
            case 'gif': return '🎬'
            case 'bmp': return '🎨'
            case 'tiff':
            case 'tif': return '📄'
            case 'svg': return '🎯'
            case 'avif': return '⭐'
            case 'heic':
            case 'heif': return '📱'
            default: return '🖼️'
        }
    }

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes'
        const k = 1024
        const sizes = ['Bytes', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }

    const getTotalSize = () => {
        return files.reduce((total, file) => total + file.size, 0)
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-gray-900 to-teal-900 text-white">
            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-5xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent mb-2 h-15">
                        🖼️ Image Converter
                    </h1>
                    <p className="text-gray-300 text-lg">
                        Convert images between JPEG, PNG, WebP, AVIF, and more formats with advanced options
                    </p>
                </div>

                <div className="max-w-4xl mx-auto">
                    <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-8 shadow-2xl">

                        {/* File Drop Zone */}
                        <div className="mb-6">
                            <div className="flex justify-between items-center mb-3">
                                <label className="block text-sm font-semibold text-emerald-300">
                                    🖼️ Select Images
                                </label>
                                {files.length > 0 && (
                                    <button
                                        onClick={clearAllFiles}
                                        className="text-sm text-red-400 hover:text-red-300 px-3 py-1 rounded-lg hover:bg-red-500/20 transition-colors"
                                    >
                                        Clear All
                                    </button>
                                )}
                            </div>
                            <div
                                {...getRootProps()}
                                className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-300 ${isDragActive
                                    ? 'border-emerald-500 bg-emerald-500/10'
                                    : 'border-gray-600 hover:border-emerald-500 hover:bg-emerald-500/5'
                                    }`}
                            >
                                <input {...getInputProps()} />
                                <div className="text-6xl mb-4">
                                    {isDragActive ? '🖼️' : '📁'}
                                </div>
                                {isDragActive ? (
                                    <p className="text-emerald-400 font-medium">Drop the images here...</p>
                                ) : (
                                    <div>
                                        <p className="text-gray-300 font-medium mb-2">
                                            Drag & drop images here, or click to select
                                        </p>
                                        <p className="text-gray-500 text-sm">
                                            Supports JPEG, PNG, WebP, GIF, BMP, TIFF, SVG, AVIF, HEIC and more
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* File List */}
                        {files.length > 0 && (
                            <div className="mb-6">
                                <label className="block text-sm font-semibold mb-3 text-emerald-300">
                                    📋 Selected Images ({files.length}) - {formatFileSize(getTotalSize())}
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
                                                        {formatFileSize(file.size)} • {file.type || 'Unknown format'}
                                                    </p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => removeFile(index)}
                                                className="text-red-400 hover:text-red-300 p-1 rounded-full hover:bg-red-500/20 transition-colors"
                                                title="Remove image"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Conversion Options */}
                        <div className="grid lg:grid-cols-2 gap-6 mb-6">
                            {/* Output Format */}
                            <div>
                                <label className="block text-sm font-semibold mb-3 text-emerald-300">
                                    🎯 Output Format
                                </label>
                                <div className="space-y-2">
                                    {formatOptions.map((option) => (
                                        <label key={option.value} className="flex items-center p-4 rounded-xl bg-gray-700/30 border border-gray-600 hover:bg-gray-700/50 cursor-pointer transition-all">
                                            <input
                                                type="radio"
                                                name="format"
                                                value={option.value}
                                                checked={format === option.value}
                                                onChange={(e) => setFormat(e.target.value)}
                                                className="w-4 h-4 text-emerald-600 bg-gray-700 border-gray-600 focus:ring-emerald-500"
                                            />
                                            <div className="ml-3">
                                                <div className="text-sm font-medium">{option.label}</div>
                                                <div className="text-xs text-gray-400">{option.description}</div>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Quality Settings */}
                            <div>
                                <label className="block text-sm font-semibold mb-3 text-emerald-300">
                                    ⭐ Quality Level
                                </label>
                                <div className="space-y-2">
                                    {qualityOptions.map((option) => (
                                        <label key={option.value} className="flex items-center p-4 rounded-xl bg-gray-700/30 border border-gray-600 hover:bg-gray-700/50 cursor-pointer transition-all">
                                            <input
                                                type="radio"
                                                name="quality"
                                                value={option.value}
                                                checked={quality === option.value}
                                                onChange={(e) => setQuality(e.target.value)}
                                                className="w-4 h-4 text-emerald-600 bg-gray-700 border-gray-600 focus:ring-emerald-500"
                                            />
                                            <div className="ml-3">
                                                <div className="text-sm font-medium">{option.label}</div>
                                                <div className="text-xs text-gray-400">{option.description}</div>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Resize Options */}
                        <div className="mb-6 p-6 bg-gray-700/20 border border-gray-600 rounded-xl">
                            <div className="flex items-center space-x-3 mb-4">
                                <input
                                    type="checkbox"
                                    id="resize"
                                    checked={resize}
                                    onChange={(e) => setResize(e.target.checked)}
                                    className="w-5 h-5 text-emerald-600 bg-gray-700 border-gray-600 rounded focus:ring-emerald-500"
                                />
                                <label htmlFor="resize" className="text-lg font-semibold text-emerald-300">
                                    📏 Resize Images
                                </label>
                            </div>

                            {resize && (
                                <div className="space-y-4">
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                                Width (pixels)
                                            </label>
                                            <input
                                                type="number"
                                                value={width}
                                                onChange={(e) => setWidth(e.target.value)}
                                                placeholder="e.g. 1920"
                                                className="w-full p-3 rounded-lg bg-gray-700/50 border border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                                Height (pixels)
                                            </label>
                                            <input
                                                type="number"
                                                value={height}
                                                onChange={(e) => setHeight(e.target.value)}
                                                placeholder="e.g. 1080"
                                                className="w-full p-3 rounded-lg bg-gray-700/50 border border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                            />
                                        </div>
                                    </div>

                                    <label className="flex items-center space-x-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={maintainAspect}
                                            onChange={(e) => setMaintainAspect(e.target.checked)}
                                            className="w-4 h-4 text-emerald-600 bg-gray-700 border-gray-600 rounded focus:ring-emerald-500"
                                        />
                                        <span className="text-sm text-gray-300">Maintain aspect ratio</span>
                                    </label>

                                    <div className="text-xs text-gray-500 bg-gray-800/50 p-3 rounded-lg">
                                        💡 <strong>Tip:</strong> Leave width or height empty to auto-calculate based on aspect ratio.
                                        Uncheck "Maintain aspect ratio" to force exact dimensions (may stretch/distort images).
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Progress Display */}
                        {isLoading && progress && (
                            <div className="mb-6">
                                <div className="bg-emerald-900/30 border border-emerald-500/30 rounded-xl p-4">
                                    <div className="flex items-center space-x-3">
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-emerald-400"></div>
                                        <span className="text-sm text-emerald-300">{progress}</span>
                                    </div>
                                    <div className="mt-2 w-full bg-gray-700 rounded-full h-2">
                                        <div className="bg-gradient-to-r from-emerald-500 to-teal-500 h-2 rounded-full animate-pulse" style={{ width: '100%' }}></div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Convert Button */}
                        <button
                            onClick={handleConvert}
                            disabled={files.length === 0 || isLoading}
                            className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition-all duration-300 transform hover:scale-105 disabled:hover:scale-100 shadow-lg"
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
                                        Convert {files.length > 0 ? `${files.length} Image${files.length > 1 ? 's' : ''}` : 'Images'}
                                        {resize && ' & Resize'}
                                    </span>
                                </div>
                            )}
                        </button>

                        {/* Conversion Summary */}
                        {files.length > 0 && (
                            <div className="mt-6 p-4 bg-gray-700/30 border border-gray-600 rounded-xl">
                                <h3 className="font-semibold text-gray-300 mb-2">📋 Conversion Summary:</h3>
                                <div className="text-sm text-gray-400 space-y-1">
                                    <p>🖼️ Images: {files.length} file{files.length > 1 ? 's' : ''}</p>
                                    <p>🎯 Output Format: {formatOptions.find(f => f.value === format)?.label}</p>
                                    <p>⭐ Quality: {qualityOptions.find(q => q.value === quality)?.label}</p>
                                    {resize && (
                                        <p>📏 Resize: {width && height ? `${width}x${height}px` : width ? `${width}px width` : height ? `${height}px height` : 'Auto'}
                                            {maintainAspect ? ' (maintain ratio)' : ' (stretch to fit)'}</p>
                                    )}
                                    <p>📦 Download: {files.length > 1 ? 'ZIP archive' : 'Single file'}</p>
                                    <p>🔄 Total Size: {formatFileSize(getTotalSize())}</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Features Info */}
                    <div className="mt-8 grid md:grid-cols-4 gap-4">
                        <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700 rounded-xl p-6 text-center">
                            <div className="text-3xl mb-3">🌐</div>
                            <h3 className="font-semibold text-emerald-300 mb-2">Modern Formats</h3>
                            <p className="text-sm text-gray-400">WebP, AVIF, and other next-gen formats</p>
                        </div>
                        <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700 rounded-xl p-6 text-center">
                            <div className="text-3xl mb-3">📏</div>
                            <h3 className="font-semibold text-emerald-300 mb-2">Smart Resizing</h3>
                            <p className="text-sm text-gray-400">Maintain aspect ratio or custom dimensions</p>
                        </div>
                        <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700 rounded-xl p-6 text-center">
                            <div className="text-3xl mb-3">⚡</div>
                            <h3 className="font-semibold text-emerald-300 mb-2">Batch Processing</h3>
                            <p className="text-sm text-gray-400">Convert multiple images at once</p>
                        </div>
                        <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700 rounded-xl p-6 text-center">
                            <div className="text-3xl mb-3">🎯</div>
                            <h3 className="font-semibold text-emerald-300 mb-2">Quality Control</h3>
                            <p className="text-sm text-gray-400">Fine-tune compression and quality settings</p>
                        </div>
                    </div>

                    {/* Supported Formats Info */}
                    <div className="mt-6 bg-gray-800/30 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
                        <h3 className="font-semibold text-emerald-300 mb-4 text-center">🖼️ Supported Image Formats</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 text-sm">
                            {formatOptions.map((format) => (
                                <div key={format.value} className="text-center p-3 rounded-lg bg-gray-700/20">
                                    <div className="text-xl mb-1">{format.label.split(' ')[0]}</div>
                                    <div className="text-xs text-gray-300">{format.value.toUpperCase()}</div>
                                </div>
                            ))}
                        </div>
                        <div className="mt-4 text-center text-xs text-gray-400">
                            Plus: ICO, SVG, HEIC/HEIF input support
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ImageConverter