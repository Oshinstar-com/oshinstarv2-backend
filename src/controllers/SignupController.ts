import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';
import User, { IUser } from '../models/User';
import { PhoneCode } from '../models/PhoneCode';
import dotenv from 'dotenv';
import { PhoneNumber } from '../models/PhoneNumber';
import { ErrorHandler, ErrorType } from '../services/errors/error_handler';
const nodemailer = require("nodemailer");

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';

function makeid(length: any) {
  const characters = '123456789';
  let text = '';
  for (let i = 0; i < length; i++) {
    text += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return text;
}

/**
 * @swagger
 * tags:
 *   name: Signup
 *   description: User signup and verification
 */

/**
 * SignupController handles user sign-up, verification, and email sending operations.
 * - createUser: Creates or updates a user.
 * - checkEmailExists: Checks if an email is already registered.
 * - getUser: Retrieves user details.
 * - verifyPhone: Initiates phone verification via SMS or call.
 * - validatePhone: Validates the phone verification code.
 * - verifyEmail: Sends an email verification code.
 * - verifyToken: Verifies the email verification code.
 */
abstract class SignupController {
  /**
   * @swagger
   * /v1/user:
   *   post:
   *     summary: Create or update a user
   *     tags: [Signup]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               userId:
   *                 type: string
   *               email:
   *                 type: string
   *               password:
   *                 type: string
   *               firstName:
   *                 type: string
   *               lastName:
   *                 type: string
   *               gender:
   *                 type: string
   *               birthdate:
   *                 type: string
   *                 format: date
   *               phone:
   *                 type: string
   *               location:
   *                 type: string
   *               categories:
   *                 type: array
   *                 items:
   *                   type: string
   *               isPhoneVerified:
   *                 type: boolean
   *               isEmailVerified:
   *                 type: boolean
   *               accountType:
   *                 type: string
   *     responses:
   *       200:
   *         description: The user was successfully created or updated
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 user:
   *                   $ref: '#/components/schemas/User'
   *       400:
   *         description: Invalid input data
   *       500:
   *         description: Internal server error
   */
  static async createUser(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined> {
    try {
      const {
        userId,
        email,
        password,
        firstName,
        lastName,
        gender,
        birthdate,
        phone,
        location,
        categories,
        isPhoneVerified,
        isEmailVerified,
        accountType
      } = req.body;
  
      let user: IUser | null;
  
      if (userId) {
        // Update existing user
        user = await User.findOne({ userId });
        if (user) {
          if (password) {
            user.password = await bcrypt.hash(password, 10);
          }
          user.email = email || user.email;
          user.firstName = firstName || user.firstName;
          user.lastName = lastName || user.lastName;
          if (firstName && lastName) {
            user.username = await SignupController.generateUniqueUsername(firstName, lastName);
          }
          user.gender = gender || user.gender;
          user.birthdate = birthdate || user.birthdate;
          user.phone = phone || user.phone;
          user.location = location || user.location;
          user.categories = categories || user.categories;
          user.isPhoneVerified = isPhoneVerified ?? user.isPhoneVerified;
          user.isEmailVerified = isEmailVerified ?? user.isEmailVerified;
          user.accountType = accountType ?? user.accountType;
  
          await user.save();
          return res.status(200).json(user);
        } else {
          return res.status(404).json({ error: 'User not found' });
        }
      } else {
        // Create new user
        if (!email) {
          return res.status(400).json({ error: 'Email is required to create a new user' });
        }
  
        // Check if the email already exists
        user = await User.findOne({ email });
        if (user) {
          return res.status(400).json({ error: 'Email already exists' });
        }
  
        // Encrypt the password before creating a new user, if password is provided
        const hashedPassword = password ? await bcrypt.hash(password, 10) : undefined;
  
        // Generate a unique username
        let username = '';
        if (firstName && lastName) {
          username = await SignupController.generateUniqueUsername(firstName, lastName);
        }
  
        // Create new user with optional fields
        user = new User({
          userId: uuidv4(),
          email,
          password: hashedPassword,
          firstName: firstName || '',
          lastName: lastName || '',
          username: username,
          gender: gender || '',
          birthdate: birthdate || null,
          phone: phone || '',
          location: location || '',
          categories: categories || [],
          isPhoneVerified: isPhoneVerified ?? false,
          isEmailVerified: isEmailVerified ?? false,
          accountType: accountType || '',
          memberSince: new Date().toISOString().split('T')[0]  // Only date, not time
        });
  
        await user.save();
  
        // Generate a JWT token
        const token = jwt.sign({ userId: user._id, email: user.email }, JWT_SECRET, { expiresIn: '365d' });
  
        return res.status(201).json({ token, user });
      }
    } catch (err: any) {
      console.error(err);
      return res.status(500).json({ error: err.message });
    }
  }
  
  static async generateUniqueUsername(firstName: string, lastName: string): Promise<string> {
    let baseUsername = `${firstName.toLowerCase()}.${lastName.toLowerCase()}`;
    let username = baseUsername;
    let counter = 1;
  
    // Check for existing usernames and append a number if necessary
    while (await User.findOne({ username })) {
      username = `${baseUsername}${counter}`;
      counter++;
    }
  
    return username;
  }

  /**
   * @swagger
   * /v1/user/email_exists:
   *   post:
   *     summary: Check if email exists
   *     tags: [Signup]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               email:
   *                 type: string
   *     responses:
   *       200:
   *         description: Email exists
   *       404:
   *         description: Email does not exist
   *       500:
   *         description: Internal server error
   */
  static async checkEmailExists(req: Request, res: Response): Promise<void> {
    const { email } = req.body;

    const exists = await User.findOne({ email });

    if (!exists) res.status(404).send({});
    else if (exists) res.status(200).send({});
  }

  /**
   * @swagger
   * /v1/user/{userId}:
   *   get:
   *     summary: Get user details
   *     tags: [Signup]
   *     parameters:
   *       - in: path
   *         name: userId
   *         schema:
   *           type: string
   *         required: true
   *         description: The user's ID
   *     responses:
   *       200:
   *         description: User found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/User'
   *       404:
   *         description: User not found
   *       500:
   *         description: Internal server error
   */
  static async getUser(req: Request, res: Response): Promise<void> {
    const userId = req.params.userId;

    const user = await User.findOne({ userId });

    if (!user) {
      res.status(404).end("User not found");
    } else {
      res.status(200).send(user);
    }
  }

  /**
   * @swagger
   * /v1/phone/verification:
   *   post:
   *     summary: Verify phone number via SMS or call
   *     tags: [Signup]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               userId:
   *                 type: string
   *               phone:
   *                 type: string
   *               method:
   *                 type: string
   *                 enum: [sms, call]
   *               eventType:
   *                 type: string
   *     responses:
   *       200:
   *         description: Verification initiated
   *       400:
   *         description: Invalid verification method
   *       429:
   *         description: Too many requests
   *       500:
   *         description: Internal server error
   */
  static async verifyPhone(req: Request, res: Response): Promise<void> {
    const accountSid = process.env.accountSid!;
    const authToken = process.env.authToken!;
    const client = require('twilio')(accountSid, authToken);

    try {
      const code = SignupController.generateVerificationCode();

      switch (req.body.method) {
        case 'sms':
          await SignupController.sendSMSCode(req, res, client, code);
          break;

        case 'call':
          await SignupController.sendCallCode(req, res, code, client);
          break;

        default:
          res.status(400).send({ error: 'Invalid verification method' });
          return;
      }
    } catch (error) {
      console.error('Error in verifyPhone:', error);
      res.status(500).send({ error: 'Internal Server Error' });
    }
  }

  /**
   * Sends an SMS verification code.
   */
  static async sendSMSCode<T>(req: Request, res: Response, client: any, code: any): Promise<void> {
    const existingPhoneCode = await SignupController.getExistingPhoneCode(req.body.userId);
    const user = await User.findOne({ userId: req.body.userId });

    if (user && user.attempts === 3) {
      res.status(429).send({ error: 'Too many requests' });
      return;
    }

    try {
      await client.messages.create({
        body: `Oshinstar - Your verification code is: ${code}\n${req.body.appSignature ?? ''}`,
        to: SignupController.getFormattedPhoneNumber(req.body.eventType, req.body.phone),
        from: '+13214051396'
      });

      res.status(200).send({});

      await SignupController.updatePhoneCode(existingPhoneCode, code, req, req.body.userId, user);
    } catch (e: any) {
      console.log(e);
      res.status(500).send({ error: e.message });
    }
  }

  /**
   * Sends a call with the verification code.
   */
  static async sendCallCode(req: any, res: any, code: any, client: any): Promise<void> {
    const phoneCode = await SignupController.getPhoneCode(req.body.clientId);

    if (!phoneCode) {
      res.status(500).send({ error: 'Internal Server Error', module: 'Phone verification - call method' });
      return;
    }

    await client.calls.create({
      twiml: SignupController.generateTwimlResponse(code),
      to: req.body.phone,
      from: '+13214051396'
    });

    console.log('[Twilio]: Call method requested');
    console.log(req.body);
    console.log(...code.toString().split('').map(Number));

    res.status(200).send({});
  }

  /**
   * Generates a 6-digit verification code.
   */
  static generateVerificationCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Generates TwiML response for call verification.
   */
  static generateTwimlResponse(code: string): string {
    const vcode = code.split('').map(Number);
    return `<Response><Say>Hello, your Oshinstar verification code is, ${vcode.join(' ')}. Your code is, ${vcode.join(' ')}</Say></Response>`;
  }

  /**
   * Retrieves the existing phone verification code for a user.
   */
  static async getExistingPhoneCode(userId: string) {
    return await PhoneCode.findOne({ userId });
  }

  /**
   * Retrieves the phone code based on clientId.
   */
  static async getPhoneCode(clientId: any) {
    return await PhoneCode.findOne({ clientId: clientId.toString() });
  }

  /**
   * Formats the phone number based on event type.
   */
  static getFormattedPhoneNumber(eventType: any, phone: any): string {
    return eventType === 'set_primary_phone' ? phone.split('+')[1] : phone;
  }

  /**
   * Updates the phone verification code.
   */
  static async updatePhoneCode(existingPhoneCode: any, code: string, req: any, userId: string, user: any): Promise<void> {
    user.attempts += 1;
    await user.save();

    if (user.attempts === 3) {
      await User.updateOne({ userId }, { canUpdatePhoneCode: false });
    } else {
      if (existingPhoneCode) {
        existingPhoneCode.creationTime = Date.now();
        existingPhoneCode.code = code;
        existingPhoneCode.userId = userId;
        await existingPhoneCode.save();
      } else {
        const newPhoneCode = new PhoneCode({
          creationTime: Date.now(),
          code,
          phone: req.body.phone,
          userId,
        });
        await newPhoneCode.save();
      }
    }
  }

  /**
   * @swagger
   * /v1/phone/validate:
   *   post:
   *     summary: Validate phone verification code
   *     tags: [Signup]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               userId:
   *                 type: string
   *               code:
   *                 type: string
   *     responses:
   *       200:
   *         description: Phone verified successfully
   *       401:
   *         description: Invalid verification code
   *       500:
   *         description: Internal server error
   */
  static async validatePhone(req: any, res: any): Promise<void> {
    const code = req.body.code;
    const userId = req.body.userId;

    const phoneCodeEntry = await PhoneCode.findOne({ userId });

    if (!phoneCodeEntry || phoneCodeEntry.code !== code) {
      res.status(401).send({ error: 'Invalid verification code' });
    } else {
      await User.updateOne({ userId }, { isPhoneVerified: true });
      await PhoneCode.deleteOne({ userId });
      res.status(200).send({});
    }
  }


  /**
   * @swagger
   * /v1/verify_email:
   *   post:
   *     summary: Send email verification code
   *     tags: [Signup]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               email:
   *                 type: string
   *               userId:
   *                 type: string
   *     responses:
   *       200:
   *         description: Email verification code sent
   *       500:
   *         description: Internal server error
   */
  static async verifyEmail(req: any, reply: any) {
    const evc: any = makeid(6);
    const htmlToSend = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Verify Email</title>
    </head>
    <body>
      <p>Action required: confirm your Oshinstar account</p>
      <p>Hello, <br/><br/>You recently signed up for Oshinstar. To complete the registration process, please confirm your account.</p>
      <p><strong>${evc}<strong></p>
      <p>Enter this code or click on the button below.</p>
      <a href="https://devservices.oshinstar.com/lambda/email-verifier/${req.body.email}/${evc}" style="display:inline-block; padding:10px 20px; color:#fff; background-color:#3AAEE0; text-decoration:none;">Click here to confirm your account</a>
      <p>Important: this code or link are valid for 24 hours, later you have to generate it again.</p>
      <p>Oshinstar helps you communicate and stay in touch with all your friends. Once you sign up for Oshinstar, you can share video, plan events and much more.</p>
    </body>
    </html>
    `;

    // create transporter object with smtp server details
    const transporter = nodemailer.createTransport({
      host: 'email-smtp.us-east-1.amazonaws.com',
      port: 587,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    const email = req.body.email;
    const emailExists = await User.findOne({ email: email.toLowerCase() });

    // send email
    await transporter.sendMail({
      from: 'security@oshinstar.com',
      to: req.body.email,
      subject: 'Action Required! Confirm your Oshinstar Account',
      html: htmlToSend
    });

    if (emailExists != null) {
      await User.updateOne({ userId: req.body.userId }, { emailCode: evc });
      reply.status(200).send({});
    }
  }

  /**
   * @swagger
   * /v1/validate_email:
   *   post:
   *     summary: Verify email verification code
   *     tags: [Signup]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               userId:
   *                 type: string
   *               token:
   *                 type: string
   *     responses:
   *       200:
   *         description: Email verified successfully
   *       301:
   *         description: Unauthorized. User does not exist
   *       500:
   *         description: Internal server error
   */
  static async verifyToken(req: any, reply: any) {
    const code = req.body.token;
    const userId = req.body.userId;

    const account = await User.findOne({ emailCode: code, userId: userId });
    if (!account) {
      reply.status(301).send({
        status: "Unauthorized. User does not exist",
      });
    } else {
      await User.updateOne({ emailCode: code, userId: userId }, { isEmailVerified: true });
      reply.status(200).send({
        status: "verified"
      });
    }
  }
}

export default SignupController;
