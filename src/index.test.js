import {jest, test} from '@jest/globals';
import {login, signUp, generateAccessToken} from "./index.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";


import helpers from "./helpers.js";

// Mock functions.
helpers.query = jest.fn();
const publishFn = jest.fn();
helpers.getTokenData= jest.fn();
const REFRESH_SECRET = process.env.refreshSecret ?? `$[/AJLN;A~djDLh,/kDg?K$Y=*dY44B4)TV*u*X5jjug9#.k>3QLzN;C9K2J36_:`;  // JWT refresh secret


describe("Signup test", () => {
    beforeEach(async () => {
        helpers.query.mockClear();
        publishFn.mockClear();
        helpers.getTokenData.mockClear();
      });

    test('Signup should call query onces', async () => {
        signUp("test", "123", 0)
        expect(helpers.query).toHaveBeenCalledTimes(1);
      });

      test('two signup should call query twices', async () => {
        signUp("test", "123", 0)
        signUp("test1", "123", 0)
        expect(helpers.query).toHaveBeenCalledTimes(2);
      });

      test('Return true if insertet correct', async () => {
        let res ={error:""}
        res.error = true
        helpers.query.mockReturnValueOnce(false).mockReturnValueOnce(true);
        
        expect(await signUp("test", "123", 0)).toStrictEqual(res);
      });

      
   
   
});

describe("Login test", () => {
    beforeEach(async () => {
        helpers.query.mockClear();
        publishFn.mockClear();
      });

   
    test('Login should call query onces', async () => {
        login("test", "123")
        expect(helpers.query).toHaveBeenCalledTimes(1);
        }
    );
    test('two login should call query twices', async () => {
        login("test", "123")
        login("test1", "123")
        expect(helpers.query).toHaveBeenCalledTimes(2);
        }
    );
    test('Return token if login correct', async () => {
        let res ={rank:0,token:""}
        res.token = jwt.sign({
            uid: 1,
        }, REFRESH_SECRET, {
            issuer: "",
        });
        helpers.query.mockReturnValueOnce( [{id: 1, rank: 0, password: await bcrypt.hash("123", 10)}]);
        expect(await login("test", "123")).toStrictEqual(res);
    });

    test('Return false if password incorrect', async () => {
        let res = {token:""}
        res.token = false
    

        helpers.query.mockReturnValueOnce( {id: 1, rank: 0, password: "124"});
        expect(await login("test", "123")).toStrictEqual(res);
    });

    test('Return false if user is not created', async () => {
        let res ={token:""}
        res.token=false
       
        helpers.query.mockReturnValueOnce( false);
        expect(await login("test", "123")).toStrictEqual(res);
    });

    test('Return false - only username ', async () => {
        let res ={token:""}
        res.token=false
       
        helpers.query.mockReturnValueOnce( false);
        expect(await login("test")).toStrictEqual(res);
    });


});


describe("Accestoken test",()  => {
   
    test('Will return accestoken',  async ()=> {
       
        let ret ={refreshToken:false}  
        ret.refreshToken = jwt.sign({
            uid: 1,
            rank: 0,
            solverLimit: 4,
        }, helpers.SECRET, {
            expiresIn: 60 * 15, // 15 minutes
            issuer: "",
        });
        helpers.getTokenData.mockReturnValueOnce({uid: 1});
        helpers.query.mockReturnValueOnce( [{id: 1, rank: 0, solverLimit:4 }]);
        expect(await generateAccessToken("token")).toBe(ret);
    });
});