import mongoose, { Schema, Document } from 'mongoose';

export interface IImage extends Document {
  url: string;
  description?: string;
}

const ImageSchema: Schema = new Schema({
  url: { type: String, required: true },
  description: { type: String },
});

const Image = mongoose.model<IImage>('Image', ImageSchema);

export default Image;
