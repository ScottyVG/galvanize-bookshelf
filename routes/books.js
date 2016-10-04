'use strict';
const knex = require('../knex');
const express = require('express');
const humps = require('humps');
// eslint-disable-next-line new-cap
const router = express.Router();

router.get('/books', (req, res) => {
  knex('books')
    .orderBy('title')
    .then((books) => {
      res.send(humps.camelizeKeys(books));
    });
});

router.get('/books/:id', (req, res) => {
  knex('books')
    .where('id', req.params.id)
    .first()
    .then((book) => {
      res.send(humps.camelizeKeys(book))
    })
    .catch((err) => {
      next(err);
    });
});

router.post('/books', (req, res, next) => {
  knex('books')
    .insert(humps.decamelizeKeys({
      title: req.body.title,
      author: req.body.author,
      genre: req.body.genre,
      description: req.body.description,
      cover_url: req.body.coverUrl
    }))
    .returning('*')
    .then((books) => {
      res.send(humps.camelizeKeys(books[0]));
    });
})

router.patch('/books/:id', (req, res, next) => {
  knex('books')
    .where('id', req.params.id)
    .first()
    .then((book) => {
      if (!book) {
        return next();
      }
      const {
        title,
        author,
        genre,
        description,
        coverUrl
      } = req.body;
      const updateBook = {}
      if (title) {
        updateBook.title = req.body.title;
      }
      if (author) {
        updateBook.author = req.body.author;
      }
      if (genre) {
        updateBook.genre = req.body.genre;
      }
      if (description) {
        updateBook.description = req.body.description;
      }
      if (coverUrl) {
        updateBook.coverUrl = req.body.coverUrl;
      }
      return knex('books')
        .update(humps.decamelizeKeys(updateBook))
        .returning('*')
        .where('id', req.params.id);
    })
    .then((books) => {
      res.send(humps.camelizeKeys(books[0]));
    })
    .catch((err) => {
      next(err);
    });
});

router.delete('/books/:id', (req, res, next) => {
  let book;
  knex('books')
    .where('id', req.params.id)
    .first()
    .then((row) => {
      if (!row) {
        return next();
      }
      book = humps.camelizeKeys(row);
      return knex('books')
        .del()
        .where('id', req.params.id);
    })
    .then(() => {
      delete book.id;
      res.send(book);
    })
    .catch((err) => {
      next(err);
    });
});

module.exports = router;
