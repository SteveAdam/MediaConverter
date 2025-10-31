// Test yt-dlp manually to diagnose the issue
// Save this as test-ytdlp.js and run: node test-ytdlp.js

import youtubeDl from 'youtube-dl-exec'
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, '../..')
const downloadsDir = path.join(projectRoot, 'downloads')

async function testYtDlp() {
  console.log('=== yt-dlp Diagnostic Test ===\n')
  
  // Test URL
  const testUrl = 'https://www.youtube.com/watch?v=HyzlYwjoXOQ'
  
  console.log('1. Checking yt-dlp version...')
  try {
    const version = await youtubeDl('--version')
    console.log('   ✓ yt-dlp version:', version)
  } catch (err) {
    console.log('   ✗ yt-dlp not found or not working:', err.message)
    return
  }
  
  console.log('\n2. Downloads directory:', downloadsDir)
  try {
    await fs.access(downloadsDir)
    console.log('   ✓ Directory exists')
  } catch (err) {
    console.log('   ✗ Directory does not exist, creating...')
    await fs.mkdir(downloadsDir, { recursive: true })
    console.log('   ✓ Directory created')
  }
  
  console.log('\n3. Testing simple download...')
  const timestamp = Date.now()
  
  // Normalize path for Windows
  const normalizedPath = downloadsDir.replace(/\\/g, '/')
  const outputTemplate = `${normalizedPath}/test_${timestamp}_%(title)s.%(ext)s`
  
  console.log('   Output template:', outputTemplate)
  
  const options = {
    output: outputTemplate,
    restrictFilenames: true,
    format: 'best',
    printJson: true,
    noPlaylist: true
  }
  
  console.log('   Options:', JSON.stringify(options, null, 2))
  console.log('   Starting download...')
  
  try {
    const info = await youtubeDl(testUrl, options)
    console.log('\n   ✓ Download completed!')
    
    if (info && info._filename) {
      console.log('   Reported filename:', info._filename)
    }
    
    // Check what files are actually there
    console.log('\n4. Checking downloads directory...')
    const files = await fs.readdir(downloadsDir)
    console.log(`   Total files: ${files.length}`)
    
    const testFiles = files.filter(f => f.startsWith(`test_${timestamp}`))
    console.log(`   Files matching test pattern: ${testFiles.length}`)
    
    if (testFiles.length > 0) {
      console.log('\n   ✓✓✓ SUCCESS! Files found:')
      testFiles.forEach(f => {
        console.log('      -', f)
      })
    } else {
      console.log('\n   ✗✗✗ PROBLEM: yt-dlp said success but no files found!')
      console.log('   All files in directory:', files.slice(0, 10).join(', '))
    }
    
  } catch (err) {
    console.log('\n   ✗ Download failed:', err.message)
    console.log('   Full error:', err)
  }
  
  console.log('\n=== Test Complete ===')
}

testYtDlp().catch(console.error)