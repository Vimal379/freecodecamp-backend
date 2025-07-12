require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const { Schema } = mongoose;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Connect to MongoDB Atlas
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Schemas
const userSchema = new Schema({ username: { type: String, required: true } });
const exerciseSchema = new Schema({
  userId: String,
  description: String,
  duration: Number,
  date: Date
});

const User = mongoose.model('User', userSchema);
const Exercise = mongoose.model('Exercise', exerciseSchema);


app.get('/', (_, res) => {
  res.sendFile(__dirname + '/views/index.html');
});


app.post('/api/users', async (req, res) => {
  try {
    const user = new User({ username: req.body.username });
    const saved = await user.save();
    res.json({ username: saved.username, _id: saved._id });
  } catch {
    res.status(500).send('User creation failed');
  }
});


app.get('/api/users', async (_, res) => {
  const users = await User.find({}, 'username _id');
  res.json(users);
});


app.post('/api/users/:_id/exercises', async (req, res) => {
  const { description, duration, date } = req.body;
  const userId = req.params._id;

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const exercise = new Exercise({
      userId,
      description,
      duration: parseInt(duration),
      date: date ? new Date(date) : new Date()
    });

    const saved = await exercise.save();

    res.json({
      _id: user._id,
      username: user.username,
      date: saved.date.toDateString(),
      duration: saved.duration,
      description: saved.description
    });
  } catch {
    res.status(500).json({ error: 'Exercise creation failed' });
  }
});


app.get('/api/users/:_id/logs', async (req, res) => {
  const { from, to, limit } = req.query;
  const userId = req.params._id;

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    let filter = { userId };
    if (from || to) {
      filter.date = {};
      if (from) filter.date.$gte = new Date(from);
      if (to) filter.date.$lte = new Date(to);
    }

    const exercises = await Exercise.find(filter).limit(parseInt(limit) || 500);
    const log = exercises.map(e => ({
      description: e.description,
      duration: e.duration,
      date: e.date.toDateString()
    }));

    res.json({
      _id: user._id,
      username: user.username,
      count: log.length,
      log
    });
  } catch {
    res.status(500).json({ error: 'Log retrieval failed' });
  }
});


const listener = app.listen(process.env.PORT || 3000, () => {
  console.log(' App listening on port ' + listener.address().port);
});
