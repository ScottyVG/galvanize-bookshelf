'use strict';
const bcrypt = require('bcrypt-as-promised');
const boom = require('boom');
const express = require('express');
const jwt = require('jsonwebtoken');
const knex = require('../knex');
const humps = require('humps');

// eslint-disable-next-line new-cap
const router = express.Router();

router.get('/token', (req, res) => {
  const accessToken = req.cookies.accessToken;

  jwt.verify(accessToken, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.send(false);
    }
    res.send(true);
  });
});

router.post('/token', (req, res, next) => {
  const {
    email,
    password
  } = req.body;

  if (!email || !email.trim()) {
    return next(boom.create(400, 'Email must not be blank'));
  }
  if (!password) {
    return next(boom.create(400, 'Password must not be blank'));
  }
  if (password.length < 8) {
    return next(boom.create(400, 'Password must be 8 characters long'));
  }
  let user;
  knex('users')
    .where('email', email)
    .first()
    .then((row) => {
      if (!row) {
        throw boom.create(400, 'Bad email or password')
      }
      user = humps.camelizeKeys(row);
      return bcrypt.compare(password, user.hashedPassword);
    })
    .then(() => {
      delete user.hashedPassword;
      // set to 3 hours for a user session
      const expiry = new Date(Date.now() + 1000 * 60 * 60 * 3);
      const token = jwt.sign({
        userId: user.id
      }, process.env.JWT_SECRET, {
        expiresIn: '3h'
      });
      res.cookie('accessToken', token, {
        httpOnly: true,
        expires: expiry,
        secure: router.get('env') === 'production'
      });
      res.send(user);
    })
    .catch(bcrypt.MISMATCH_ERROR, () => {
      throw boom.create(400, 'Bad email or password')
    })
    .catch((err) => {
      next(err);
    });
});

router.delete('/token', (req, res) => {
  res.clearCookie('accessToken');
  res.send(true);
});

module.exports = router;
