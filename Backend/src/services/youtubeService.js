import youtubeDl from 'youtube-dl-exec'

// Check if yt-dlp is available
export const checkYtDlp = async () => {
  try {
    await youtubeDl('--version')
    return true
  } catch (error) {
    console.log('yt-dlp not available:', error.message)
    return false
  }
}

// Check if URL is a playlist
export const isPlaylist = (url) => {
  return url.includes('playlist?list=') || url.includes('&list=')
}

// Get playlist info
export const getPlaylistInfo = async (url) => {
  try {
    const info = await youtubeDl(url, {
      dumpJson: true,
      noWarnings: true,
      flatPlaylist: true
    })
    return Array.isArray(info) ? info : [info]
  } catch (error) {
    console.error('Error getting playlist info:', error)
    throw new Error('Failed to get playlist information')
  }
}