import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';

const router = Router();


/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication and user verification
 */

/**
 * @swagger
 * /v3/auth:
 *   post:
 *     summary: Handle 2FA TOTP requests
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               eventType:
 *                 type: string
 *                 enum: [request_qr, validate_totp, disable_2fa]
 *               clientId:
 *                 type: string
 *               totp:
 *                 type: string
 *     responses:
 *       200:
 *         description: Successful operation
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 link:
 *                   type: string
 *                 key:
 *                   type: string
 *                 formattedKey:
 *                   type: string
 *                 valid:
 *                   type: boolean
 *       400:
 *         description: Bad Request
 *       500:
 *         description: Internal Server Error
 */


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


  export default router;