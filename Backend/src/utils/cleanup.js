import fs from 'fs/promises'

export const cleanupFiles = async (filePaths) => {
  for (const filePath of filePaths) {
    try {
      await fs.unlink(filePath)
    } catch (error) {
      console.log(`Could not delete ${filePath}:`, error.message)
    }
  }
}