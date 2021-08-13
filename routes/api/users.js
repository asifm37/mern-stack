const express = require('express');
const router = express.Router();
const config = require('config');
const User = require('../../models/User');
const gravatar = require('gravatar');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { check, validationResult } = require('express-validator');

// @route   POST api/users
// @desc    Register User
// @access  Public
router.post(
  '/',
  [
    check('name', 'Name is required').not().isEmpty(),
    check('email', 'Please include email').isEmail(),
    check(
      'password',
      'Please enter a password with 6 or more characters'
    ).isLength({ min: 6 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password } = req.body;

    try {
      // Check If User Exists
      let foundUser = await User.findOne({ email });
      if (foundUser) {
        return res
          .status(400)
          .json({ errors: [{ msg: 'User Already Exists' }] });
      }

      // Get Avatar
      const avatar = gravatar.url(email, { s: 200, r: 'pg', d: 'mm' });

      //Create User Obj
      let user = new User({
        name,
        email,
        avatar,
        password,
      });

      // Encrypt The Password
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);

      //Save User to DB
      await user.save();

      //Return JWT Token
      const payload = {
        user: {
          id: user.id,
        },
      };
      jwt.sign(
        payload,
        config.get('jwtSecret'),
        { expiresIn: 36000000 },
        (err, token) => {
          if (err) throw err;
          res.json({ token });
        }
      );
      // res.send('User Creation is Successfull');
    } catch (err) {
      console.log(err);
      res.status(500).send('Server Error');
    }
  }
);

module.exports = router;
