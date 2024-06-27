import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User, { IUser } from '../models/User';
import { Helpers } from '../helpers/helpers';
import * as otplib from 'otplib';

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your_jwt_refresh_secret_key';



const parseMonth = (month: string): string => {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const monthIndex = months.indexOf(month) + 1;
  return monthIndex < 10 ? `0${monthIndex}` : `${monthIndex}`;
};


/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication and user verification
 */
export abstract class AuthController {
  /**
   * @swagger
   * /v1/login:
   *   post:
   *     summary: User login
   *     tags: [Auth]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               email:
   *                 type: string
   *               password:
   *                 type: string
   *     responses:
   *       200:
   *         description: Login successful
   *       401:
   *         description: Invalid email or password
   *       500:
   *         description: Server error
   */
  static async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;
      const user = await User.findOne({ email });

      if (!user || !(await bcrypt.compare(password, user.password!))) {
        res.status(401).json({ message: 'Invalid email or password' });
        return;
      }

      const token = jwt.sign({ userId: user._id, email: user.email }, JWT_SECRET, { expiresIn: '365d' });
      const refreshToken = jwt.sign({ userId: user._id, email: user.email }, JWT_REFRESH_SECRET, { expiresIn: '7d' });

      res.status(200).json({ token, refreshToken, user });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error });
    }
  }

  /**
   * @swagger
   * /v1/refresh:
   *   post:
   *     summary: Refresh JWT token
   *     tags: [Auth]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               token:
   *                 type: string
   *     responses:
   *       200:
   *         description: Token refreshed successfully
   *       401:
   *         description: Failed to authenticate token
   *       500:
   *         description: Server error
   */
  static async refreshToken(req: Request, res: Response): Promise<void> {
    try {
      const { token } = req.body;

      if (!token) {
        res.status(401).json({ message: 'No token provided' });
        return;
      }

      jwt.verify(token, JWT_REFRESH_SECRET, (err: any, decoded: any) => {
        if (err) {
          res.status(401).json({ message: 'Failed to authenticate token' });
          return;
        }

        const newToken = jwt.sign({ userId: decoded.userId, email: decoded.email }, JWT_SECRET, { expiresIn: '365d' });
        res.status(200).json({ token: newToken });
      });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error });
    }
  }

  /**
   * Middleware to verify JWT token
   */
  static verifyToken(req: any, res: Response, next: Function): void {
    const token = req.headers['authorization']?.split(' ')[1];

    if (!token) {
      res.status(401).json({ message: 'No token provided' });
      return;
    }

    jwt.verify(token, JWT_SECRET, (err: any, decoded: any) => {
      if (err) {
        res.status(401).json({ message: 'Failed to authenticate token' });
        return;
      }

      req.userId = decoded.userId;
      next();
    });
  }

  /**
   * @swagger
   * /v1/user/me:
   *   get:
   *     summary: Get current user
   *     tags: [Auth]
   *     responses:
   *       200:
   *         description: User details
   *       404:
   *         description: User not found
   *       500:
   *         description: Server error
   */
  static async getCurrentUser(req: any, res: Response): Promise<void> {
    try {
      const user = await User.findById(req.userId).select('-password');

      if (!user) {
        res.status(404).json({ message: 'User not found' });
        return;
      }

      res.status(200).json({ user });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error });
    }
  }

  /**
   * Generates a TOTP setup URL
   * @param clientId - The client ID
   * @returns {Promise<TwoFactorSetupResult>}
   */
  public static async generateTOTPSetupUrl(clientId: string): Promise<TwoFactorSetupResult> {
    const issuer = 'oshinstar';
    const accountName = clientId;
    const secretKey = Helpers.generateBase32Key(20);
    const algorithm = 'SHA1';
    const digits = 6;
    const period = 30;

    const totpUri = `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(accountName)}?secret=${secretKey}&issuer=${encodeURIComponent(issuer)}&algorithm=${algorithm}&digits=${digits}&period=${period}`;
    await User.updateOne({ userId: clientId.toString() }, { secretKey });

    const formattedKey = secretKey.slice(0, 5);
    return { totpUri, secretKey, formattedKey };
  }

  /**
   * Validates a TOTP code
   * @param clientId - The client ID
   * @param totpCode - The TOTP code
   * @returns {Promise<boolean>}
   */
  public static async validateTOTPCode(clientId: string, totpCode: string): Promise<boolean> {
    const user = await User.findOne({ userId: clientId.toString() });

    if (!user) {
      return false;
    }

    try {
      const valid = otplib.authenticator.check(totpCode, user.secretKey!);
      if (valid) await User.updateOne({ userId: clientId.toString() }, { hasTwoFactor: valid });
      return valid;
    } catch (error: any) {
      console.error('Error validating TOTP code:', error.message);
      return false;
    }
  }

  /**
   * Disables 2FA for a user
   * @param clientId - The client ID
   */
  public static async disable2fa(clientId: string): Promise<void> {
    await User.updateOne({ userId: clientId.toString() }, { hasTwoFactor: false });
  }

  static async updateUserPassword(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined> {
    try {
      const { userId, newPassword } = req.body;

      if (!userId || !newPassword) {
        return res.status(400).json({ error: 'User ID and new password are required' });
      }

      const user = await User.findOne({ userId });
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      user.password = hashedPassword;
      await user.save();

      return res.status(200).json({ message: 'Password updated successfully' });
    } catch (err: any) {
      console.error(err);
      return res.status(500).json({ error: err.message });
    }
  };

  static async updateBirthdate(req: Request, res: Response) {
    try {
      const { userId, day, month, year } = req.body;
  
      // Check if userId is provided
      if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
      }
  
      // Find the user by userId
      const user = await User.findOne({ userId: userId });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
  
      // Parse the birthdate components
      const parsedMonth = parseMonth(month);
  
      // Create a new Date object for the birthdate

      const newBirthdate = `${year}-${parsedMonth}-${day}T00:00:00.000Z`;
  
      // Update the user's birthdate
      console.log(newBirthdate)
      user.birthdate = newBirthdate
      user.canUpdateBirthdate = false;
      await user.save();


      return res.status(200).json({ message: 'Birthdate updated successfully', birthdate: user.birthdate });
    } catch (err: any) {
      console.error(err);
      return res.status(500).json({ error: err.message });
    }
  }
}