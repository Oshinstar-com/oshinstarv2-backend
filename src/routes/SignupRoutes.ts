import { Router } from 'express';
import SignupController from '../controllers/SignupController';
import { AuthController } from '../controllers/AuthController';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication
 */

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
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post('/v1/login', AuthController.login);

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
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post('/v1/refresh', AuthController.refreshToken);

// Middleware to verify token
// router.use('/v1/user', AuthController.verifyToken);
// router.use('/v1/phone', AuthController.verifyToken);

/**
 * @swagger
 * /v1/user:
 *   post:
 *     summary: Create or update user
 *     tags: [Signup]
 *     responses:
 *       200:
 *         description: User created or updated
 *       400:
 *         description: Invalid input
 *       500:
 *         description: Internal server error
 */
router.post('/v1/user', SignupController.createUser);

/**
 * @swagger
 * /v1/user/email_exists:
 *   post:
 *     summary: Check if email exists
 *     tags: [Signup]
 *     responses:
 *       200:
 *         description: Email exists
 *       404:
 *         description: Email does not exist
 *       500:
 *         description: Internal server error
 */
router.post('/v1/user/email_exists', SignupController.checkEmailExists);

/**
 * @swagger
 * /v1/user/me:
 *   get:
 *     summary: Get current user
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: User details
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/v1/user/me', AuthController.getCurrentUser);

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
 *         description: The user ID
 *     responses:
 *       200:
 *         description: User details
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
router.get('/v1/user/:userId', SignupController.getUser);

/**
 * @swagger
 * /v1/phone/verification:
 *   post:
 *     summary: Verify phone number via SMS or call
 *     tags: [Signup]
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
router.post('/v1/phone/verification', SignupController.verifyPhone);

/**
 * @swagger
 * /v1/phone/validate:
 *   post:
 *     summary: Validate phone verification code
 *     tags: [Signup]
 *     responses:
 *       200:
 *         description: Phone verified
 *       401:
 *         description: Invalid verification code
 *       500:
 *         description: Internal server error
 */
router.post('/v1/phone/validate', SignupController.validatePhone);

/**
 * @swagger
 * /v1/verify_email:
 *   post:
 *     summary: Send email verification code
 *     tags: [Signup]
 *     responses:
 *       200:
 *         description: Email verification code sent
 *       500:
 *         description: Internal server error
 */
router.post('/v1/verify_email', SignupController.verifyEmail);

/**
 * @swagger
 * /v1/validate_email:
 *   post:
 *     summary: Verify email verification code
 *     tags: [Signup]
 *     responses:
 *       200:
 *         description: Email verified
 *       301:
 *         description: Unauthorized. User does not exist
 *       500:
 *         description: Internal server error
 */
router.post('/v1/validate_email', SignupController.verifyToken);



router.post("/v3/auth", async function (req: any, reply: any) {
    switch (req.body.eventType) {
        case 'request_qr':
            const data = await AuthController.generateTOTPSetupUrl(req.body.clientId);

            reply.send({ link: data.totpUri, key: data.secretKey, formattedKey: data.formattedKey + "..." });
            break;
        case 'validate_totp':
            const valid = await AuthController.validateTOTPCode(req.body.clientId.toString(), req.body.totp.toString());
            reply.send({ "valid": valid });
            break;
        case 'disable_2fa':
            await AuthController.disable2fa(req.body.clientId.toString());
            reply.send({})
            break;
    }
});


router.post("/v3/auth/update_password", AuthController.updateUserPassword);


router.post('/v1/user/update_birthdate', AuthController.updateBirthdate);

export default router;
