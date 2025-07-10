import { PrismaService } from '../../src/database/prisma.service';

/**
 * Utility class for cleaning the database during tests
 */
export class DatabaseCleaner {
  private prisma: PrismaService;

  constructor(prisma: PrismaService) {
    this.prisma = prisma;
  }

  /**
   * Cleans the database by truncating all tables
   * Note: This preserves the tables but removes all data
   */
  async cleanDatabase(): Promise<void> {
    const tablenames = await this.getTableNames();

    for (const tablename of tablenames) {
      try {
        await this.prisma.$executeRawUnsafe(
          `TRUNCATE TABLE "${tablename}" CASCADE;`
        );
      } catch (error) {
        console.error(`Error truncating table ${tablename}:`, error);
      }
    }
  }

  /**
   * Gets all table names in the current database schema
   * @returns Array of table names
   */
  private async getTableNames(): Promise<string[]> {
    const tables = await this.prisma.$queryRaw<
      Array<{ tablename: string }>
    >`SELECT tablename FROM pg_tables WHERE schemaname='public'`;

    return tables
      .map(({ tablename }) => tablename)
      .filter((name) => name !== '_prisma_migrations');
  }
}
