import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import rapidriver from "@ovcina/rapidriver";
import helpers from './helpers.js';

const REFRESH_SECRET = process.env.refreshSecret ?? `$[/AJLN;A~djDLh,/kDg?K$Y=*dY44B4)TV*u*X5jjug9#.k>3QLzN;C9K2J36_:`;  // JWT refresh secret

/**
 * Generates a AccessToken if the RefreshToken is valid.
 * @param string refreshToken
 * @returns AccessToken|false
 */
export async function generateAccessToken(refreshToken)
{
    let ret = false;
    const token = await helpers.getTokenData(refreshToken, REFRESH_SECRET);
    if(token)
    {

        const userStmt = await helpers.query("SELECT * FROM `users` WHERE `id` = ?", [
            token.uid
        ]);
        if(userStmt.length > 0)
        {
            const userData = userStmt[0];
            
            ret = jwt.sign({
                uid: userData.id,
                rank: userData.rank,
                solverLimit: userData.solverLimit,
            }, helpers.SECRET, {
                expiresIn: 60 * 15, // 15 minutes
                issuer: "",
            });
        }
    }

    return {
        refreshToken: ret,
    };
}

/**
 * Returns a RefreshToken if the username and password is valid.
 * @param string username
 * @param string password
 * @returns RefreshToken|false
 */
export async function login(username, password)
{
    let ret = {
        token: false,
    };
    if(username && password)
    {
        const userStmt = await helpers.query("SELECT `id`, `rank`, `password` FROM `users` WHERE `email` = ?", [username.toLowerCase()]);
        if(userStmt && userStmt.length > 0)
        {
            const userData = userStmt[0];
            const correct = await bcrypt.compare(password, userData.password);
            if(correct)
            {
                ret.rank = userData.rank;
                ret.token = jwt.sign({
                    uid: userData.id,
                }, REFRESH_SECRET, {
                    issuer: "",
                });
            }
        }
    }

    return ret;
}

/**
 * Creates a user if the user dosent exist.
 * @param string username
 * @param string password
 * @param number rank
 * @returns true|false depending on if the user was created.
 */
export async function signUp(username, password, rank)
{
    let error = true;
    if(username && password)
    {
        const userStmt = await helpers.query("SELECT `email` FROM `users` WHERE `email` = ?", [username.toLowerCase()]);
        if(userStmt && userStmt.length === 0)
        {
            const hashedPass = await bcrypt.hash(password, 10);
            const newUserStmt = await helpers.query("INSERT INTO users (`email`, `password`, `rank`) VALUES (?, ?, ?)", [
                username.toLowerCase(),
                hashedPass,
                rank
            ]);
            if(newUserStmt)
            {
                error = false;
            }
        }
    }
    return {
        error,
    };
}
setImmediate(() => {
    signUp(process.env.userUsername, process.env.userPassword, 0);
    signUp(process.env.adminUsername, process.env.adminPassword, 1);    
});

if(process.env.RAPID)
{
    helpers.subscriber(helpers.host, [
        {
            river: "auth",
            event: "signIn",
            work: async (msg, publish) => publish("signIn-response", await login(msg.username, msg.password)),
        },
        {
            river: "auth",
            event: "signUp",
            work: async (msg, publish) => publish("signUp-response", await signUp(msg.username, msg.password, msg.rank)),
        },
        {
            river: "auth",
            event: "accessToken",
            work: async (msg, publish) => publish("accessToken-response", await generateAccessToken(msg.token)),
        },
    ]);
}
