import app from './app.js';
import { prisma } from './lib/prisma.js';

const PORT = process.env.PORT || 5000;

async function startServer() {
    try {
        await prisma.$connect();
        console.log("Connected to the database");

        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    } catch (error) {
        console.error("Failed to start the server", error);

        process.exit(1);
    }
}

startServer();