import { PrismaClient } from '@prisma/client';

/**
 * Migration to set all active conversations to abandoned status
 */
export async function migrate() {
  const prisma = new PrismaClient();
  const batchSize = 100;
  let processedCount = 0;
  let totalProcessed = 0;

  try {
    console.log('Starting conversation abandonment migration...');
    console.log(`Processing in batches of ${batchSize}`);

    // Keep fetching and processing until no more records are found
    while (true) {
      console.log(`\nFetching next batch of conversations...`);

      // Get conversations that are not already abandoned
      const conversations = await prisma.conversation.findMany({
        where: {
          NOT: {
            status: 'abandoned',
          },
        },
        select: {
          id: true,
          status: true,
          lastMessageAt: true,
          conversationType: true,
        },
        take: batchSize,
        skip: totalProcessed,
        orderBy: {
          lastMessageAt: 'asc', // Process older conversations first
        },
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
            // Update the conversation
            await prisma.conversation.update({
              where: { id: conversation.id },
              data: {
                status: 'abandoned',
              },
            });

            processedCount++;
            console.log(
              `Updated conversation ${conversation.id}: Changed status from "${conversation.status}" to "abandoned" (Type: ${conversation.conversationType}, Last message: ${conversation.lastMessageAt})`
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
