import { PrismaClient, Prisma } from '@prisma/client';

/**
 * Migration to update the currentNode field from metadata
 */
export async function migrate() {
  const prisma = new PrismaClient();
  const batchSize = 100;
  let processedCount = 0;
  let totalProcessed = 0;

  try {
    console.log('Starting currentNode migration...');
    console.log(`Processing in batches of ${batchSize}`);

    // Keep fetching and processing until no more records are found
    while (true) {
      console.log(`\nFetching next batch of conversations...`);

      // Get conversations that have currentNode in metadata
      const conversations = await prisma.conversation.findMany({
        where: {
          metadata: {
            path: ['currentNode'],
            not: Prisma.JsonNull,
          },
        },
        select: {
          id: true,
          metadata: true,
          currentNode: true,
        },
        take: batchSize,
        skip: totalProcessed,
      });

      if (conversations.length === 0) {
        console.log('No more conversations to process');
        break;
      }

      console.log(`Found ${conversations.length} conversations in this batch`);
      processedCount = 0;

      // Update each conversation in the batch
      await Promise.all(
        conversations.map(async (conversation) => {
          try {
            const metadata = conversation.metadata as Prisma.JsonObject;

            if (!metadata || typeof metadata !== 'object') {
              console.log(
                `Skipping conversation ${conversation.id}: Invalid metadata format`
              );
              return;
            }

            const currentNodeFromMetadata = metadata.currentNode;

            if (typeof currentNodeFromMetadata !== 'string') {
              console.log(
                `Skipping conversation ${conversation.id}: currentNode in metadata is not a string`
              );
              return;
            }

            // Skip if currentNode is already set to the same value
            if (conversation.currentNode === currentNodeFromMetadata) {
              console.log(
                `Skipping conversation ${conversation.id}: currentNode already up to date`
              );
              return;
            }

            // Update the conversation
            await prisma.conversation.update({
              where: { id: conversation.id },
              data: {
                currentNode: currentNodeFromMetadata,
              },
            });

            processedCount++;
            console.log(
              `Updated conversation ${conversation.id}: Set currentNode to "${currentNodeFromMetadata}"`
            );
          } catch (error) {
            console.error(
              `Error processing conversation ${conversation.id}:`,
              error
            );
          }
        })
      );

      totalProcessed += conversations.length;
      console.log(`\nBatch Summary:`);
      console.log(`- Processed: ${conversations.length} conversations`);
      console.log(`- Updated: ${processedCount} conversations`);
      console.log(`- Total processed so far: ${totalProcessed} conversations`);
    }

    console.log('\nMigration completed successfully');
    console.log(`Total conversations processed: ${totalProcessed}`);
  } catch (error) {
    console.error('Error during migration:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
migrate().catch((error) => {
  console.error('Migration failed:', error);
  process.exit(1);
});
