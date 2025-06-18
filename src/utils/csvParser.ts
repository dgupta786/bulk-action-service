import { createReadStream } from 'fs';
import { parse } from 'fast-csv';
import serverConfig from '../configs/server.config';

/**
 * Processes a CSV file in batches to efficiently handle large files
 * @param filePath Path to the CSV file
 * @param batchProcessor Function to process each batch of records
 * @returns Promise resolving to the total number of processed records
 */
export const processCsvInBatches = async (
  filePath: string, 
  batchProcessor: (records: Record<string, any>[]) => Promise<void>
): Promise<number> => {
  return new Promise((resolve, reject) => {
    let recordCount = 0;
    let currentBatch: Record<string, any>[] = [];
    let processingQueue = Promise.resolve();
    const { csvBatchSize: maxBatchSize } = serverConfig;
    
    const flushBatch = async () => {
      if (currentBatch.length === 0) return;
      
      const batchToProcess = [...currentBatch];
      currentBatch = [];
      
      return processingQueue.then(() => batchProcessor(batchToProcess));
    };

    createReadStream(filePath)
      .pipe(parse({ headers: true, ignoreEmpty: true }))
      .on('data', (record) => {
        recordCount++;
        currentBatch.push(record);

        if (currentBatch.length >= maxBatchSize) {
          processingQueue = flushBatch();
        }
      })
      .on('end', async () => {
        try {
          // Process any remaining records
          await flushBatch();
          resolve(recordCount);
        } catch (err) {
          reject(err);
        }
      })
      .on('error', (err) => {
        reject(err);
      });
  });
};