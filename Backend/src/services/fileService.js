import fs from 'fs'
import path from 'path'
import archiver from 'archiver'

export const createZipFile = async (filePaths, zipName, outputDir, fileInfos = null) => {
  const zipPath = path.join(outputDir, `${zipName}.zip`)
  const archive = archiver('zip', { zlib: { level: 9 } })
  const output = fs.createWriteStream(zipPath)

  return new Promise((resolve, reject) => {
    output.on('close', () => resolve(zipPath))
    output.on('error', reject)
    archive.on('error', reject)

    archive.pipe(output)

    filePaths.forEach((filePath, index) => {
      let fileName = path.basename(filePath)
      
      // If we have file info (for documents), use the converted name
      if (fileInfos && fileInfos[index]) {
        fileName = fileInfos[index].convertedName
      }
      
      archive.file(filePath, { name: fileName })
    })

    archive.finalize()
  })
}