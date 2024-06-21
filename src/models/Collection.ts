import mongoose, { Schema, Document } from 'mongoose';

export interface ICollection extends Document {
  name: string;
  items: string[];
}

const CollectionSchema: Schema = new Schema({
  name: { type: String, required: true },
  items: { type: [String], required: true },
});

const Collection = mongoose.model<ICollection>('Collection', CollectionSchema);

export default Collection;
