const express = require('express'); 
const router = express.Router();
const gravatar = require('gravatar'); 
const bcrypt = require('bcryptjs'); 
const {check, validationResult} = require('express-validator');

const User = require('../../models/User'); 

// @route POST api/users
// @desc Test route
// @ access
router.post('/', [
    check('name', 'Name is required')
        .not()
        .isEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check(
        'password', 
        'Please enter a valid password with 6 or more characters'
    ).isLength({ min: 6 })
] , async (req, res) =>{
    const errors = validationResult(req); 
    if (!errors.isEmpty()){
        return res.status(400).json({ errors: errors.array()}); 
    }

    const { name, email, password } = req.body; 
    try{
        // See if the user exists
        let use = await User.findOne({ email }); 
        if(user){
            res.status(400).json({ errors: [{ msg: 'User already exists'}]}); 
        }
        // Get the users gravatar
        const avatar = gravatar.url(email, {
            s: '200',
            r: 'pg', 
            d: 'mm'
        }); 

        user = new User({
            name, 
            email,
            avatar, 
            password
        });
        // Encrypt the password

        // Return the jsonwebtoken
        res.send('User route')
    }catch(err){
        console.error(err.message); 
        res.status(500).send('Server Error'); 
    }
    
}); 

module.exports = router; 