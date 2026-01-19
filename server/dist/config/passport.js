"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const passport_1 = __importDefault(require("passport"));
const passport_google_oauth20_1 = require("passport-google-oauth20");
const passport_github2_1 = require("passport-github2");
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
// Serialize user for the session (we are stateless with JWT but boilerplate requires this)
passport_1.default.serializeUser((user, done) => {
    done(null, user.id);
});
passport_1.default.deserializeUser(async (id, done) => {
    const user = await prisma.user.findUnique({ where: { id } });
    done(null, user);
});
// Google Strategy
passport_1.default.use(new passport_google_oauth20_1.Strategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/api/auth/google/callback"
}, async (accessToken, refreshToken, profile, done) => {
    try {
        // Check if user exists by Google ID
        let user = await prisma.user.findUnique({
            where: { googleId: profile.id }
        });
        if (user) {
            return done(null, user);
        }
        // Check if user exists by Email (Link Account)
        if (profile.emails && profile.emails.length > 0) {
            const email = profile.emails[0].value;
            user = await prisma.user.findUnique({
                where: { email }
            });
            if (user) {
                // Link Google ID to existing email account
                user = await prisma.user.update({
                    where: { id: user.id },
                    data: { googleId: profile.id }
                });
                return done(null, user);
            }
        }
        // Create New User
        user = await prisma.user.create({
            data: {
                googleId: profile.id,
                email: profile.emails ? profile.emails[0].value : `google_${profile.id}@no-email.com`, // Fallback
                firstName: profile.name?.givenName || profile.displayName,
                lastName: profile.name?.familyName || "",
                password: "", // User with no password (social login)
                profilePic: profile.photos ? profile.photos[0].value : null
            }
        });
        done(null, user);
    }
    catch (error) {
        done(error, undefined);
    }
}));
// GitHub Strategy
passport_1.default.use(new passport_github2_1.Strategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: "/api/auth/github/callback",
    scope: ['user:email']
}, async (accessToken, refreshToken, profile, done) => {
    try {
        // Check if user exists by GitHub ID
        let user = await prisma.user.findUnique({
            where: { githubId: profile.id }
        });
        if (user) {
            return done(null, user);
        }
        // GitHub Email might be private
        let email = null;
        if (profile.emails && profile.emails.length > 0) {
            email = profile.emails[0].value;
        }
        if (email) {
            // Check if user exists by Email (Link Account)
            user = await prisma.user.findUnique({ where: { email } });
            if (user) {
                user = await prisma.user.update({
                    where: { id: user.id },
                    data: { githubId: profile.id }
                });
                return done(null, user);
            }
        }
        // Create New User
        user = await prisma.user.create({
            data: {
                githubId: profile.id,
                email: email || `github_${profile.id}@no-email.com`, // Fallback
                firstName: profile.displayName || profile.username || 'User',
                lastName: "",
                password: "",
                profilePic: profile.photos ? profile.photos[0].value : null
            }
        });
        done(null, user);
    }
    catch (error) {
        done(error, undefined);
    }
}));
//# sourceMappingURL=passport.js.map