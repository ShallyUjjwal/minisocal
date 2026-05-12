const express = require('express');
const app = express();
const port = 3000;
const upload = require('./config/multerconfig');

const User = require('./models/user');
const Post = require('./models/post');
const path = require('path');


const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

app.set('view engine', 'ejs');

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));






// Home Page
app.get('/profile/upload', (req, res) => {
    res.render('profileupload');
});

app.post('/upload',upload.single('image'), isLoggedIn, async (req, res) => {
  let user =  await User.findOne({ email: req.user.email });
   user.profilepic = req.file.filename;
   await user.save();
    res.redirect('/profile');


});
    

app.get('/', (req, res) => {
    res.render('index');
});



// Login Page
app.get('/login',  (req, res) => {
    res.render('login');
});




// Register User
app.post('/register', async (req, res) => {

    try {

        let { username, name, email, password, age } = req.body;

        // check existing user
        let existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(400).send('User already exists');
        }

        // hash password
        const hash = await bcrypt.hash(password, 10);

        // create user
        let newUser = await User.create({
            username,
            name,
            email,
            password: hash,
            age
        });

        // create token
        let token = jwt.sign(
            {
                email: newUser.email,
                userid: newUser._id
            },
            'secretkey'
        );

        // save token in cookie
        res.cookie('token', token);

        res.redirect('/profile');

    } catch (err) {

        console.log(err);

        res.status(500).send('Something went wrong');
    }
});


// Login User
app.post('/login', async (req, res) => {

    try {

        let { email, password } = req.body;

        let user = await User.findOne({ email });

        if (!user) {
            return res.status(404).send('User not found');
        }

        // compare password
        let result = await bcrypt.compare(password, user.password);

        if (!result) {
            return res.redirect('/login');
        }

        // create token
        let token = jwt.sign(
            {
                email: user.email,
                userid: user._id
            },
            'secretkey'
        );

        // save token in cookie
        res.cookie('token', token);

        res.redirect('/profile');
    } catch (err) {

        console.log(err);

        res.status(500).send('Something went wrong');
    }
});


// Logout User
app.get('/logout', (req, res) => {

    res.clearCookie('token');

    res.redirect('/login');
});


function isLoggedIn(req, res, next) {
    if (req.cookies.token === undefined) {
        return res.redirect('/login');
    }else {
       let data =  jwt.verify(req.cookies.token, 'secretkey')
         req.user = data; 
            next();  
            
    }
     }



app.post('/profile', isLoggedIn, async (req, res) => {

    let user = await User.findOne({
        email: req.user.email
    });

    console.log(user);

    res.render('profile', { user });

});


app.post('/post', isLoggedIn, async (req, res) => {

  let user = await User.findOne({
    email: req.user.email
  });
  let post = await  Post.create({
    user: user._id,
    content: req.body.content
  });

  user.posts.push(post._id);
    await user.save();
    res.redirect('/profile');



});

app.get('/profile', isLoggedIn, async (req, res) => {

    let user = await User.findOne({
        email: req.user.email
    }).populate('posts');

    res.render('profile', { user });

});

app.get('/like/:id', isLoggedIn, async (req, res) => {

    let post = await Post.findById(req.params.id);

    // check if user already liked the post
    if(post.likes.includes(req.user.userid)){

        // UNLIKE
        post.likes = post.likes.filter((id) => {
            return id.toString() !== req.user.userid.toString();
        });

    } else {

        // LIKE
        post.likes.push(req.user.userid);

    }

    await post.save();

    res.redirect('/profile');

});

app.get('/edit/:id', isLoggedIn, async (req, res) => {

    let post = await Post.findById(req.params.id);

    

    res.render('edit', { post });

});


app.post('/update/:id', isLoggedIn, async (req, res) => {

    let post = await Post.findOneAndUpdate({ _id: req.params.id }, { content: req.body.content }, { new: true });

    

    res.redirect('/profile');

});








// Start Server
app.listen(port, () => {

    console.log(`Server running at http://localhost:${port}`);
});