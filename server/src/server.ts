import app from './app';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const PORT = process.env.PORT || 5000;

async function main() {
    try {
        await prisma.$connect();
        console.log('✅ Connected to PostgreSQL Database');

        app.listen(PORT, () => {
            console.log(`✅ Server running on http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('❌ Database connection failed:', error);
        process.exit(1);
    }
}

main();
