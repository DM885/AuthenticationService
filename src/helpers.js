import jwt from "jsonwebtoken";
import rapidriver from "@ovcina/rapidriver";
import mysql from "mysql";

export const SECRET = process.env.SECRET ?? `3(?<,t2mZxj$5JT47naQFTXwqNWP#W>'*Kr!X!(_M3N.u8v}%N/JYGHC.Zwq.!v-`;  // JWT secret

const rapidUser = process.env.rapidUser ?? "guest";
const rapidPass = process.env.rapidPass ?? "guest";
export const host = "amqp://" + rapidUser + ":" + rapidPass + "@" + (process.env.riverUrl ?? `localhost`);  // RabbitMQ url

export function subscribe(eventListeners = [])
{
    eventListeners.forEach(listener => rapidriver.subscribe(host, [listener]));
}

/**
 * Returns the token payload if its valid, otherwise it returns false.
 * @param String token
 * @returns Promise<false|TokenData>
 */
export function getTokenData(token, secretOrPublicKey = SECRET)
{
    return new Promise(resolve => jwt.verify(token, secretOrPublicKey, (err, data) => resolve(err ? false : data)));
}

let connection;
if(process.env.mysqlDb)
{
    connection = mysql.createConnection({
        host     : process.env.mysqlHost ?? 'localhost',
        user     : process.env.mysqlUser ?? 'root',
        password : process.env.mysqlPass ?? '',
        database : process.env.mysqlDb
    });
    connection.connect();
}

/**
 * Runs a SQL query on the DB.
 * @param string stmt
 * @param ?string[] WHERE
 * @returns results[]|false
 */
export function query(stmt, WHERE = [])
{
    return new Promise(r => connection.query(stmt, WHERE, (err, results) => r(err ? false : results)));
}
