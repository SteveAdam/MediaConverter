import { useState } from 'react'
import MediaConverter from '../src/pages/MediaConverter'
import DocumentConverter from '../src/pages/DocumentConverter'
import ImageConverter from '../src/pages/ImageConverter'

type ConverterType = 'media' | 'documents' | 'images'

function App() {
  const [activeConverter, setActiveConverter] = useState<ConverterType>('media')

  const converters = [
    {
      type: 'media' as const,
      title: '🎬 Media',
      description: 'Videos & Audio',
      icon: '🎥',
      color: 'from-purple-600 to-pink-600',
      hoverColor: 'hover:from-purple-700 hover:to-pink-700'
    },
    {
      type: 'documents' as const,
      title: '📚 Documents',
      description: 'PDF, DOCX, PPTX',
      icon: '📄',
      color: 'from-blue-600 to-teal-600',
      hoverColor: 'hover:from-blue-700 hover:to-teal-700'
    },
    {
      type: 'images' as const,
      title: '🖼️ Images',
      description: 'JPEG, PNG, WebP',
      icon: '🎨',
      color: 'from-emerald-600 to-teal-600',
      hoverColor: 'hover:from-emerald-700 hover:to-teal-700'
    }
  ]

  const renderConverter = () => {
    switch (activeConverter) {
      case 'media':
        return <MediaConverter />
      case 'documents':
        return <DocumentConverter />
      case 'images':
        return <ImageConverter />
      default:
        return <MediaConverter />
    }
  }

  const getActiveConverter = () => {
    return converters.find(c => c.type === activeConverter)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header Navigation */}
      <div className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            {/* Logo and Title */}
            <div className="flex items-center space-x-3">
              <div className="text-3xl">🔄</div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  Universal Converter
                </h1>
                <p className="text-sm text-gray-400">
                  Convert media, documents, and images with ease
                </p>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex flex-wrap gap-2 lg:gap-4">
              {converters.map((converter) => (
                <button
                  key={converter.type}
                  onClick={() => setActiveConverter(converter.type)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 ${
                    activeConverter === converter.type
                      ? `bg-gradient-to-r ${converter.color} text-white shadow-lg`
                      : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50 hover:text-white'
                  }`}
                >
                  <span className="text-lg">{converter.icon}</span>
                  <div className="text-left">
                    <div className="text-sm font-bold">{converter.title}</div>
                    <div className="text-xs opacity-80">{converter.description}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Active Converter Content */}
      <div className="transition-all duration-500 ease-in-out">
        {renderConverter()}
      </div>

      {/* Footer */}
      <footer className="bg-gray-800/30 border-t border-gray-700 mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="grid md:grid-cols-3 gap-8">
            {/* About */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">About Universal Converter</h3>
              <p className="text-gray-400 text-sm">
                A powerful, all-in-one conversion tool that handles media files, documents, and images 
                with advanced features like batch processing, quality control, and format optimization.
              </p>
            </div>

            {/* Features */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Key Features</h3>
              <ul className="text-gray-400 text-sm space-y-2">
                <li>✨ High-quality conversions</li>
                <li>📦 Batch processing support</li>
                <li>🔒 Secure and private</li>
                <li>⚡ Fast processing</li>
                <li>🌐 Modern format support</li>
                <li>📱 Cross-platform compatibility</li>
              </ul>
            </div>

            {/* Supported Formats */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Supported Formats</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-purple-400 font-medium">Media:</span>
                  <span className="text-gray-400 ml-2">MP3, MP4, YouTube</span>
                </div>
                <div>
                  <span className="text-blue-400 font-medium">Documents:</span>
                  <span className="text-gray-400 ml-2">PDF, DOCX, PPTX, XLSX</span>
                </div>
                <div>
                  <span className="text-emerald-400 font-medium">Images:</span>
                  <span className="text-gray-400 ml-2">JPEG, PNG, WebP, AVIF</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-gray-700 mt-8 pt-6 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-gray-400 text-sm">
              © 2025 Universal Converter. Built with modern web technologies.
            </div>
            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center space-x-2 text-green-400">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span>Service Online</span>
              </div>
              <div className="text-gray-500">|</div>
              <div className="text-gray-400">
                v1.2.0 - Enhanced with Image Support
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App