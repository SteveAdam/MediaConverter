// Use environment variable for API URL, fallback to localhost for development
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'
const BASE_URL = `${API_BASE_URL}/api`

const apiUrls = {
    media: {
        convert: `${BASE_URL}/media/convert`,
    },
    document: {
        convert: `${BASE_URL}/documents/convert`,
    },
    images: {
        convert: `${BASE_URL}/images/convert`,
    },
    playlistinfo: {
        value: `${BASE_URL}/media/playlist-info`,
    }

};

export default apiUrls;