export const gracefulShutdown = async (signal) => {
  console.log(`${signal} received, shutting down gracefully`)
  
  // Add any cleanup logic here
  // - Close database connections
  // - Finish ongoing operations
  // - Clean up temporary files
  
  process.exit(0)
}