import { useState } from 'react'
import axios from 'axios'
import apiUrls from '../apiurls'

interface PlaylistInfo {
  isPlaylist: boolean
  videoCount: number
  title?: string
  videos?: Array<{
    title: string
    duration: number
    uploader: string
  }>
}

function MediaConverter() {
  const [url, setUrl] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [format, setFormat] = useState('mp3')
  const [resolution, setResolution] = useState('720p')
  const [quality, setQuality] = useState('high')
  const [isLoading, setIsLoading] = useState(false)
  const [playlistInfo, setPlaylistInfo] = useState<PlaylistInfo | null>(null)
  const [downloadPlaylist, setDownloadPlaylist] = useState(false)
  const [progress, setProgress] = useState('')

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setFile(event.target.files[0])
      setUrl('')
      setPlaylistInfo(null)
    }
  }

  const handleUrlChange = (value: string) => {
    setUrl(value)
    if (value.trim()) {
      setFile(null)
      setPlaylistInfo(null)
      setDownloadPlaylist(false)
      checkPlaylist(value)
    }
  }

  const checkPlaylist = async (urlValue: string) => {
    if (!urlValue.trim()) return

    try {
      const response = await axios.post(apiUrls.playlistinfo.value, {
        url: urlValue.trim()
      })
      setPlaylistInfo(response.data)
    } catch (error) {
      console.error('Error checking playlist:', error)
      setPlaylistInfo(null)
    }
  }

  const handleConvert = async () => {
    try {
      if (!file && !url.trim()) {
        alert('Please either select a file or enter a YouTube URL')
        return
      }

      setIsLoading(true)
      setProgress('Initializing...')

      const formData = new FormData()

      if (file) {
        formData.append('file', file)
        formData.append('format', format)
        formData.append('resolution', resolution)
        formData.append('quality', quality)
        setProgress('Converting uploaded file...')
      } else if (url.trim()) {
        formData.append('url', url.trim())
        formData.append('format', format)
        formData.append('resolution', resolution)
        formData.append('quality', quality)
        formData.append('downloadPlaylist', downloadPlaylist.toString())
        
        if (playlistInfo?.isPlaylist && downloadPlaylist) {
          setProgress(`Downloading playlist (${playlistInfo.videoCount} videos)...`)
        } else {
          setProgress('Downloading from YouTube...')
        }
      }

      const response = await axios.post(apiUrls.media.convert, formData, {
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
      
      // Determine filename based on context
      if (playlistInfo?.isPlaylist && downloadPlaylist) {
        link.download = `playlist-${playlistInfo.title || 'download'}.zip`
      } else if (playlistInfo?.isPlaylist && playlistInfo.videoCount > 1 && !downloadPlaylist) {
        link.download = `batch-converted.zip`
      } else {
        link.download = `converted.${format}`
      }
      
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(downloadUrl)

      setProgress('Download complete!')
      setTimeout(() => setProgress(''), 2000)

    } catch (error) {
      console.error('Error converting media:', error)
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data?.message || 'An error occurred during conversion.'
        alert(`Error: ${errorMessage}`)
        
        if (error.response?.data?.isPlaylist) {
          // Handle playlist confirmation
          const confirmDownload = window.confirm(
            `This URL contains a playlist with multiple videos. Do you want to download the entire playlist?`
          )
          if (confirmDownload) {
            setDownloadPlaylist(true)
          }
        }
      } else {
        alert('An unexpected error occurred. Please try again later.')
      }
      setProgress('')
    } finally {
      setIsLoading(false)
    }
  }

  const formatOptions = [
    { value: 'mp3', label: '🎵 MP3 Audio', description: 'Audio only' },
    { value: 'mp4', label: '🎬 MP4 Video', description: 'Video with audio' }
  ]

  const qualityOptions = [
    { value: 'high', label: '🔥 High Quality', description: 'Best quality, larger file' },
    { value: 'medium', label: '⚡ Medium Quality', description: 'Balanced quality & size' },
    { value: 'low', label: '💾 Low Quality', description: 'Smaller file size' }
  ]

  const resolutionOptions = [
    { value: '2160p', label: '4K (2160p)', description: 'Ultra HD' },
    { value: '1440p', label: '2K (1440p)', description: 'Quad HD' },
    { value: '1080p', label: 'Full HD (1080p)', description: 'Standard HD' },
    { value: '720p', label: 'HD (720p)', description: 'Standard' },
    { value: '480p', label: 'SD (480p)', description: 'Lower quality' }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-gray-900 to-indigo-900 text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-4">
            🎬 Universal Media Converter
          </h1>
          <p className="text-gray-300 text-lg">
            Convert YouTube videos, playlists, and your own files with enhanced quality
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-8 shadow-2xl">
            
            {/* URL Input Section */}
            <div className="mb-6">
              <label className="block text-sm font-semibold mb-3 text-purple-300">
                🔗 YouTube URL or Playlist
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="https://youtu.be/... or https://www.youtube.com/watch?v=..."
                  value={url}
                  onChange={(e) => handleUrlChange(e.target.value)}
                  className="w-full p-4 rounded-xl bg-gray-700/50 border border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                />
                {url.includes('youtube') && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <span className="text-red-500 text-lg">📺</span>
                  </div>
                )}
              </div>
              
              {/* Playlist Info */}
              {playlistInfo && playlistInfo.isPlaylist && (
                <div className="mt-4 p-4 bg-purple-900/30 border border-purple-500/30 rounded-xl">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-purple-300">📋 Playlist Detected</h3>
                    <span className="text-sm bg-purple-600 px-2 py-1 rounded-full">
                      {playlistInfo.videoCount} videos
                    </span>
                  </div>
                  <p className="text-sm text-gray-300 mb-3">{playlistInfo.title}</p>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={downloadPlaylist}
                      onChange={(e) => setDownloadPlaylist(e.target.checked)}
                      className="w-4 h-4 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500"
                    />
                    <span className="text-sm">Download entire playlist</span>
                  </label>
                </div>
              )}
            </div>

            {/* OR Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-600"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-gray-800 px-4 text-gray-400 font-medium">OR</span>
              </div>
            </div>

            {/* File Upload Section */}
            <div className="mb-6">
              <label className="block text-sm font-semibold mb-3 text-purple-300">
                📁 Upload Media File
              </label>
              <div className="relative">
                <input
                  type="file"
                  accept="video/*,audio/*"
                  onChange={handleFileChange}
                  className="w-full p-4 rounded-xl bg-gray-700/50 border border-gray-600 text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-purple-600 file:text-white hover:file:bg-purple-700 transition-all"
                />
              </div>
              {file && (
                <div className="mt-3 p-3 bg-green-900/30 border border-green-500/30 rounded-lg">
                  <p className="text-sm text-green-300">✅ Selected: {file.name}</p>
                </div>
              )}
            </div>

            {/* Format Selection */}
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-semibold mb-3 text-purple-300">
                  🎯 Output Format
                </label>
                <div className="space-y-2">
                  {formatOptions.map((option) => (
                    <label key={option.value} className="flex items-center p-3 rounded-xl bg-gray-700/30 border border-gray-600 hover:bg-gray-700/50 cursor-pointer transition-all">
                      <input
                        type="radio"
                        name="format"
                        value={option.value}
                        checked={format === option.value}
                        onChange={(e) => setFormat(e.target.value)}
                        className="w-4 h-4 text-purple-600 bg-gray-700 border-gray-600 focus:ring-purple-500"
                      />
                      <div className="ml-3">
                        <div className="text-sm font-medium">{option.label}</div>
                        <div className="text-xs text-gray-400">{option.description}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Quality Selection */}
              <div>
                <label className="block text-sm font-semibold mb-3 text-purple-300">
                  ⭐ Quality Level
                </label>
                <div className="space-y-2">
                  {qualityOptions.map((option) => (
                    <label key={option.value} className="flex items-center p-3 rounded-xl bg-gray-700/30 border border-gray-600 hover:bg-gray-700/50 cursor-pointer transition-all">
                      <input
                        type="radio"
                        name="quality"
                        value={option.value}
                        checked={quality === option.value}
                        onChange={(e) => setQuality(e.target.value)}
                        className="w-4 h-4 text-purple-600 bg-gray-700 border-gray-600 focus:ring-purple-500"
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

            {/* Resolution Selection (only for video) */}
            {format === 'mp4' && (
              <div className="mb-6">
                <label className="block text-sm font-semibold mb-3 text-purple-300">
                  📺 Video Resolution
                </label>
                <select
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                  className="w-full p-5 rounded-xl bg-gray-700/50 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                >
                  {resolutionOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label} - {option.description}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Progress Display */}
            {isLoading && progress && (
              <div className="mb-6">
                <div className="bg-purple-900/30 border border-purple-500/30 rounded-xl p-4">
                  <div className="flex items-center space-x-3">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-400"></div>
                    <span className="text-sm text-purple-300">{progress}</span>
                  </div>
                  <div className="mt-2 w-full bg-gray-700 rounded-full h-2">
                    <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full animate-pulse" style={{width: '100%'}}></div>
                  </div>
                </div>
              </div>
            )}

            {/* Convert Button */}
            <button
              onClick={handleConvert}
              disabled={(!file && !url.trim()) || isLoading}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition-all duration-300 transform hover:scale-105 disabled:hover:scale-100 shadow-lg"
            >
              {isLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Processing...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-2">
                  <span>🚀</span>
                  <span>
                    {playlistInfo?.isPlaylist && downloadPlaylist 
                      ? `Convert Playlist (${playlistInfo.videoCount} videos)`
                      : 'Convert Media'
                    }
                  </span>
                </div>
              )}
            </button>

            {/* Info Cards */}
            <div className="grid md:grid-cols-2 gap-4 mt-6">
              <div className="bg-gradient-to-r from-blue-900/20 to-cyan-900/20 border border-blue-500/20 rounded-xl p-4">
                <h3 className="font-semibold text-blue-300 mb-2">🎵 Audio Features</h3>
                <ul className="text-xs text-blue-200 space-y-1">
                  <li>• Up to 320kbps MP3 quality</li>
                  <li>• Volume normalization</li>
                  <li>• Metadata preservation</li>
                </ul>
              </div>
              <div className="bg-gradient-to-r from-green-900/20 to-emerald-900/20 border border-green-500/20 rounded-xl p-4">
                <h3 className="font-semibold text-green-300 mb-2">🎬 Video Features</h3>
                <ul className="text-xs text-green-200 space-y-1">
                  <li>• Up to 4K resolution support</li>
                  <li>• H.264 encoding</li>
                  <li>• Playlist batch download</li>
                </ul>
              </div>
            </div>

            {/* Current Selection Summary */}
            {(file || url.trim()) && (
              <div className="mt-6 p-4 bg-gray-700/30 border border-gray-600 rounded-xl">
                <h3 className="font-semibold text-gray-300 mb-2">📋 Current Selection:</h3>
                <div className="text-sm text-gray-400 space-y-1">
                  {file && <p>📁 File: {file.name}</p>}
                  {url.trim() && <p>🔗 URL: YouTube {playlistInfo?.isPlaylist ? 'Playlist' : 'Video'}</p>}
                  <p>🎯 Format: {format.toUpperCase()}</p>
                  <p>⭐ Quality: {quality}</p>
                  {format === 'mp4' && <p>📺 Resolution: {resolution}</p>}
                  {playlistInfo?.isPlaylist && (
                    <p>📋 Playlist: {downloadPlaylist ? `Yes (${playlistInfo.videoCount} videos)` : 'No (single video only)'}</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Additional Features Info */}
          <div className="mt-8 grid md:grid-cols-3 gap-4">
            <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700 rounded-xl p-6 text-center">
              <div className="text-3xl mb-3">⚡</div>
              <h3 className="font-semibold text-purple-300 mb-2">Lightning Fast</h3>
              <p className="text-sm text-gray-400">Optimized processing with parallel conversion</p>
            </div>
            <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700 rounded-xl p-6 text-center">
              <div className="text-3xl mb-3">🔒</div>
              <h3 className="font-semibold text-purple-300 mb-2">Secure & Private</h3>
              <p className="text-sm text-gray-400">Files are automatically deleted after download</p>
            </div>
            <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700 rounded-xl p-6 text-center">
              <div className="text-3xl mb-3">📱</div>
              <h3 className="font-semibold text-purple-300 mb-2">Multi-Platform</h3>
              <p className="text-sm text-gray-400">Works on all devices and operating systems</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MediaConverter