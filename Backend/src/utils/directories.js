import fs from 'fs/promises'
import { config } from '../config/index.js'

export const setupDirectories = async () => {
  const directories = Object.values(config.directories)
  
  for (const dir of directories) {
    try {
      await fs.access(dir)
    } catch {
      await fs.mkdir(dir, { recursive: true })
      console.log(`Created directory: ${dir}`)
    }
  }
}