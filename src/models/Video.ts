import mongoose, { Schema, Document } from 'mongoose';

export interface IVideo extends Document {
  url: string;
  description?: string;
}

const VideoSchema: Schema = new Schema({
  url: { type: String, required: true },
  description: { type: String },
});

const Video = mongoose.model<IVideo>('Video', VideoSchema);

export default Video;
