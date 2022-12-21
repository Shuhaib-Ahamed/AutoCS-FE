const User = require('../models/User');
const encryption = require('../utilities/encryption');


module.exports = {
    register: {
        post: (req, res) => {
            let userData = req.body;
            console.log(userData)
            return res.status(200).send({ message: `NodeJS => User ${userData.name} registered!`});
        }, 
    },
    login: {
        post: (req, res) => {
            let userData = req.body;
            console.log(userData)
            //check credentials
            let respData = {
                message: `NodeJS => User ${userData.name} authorized!`,
                isAuthenticated: true
            };
            return res.status(200).send(respData);
        },
    },
    logout: (req, res) => {
        return res.status(200).send({ message: 'NodeJS => Server responce for Logout Operation!' });
    }
};