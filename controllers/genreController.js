let Book = require('../models/book');
let async = require('async');
let Genre = require('../models/genre');
const validator = require('express-validator');


exports.genre_list = function(req, res, next) {
    Genre.find()
    .sort([['name', 'ascending']])
    .exec(function (err, list_genre) {
        if (err) { return next(err); }
        //Successful, so render
        res.render('genre_list', { title: 'Genre List', genre_list: list_genre });
    });
};

exports.genre_detail = function(req, res, next) {
    async.parallel({
        genre: function(callback) {
            Genre.findById(req.params.id)
            .exec(callback);
        },

        genre_books: function(callback) {
            Book.find({ 'genre': req.params.id })
            .exec(callback);
        },

    }, function(err, results) {
        if (err) { return next(err); }
        if (results.genre==null) { // No results.
            let err = new Error('Genre not found');
            err.status = 404;
            return next(err);
        }
        // Successful, so render
        res.render('genre_detail', { title: 'Genre Detail', genre: results.genre, genre_books: results.genre_books } );
    });
};

// Отображение формы для создания Жанра
exports.genre_create_get = function(req, res, next) {
    res.render('genre_form', { title: 'Create Genre' });
};

// Обрабтка POST запроса от формы создания Жанра
exports.genre_create_post = [
    // В данном случае передается не функция, а массив с функциями и методами которые будут выполняться последовательно
    // Проверка на пустоту.
    validator.body('name', 'Genre name required').trim().isLength({ min: 1 }),
    // Создает дезинфицирующее средство для escape () любых опасных HTML-символов в поле имени.
    validator.sanitizeBody('name').escape(),
    // middlware для остальных проверок на валидность заполнения формы
    (req, res, next) => {
        // Extract the validation errors from a request.
        const errors = validator.validationResult(req);
        // Создаем новый экземляр Жанра(Схемы).
        let genre = new Genre(
            { name: req.body.name }
        );
        if (!errors.isEmpty()) {
            // Если error не пустой то в таком случае передаем ошибку и заново отображаем пустую форму
            res.render('genre_form', { title: 'Create Genre', genre: genre, errors: errors.array()});
            return;
        }
        else {
            // Сюда попадаем если форму валидна
            // Проверка на новизну данного жанра в БД
            Genre.findOne({ 'name': req.body.name })
            .exec( function(err, found_genre) {
                if (err) { return next(err); }
                if (found_genre) {
                    // Если жанр был найден то перенаправляем на страницу данного жанра.
                    res.redirect(found_genre.url);
                }
                // Если жанр не был найден создаем его
                else {
                    genre.save(function (err) {
                        if (err) { return next(err); }
                        // Сохраняем жанр. Перенапрляем на страницу этого жанра
                        res.redirect(genre.url);
                    });
                }
            });
        }
    }
];

exports.genre_delete_get = function(req, res,next) {
    Genre.findById(req.params.id)
    .exec(function (err, genre) {
        if (err) { return next(err); }
        if(genre == null){
            res.redirect('/catalog/genres');
        }
        //Successful, so render
        res.render('genre_delete', { title: 'Genre Delete', genre: genre });
    });
};

exports.genre_delete_post = function(req, res) {
    Genre.findById(req.body.genreid)
    .exec(function(err, genre){
        if (err) { return next(err); }
        Genre.findByIdAndRemove(req.body.genreid, function deleteGenre(err) {
            if (err) { return next(err); }
            // Успех-перейти к списку авторов
            res.redirect('/catalog/genres')
        })
    });
};

exports.genre_update_get = function(req, res, next) {
    Genre.findById(req.params.id, function(err, genre) {
        if (err) { return next(err); }
        if (genre==null) { // No results.
            var err = new Error('Genre not found');
            err.status = 404;
            return next(err);
        }
        // Success.
        res.render('genre_form', { title: 'Update Genre', genre: genre });
    });
};

exports.genre_update_post = [
    // Validate and sanitze the name field.
    validator.body('name', 'Genre name must contain at least 3 characters').trim().isLength({ min: 3 }).escape(),
    // Process request after validation and sanitization.
    (req, res, next) => {
        // Extract the validation errors from a request .
        const errors = validationResult(req);
    // Create a genre object with escaped and trimmed data (and the old id!)
        var genre = new Genre(
          {
          name: req.body.name,
          _id: req.params.id
          }
        );
        if (!errors.isEmpty()) {
            // There are errors. Render the form again with sanitized values and error messages.
            res.render('genre_form', { title: 'Update Genre', genre: genre, errors: errors.array()});
        return;
        }
        else {
            // Data from form is valid. Update the record.
            Genre.findByIdAndUpdate(req.params.id, genre, {}, function (err,thegenre) {
                if (err) { return next(err); }
                // Successful - redirect to genre detail page.
                res.redirect(thegenre.url);
            });
        }
    }
];