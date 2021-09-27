// Student: David Numa, ID 8746372
// Inspired by www.starwars.com
// August 13, 2021

// MongoDB Structure:
// DB: starwars
// Collections: contacts, posts, users

/****************************Dependencies****************************/
//#region
// import dependencies you will use
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
//What is this programming construct or structure in js?
//Destructuring an object example in tests.js
const { check, validationResult, header } = require('express-validator');
const { json } = require('body-parser');
//get express session
const session = require('express-session');
//for uploading the images to the pages
const formidable = require("formidable");

//#endregion

/****************************Database*******************************/
//#region MongoDB
// Takes two arguments path - Includes type of DB, ip with port and name of database
// If it was not created this would create it through code.
mongoose.connect('mongodb://localhost:27017/starwars',
    {
        useNewUrlParser: true,
        useUnifiedTopology: true
    });
//#endregion

/****************************Models*********************************/
//#region Models
const Users = mongoose.model('users', {
    username: String,
    password: String
});

const Contact = mongoose.model('contacts', {
    name: String,
    address: String,
    phone: String,
    email: String,
    force: String,
    human: Boolean,
    wookie: Boolean,
    hutt: Boolean,
    comment: String
});

const Post = mongoose.model('posts', {
    pageTitle: String,
    pageImageTitle: String,
    pageImage: String,
    pageText: String
});
//#endregion

/****************************Variables******************************/
//#region Variables
var myApp = express();

myApp.use(express.urlencoded({ extended: false }));
// Setup session to work with app
// secret is a random string to use for the the hashes to save session cookies.
// resave - false prevents really long sessions and security threats from people not logging out.
// saveUninitialized - record a session of a user to see how many users were on your site even if
// they did not login or create any session variables.
myApp.use(session({
    secret: 'superrandomsecret',//Should look more like 4v2j3h4h4b324b24k2b3jk4b24kj32nb4
    resave: false,
    saveUninitialized: true
}));

//parse application json
myApp.use(express.json());
// set path to public folders and view folders
myApp.set('views', path.join(__dirname, 'views'));
//use public folder for CSS etc.
myApp.use(express.static(__dirname + '/public'));
myApp.set('view engine', 'ejs');

//#endregion

/****************************Page Routes****************************/
//#region Home page
myApp.get('/', function (req, res) {

    Post.find({}).exec(function (err, posts) {
        res.render('home', { posts: posts, userLoggedIn: req.session.userLoggedIn }); // no need to add .ejs to the file name
    });

});
//#endregion

//#region Static pages: Jedi, Sith, About me
// Jedi page
myApp.get('/jedi', function (req, res) {
    Post.find({}).exec(function (err, posts) {
        res.render('jedi', { posts: posts, userLoggedIn: req.session.userLoggedIn });
    });
});
// Sith page
myApp.get('/sith', function (req, res) {
    Post.find({}).exec(function (err, posts) {
        res.render('sith', { posts: posts, userLoggedIn: req.session.userLoggedIn });
    });
});
// About Me
myApp.get('/about', function (req, res) {
    Post.find({}).exec(function (err, posts) {
        res.render('about', { posts: posts, userLoggedIn: req.session.userLoggedIn });
    });
});

//#endregion

//#region Internal use pages: Construction
// Under constructions
myApp.get('/construction', function (req, res) {
    Post.find({}).exec(function (err, posts) {
        res.render('construction', { posts: posts, userLoggedIn: req.session.userLoggedIn });
    });
});

//#endregion

//#region Forms: contact, login, logout
// Contact page
myApp.get('/contact', function (req, res) {
    Post.find({}).exec(function (err, posts) {
        res.render('contact', {
            posts: posts,
            userLoggedIn: req.session.userLoggedIn,
            name: '',
            email: '',
            contactsaved: false
        });
    });
});

myApp.post('/contact', [
    check('phone', '').custom(CustomPhoneValidation),
],
    function (req, res) {
        Post.find({}).exec(function (err, posts) {
            var contactsaved;
            const errors = validationResult(req);
            //console.log(req.body);
            if (!errors.isEmpty()) {
                res.render('contact', {
                    posts: posts,
                    contactsaved: contactsaved,
                    errors: errors.array()
                });
            }
            else {
                // Save data from the EJS
                var name = req.body.name;
                var address = req.body.address;
                var phone = req.body.phone;
                var email = req.body.email;
                var comment = req.body.comment;
                var force = req.body.force;

                // Validate if the user selected any race
                if (req.body.human) {
                    var human = true;
                } else {
                    var human = false;
                }
                if (req.body.wookie) {
                    var wookie = true;
                } else {
                    var wookie = false;
                }
                if (req.body.hutt) {
                    var hutt = true;
                } else {
                    var hutt = false;
                }

                // Save the data in the mongoDB
                var myNewContact = new Contact(
                    {
                        name: name,
                        address: address,
                        phone: phone,
                        email: email,
                        force: force,
                        human: human,
                        wookie: wookie,
                        hutt: hutt,
                        comment: comment
                    }
                )
                myNewContact.save().then(() => console.log('New contact saved'));
                contactsaved = true;
                res.render('contact', {
                    contactsaved: contactsaved,
                    posts: posts,
                    name: name,
                    email: email
                });
            }
        });
    }
)

