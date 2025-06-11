// Routes
app.use('/api/users', require('./routes/user.routes'));
app.use('/api/subjects', require('./routes/subject.routes'));
app.use('/api/exams', require('./routes/exam.routes')); 