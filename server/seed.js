require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Import Models
const User = require('./models/User');
const CompanyProfile = require('./models/CompanyProfile');
const Job = require('./models/Job');
const Course = require('./models/Course');

// Connect to Database
mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/campus_recruit')
  .then(() => console.log('Connected to MongoDB for seeding'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

const seedData = async () => {
  try {
    console.log('🧹 Clearing existing Jobs and Courses...');
    await Job.deleteMany({});
    await Course.deleteMany({});

    // 1. Create/Find a Dummy Company User (Required for Company Profile)
    const seedCompanyEmail = 'recruiter@techcorp.com';
    let companyUser = await User.findOne({ email: seedCompanyEmail });

    if (!companyUser) {
      console.log('👤 Creating seed company user...');
      companyUser = await User.create({
        name: 'Tech Corp Recruiter',
        email: seedCompanyEmail,
        password: 'Recruiter@123',
        role: 'company',
        isVerified: true
      });
    }

    // 1b. Create/Find a Demo Student User
    const seedStudentEmail = 'student@test.com';
    let studentUser = await User.findOne({ email: seedStudentEmail });

    if (!studentUser) {
      console.log('👤 Creating seed student user...');
      studentUser = await User.create({
        name: 'Demo Student',
        email: seedStudentEmail,
        password: 'Student@123',
        role: 'student',
        course: 'B.Tech Computer Science',
        isVerified: true
      });
    }

    // 2. Create/Find Company Profile (Required for Jobs)
    let companyProfile = await CompanyProfile.findOne({ user: companyUser._id });
    if (!companyProfile) {
      console.log('🏢 Creating company profile...');
      companyProfile = await CompanyProfile.create({
        user: companyUser._id,
        companyName: 'Tech Corp',
        description: 'Leading innovator in AI and Cloud Computing solutions.',
        website: 'https://techcorp.example.com',
        location: 'San Francisco, CA',
        industry: 'Technology',
        logo: 'https://via.placeholder.com/150?text=Tech+Corp'
      });
    }

    // 3. Seed Jobs
    console.log('💼 Seeding Jobs...');
    const jobs = [
      {
        company: companyProfile._id,
        postedBy: companyUser._id,
        title: 'Frontend Developer',
        description: 'We are looking for a skilled React developer to join our team and build responsive web applications.',
        requirements: ['React', 'Tailwind CSS', 'JavaScript', '2+ years experience'],
        salary: '$80,000 - $110,000',
        location: 'Remote',
        type: 'Full-time',
        status: 'Open',
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
      },
      {
        company: companyProfile._id,
        postedBy: companyUser._id,
        title: 'Backend Engineer',
        description: 'Join our backend team to build scalable APIs and microservices.',
        requirements: ['Node.js', 'MongoDB', 'Express', 'System Design'],
        salary: '$90,000 - $120,000',
        location: 'New York, NY',
        type: 'Full-time',
        status: 'Open',
        deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000)
      },
      {
        company: companyProfile._id,
        postedBy: companyUser._id,
        title: 'AI/ML Intern',
        description: 'Exciting internship opportunity for students interested in Artificial Intelligence and Machine Learning.',
        requirements: ['Python', 'PyTorch', 'Basic ML knowledge', 'Mathematics'],
        salary: '$30/hr',
        location: 'Austin, TX',
        type: 'Internship',
        status: 'Open',
        deadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000)
      }
    ];
    await Job.insertMany(jobs);

    // 4. Seed Courses
    console.log('📚 Seeding Courses...');
    const courses = [
      {
        title: 'Mastering React 2024',
        description: 'A comprehensive guide to building modern web apps with React, Hooks, and Redux.',
        instructor: 'Sarah Drasner',
        thumbnail: 'https://via.placeholder.com/300x200.png?text=React+Course',
        duration: '12 hours',
        level: 'Intermediate',
        tags: ['React', 'Frontend', 'Web Development'],
        price: 49.99,
        modules: [
          {
            title: 'Introduction to React',
            lessons: [
              { title: 'Why React?', type: 'video', content: 'https://www.youtube.com/embed/dQw4w9WgXcQ', duration: '10 min' },
              { title: 'Setting up the Environment', type: 'text', content: '## Setup Guide\n\n1. Install Node.js\n2. Run `npx create-react-app my-app`', duration: '15 min' }
            ]
          },
          {
            title: 'React Hooks',
            lessons: [
              { title: 'useState Hook', type: 'code', content: 'const [count, setCount] = useState(0);', duration: '20 min' },
              { title: 'useEffect Hook', type: 'text', content: 'The useEffect hook lets you perform side effects in function components.', duration: '15 min' }
            ]
          }
        ]
      },
      {
        title: 'Node.js for Beginners',
        description: 'Learn the basics of Node.js, Express, and building RESTful APIs from scratch.',
        instructor: 'Andrew Mead',
        thumbnail: 'https://via.placeholder.com/300x200.png?text=Node.js+Course',
        duration: '8 hours',
        level: 'Beginner',
        tags: ['Node.js', 'Backend', 'JavaScript'],
        price: 29.99,
        modules: [
          {
            title: 'Getting Started',
            lessons: [
              { title: 'What is Node.js?', type: 'video', content: 'https://www.youtube.com/embed/dQw4w9WgXcQ', duration: '5 min' }
            ]
          }
        ]
      },
      {
        title: 'System Design Interview Prep',
        description: 'Crack your system design interviews with ease. Learn about scalability, load balancing, and database design.',
        instructor: 'Gaurav Sen',
        thumbnail: 'https://via.placeholder.com/300x200.png?text=System+Design',
        duration: '15 hours',
        level: 'Advanced',
        tags: ['System Design', 'Architecture', 'Interview'],
        price: 79.99,
        modules: []
      }
    ];
    await Course.insertMany(courses);

    console.log('✅ Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    process.exit(1);
  }
};

seedData();