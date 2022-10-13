const express = require('express');
const request = require('request'); 
const config = require('config');  
const router = express.Router(); 
const auth = require('../../middleware/auth');
const { check, validationResult } = require('express-validator'); 

const Profile = require('../../models/Profile'); 
const User = require('../../models/User'); 

// @route GET api/profile
// @desc Test route
// @ access
router.get('/me', auth, async(req, res) =>{
    try{
        const profile = await Profile.findOne({ user: req.user.id }).populate('user', ['name', 'avatar']); 
    
        if(!profile){
            return res.status(400).json({msg: 'There is no profile for this user'})
        }
    }catch(err){
        console.error(err.message);
        res.status(500).send('Server Error'); 
    }
}); 



// @route GET api/profile
// @desc Test route
// @ access
router.post('/', [
    check('status', 'Status is required')
        .not()
        .isEmpty(),
    check('skills', 'Skills is required')
        .not()
        .isEmpty()
], async (req, res) =>{
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({ errors: errors.array()});
    }

    const {
        company, 
        location,
        bio, 
        status,
        githubusername,
        website,
        skills,
        youtube,
        twitter,
        instagram,
        linkedin,
        facebook
      } = req.body;

      // Build profile object
      const profileFields = {}; 
      profileFields.user = req.user.id; 
      if(company) profileFields.company = company; 
      if(website) profileFields.website = website; 
      if(location) profileFields.location = location; 
      if(bio) profileFields.bio = bio; 
      if(status) profileFields.status = status; 
      if(githubusername) profileFields.githubusername = githubusername;
      if(skills){
        profileFields.skills = skills.split(',').map(skill => skill.trim()); 
      } 

      // Building the social fields object
      profileFields.social = {}; 
      if(youtube) profileFields.social.youtube = youtube; 
      if(twitter) profileFields.social.twitter = twitter; 
      if(facebook) profileFields.social.facebook = facebook; 
      if(linkedin) profileFields.social.linkedin = linkedin; 
      if(instagram) profileFields.social.instagram = instagram;
      
      
      try{
        let profile = await Profile.findOne({ user: req.user.id }); 

        if (profile){
            profile = await Profile.findOneAndUpdate(
                { user: req.user.id }, 
                { $set: profileFields }, 
                { new: true }
            );

            return res.json(profile); 

            // Create the new profile
            profile = new Profile(profileFields); 

            await Profile.save(); 
            res.json(profile);  
        }
      }catch(err){
        console.error(err.message); 
        res.status(500).send('Server error')
      }
    });
    // @route GET api/profile
    // @desc Test route
    // @ access
    router.get('/', async(req, res)=>{
        try{
            const profiles = await Profile.find().populate('user', ['name', 'avatar']); 
            res.json(profiles)
        }catch(err){
            console.error(err.message); 
            res.status(500).send('Server Error')
        }
    }); 

    // @route GET api/profile/user/:user_id
    // @desc Get profile by user ID
    // @ access 
    router.get('/user/:user_id', async(req, res)=>{
        try{
            const profile = 
                await Profile.findOne({ user: req.params.user_id })
                .populate('user', ['name', 'avatar']); 
            if(!profile) return res.status(400).json({ msg: 'There is no profile for this user'})
            res.json(profiles)
        }catch(err){
            console.error(err.message); 
            if (!mongoose.Types.ObjectId.isValid(req.params.user_id)){
                return res.status(400).json({ msg: 'Invalid ID' });
            }
            res.status(500).send('Server Error')
        }
    });

    // @route Delete api/profile
    // @desc Delete Profile, User, Posts
    // @ access Private
    router.get('/', async(req, res)=>{
        try{
            // @todo remove user posts

            // Remove Profile
            await Profile.findOneAndRemove({ user: req.user.id}); 

            // Remove user
            await User.findOneAndRemove({ _id: req.user.id}); 

            res.json({msg: 'User deleted'})
        }catch(err){
            console.error(err.message); 
            res.status(500).send('Server Error')
        }
    }); 

    // @route GET api/profile/user/:user_id
    // @desc Get profile by user ID
    // @ access
    router.put(
        '/experience', 
        [
            check('title', 'Title is required')
                .not()
                .isEmpty(),
            check('company', 'Company is required')
                .not()
                .isEmpty(),
            check('from', 'Start date is required')
                .not()
                .isEmpty(),
        ], 
        async(req, res)=>{
            const errors = validationResult(req); 
            if(!errors.isEmpty()){
                return res.status(400).json({ errors: errors.array()}); 
            }

            const {
                title,
                company, 
                location, 
                from, 
                to,
                current, 
                description
            } = req.body

            const newExp ={
                title,
                company, 
                location, 
                from, 
                to,
                current, 
                description
            }

            try{
                const profile = await Profile.findOne({ user: req.user.id }); 

                profile.experience.unshift(newExp);

                await profile.save(); 

                res.json(profile); 
            }catch(err){
                console.log(err.message); 
                res.status(500).send('Server Error'); 
            }
        }
    )

    // @route Delete api/profile/user/:experience_id
    // @desc Delete expereience by user ID
    // @ access
    router.delete('/experience/:exp_id', auth, async(req, res) =>{
        try{
            const profile = await Profile.findOne({ user: req.user.id }); 

            // remove index
            const removeIndex = profile.experience.map(item => item.id).indexOf(req.params.exp_id); 
            profile.experience.splice(removeIndex, 1); 
            await profile.save(); 
            res.json(profile); 
        }catch(err){
            console.log(err.message); 
            res.status(500).send('Server Error'); 
        }
    }); 
// @route    PUT api/profile/education
// @desc     Add profile education
// @access   Private
router.put(
    '/education',
    auth,
    check('school', 'School is required').notEmpty(),
    check('degree', 'Degree is required').notEmpty(),
    check('fieldofstudy', 'Field of study is required').notEmpty(),
    check('from', 'From date is required and needs to be from the past')
      .notEmpty()
      .custom((value, { req }) => (req.body.to ? value < req.body.to : true)),
    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
  
      try {
        const profile = await Profile.findOne({ user: req.user.id });
  
        profile.education.unshift(req.body);
  
        await profile.save();
  
        res.json(profile);
      } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
      }
    }
  );
  
  // @route    DELETE api/profile/education/:edu_id
  // @desc     Delete education from profile
  // @access   Private
  
  router.delete('/education/:edu_id', auth, async (req, res) => {
    try {
      const foundProfile = await Profile.findOne({ user: req.user.id });
      foundProfile.education = foundProfile.education.filter(
        (edu) => edu._id.toString() !== req.params.edu_id
      );
      await foundProfile.save();
      return res.status(200).json(foundProfile);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ msg: 'Server error' });
    }
  });

  // @route    DELETE api/profile/education/:edu_id
  // @desc     Delete education from profile
  // @access   Private
router.get('/github/:username', (req, res) =>{
    try{
        const options = {
            uri: `https://api.github.com/users/${req.params.username}/repos?per_page5&sort=created:asc&client_id=${config.get('githubClientId')}&client_secret=${config.get('githubSecret')}`, 
            method: 'GET', 
            headers: {'user-agent': 'node.js'}
        };

        request(options, (error, response, body) =>{
            if(error) console.error(error);

            if(response.statusCode !== 200){
                res.status(404).json({ msg: 'No github profile found'}); 
            }
        }); 
    }catch(err){
        console.error(error);
        return res.status(500).json({ msg: 'Server error' });
    }
})

module.exports = router; 