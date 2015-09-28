var app = angular.module('flapperNews',['ui.router']);

app.controller("MainCtrl",[
    '$scope',
    'posts',
    'auth',
     function($scope, posts, auth){
    $scope.test = 'hello world';
    $scope.posts = posts.posts;
    $scope.isLoggedIn = auth.isLoggedIn;

    $scope.shouldShowAddNewPostForm = false; //from philipdnichols

    $scope.addPost = function(){
        if (!$scope.title || $scope.title === '' ) {return;};
        // posts.create({
        //     title:$scope.title,
        //     link:$scope.link,
        //     author: auth.currentUserID() //from philipdnichols
        //     //postauthor:$scope.postauthor

        // });

        posts.create({
          title: $scope.title,
          link: $scope.link,
          author: auth.currentUserId()
        });

        $scope.title = '';
        $scope.link = '';

        $scope.shouldShowAddNewPostForm = false;  //from philipdnichols
    };

    $scope.deletePost = function(post) {
        // TODO add modal confirmation
        posts.deletePost(post);
    };    

    $scope.incrementUpvotes = function(post){
        posts.upvote(post);
    };
    $scope.decrementUpvotes = function(post){
        posts.downvote(post);
    };

    //from philipdnichols
      // function showAddNewPostForm() {
      //   $scope.shouldShowAddNewPostForm = true      // }

      // function hideAddNewPostForm() {
      //   $scope.shouldShowAddNewPostForm = false;
      //   $scope.title = "";
      //   $scope.link = "";
      // }

    //from philipdnichols
    $scope.showAddNewPostForm = function(post) {
        $scope.shouldShowAddNewPostForm = true;
    };

    $scope.hideAddNewPostForm = function(post) {
        $scope.shouldShowAddNewPostForm = false;
        $scope.title = "";
        $scope.link = "";
    };

    $scope.showDeletePost = function(post) {
        // return post.author == auth.currentUser();
        return post.author._id == auth.currentUserId();
    }

    //$scope.deletePost = deletePost;
    //$scope.showDeletePost = showDeletePost
}]);

app.controller('PostsCtrl',[
    '$scope',
    'posts',
    'post',
    'auth',
    function($scope, posts, post, auth){
        $scope.post = post;
        $scope.isLoggedIn = auth.isLoggedIn;

        $scope.shouldShowAddNewCommentForm = false;  //new from philipdnichols

        $scope.addComment = function(){
            if (!$scope.body || $scope.body === '') {return;};
            posts.addComment(post._id, {
                body: $scope.body,
                // author: 'user'
                author: auth.currentUserId()
            }).success(function(comment){
                $scope.post.comments.push(comment);
            });
            $scope.body = '';

            $scope.shouldShowAddNewCommentForm = false; //new from philipdnichols

        };
        $scope.incrementUpvotes = function(comment){
            posts.upvoteComment(post, comment);
        };
        $scope.decrementUpvotes = function(comment){
            posts.downvoteComment(post, comment);
        };

      //new from philipdnichols
      // function deleteComment(comment) {
      //   // TODO add modal confirmation
      //   postService.deleteComment(post, comment)
      //     .success(function() {
      //       post.comments.splice(post.comments.indexOf(comment), 1);
      //     });
      // }  
        $scope.deleteComment = function (comment) {
          // TODO add modal confirmation
          posts.deleteComment(post, comment)
          .success(function() {
            post.comments.splice(post.comments.indexOf(comment), 1);
          });
        }        

        //new from philipdnichols
      // function showAddNewCommentForm() {
      //   $scope.shouldShowAddNewCommentForm = true;
      // }

      // function hideAddNewCommentForm() {
      //   $scope.shouldShowAddNewCommentForm = false;
      //   $scope.body = "";
      // }


        $scope.showAddNewCommentForm = function(comment) {
            $scope.shouldShowAddNewCommentForm = true;
        };

        $scope.hideAddNewCommentForm = function(comment) {
            $scope.shouldShowAddNewCommentForm = false;
            $scope.body = "";
        };

        $scope.editorEnabled = false;      

        // $scope.showAddNewCommentForm = showAddNewCommentForm;
        // $scope.hideAddNewCommentForm = hideAddNewCommentForm;

      $scope.enableEditor = function() {
        $scope.editorEnabled = true;
        $scope.link = $scope.post.link;
      };

      $scope.disableEditor = function() {
        $scope.editorEnabled = false;
      };

      $scope.save = function() {
        $scope.post.link = $scope.link;
        
        // save into db
       
        posts.save($scope.post);
        $scope.disableEditor();
      };
    // }]);


    }]);

app.controller('AuthCtrl', ['$scope', '$state', 'auth', function($scope, $state, auth){
    $scope.user = {};

    $scope.register = function(){
        auth.register($scope.user).error(function(error){
            $scope.error = error;
        }).then(function(){
            $state.go('home');
        });
    };

    $scope.logIn = function(){
        auth.logIn($scope.user).error(function(error){
            $scope.error = error;
        }).then(function(){
            $state.go('home');
        });
    };
}]);

app.controller('NavCtrl',
    ['$scope',
    'auth',
    function($scope, auth){
        $scope.isLoggedIn = auth.isLoggedIn;
        $scope.currentUser = auth.currentUser;
        $scope.logOut = auth.logOut;
    }]);

