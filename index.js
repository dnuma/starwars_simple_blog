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
const { Console } = require('console');
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

// set up the model for the order
const Order = mongoose.model('posts', {
    name: String,
    email: String,
    phone: String,
    address: String,
    city: String,
    provinceText: String,
    item1: Number,
    item2: Number,
    item3: Number,
    tax: Number,
    total: Number
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
// Home page
myApp.get('/', function (req, res) {
    res.render('home', { userLoggedIn: req.session.userLoggedIn }); // no need to add .ejs to the file name
});

//#region Static pages: Jedi, Sith, About me
// Jedi page
myApp.get('/jedi', function (req, res) {
    res.render('jedi', { userLoggedIn: req.session.userLoggedIn });
});
// Sith page
myApp.get('/sith', function (req, res) {
    res.render('sith', { userLoggedIn: req.session.userLoggedIn });
});
// About Me
myApp.get('/about', function (req, res) {
    res.render('about', { userLoggedIn: req.session.userLoggedIn });
});

//#endregion

//#region Internal use pages: Construction
// Under constructions
myApp.get('/construction', function (req, res) {
    res.render('construction', { userLoggedIn: req.session.userLoggedIn });
});

//#endregion

//#region Forms: contact, login, logout
// Contact page
myApp.get('/contact', function (req, res) {
    res.render('contact', { userLoggedIn: req.session.userLoggedIn });
});

myApp.post('/contact', [
    check('phone', '').custom(CustomPhoneValidation),
],
    function (req, res) {
        const errors = validationResult(req);
        console.log(req.body);
        if (!errors.isEmpty()) {
            res.render('contact', {
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

            res.render('contactthanks', {
                name: name,
                email: email
            });
        }
    }
)
myApp.get('/contactthanks', function (req, res) {
    res.render('contactthanks', { userLoggedIn: req.session.userLoggedIn });
});

//Login Page
myApp.get('/login', function (req, res) {
    res.render('login', { userLoggedIn: req.session.userLoggedIn });
});

myApp.post('/login', function (req, res) {
    // Get values from EJS
    var user = req.body.username;
    var pass = req.body.password;

    Users.findOne({ username: user, password: pass }).exec(function (err, users) {
        // log any errors
        console.log('Error: ' + err);
        console.log('Username: ' + users);
        if (users) {
            //store username in session and set logged in true
            req.session.username = users.username;
            req.session.userLoggedIn = true;

            // redirect to the dashboard
            res.redirect('/');
        }
        else {
            res.render('login', { error: '"Log in, you can not" - Yoda' });
        }
    });
});

//Logout Page
myApp.get('/logout', function (req, res) {
    //Remove variables from session
    req.session.username = '';
    req.session.userLoggedIn = false;
    res.render('home', { userLoggedIn: req.session.userLoggedIn });

});
// This avoids PAGE NOT FOUND if the user clicks on LOGIN button inmediatly after logout
myApp.post('/logout', function (req, res) {
    res.redirect('/login');
});


//#endregion

//#region Blog posts> add page, delete page
myApp.get('/addpage', function (req, res) {
    res.render('addpage', { userLoggedIn: req.session.userLoggedIn });
});

function test(pageTitle, imageName, addPageEditor) {
    console.log(pageTitle);
    console.log(imageName);
    console.log(addPageEditor);
}

myApp.post('/addpage', function (req, res) {
    if (req.session.userLoggedIn) {
        
        //Upload the picture: 
        //https://www.youtube.com/watch?v=PXxd7WzhVn0
        // create an incoming form object
        const form = formidable.IncomingForm();
        form.parse(req);
        form.on('fileBegin', function (name, file, fields) {
            file.path = __dirname + '/public/uploads/' + file.name;
        });

        form.on('file', function (fields, file) {
            console.log('Uploaded ' + file.name);
            return res.send(file.name);
            test(fields.pageTitle, file.name, fields.addPageEditor);
        });
        console.log(file.name);
        var pageTitle = req.body.pageTitle;
        var addPageEditor = req.body.addPageEditor;

        console.log("Page title: " + pageTitle);
        console.log("Page CKEDitor: " + addPageEditor);

        // var email = req.body.email;
        // var comment = req.body.comment;
        // var force = req.body.force;

        // // Validate if the user selected any race
        // if (req.body.human) {
        //     var human = true;
        // } else {
        //     var human = false;
        // }
        // if (req.body.wookie) {
        //     var wookie = true;
        // } else {
        //     var wookie = false;
        // }
        // if (req.body.hutt) {
        //     var hutt = true;
        // } else {
        //     var hutt = false;
        // }

        // // Save the data in the mongoDB
        // var myNewContact = new Contact(
        //     {
        //         name: name,
        //         address: address,
        //         phone: phone,
        //         email: email,
        //         force: force,
        //         human: human,
        //         wookie: wookie,
        //         hutt: hutt,
        //         comment: comment
        //     }
        // )
        // myNewContact.save().then(() => console.log('New contact saved'));

        // var orderid = req.params.orderid;
        // console.log(orderid);
        // Order.findOne({ _id: orderid }).exec(function (err, order) {
        //     console.log('Error: ' + err);
        //     console.log('Order: ' + order);
        //     if (order) {
        //         res.render('edit', { order: order, userLoggedIn: req.session.userLoggedIn });//Render edit with the order
        //     }
        //     else {
        //         //This will be displayed if the user is trying to change the order id in the url
        //         res.send('No order found with that id...');
        //     }
        // });
    }
    else {
        res.redirect('/login');
    }
});

myApp.get('/editpage', function (req, res) {
    res.render('editpage', { userLoggedIn: req.session.userLoggedIn });
});

//#endregion

//**************DELETEEEEEE  TEMP ********************************//
myApp.get('/temp', function (req, res) {
    res.render('temp', { userLoggedIn: req.session.userLoggedIn });
});















//Edit page 
//Use uniques mongodb id
myApp.get('/edit/:orderid', function (req, res) {
    // check if the user is logged in
    if (req.session.userLoggedIn) {
        var orderid = req.params.orderid;
        console.log(orderid);
        Order.findOne({ _id: orderid }).exec(function (err, order) {
            console.log('Error: ' + err);
            console.log('Order: ' + order);
            if (order) {
                res.render('edit', { order: order, userLoggedIn: req.session.userLoggedIn });//Render edit with the order
            }
            else {
                //This will be displayed if the user is trying to change the order id in the url
                res.send('No order found with that id...');
            }
        });
    }
    else {
        res.redirect('/login');
    }
});

myApp.post('/edit/:id', [
    check('name', 'Must have a name').not().isEmpty(),
    check('email', 'Must have email').isEmail(),
    check('phone').custom(CustomPhoneValidation)
], function (req, res) {

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        //console.log(errors); // check what is the structure of errors
        var orderid = req.params.id;
        Order.findOne({ _id: orderid }).exec(function (err, order) {
            console.log('Error: ' + err);
            console.log('Order: ' + order);
            if (order) {
                res.render('edit', { order: order, errors: errors.array() });
            }
            else {
                res.send('No order found with that id...');
            }
        });
    }
    else {
        var name = req.body.name;
        var email = req.body.email;
        var phone = req.body.phone;
        var address = req.body.address;
        var city = req.body.city;
        var provinceText = req.body.provinceText;
        var colorprint = req.body.colorprint;
        var grayscale = req.body.grayscale;
        var scan = req.body.scan;

        var tax = subTotal * 0.13;
        var total = subTotal + tax;

        var pageData = {
            name: name,
            email: email,
            phone: phone,
            address: address,
            city: city,
            provinceText: provinceText,
            colorprint: colorprint,
            grayscale: grayscale,
            scan: scan,
            subTotal: subTotal,
            tax: tax,
            total: total
        }
        var id = req.params.id;
        Order.findOne({ _id: id }, function (err, order) {
            order.name = name;
            order.email = email;
            order.phone = phone;
            order.address = address;
            order.lunch = lunch;
            order.city = city;
            order.provinceText = provinceText;
            order.colorprint = item1;
            order.grayscale = item2;
            order.scan = item3;
            order.subTotal = subTotal;
            order.tax = tax;
            order.total = total;
            order.save();
        });
        res.render('editsuccess', pageData);
    }
});

//Delete page
//Use uniques mongodb id
myApp.get('/delete/:orderid', function (req, res) {
    // check if the user is logged in
    if (req.session.userLoggedIn) {
        //delete
        var orderid = req.params.orderid;
        console.log(orderid);
        Order.findByIdAndDelete({ _id: orderid }).exec(function (err, order) {
            console.log('Error: ' + err);
            console.log('Order: ' + order);
            if (order) {
                res.render('delete', { message: 'Successfully deleted!', userLoggedIn: req.session.userLoggedIn });
            }
            else {
                res.render('delete', { message: 'Sorry, could not delete!', userLoggedIn: req.session.userLoggedIn });
            }
        });
    }
    else {
        res.redirect('/login');
    }
});

//All orders page
//fetch all. If there is an error it will put it in the err variable otherwise the orders
//will be returned in the orders variable.
// All orders page
myApp.get('/allorders', function (req, res) {
    // check if the user is logged in
    if (req.session.userLoggedIn) {
        console.log(req.session.userLoggedIn);
        Order.find({}).exec(function (err, orders) {
            res.render('allorders', { orders: orders, userLoggedIn: req.session.userLoggedIn });
        });
    }
    else { // otherwise send the user to the login page
        res.redirect('/login');
    }
});

/********************************Tax finder *********************************/
// https://www.retailcouncil.org/resources/quick-facts/sales-tax-rates-by-province/
function TaxFinder(province) {

    var tax;
    var provinceText;

    switch (province) {
        case 1:
            tax = 0.05;
            provinceText = "Alberta";
            break;
        case 2:
            tax = 0.12;
            provinceText = "British Columbia";
            break;
        case 3:
            tax = 0.12;
            provinceText = "Manitoba";
            break;
        case 4:
            tax = 0.15;
            provinceText = "New Brunswick";
            break;
        case 5:
            tax = 0.15;
            provinceText = "Newfoundland and Labrador";
            break;
        case 6:
            tax = 0.05;
            provinceText = "Northwest Territories";
            break;
        case 7:
            tax = 0.15;
            provinceText = "Nova Scotia";
            break;
        case 8:
            tax = 0.05;
            provinceText = "Nunavut";
            break;
        case 9:
            tax = 0.13;
            provinceText = "Ontario";
            break;
        case 10:
            tax = 0.15;
            provinceText = "Prince Edward Island";
            break;
        case 11:
            tax = 0.14975;
            provinceText = "Quebec";
            break;
        case 12:
            tax = 0.11;
            provinceText = "Saskatchewan";
            break;
        case 13:
            tax = 0.05;
            provinceText = "Yukon";
            break;
    }

    return [tax, provinceText];
}

/****************************Validation Functions****************************/
// phone regex for 123-123-2341
var phoneRegex = /^[0-9]{3}\-?[0-9]{3}\-?[0-9]{4}$/;

//Function to check a string using regex
function CheckRegex(userInput, regex) {
    if (regex.test(userInput)) {
        return true;
    }
    return false;
}

// Custom validation functions return true if conditions are satisfied or throws an error of type Error
// Validate if the subtotal is greater than the minimum value
function SubTotalValidation(value, { req }) {
    var item1 = parseInt(req.body.item1);
    var item2 = parseInt(req.body.item2);
    var item3 = parseInt(req.body.item3);

    var item1Value = 0.5;
    var item2Value = 0.2;
    var item3Value = 0.25;
    var minimumSubtotalPrice = 10;

    item1 *= item1Value.toFixed(2);
    item2 *= item2Value.toFixed(2);
    item3 *= item3Value.toFixed(2);

    if ((item1 + item2 + item3) < minimumSubtotalPrice) {
        throw new Error('Your total before taxes must be greater than $10');
    }
    return true;
}

// Custom phone validation
function CustomPhoneValidation(value) {
    if (!CheckRegex(value, phoneRegex)) {
        throw new Error('Wrong phone format');
    }
    return true;
}

// Custom Province validator
function CustomProvinceValidation(value) {
    if (!parseInt(value)) {
        throw new Error('Please select a Province');
    }
    return true;
}
// Custom item quantity validators. Must be a number greater than zero and the user must select at least 1 item
function CustomItem1Validation(value, { req }) {
    var item1 = req.body.item1;
    var grayscale = req.body.grayscale;
    var scan = req.body.scan;

    if (value) {
        if (!parseInt(item1)) {
            throw new Error('Please correct item quantity: Color print');
        }
    } else if (!value && !grayscale && !scan) {
        throw new Error('Please select at least 1 item');
    }
    return true;
}
function CustomItem2Validation(value, { req }) {
    var item2 = req.body.item2;

    if (value) {
        if (!parseInt(item2)) {
            throw new Error('Please correct item quantity: Grayscale print');
        }
    }
    return true;
}
function CustomItem3Validation(value, { req }) {
    var item3 = req.body.item3;

    if (value) {
        if (!parseInt(item3)) {
            throw new Error('Please correct item quantity: Scan');
        }
    }
    return true;
}

//#endregion



//#region Last route (404) and listener
// Page not found, error 404 handler
myApp.use(function (req, res, next) {
    res.status(404);
    res.render('404', { userLoggedIn: req.session.userLoggedIn });
});

// start the server and listen at a port
myApp.listen(8080);
console.log('Everything executed fine.. website at port 8080....');

//#endregion