//Login Pages
myApp.get('/loginsuccess', function (req, res) {
    Post.find({}).exec(function (err, posts) {
        res.render('loginsuccess', { posts: posts, userLoggedIn: req.session.userLoggedIn });
    });
});


myApp.get('/login', function (req, res) {
    Post.find({}).exec(function (err, posts) {
        res.render('login', { posts: posts, userLoggedIn: req.session.userLoggedIn });
    });
});

myApp.post('/login', function (req, res) {
    // Get values from EJS
    var user = req.body.username;
    var pass = req.body.password;

    Post.find({}).exec(function (err, posts) {
        Users.findOne({ username: user, password: pass }).exec(function (err, users) {
            // log any errors
            console.log('Error: ' + err);
            console.log('Username: ' + users);
            if (users) {
                //store username in session and set logged in true
                req.session.username = users.username;
                req.session.userLoggedIn = true;
                console.log(req.session.username);

                // store the username globally
                myApp.locals.username = users.username;

                res.redirect('loginsuccess')
            }
            else {
                res.render('login', { posts: posts, error: '<blockquote>"Log in, you can not"</blockquote> - Yoda' });
            }
        });
    });
});

//Logout Page
myApp.get('/logout', function (req, res) {

    //Remove variables from session
    req.session.username = '';
    req.session.userLoggedIn = false;
    usernameHeader = req.session.username;
    Post.find({}).exec(function (err, posts) {
        res.render('home', { posts: posts, userLoggedIn: req.session.userLoggedIn });
    });
});
// This avoids PAGE NOT FOUND if the user clicks on LOGIN button inmediatly after logout
myApp.post('/logout', function (req, res) {
    res.redirect('/login');
});
//#endregion

//#region Blog posts> add page, edit page

// Add Page
myApp.get('/addpage', function (req, res) {
    Post.find({}).exec(function (err, posts) {
        res.render('addpage', { posts: posts, userLoggedIn: req.session.userLoggedIn });
    });
});

myApp.post('/addpage', function (req, res) {
    if (req.session.userLoggedIn) {

        //Upload the picture: 
        // https://www.youtube.com/watch?v=PXxd7WzhVn0
        // create an incoming form object

        var form = formidable.IncomingForm();
        form.parse(req, (err, fields, files) => {
            if (err) {
                next(err);
                return;
            }
            console.log("Title: " + fields.pageTitle);
            console.log("Image title: " + fields.pageImageTitle);
            console.log("File: " + files.pageImage.name);
            console.log("Comment: " + fields.pageEditor);

            var pageTitle = fields.pageTitle;
            var pageEditor = fields.pageEditor;
            var pageImageTitle = fields.pageImageTitle;
            var pageImage = files.pageImage.name;

            //console.log(JSON.stringify(files))

            var myNewPost = new Post(
                {
                    pageTitle: pageTitle,
                    pageImageTitle: pageImageTitle,
                    pageImage: pageImage,
                    pageText: pageEditor
                }
            )
            myNewPost.save().then(() => console.log('New page saved'));

        });

        form.on('fileBegin', function (name, file) {
            file.path = __dirname + '/public/uploads/' + file.name;
        });

        setTimeout(() => 1500);           // wait for the image to copy into upload
        res.redirect('addpagesuccess');
    }
    else {
        res.redirect('/login');
    }
});

myApp.get('/addpagesuccess', function (req, res) {
    Post.find({}).exec(function (err, posts) {
        res.render('addpagesuccess', { posts: posts, userLoggedIn: req.session.userLoggedIn });
    });
});

// List all pages (edit pages menu)
myApp.get('/allpages', function (req, res) {
    // check if the user is logged in
    if (req.session.userLoggedIn) {
        Post.find({}).exec(function (err, posts) {
            res.render('allpages', { posts: posts, userLoggedIn: req.session.userLoggedIn });
        });
    }
    else { // otherwise send the user to the login page
        res.redirect('/login');
    }
});

//Edit page
//Use uniques mongodb id
myApp.get('/editpage/:id', function (req, res) {
    // check if the user is logged in

    if (req.session.userLoggedIn) {
        var postsid = req.params.id;
        console.log(postsid);
        Post.findOne({ _id: postsid }).exec(function (err, posts) {
            console.log('Error: ' + err);
            console.log('Post: ' + posts);
            console.log('Post ID: ' + postsid);

            // save the postsid globally to be used in the EJS
            myApp.locals.postsid = postsid;

            if (posts) {
                res.render('editpage', { posts: posts, userLoggedIn: req.session.userLoggedIn });//Render edit with the order
            }
            else {
                //This will be displayed if the user is trying to change the order id in the url
                res.send('Edit page: No page found with that id...');
            }
        });
    }
    else {
        res.redirect('/login');
    }

});

