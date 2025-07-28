// routes/auth.js (CommonJS version)
console.log('✅ Auth routes loaded');

const express = require('express');
const passport = require('passport');
const router = express.Router();

// @desc    Auth with Google
// @route   GET /auth/google
router.get(
    '/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
);

// @desc    Google auth callback
// @route   GET /auth/google/callback
router.get(
    '/google/callback',
    passport.authenticate('google', { failureRedirect: '/auth/failure' }),
    (req, res) => {
        // Successful authentication, redirect to frontend.
        // req.user contains the authenticated user object.
        // You can attach a JWT here if you prefer stateless authentication,
        // but for now, Passport's session will manage it.

        console.log('✅ Google OAuth successful for user:', req.user.username);
        // Redirect to your frontend application's main page or dashboard
        // The FRONTEND_URL comes from your .env file in index.js
        // and is used for redirects. Ensure your frontend is set up to receive this.
        res.redirect(process.env.FRONTEND_URL || 'http://localhost:19000');
    }
);

// @desc    Auth Failure Redirect
// @route   GET /auth/failure
router.get('/failure', (req, res) => {
    console.log('❌ Google OAuth failed.');
    res.status(401).json({ message: 'Authentication failed. Please try again.' });
    // You could also redirect to a specific error page on your frontend:
    // res.redirect(`${process.env.FRONTEND_URL}/login?error=auth_failed`);
});


// @desc    Logout user
// @route   GET /auth/logout
router.get('/logout', (req, res, next) => {
    console.log('User logging out:', req.user ? req.user.username : 'unknown user');
    req.logout((err) => { // Passport's logout method
        if (err) {
            return next(err);
        }
        // Destroy the session and redirect
        req.session = null; // Clear the session
        res.status(200).json({ message: 'Logged out successfully' });
        // Or redirect to your frontend's login page
        // res.redirect(`${process.env.FRONTEND_URL}/login`);
    });
});
router.get('/test', (req, res) => {
  res.json({ message: 'Auth route is working!' });
});
module.exports = router;