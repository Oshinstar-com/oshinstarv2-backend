import express from 'express';
import connectDB from './config/db';
import session from './config/session';
import signupRoutes from './routes/SignupRoutes';
import coreRoutes from './routes/CoreRoutes';
import dotenv from 'dotenv';
import morgan from "morgan";
import cors from "cors";
import { ErrorHandler } from './services/errors/error_handler';
import mongoose from 'mongoose';
import swaggerUi from 'swagger-ui-express';
import swaggerDocs from '../swagger';

dotenv.config();

const app = express();

// Connect to database
connectDB();

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session);
app.use(morgan("common"));

const corsOptions = {
  origin: 'http://localhost:54038', // Replace with your specific origin
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  preflightContinue: false,
  optionsSuccessStatus: 204
};

// Use CORS middleware
app.use(cors(corsOptions));

// Swagger documentation route
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Routes
app.use('/', signupRoutes);
app.use('/', coreRoutes);

app.use(ErrorHandler.errorHandler);

mongoose.set('debug', false);

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

export default app;
