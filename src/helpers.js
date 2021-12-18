import jwt from "jsonwebtoken";
import rapid from "@ovcina/rapidriver";
import mysql from "mysql";

const SECRET = process.env.SECRET ?? `3(?<,t2mZxj$5JT47naQFTXwqNWP#W>'*Kr!X!(_M3N.u8v}%N/JYGHC.Zwq.!v-`;  // JWT secret

const rabbitUser = process.env.rabbitUser ?? "guest";
const rabbitPass = process.env.rabbitPass ?? "guest";
const host = "amqp://" + rabbitUser + ":" + rabbitPass + "@" + (process.env.rabbitHost ?? `localhost`);  // RabbitMQ url

/**
 * Automatically adds logging, request and sessionIDs to rabbit responses.
 * @param stromg host 
 * @param [] subscribers 
 */
function subscriber(host, subscribers)
 {
     rapid.subscribe(host, subscribers.map(subscriber => ({
         river: subscriber.river,
         event: subscriber.event,
         work: (msg, publish) => {
             const wrapResponse = (func) => {
                 let logPath = msg.logPath ?? [];
                 logPath.push({
                     river: subscriber.river, 
                     event: subscriber.event
                 });
 
                 return (event, data) => func(event, {
                    ...data,
                    sessionId: msg.sessionId,
                    requestId: msg.requestId,
                    logPath
                });
             };
             
             subscriber.work(msg, wrapResponse(publish));
         },
     })));
 }

/**
 * Returns the token payload if its valid, otherwise it returns false.
 * @param String token
 * @returns Promise<false|TokenData>
 */
function getTokenData(token, secretOrPublicKey = SECRET)
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
        database : process.env.mysqlDb  ?? 'db'
    });
    connection.connect();
    await query("CREATE TABLE IF NOT EXISTS `users` (`id` int(11) unsigned NOT NULL AUTO_INCREMENT,`email` varchar(255) NOT NULL,`password` varchar(255) NOT NULL,`rank` int(1) unsigned NOT NULL DEFAULT '0',KEY `Index 1` (`id`)) ENGINE=InnoDB DEFAULT CHARSET=latin1;");
}

/**
 * Runs a SQL query on the DB.
 * @param string stmt
 * @param ?string[] WHERE
 * @returns results[]|false
 */
function query(stmt, WHERE = [])
{
    return new Promise(r => connection.query(stmt, WHERE, (err, results) => r(err ? false : results)));
}
export default {
    host,
    query,
    getTokenData,
    subscriber,
    SECRET
}