var express = require('express');
var router = express.Router();
var passport = require('passport');
var jwt = require('express-jwt');

var mongoose = require('mongoose');
var Post = mongoose.model('Post');
var Comment = mongoose.model('Comment');
var User = mongoose.model('User');

// var auth = jwt({secret:'SECRET', userProperty: 'payLoad'});
var auth = jwt({secret:'SECRET', userProperty: 'payload'});
 
/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

/* GET All posts*/
// router.get('/posts', function(req, res, next){
//     Post.find(function(err, posts){
//         if (err) {next(err);};

//         res.json(posts);
//     });
// });

  router.route("/posts")
    .get(function(req, res, next) {
      Post.find(function(err, posts) {
        if (err) {
          return next(err);
        }

        // Load the author objects, but only the id and username, for security reasons
        Post.populate(posts, {
          path: "author",
          select: "username"
        }).then(function(posts) {
          res.json(posts);
        });
      });
    })
    .post(auth, function(req, res, next) {
      var post = new Post(req.body);
      //post.upvotes = 1;
      //post.usersWhoUpvoted.push(req.payload._id);

      post.save(function(err, post) {
        if (err) {
          return next(err);
        }

        Post.populate(post, {
          path: "author",
          select: "username"
        }).then(function(post) {
          res.json(post);
        });
      });
    });    


/* GET specific post */
  router.route("/posts/:post")
    .get(function(req, res, next) {
      Post.populate(req.post, {
        path: "comments",
      }).then(function(post) {
        Comment.populate(req.post.comments, {
          path: "author",
          select: "username"
        }).then(function(comments) {
          res.json(post);
        });
      });
    })
    .delete(auth, function(req, res, next) { //new for deleting post
      // TODO better, more standard way to do this?
      console.log(req.post.author);
      console.log(req.payload._id);
      console.log(req.post.author + "     " + req.payload._id);      
      if (req.post.author != req.payload._id) {
        res.statusCode = 401;
        return res.end("invalid authorization");
      }

      // TODO: I wonder if there is a way to define a cascade strategy
      Comment.remove({ post: req.post }, function(err) {
        if (err) {
          return next(err);
        }

        req.post.remove(function(err) {
          if (err) {
            return next(err);
          }

          // TODO what's the best practice here?
          res.send("success");
        });
      });
    });


/* POST Register a new user*/
router.post('/register', function(req, res, next){
    if (!req.body.username || !req.body.password) {
        return res.status(400).json({message:'Please fill out all fields'});
    };

    var user = new User();

    user.username = req.body.username;
    user.setPassword(req.body.password);

    user.save(function(err){
        if (err) {return next(err);};

        return res.json({token:user.generateJWT()});
    });
});

/*POST login */
router.post('/login', function(req, res, next){
    if (!req.body.username || !req.body.password) {
        return res.status(400).json({message:'Please fill out all fields'});
    };

    passport.authenticate('local', function(err, user, info){
        if (err) {return next(err);};

        if (user) {
            return res.json({token:user.generateJWT()});
        } else {
            return res.status(401).json(info);
        };
    })(req,res,next);
});

/* POST - create new post */
router.post('/posts', auth, function(req,res,next){
    var post = new Post(req.body);
    // post.author = req.payLoad.username;
    post.author = req.payload.username;
    console.log(post.author);
    post.save(function(err, post){

        if (err) {next(err);};

        res.json(post);
    })
});

/* POST - Create a comment to a post */
// router.post('/posts/:post/comments', auth , function(req,res,next){
//     var comment = new Comment(req.body);
//     comment.post = req.post;
//     comment.author = req.payLoad.username;

//     comment.save(function(err, comment){
//         if (err) {return next(err);};

//         req.post.comments.push(comment);
//         req.post.save(function(err,post){
//             if (err) {return next(err);};

//             res.json(comment);
//         });
//     });
// });

  router.route("/posts/:post/comments")
    .post(auth, function(req, res, next) {
      var comment = new Comment(req.body);
      comment.post = req.post;
      //comment.upvotes = 1;
      //comment.usersWhoUpvoted.push(req.payload._id);

      comment.save(function(err, comment) {
        if (err) {
          return next(err);
        }

        req.post.comments.push(comment);
        req.post.save(function(err, post) {
          if (err) {
            return next(err);
          }

          Comment.populate(comment, {
            path: "author",
            select: "username"
          }).then(function(comment) {
            res.json(comment);
          });
        })
      })
    });

// Delete comment per rojaware
//router.delete('/posts/:post/comments/:comment', function(req, res, next) {
 router.route("/posts/:post/comments/:comment")
    .delete(auth, function(req, res, next) {
      console.log(req.comment.author);
      console.log(req.payload._id);
      console.log(req.comment.author + "     " + req.payload._id);
      if (req.comment.author != req.payload._id) {
        res.statusCode = 401;
        return res.end("invalid authorization");
      }


    req.post.comments.splice(req.post.comments.indexOf(req.comment),1);
    req.post.save(function(err, post) {
        if (err) { return next(err); }

        req.comment.remove(function(err) {
            if(err) { return next(err); }
        })
        res.send("success");
    });
});

/*Update post*/
// router.post('/posts/:post', auth, function(req, res, next) {
//       console.log(req.post.author);
//       console.log(req.payload._id);
//       console.log(req.post.author + "     " + req.payload._id);      
//       if (req.post.author != req.payload._id) {
//         res.statusCode = 401;
//         return res.end("invalid authorization");
//       }

//     Post.findByIdAndUpdate(req.post.id,  req.body, function(err, post) {
//         if (err) {
//             return next(err);
//         }
//         else {
//             res.json(post);
//         }
//     });
// });

router.post('/posts/:post', auth, function(req, res, next) {
      console.log(req.post.author);
      console.log(req.payload._id);
      console.log(req.post.author + "     " + req.payload._id);      
      if (req.post.author != req.payload._id) {
        res.statusCode = 401;
        return res.end("invalid authorization");
      } else {
        Post.findByIdAndUpdate(req.post.id,  req.body, function(err, post) {
            if (err) {
                return next(err);
            }
            else {
                res.json(post);
            }
        });
        
      }


});    


/*PUT - Upvote a post*/
router.put('/posts/:post/upvote', auth, function(req,res, next){
    req.post.upvote(function(err, post){
        if (err) {return next(err);};
        res.json(post);
    });
});

/*PUT - Downvote a post */
router.put('/posts/:post/downvote', auth, function(req, res, next){
    req.post.downvote(function(err, post){
        if (err) {return next(err);};
        res.json(post);
    });
});

/*PUT - Upvote a comment on a post */
router.put('/posts/:post/comments/:comment/upvote', auth, function(req,res,next){
    req.comment.upvote(function(err, comment){
        if (err) {return next(err);};
        res.json(comment);
    });
});

/*PUT - downvote a comment on a post */
router.put('/posts/:post/comments/:comment/downvote', auth, function(req,res,next){
    req.comment.downvote(function(err, comment){
        if (err) {return next(err);};
        res.json(comment);
    });
});

router.param('post', function(req,res,next,id){
    var query = Post.findById(id);

    query.exec(function(err, post){
        if (err) {return next(err);};
        if (!post) {return next(new Error('can\'t find post'))};

        req.post = post;
        return next();
    });
});

router.param('comment', function(req,res,next,id){
    var query = Comment.findById(id);

    query.exec(function(err, comment){
        if (err) {return next(err);};
        if (!comment) {return next(new Error('can\'t find comment'))};

        req.comment = comment;
        return next();
    });
});

module.exports = router;