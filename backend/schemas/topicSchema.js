const mongoose = require('mongoose');
const ContentObj= require('./contentObjSchema');

const topicSchema = mongoose.Schema({
    topicName: String,
    content: {type:[ContentObj], default:[]},
    lastEdited: {type:Date, default: Date.now}
})

module.exports = topicSchema;
