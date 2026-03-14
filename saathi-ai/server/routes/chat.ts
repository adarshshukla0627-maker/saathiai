import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { Chat } from '../models/Chat.js';
import mongoose from 'mongoose';

const router = Router();

// Mock AI response for development (when no OpenAI API key)
const mockAIResponse = `Namaste! 🙏

Main aapki baat sunke samajh gaya. Aap jo feel kar rahe ho, wo bilkul valid hai.

Kuch cheezein jo main sochta hoon:

1. **Apne emotions ko maano** - Jo feel kar rahe ho, wo sahi hai. Darrne ki zaroorat nahi.

