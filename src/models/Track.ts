import mongoose, { Schema, Document } from 'mongoose';

export interface ITrack extends Document {
  url: string;
  description?: string;
}

const TrackSchema: Schema = new Schema({
  url: { type: String, required: true },
  description: { type: String },
});

const Track = mongoose.model<ITrack>('Track', TrackSchema);

export default Track;
