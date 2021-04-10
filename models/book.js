// Модуль(файл) модели Книги

let mongoose = require('mongoose');

let Schema = mongoose.Schema;

let BookSchema = new Schema({
    title: {type: String, required: true},
    author: {type: Schema.ObjectId, ref: 'Author', required: true}, // ссылка на единственный объект модели Author(Автор может быть только один)
    summary: {type: String, required: true},
    isbn: {type: String, required: true},
    genre: [{type: Schema.ObjectId, ref: 'Genre'}] // ссылка на массив объектов genre. Массив так как у книги может быть много жанров
});

// Виртуальное свойство - URL книги , по средствам id книги
BookSchema
.virtual('url') 
.get(function () {
    return '/catalog/book/' + this._id;
});

//Export model
module.exports = mongoose.model('Book', BookSchema);