myApp.post('/editpage/:id', function (req, res) {
    if (req.session.userLoggedIn) {
        var form = formidable.IncomingForm();
        form.parse(req, (err, fields, files) => {
            if (err) {
                next(err);
                return;
            }
            console.log("Title: " + fields.pageTitle);
            console.log("Image title: " + fields.pageImageTitle);
            console.log("File: " + files.pageImage.name);
            console.log("Comment: " + fields.pageEditor);

            var pageTitle = fields.pageTitle;
            var pageText = fields.pageEditor;
            var pageImage = files.pageImage.name;
            var pageImageTitle = fields.pageImageTitle;
            var postsid = req.params.id;

            console.log("PostsID In edit: " + postsid);

            //console.log(JSON.stringify(files))
            Post.findOne({ _id: postsid }, function (err, posts) {

                posts.pageTitle = pageTitle;
                posts.pageImageTitle = pageImageTitle;
                posts.pageImage = pageImage;
                posts.pageText = pageText;
                posts.save();
            });

        });

        form.on('fileBegin', function (name, file) {
            file.path = __dirname + '/public/uploads/' + file.name;
        });

        var postsid = req.params.id;
        var editSuccessPage = '/pageTemplate/' + postsid;
        console.log("PostsID In edit END: " + postsid);
        console.log("Edit success page: " + editSuccessPage);

        setTimeout(() => 1500);           // wait for the image to copy into upload
        res.redirect(editSuccessPage);
    } else {
        res.redirect('/login');
    }

});

myApp.get('/pageTemplate/:id', function (req, res) {
    if (req.session.userLoggedIn) {
        var postsid = req.params.id;
        console.log('PostI in pageTemplate: ' + postsid);
        Post.findOne({ _id: postsid }, function (err, postUnique) {
            Post.find({}).exec(function (err, posts) {
                var message = '<h2><a href="#">Page succesfully edited</a></h2>';
                console.log(postUnique.pageTitle);
                if (posts) {
                    res.render('pageTemplate', {
                        userLoggedIn: req.session.userLoggedIn,
                        message: message,
                        pageImage: postUnique.pageImage,
                        pageTitle: postUnique.pageTitle,
                        pageText: postUnique.pageText,
                        pageImageTitle: postUnique.pageImageTitle,
                        posts
                    });
                } else {
                    res.send('pageTemplate: No page found with that id...');
                }
            });
        });
    } else {
        res.redirect('/login');
    }
});

//Delete page. Use uniques mongodb id
myApp.get('/deletepage/:postsid', function (req, res) {
    // check if the user is logged in
    if (req.session.userLoggedIn) {
        //delete
        var postsid = req.params.postsid;
        console.log(postsid);
        Post.findByIdAndDelete({ _id: postsid }).exec(function (err, posts) {
            console.log('Error: ' + err);
            console.log('Page: ' + posts);
            if (posts) {
                res.render('deletepage', { message: 'Successfully deleted!', userLoggedIn: req.session.userLoggedIn, posts });
            }
            else {
                res.render('deletepage', { message: 'Sorry, could not delete!', userLoggedIn: req.session.userLoggedIn, posts });
            }
        });
    }
    else {
        res.redirect('/login');
    }
});
//#endregion

//#region Path for each page, 404 and listener
myApp.get('/:path', function (req, res) {

    var path = req.params.path;
    Post.findOne({ pageTitle: path }).exec(function (err, postUnique) {
        var message = '';
        Post.find({}).exec(function (err, posts) {
            if (postUnique) {
                res.render('pageTemplate', {
                    userLoggedIn: req.session.userLoggedIn,
                    message: message,
                    pageImageTitle: postUnique.pageImageTitle,
                    pageTitle: postUnique.pageTitle,
                    pageImage: postUnique.pageImage,
                    pageText: postUnique.pageText,
                    posts
                });
            } else {
                res.render('404', { posts: posts, userLoggedIn: req.session.userLoggedIn });
            }
        });
    });
});

// Page not found, error 404 
myApp.use(function (req, res, next) {
    Post.find({}).exec(function (err, posts) {
        res.status(404);
        res.render('404', { posts: posts, userLoggedIn: req.session.userLoggedIn });
    });
});

// start the server and listen at a port
myApp.listen(8080);
console.log('R2D2: *** BLIP BLIP BLIP CHRIMP BLIP *** (Translation: Website at port 8080)');

//#endregion

/****************************Validation Functions****************************/
//#region Validators
// phone regex for 123-123-2341
var phoneRegex = /^[0-9]{3}\-?[0-9]{3}\-?[0-9]{4}$/;

//Function to check a string using regex
function CheckRegex(userInput, regex) {
    if (regex.test(userInput)) {
        return true;
    }
    return false;
}

// Custom phone validation
function CustomPhoneValidation(value) {
    if (!CheckRegex(value, phoneRegex)) {
        throw new Error('Wrong phone format');
    }
    return true;
}
//#endregion
