'use strict';

const knex = require('../knex');
const express = require('express');
const humps = require('humps');
const bcrypt = require('bcrypt');

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
        .insert(humps.decamelizeKey(insertNewUser), '*')
      res.send(humps.camelizeKeys(insertNewUsers))
    })
    .then((rows) => {
      let user = humps.camelizeKeys(rows[0]);
      delete user.hashedPassword;
      req.session.userId = user.id;
      res.send(user)
    })
})

module.exports = router;
