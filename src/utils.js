function logErrors (err, req, res, next) {
    console.error(err.stack);
    next(err);
}

function errorHandler (err, req, res, next) {
    const msg = err.message;
    res.status(500).send(msg);
}


export {
    logErrors,
    errorHandler
};