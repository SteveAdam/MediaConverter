const BASE_URL = "http://localhost:5000/api";

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