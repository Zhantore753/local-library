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

exports.genre_delete_get = function(req, res) {
    res.send('NOT IMPLEMENTED: Genre delete GET');
};

exports.genre_delete_post = function(req, res) {
    res.send('NOT IMPLEMENTED: Genre delete POST');
};

exports.genre_update_get = function(req, res) {
    res.send('NOT IMPLEMENTED: Genre update GET');
};

exports.genre_update_post = function(req, res) {
    res.send('NOT IMPLEMENTED: Genre update POST');
};