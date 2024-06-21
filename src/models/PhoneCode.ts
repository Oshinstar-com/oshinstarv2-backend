const mongoose = require('mongoose');

// PhoneCode Schema
var PhoneCodeSchema = mongoose.Schema({
    creationTime: { type: String, required: true },
    code: { type: String, required: true },
    phone: { type: String, required: true },
    userId: { type: String },
    attempts: { type: Number, default: 0}
});

export const PhoneCode = mongoose.model('PhoneCode', PhoneCodeSchema);