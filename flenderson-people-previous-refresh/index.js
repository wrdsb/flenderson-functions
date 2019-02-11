module.exports = function (context, req) {

    // Overwrite previous files with now files
    context.bindings.peoplePreviousArray = context.bindings.peopleNowArray;
    context.bindings.peoplePreviousObject = context.bindings.peopleNowObject;

    context.done();
};