var mongoose = require('mongoose');

var PostSchema = new mongoose.Schema({
  title: String,
  // author: String,
    author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  link: String,
  upvotes: {type: Number, default: 0},
  comments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }]
});

PostSchema.methods.upvote = function(cb) {
  this.upvotes ++;
  this.save(cb);
};
PostSchema.methods.downvote = function(cb){
	this.upvotes --;
	this.save(cb);
};

mongoose.model('Post', PostSchema);