/**
 * Input validation middleware
 */
const validateJobUpload = (req, res, next) => {
  const { title, description } = req.body;
  
  if (!title || typeof title !== 'string' || title.trim().length < 3) {
    return res.status(400).json({ error: 'Job title must be at least 3 characters long' });
  }
  
  if (!description || typeof description !== 'string' || description.trim().length < 10) {
    return res.status(400).json({ error: 'Job description must be at least 10 characters long' });
  }
  
  if (title.length > 100) {
    return res.status(400).json({ error: 'Job title cannot exceed 100 characters' });
  }
  
  if (description.length > 5000) {
    return res.status(400).json({ error: 'Job description cannot exceed 5000 characters' });
  }
  
  next();
};

const validateRegistration = (req, res, next) => {
  const { email, password, role, name } = req.body;
  
  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Valid email is required' });
  }
  
  if (!password || password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long' });
  }
  
  if (!role || !['user', 'job_poster', 'admin', 'interviewer'].includes(role)) {
    return res.status(400).json({ error: 'Valid role is required' });
  }
  
  if (name && name.length > 50) {
    return res.status(400).json({ error: 'Name cannot exceed 50 characters' });
  }
  
  next();
};

module.exports = {
  validateJobUpload,
  validateRegistration
};