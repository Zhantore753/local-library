// Модуль(файл) модели Автора

let mongoose = require('mongoose');

let Schema = mongoose.Schema;

// Схема модели автора
// Определяем схему
let AuthorSchema = new Schema({
    first_name: {type: String, required: true, maxlength: 100},
    family_name: {type: String, required: true, maxlength: 100},
    date_of_birth: {type: Date},
    date_of_death: {type: Date},
});
//required обязательное поле

// Виртуальный объект - это свойство, которое не хранится в MongoDB
// Виртуальное свойство для полного имени автора
AuthorSchema
.virtual('name') // создаем виртульно свойство name которое составляется из Имени и Фамиилии
.get(function () {
    return this.family_name + ', ' + this.first_name;
});

// Виртуальное свойство - URL автора
AuthorSchema
.virtual('url') // создаем виртульно свойтсво url для формирование url строки с помощью id автора
.get(function () {
    return '/catalog/author/' + this._id;
});

//Export model
module.exports = mongoose.model('Author', AuthorSchema);