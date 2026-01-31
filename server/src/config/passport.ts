import passport from 'passport';
import { Strategy as GoogleStrategy, Profile as GoogleProfile } from 'passport-google-oauth20';
import { Strategy as GitHubStrategy, Profile as GitHubProfile } from 'passport-github2';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Serialize user for the session (we are stateless with JWT but boilerplate requires this)
passport.serializeUser((user: any, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id: number, done) => {
    const user = await prisma.user.findUnique({ where: { id } });
    done(null, user);
});

// Google Strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID as string,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    callbackURL: "/api/auth/google/callback"
},
    async (accessToken, refreshToken, profile: GoogleProfile, done) => {
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
            const email = profile.emails ? profile.emails[0].value : `google_${profile.id}@no-email.com`;
            // Generate basic loginId from email or ID. We might need a collision check logic ideally, 
            // but for now, let's assume specific format or timestamp to minimize collision.
            // Using google_ID as loginId seems safe/unique enough for social users.
            const loginId = `google_${profile.id}`;

            user = await prisma.user.create({
                data: {
                    googleId: profile.id,
                    email, // Fallback
                    loginId,
                    firstName: profile.name?.givenName || profile.displayName,
                    lastName: profile.name?.familyName || "",
                    password: "", // User with no password (social login)
                    profilePic: profile.photos ? profile.photos[0].value : null
                }
            });

            done(null, user);

        } catch (error) {
            done(error as Error, undefined);
        }
    }));

// GitHub Strategy
passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID as string,
    clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
    callbackURL: "/api/auth/github/callback",
    scope: ['user:email']
},
    async (accessToken: string, refreshToken: string, profile: GitHubProfile, done: (err?: string | Error | null, user?: any, info?: any) => void) => {
        try {
            // Check if user exists by GitHub ID
            let user = await prisma.user.findUnique({
                where: { githubId: profile.id }
            });

            if (user) {
                return done(null, user);
            }

            // GitHub Email might be private
            let email: string | null = null;
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
            const finalEmail = email || `github_${profile.id}@no-email.com`;
            const loginId = `github_${profile.username || profile.id}`;

            user = await prisma.user.create({
                data: {
                    githubId: profile.id,
                    email: finalEmail, // Fallback
                    loginId,
                    firstName: profile.displayName || profile.username || 'User',
                    lastName: "",
                    password: "",
                    profilePic: profile.photos ? profile.photos[0].value : null
                }
            });

            done(null, user);

        } catch (error) {
            done(error as Error, undefined);
        }
    }));
