import fs from 'fs';

export async function writeDataToFile(channelTitle: string, data: any) {
    const fileName = 'channel_data.json';
  
    // Read the existing JSON data from the file
    let existingData = {};
    try {
      const fileData = await fs.promises.readFile(fileName, 'utf-8');
      existingData = JSON.parse(fileData);
    } catch (err) {
      if (err.code !== 'ENOENT') {
        console.error('Error reading the output file:', err);
      }
    }
  
    // Update the existing JSON data with the new data
    existingData[channelTitle] = data;
  
    // Write the updated JSON data back to the file
    await fs.promises.writeFile(fileName, JSON.stringify(existingData, null, 2));
}
  