const express = require('express');
const path = require('path');
const Joi = require('joi');
const mongoose = require('mongoose');
const app = express();
const port = process.env.PORT || 8000;
app.use(express.json());

mongoose.connect('mongodb://localhost/test4app');
let db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => console.log('mongodb connection successful!'));

const taskSchema = mongoose.Schema({
  title: String,
  description: String,
  completed: Boolean
}, { timestamps: true });
const Task = mongoose.model('Task', taskSchema);

app.get('/', (req, res) => {
  res.send('hello world');
});

// GET all tasks
app.get('/api/tasks', (req, res) => {
  Task.find((err, tasks) => {
    if (err) res.status(404).send(`Tasks not found`);
    res.send(tasks);
  })
});

// GET task by id
app.get('/api/tasks/:id', (req, res) => {
  Task.find({ _id: req.params.id }, (err, task) => {
    if (err) res.status(404).send(`Task not found`);
    res.send(task);
  });
})

// POST new task
app.post('/api/tasks', (req, res) => {
  // if errors, return 400 - bad request along with reason for error
  const { error } = validateTask(req.body);
  if (error) {
    return res.status(400).send(`Bad Request: ${error.details[0].message}`);
  }

  // write new task to database
  const task = new Task(req.body);
  task.save((err, task) => {
    if (err) res.status(500).send('Internal server error');
    res.send(task);
  });
});

// PUT new task
app.put('/api/tasks/:id', (req, res) => {
  // validate user input first
  const { error } = validateTask(req.body);
  if (error) {
    return res.status(400).send(`Bad Request: ${error.details[0].message}`)
  }

  Task.findByIdAndUpdate(req.params.id, req.body, { new: true }, (err, task) => {
    if (err) return res.status(404).send(`Task not found`);
    res.send(task);
  });
});

app.delete('/api/tasks/:id', (req, res) => {
  Task.findById(req.params.id, (err, task) => {
    if (err) return res.status(404).send(`404: Resource not found`);
    Task.deleteOne(task, (err) => {
      if (err) return res.status(500).send(`Internal server error`);
      res.send(task);
    })
  })
});

// validate task input
function validateTask(task) {
  const schema = {
    title: Joi.string().min(2).required(),
    description: Joi.string().min(2).required(),
    completed: Joi.boolean()
  }
  return Joi.validate(task, schema);
}

app.get('/*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(port, () => console.log(`running on port ${port}`));
