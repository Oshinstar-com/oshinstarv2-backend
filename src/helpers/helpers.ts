const base32 = require('thirty-two');

export abstract class Helpers {

    public static generateRandomBytes(length: number): Uint8Array {
        const bytes = new Uint8Array(length);
        for (let i = 0; i < length; i++) {
            bytes[i] = Math.floor(Math.random() * 256);
        }
        return bytes;
    }
    public static generateBase32Key(length: number): string {
        const randomBytes = this.generateRandomBytes(length);
        const base32Key = base32.encode(randomBytes).toString();
        return base32Key.replace(/=/g, ''); // Remove padding characters
    }
}