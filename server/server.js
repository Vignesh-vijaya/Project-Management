import express from 'express';
// 1. Keep dotenv at the very top so variables load before db.js is read
import 'dotenv/config'; 
import cors from 'cors';
import { clerkMiddleware } from '@clerk/express';
import { serve } from "inngest/express";
import { inngest, functions } from "./inngest/index.js"
import workspaceRouter from './routes/workspaceRoutes.js';
import workspaceRouter from './routes/workspaceRoutes.js';
import { protect } from './middlewares/authMiddleware.js';

// 2. Import the prisma client from your new file
import { prisma } from './db.js';

const app = express();

app.use(express.json());
app.use(cors());
app.use(clerkMiddleware());

app.get('/', (req, res) => {
    res.send('Server is Live!');
});

app.use("/api/inngest", serve({ client: inngest, functions }));

//Routes

app.use('/api/workspaces', protect,workspaceRouter);    


// 3. Add a test route to verify Database connection
app.get('/db-test', async (req, res) => {
    try {
        // Simple query to check connection
        const result = await prisma.$queryRaw`SELECT 1 as result`;
        res.json({ status: "success", message: "Connected to Neon DB!", data: result });
    } catch (error) {
        console.error("Database Error:", error);
        res.status(500).json({ status: "error", message: "Connection failed", error: error.message });
    }
});

const PORT = process.env.PORT || 5000;



app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});