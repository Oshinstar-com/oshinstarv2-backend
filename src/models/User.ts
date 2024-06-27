import mongoose, { Schema, Document } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';


export interface IUser extends Document {
  userId: string;
  email: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  gender?: string;
  birthdate?: string;
  phone?: string;
  location?: string;
  categories?: string[];
  isPhoneVerified?: boolean;
  isEmailVerified?: boolean;
  attempts: number;
  canUpdatePhoneCode: boolean;
  accountType?: string;
  images?: string[];
  videos?: string[];
  tracks?: string[];
  collections?: string[];
  secretKey?: string;
  emailCode?: string;
  memberSince?: string;
  canUpdateBirthdate? : boolean;
  hometown?: string;
  address?: string;
  username?: string;
}




const UserSchema: Schema = new Schema({
  userId: { type: String, default: uuidv4, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String },
  firstName: { type: String },
  lastName: { type: String },
  gender: { type: String },
  birthdate: { type: String },
  phone: { type: String },
  location: { type: String },
  categories: { type: Array, default: [] },
  isPhoneVerified: { type: Boolean, default: false },
  isEmailVerified: { type: Boolean, default: false },
  attempts: { type: Number, default: 0 },
  canUpdatePhoneCode: { type: Boolean, default: true },
  accountType: { type: String },
  images: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Image' }],
  videos: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Video' }],
  tracks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Track' }],
  collections: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Collection' }],
  secretKey: { type: String, default: "" },
  emailCode: { type: String },
  memberSince: { type: String },
  canUpdateBirthdate: { type: Boolean, default: true },
  hometown: { type: String },
  address: { type: String },
  username: { type: String }
});

const User = mongoose.model<IUser>('User', UserSchema);

export default User;
