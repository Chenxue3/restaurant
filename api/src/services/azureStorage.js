import { BlobServiceClient } from '@azure/storage-blob';

// Initialize Azure Blob Storage client
const getBlobServiceClient = () => {
  const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
  if (!connectionString) {
    throw new Error('Azure storage connection string is not configured');
  }
  
  // Validate connection string format
  if (!connectionString.startsWith('DefaultEndpointsProtocol=https')) {
    throw new Error('Invalid Azure storage connection string format. Expected format: DefaultEndpointsProtocol=https;AccountName=...;AccountKey=...;EndpointSuffix=core.windows.net');
  }
  
  try {
    return BlobServiceClient.fromConnectionString(connectionString);
  } catch (error) {
    throw new Error(`Failed to create Azure Blob Service client: ${error.message}`);
  }
};

// Get a container client
const getContainerClient = (containerName) => {
  const blobServiceClient = getBlobServiceClient();
  return blobServiceClient.getContainerClient(containerName);
};

// Upload image to Azure Blob Storage
export const uploadImage = async (file, directory) => {
  try {
    const containerName = 'smartsavor';
    const containerClient = getContainerClient(containerName);
    
    // Create container if it doesn't exist
    await containerClient.createIfNotExists({
      access: 'blob' // Public access level
    });
    
    // Generate unique blob name
    const blobName = `${directory}/${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`;
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    
    // Upload file
    await blockBlobClient.uploadData(file.buffer, {
      blobHTTPHeaders: { blobContentType: file.mimetype }
    });
    
    // Return the URL of the uploaded image
    return blockBlobClient.url;
  } catch (error) {
    console.error(`Error uploading image to Azure Blob Storage: ${error.message}`);
    throw error;
  }
};

// Delete image from Azure Blob Storage
export const deleteImage = async (imageUrl) => {
  try {
    // Extract blob name from URL
    const url = new URL(imageUrl);
    const pathSegments = url.pathname.split('/');
    const containerName = pathSegments[1];
    const blobName = pathSegments.slice(2).join('/');
    
    const containerClient = getContainerClient(containerName);
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    
    // Delete the blob
    await blockBlobClient.delete();
  } catch (error) {
    console.error(`Error deleting image from Azure Blob Storage: ${error.message}`);
    throw error;
  }
};

export { getBlobServiceClient, getContainerClient };

export default {
  uploadImage,
  deleteImage,
  getBlobServiceClient,
  getContainerClient
}; 