import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import bodyParser from 'body-parser';
import passport from 'passport';
import AppleStrategy from 'passport-apple';
import mongoose from 'mongoose';

const app = express();

// Connect to your MongoDB database
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });

// Define a mongoose model for your users
const User = mongoose.model('user', {
    appleId: String,
    // Add other fields you want to save
});

app.get("/", (req, res) => {
    res.send("<a href=\"/login\">Sign in with Apple</a>");
});

app.use(passport.initialize());
app.use(passport.session());
app.use(bodyParser.urlencoded({ extended: true }));

passport.serializeUser((user, cb) => {
    cb(null, user);
});

passport.deserializeUser((obj, cb) => {
    cb(null, obj);
});

passport.use(new AppleStrategy({
    clientID: "com.yourservice",
    teamID: "######",
    callbackURL: "https://codercruiser.github.io/web-design/redirect",
    keyID: "ZYM475Q23Y",
        privateKeyLocation: "/PATH TO YOUR CERT FILE/#####.p8"
}, (req, accessToken, refreshToken, idToken, profile, cb) => {
    console.log("Apple authentication successful. Profile:", profile);

    // Save user to MongoDB
    const newUser = new User({
        appleId: profile.id,
        email: profile.emails ? profile.emails[0].value : null,
        firstName: profile.name ? profile.name.givenName : null,
        lastName: profile.name ? profile.name.familyName : null,
        // Add other fields you want to save
    });

    newUser.save((err) => {
        if (err) {
            console.error("Error saving user to database:", err);
            return cb(err);
        }

        console.log("User saved to database successfully.");
        return cb(null, idToken);
    });
}));

app.get("/login", passport.authenticate('apple'));
app.post("/auth", (req, res, next) => {
    passport.authenticate('apple', (err, user, info) => {
        if (err) {
            console.error("Authentication error:", err);
            return res.status(500).send("Internal Server Error");
        }

        if (!user) {
            console.error("No user found after authentication.");
            return res.status(401).send("Unauthorized");
        }

        if (req.body.user) {
            res.json({
                user: req.body.user,
                idToken: user
            });
        } else {
            res.json(user);
        }
    })(req, res, next);
});

app.listen(4000, () => {
    console.log("Server started");
});
