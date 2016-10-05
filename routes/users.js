'use strict';

const knex = require('../knex');
const express = require('express');
const humps = require('humps');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// eslint-disable-next-line new-cap
const router = express.Router();

router.post('/users', (req, res, next) => {
  let {
    email,
    password
  } = req.body;
  knex('users')
    .where('email', req.body.email)
    .first()
    .then(() => {
      return bcrypt.hashSync(req.body.password, 12);
    })
    .then((hashedPassword) => {
      let {
        firstName,
        lastName
      } = req.body;
      let insertNewUser = {
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: req.body.email,
        hashedPassword: hashedPassword
      }
      return knex('users')
        .insert(humps.decamelizeKeys(insertNewUser), '*')
      res.send(humps.camelizeKeys(insertNewUser))
    })
    .then((rows) => {
      let user = humps.camelizeKeys(rows[0]);

      delete user.hashedPassword;

      // session expiration
      let expiration = new Date(Date.now() + 1000 * 60 * 60 * 3);
      let token = jwt.sign({
        userId: user.id
      }, process.env.JWT_SECRET, {
        expiresIn: '3h'
      });

      res.cookie('accessToken', token, {
        httpOnly: true,
        expires: expiration,
        secure: router.get('env') === 'production'
      });

      res.send(user);
    })
    .catch((err) => {
      next(err);
    });
})

module.exports = router;
