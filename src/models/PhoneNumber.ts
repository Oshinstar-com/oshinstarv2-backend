const mongoose = require('mongoose');

// PhoneNumber Schema
var PhoneNumberSchema = mongoose.Schema({
    number: { type: String, required: true },
    visibility: { type: String, default: "only_me" },
    dial_code: { type: String },
    userId: { type: String, required: true },
    is_verified: { type: Boolean, default: false },
    is_primary: { type: Boolean, default: false },
    code: { type: Number }
});

export const PhoneNumber = mongoose.model('PhoneNumber', PhoneNumberSchema);