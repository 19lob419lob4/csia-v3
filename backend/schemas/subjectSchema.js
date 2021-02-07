const mongoose = require('mongoose');
const Topic = require('./topicSchema');



const subjectSchema = mongoose.Schema({
    subjectName: String,

    topics: {type:[Topic],default:[]},

    lastEdited: {type:Date,default: Date.now },

},{
    collection: 'subjects'
}
);

module.exports = mongoose.model('Subject',subjectSchema);