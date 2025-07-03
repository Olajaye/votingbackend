import express from 'express';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import swaggerUi from 'swagger-ui-express';
import swaggerJSDoc from 'swagger-jsdoc';
import options from './swagger.js';
import AuthRoutes from './src/routes/AuthRouter.js';
import RoomRoutes from './src/routes/RoomRouter.js';
import dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;
const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
// Ensure that the server is created before initializing Socket.IO
const io = new Server(server, {
  cors: { origin: "*" },
});



app.use(cors());
app.use(express.json());

// Mount Swagger UI
const swaggerSpec = swaggerJSDoc(options);
app.use('/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    explorer: true, // Enable search bar
    customSiteTitle: "Decision Voting API",
    // customCss: '.swagger-ui .topbar { display: none }',
    // customfavIcon: '/public/favicon.ico'
  })
);


/**
* @swagger
* /
*   get:
*     summary: Welcome endpoint
*     description: Returns a welcome message for the API
*     tags: [General]
*     responses:
*       200:
*         description: A welcome message
*         content:
*           text/plain:
*             schema:
*               type: string
*               example: "Welcome to the API"
*/
app.get('/', (req, res) => {
  res.send('Welcome to the API');
});

app.use('/api/auth', AuthRoutes);
app.use('/api/rooms', RoomRoutes);

// Socket.IO for real-time vote updates
io.on('connection', (socket) => {
  socket.on('joinRoom', (roomId) => {
    socket.join(roomId);
  });
});

// Make Prisma and io available in routes
app.set('prisma', prisma);
app.set('io', io);

// Graceful shutdown
process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  server.close();
});

// Error handling middleware (recommended to add)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});


server.listen(PORT, () =>{
  console.log(`Server running on port ${PORT}`);
  console.log(`Swagger UI available at http://localhost:${PORT}/api-docs`)}
);