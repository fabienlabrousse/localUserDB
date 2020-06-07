const {ACCESS_TOKEN_SECRET} = require('./const');

exports.validateToken = function(req, res, next){
    var token = req.headers['x-access-token'];
    if (!token) return res.status(401).send({ auth: false, message: 'No token provided.' });


    let payload;
    try{
        //use the jwt.verify method to verify the access token
        //throws an error if the token has expired or has a invalid signature
        payload = jwt.verify(token, ACCESS_TOKEN_SECRET);
        //check if the user exist maybe with the payload ? Roles ?
        next();
    }
    catch(e){
        //if an error occured return request unauthorized error
        return res.status(401).send();
    }
};
