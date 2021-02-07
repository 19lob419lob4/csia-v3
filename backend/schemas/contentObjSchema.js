const mongoose = require('mongoose');

const contentObjSchema = mongoose.Schema({
    before: String,
    keyword: Number, 
    after: [String],
    status: Number
})

module.exports = contentObjSchema;