app.factory('posts',['$http','auth', function($http, auth){
    //service body
    var o = {
        posts:[]
    };
    o.getAll = function(){
        return $http.get('/posts').success(function(data){
            angular.copy(data, o.posts);
        });
    };
    o.create = function(post) {
        return $http.post('/posts', post, {
            headers: {Authorization: 'Bearer ' + auth.getToken()}
        }).success(function(data){
            o.posts.push(data);
        });
    };

    // update post...
    o.save = function(post) {
        return $http.post('/posts/' + post._id, post, {
            headers: {Authorization: 'Bearer ' + auth.getToken()}
        }).success(function(data) {
             // TODO - what is the best practice after saving??
        });
    };    


    o.deletePost = function(post) {
        return $http.delete("/posts/" + post._id, {
          headers: {
            Authorization: "Bearer " + auth.getToken()
          }
        }).success(function() {
          o.posts.splice(o.posts.indexOf(post), 1);
        });
    };

            



    o.upvote = function(post){
        return $http.put('/posts/'+post._id+'/upvote', null, {
            headers: {Authorization: 'Bearer ' + auth.getToken()}
        }).success(function(data){
            post.upvotes++;
        });
    };
    o.downvote = function(post){
        return $http.put('/posts/' + post._id + '/downvote', null, {
            headers: {Authorization: 'Bearer ' + auth.getToken()}
        }).success(function(data){
            post.upvotes--;
        });
    };
    o.get = function(id) {
      return $http.get('/posts/' + id).then(function(res){
        return res.data;
      });
    };
    o.addComment = function(id, comment){
        return $http.post('/posts/' + id + '/comments', comment, {
            headers: {Authorization: 'Bearer ' + auth.getToken()}
        });
    };
    o.upvoteComment = function(post, comment){
        return $http.put('/posts/' + post._id + '/comments/' + comment._id + '/upvote', null, {
            headers: {Authorization: 'Bearer ' + auth.getToken()}
        })
        .success(function(data){
            comment.upvotes++;
        });
    };

    o.downvoteComment = function(post, comment){
        return $http.put('/posts/' + post._id + '/comments/' + comment._id + '/downvote', null, {
            headers: {Authorization: 'Bearer ' + auth.getToken()}
        })
        .success(function(data){
            comment.upvotes--;
        });
    };

  // per philipdnichols
  // function deleteComment(post, comment) {
  //   return $http.delete("/posts/" + post._id + "/comments/" + comment._id, {
  //     headers: {
  //       Authorization: "Bearer " + authService.getToken()
  //     }
  //   });
  // }

   o.deleteComment = function(post, comment) {
    return $http.delete("/posts/" + post._id + "/comments/" + comment._id, {
      headers: {
        Authorization: "Bearer " + auth.getToken()
      }
    });
  }


    return o;
}]);

app.factory('auth', ['$http', '$window', function($http, $window){
    var auth = {};
    auth.getToken = function(){
        return $window.localStorage['flapper-news-token']; 
    };
    auth.saveToken = function(token){
        $window.localStorage['flapper-news-token'] = token;
    };
    auth.isLoggedIn = function(){
        var token = auth.getToken();

        if (token) {
            var payload = JSON.parse($window.atob(token.split('.')[1]));

            return payload.exp > Date.now() / 1000;
        } else {
            return false;
        }
    };
    auth.currentUser = function(){
        if (auth.isLoggedIn()) {
            var token = auth.getToken();
            var payload = JSON.parse($window.atob(token.split('.')[1]));

            return payload.username;
        };
    };

    auth.currentUserId = function() {
        if (auth.isLoggedIn()) {
          var token = auth.getToken();
          var payload = JSON.parse($window.atob(token.split(".")[1]));

          return payload._id;
        };
    };
 

    auth.register = function(user){
        return $http.post('/register', user).success(function(data){
            auth.saveToken(data.token);
        });
    };
    auth.logIn = function(user){
        return $http.post('/login', user).success(function(data){
            auth.saveToken(data.token);
        });
    };
    auth.logOut = function(){
        $window.localStorage.removeItem('flapper-news-token');
    };
    return auth;
}]);

app.config([
    '$stateProvider',
    '$urlRouterProvider',
    function($stateProvider, $urlRouterProvider){
          $stateProvider
            .state('home', {
              url: '/home',
              templateUrl: '/home.html',
              controller: 'MainCtrl',
              resolve: {
                postPromise: ['posts', function(posts){
                    return posts.getAll();
                }]
              }
            })
            .state('posts', {
              url: '/posts/{id}',
              templateUrl: '/posts.html',
              controller: 'PostsCtrl',
              resolve:{
                  post: ['$stateParams', 'posts', function($stateParams, posts) {
                        return posts.get($stateParams.id);
                    }]
              }
            })
            .state('login', {
                url: '/login',
                templateUrl: '/login.html',
                controller: 'AuthCtrl',
                onEnter: [ '$state', 'auth', function($state, auth){
                    if (auth.isLoggedIn()) {
                        $state.go('home');
                    };
                }]
            })
            .state('register', {
                url: '/register',
                templateUrl: '/register.html',
                controller: 'AuthCtrl',
                onEnter: [ '$state', 'auth', function($state, auth){
                    if (auth.isLoggedIn()) {
                        $state.go('home');
                    };
                }]
            });

        $urlRouterProvider.otherwise('home');
    }]);