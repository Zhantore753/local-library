let Book = require('../models/book');
let Author = require('../models/author');
let Genre = require('../models/genre');
let BookInstance = require('../models/bookinstance');
const { body,validationResult } = require('express-validator');

let async = require('async');

exports.index = function(req, res) {

    async.parallel({
        book_count: function(callback) {
            Book.countDocuments({}, callback); // Pass an empty object as match condition to find all documents of this collection
            // countDocuments не работает, работает только просто count
        },
        book_instance_count: function(callback) {
            BookInstance.countDocuments({}, callback);
        },
        book_instance_available_count: function(callback) {
            BookInstance.countDocuments({status:'Available'}, callback);
        },
        author_count: function(callback) {
            // console.log(callback.toString());
            Author.countDocuments({}, callback);
        },
        genre_count: function(callback) {
            Genre.countDocuments({}, callback);
        }
    }, function(err, results) {
        res.render('index', { title: 'Local Library Home', error: err, data: results });
    });
};

exports.book_list = function(req, res, next) {
    Book.find({}, 'title author')
    .populate('author')
    .exec(function (err, list_books) {
        if (err) { return next(err); }
        //Successful, so render
        res.render('book_list', { title: 'Book List', book_list: list_books });
    });
};

exports.book_detail = function(req, res, next) {
    async.parallel({
        book: function(callback) {
            Book.findById(req.params.id)
              .populate('author')
              .populate('genre')
              .exec(callback);
        },
        book_instance: function(callback) {
          BookInstance.find({ 'book': req.params.id })
          .exec(callback);
        },
    }, function(err, results) {
        if (err) { return next(err); }
        if (results.book==null) { // No results.
            let err = new Error('Book not found');
            err.status = 404;
            return next(err);
        }
        // Successful, so render.
        res.render('book_detail', { title: results.book.title, book: results.book, book_instances: results.book_instance } );
    });
};

exports.book_create_get = function(req, res, next) {
    // Get all authors and genres, which we can use for adding to our book.
    async.parallel({
        authors: function(callback) {
            Author.find(callback);
        },
        genres: function(callback) {
            Genre.find(callback);
        },
    }, function(err, results) {
        if (err) { return next(err); }
        res.render('book_form', { title: 'Create Book', authors: results.authors, genres: results.genres });
    });
};

exports.book_create_post = [
    // Convert the genre to an array.
    (req, res, next) => {
        if(!(req.body.genre instanceof Array)){
            if(typeof req.body.genre ==='undefined')
            req.body.genre = [];
            else
            req.body.genre = new Array(req.body.genre);
        }
        next();
    },
    // Validate and sanitise fields.
    body('title', 'Title must not be empty.').trim().isLength({ min: 1 }).escape(),
    body('author', 'Author must not be empty.').trim().isLength({ min: 1 }).escape(),
    body('summary', 'Summary must not be empty.').trim().isLength({ min: 1 }).escape(),
    body('isbn', 'ISBN must not be empty').trim().isLength({ min: 1 }).escape(),
    body('genre.*').escape(),
    // Process request after validation and sanitization.
    (req, res, next) => {
        // Extract the validation errors from a request.
        const errors = validationResult(req);
        // Create a Book object with escaped and trimmed data.
        let book = new Book({ 
            title: req.body.title,
            author: req.body.author,
            summary: req.body.summary,
            isbn: req.body.isbn,
            genre: req.body.genre
        });
        if (!errors.isEmpty()) {
            // There are errors. Render form again with sanitized values/error messages.
            // Get all authors and genres for form.
            async.parallel({
                authors: function(callback) {
                    Author.find(callback);
                },
                genres: function(callback) {
                    Genre.find(callback);
                },
            }, function(err, results) {
                if (err) { return next(err); }
                // Mark our selected genres as checked.
                for (let i = 0; i < results.genres.length; i++) {
                    if (book.genre.indexOf(results.genres[i]._id) > -1) {
                        results.genres[i].checked='true';
                    }
                }
                res.render('book_form', { title: 'Create Book',authors:results.authors, genres:results.genres, book: book, errors: errors.array() });
            });
            return;
        }
        else {
            // Data from form is valid. Save book.
            book.save(function (err) {
                if (err) { return next(err); }
                //successful - redirect to new book record.
                res.redirect(book.url);
            });
        }
    }
];

exports.book_delete_get = function(req, res, next) {
    async.parallel({
        book: function(callback) {
            Book.findById(req.params.id)
              .populate('author')
              .populate('genre')
              .exec(callback);
        },
        book_instance: function(callback) {
          BookInstance.find({ 'book': req.params.id }).exec(callback);
        },
    }, function(err, results){
        if(err){return next(err)}
        if(results.book == null){
            res.redirect('/catalog/books');
        }
        console.log(results.book_instance);
        res.render('book_delete', { title: 'Delete Book', book: results.book, book_instance: results.book_instance } );
    });
};

exports.book_delete_post = function(req, res, next) {
    async.parallel({
        book: function(callback) {
            Book.findById(req.body.bookid)
              .populate('author')
              .populate('genre')
              .exec(callback);
        },
        book_instance: function(callback) {
          BookInstance.find({ 'book': req.body.bookid }).exec(callback);
        },
    }, function(err, results) {
        if (err) { return next(err); }
        // Success
        if (results.book_instance.length > 0) {
            // Автор книги. Визуализация выполняется так же, как и для GET route.
            res.render('book_delete', { title: 'Delete Book', book: results.book, book_instance: results.book_instance } );
            return;
        }
        else {
            console.log(req.body.bookid);
            //У автора нет никаких книг. Удалить объект и перенаправить в список авторов.
            Book.findByIdAndRemove(req.body.bookid, function deleteBook(err) {
                if (err) { return next(err); }
                // Успех-перейти к списку авторов
                res.redirect('/catalog/books')
            })
        }
    });
};

exports.book_update_get = function(req, res) {
    res.send('NOT IMPLEMENTED: Book update GET');
};

exports.book_update_post = function(req, res) {
    res.send('NOT IMPLEMENTED: Book update POST');
};