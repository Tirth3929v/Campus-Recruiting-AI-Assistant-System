const { GoogleGenerativeAI } = require('@google/generative-ai');
const mongoose = require('mongoose');
const AIInterviewSession = require('../models/AIInterviewSession');

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'your-gemini-api-key');

const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

// Generate interview questions based on focus areas and difficulty
exports.generateQuestions = async (req, res) => {
  try {
    const { focusAreas, difficulty, jobId } = req.body;
    const userId = req.user.id;

    // Build prompt based on focus areas
    const focusAreasText = focusAreas?.length > 0
      ? focusAreas.join(', ')
      : 'JavaScript, React, Problem Solving';

    const difficultyText = difficulty || 'Medium';
    const questionCount = difficultyText === 'Easy' ? 3 : difficultyText === 'Hard' ? 8 : 5;

    const prompt = `Generate ${questionCount} interview questions for a candidate with focus on: ${focusAreasText}. 
    Difficulty level: ${difficultyText}.
    
    Return ONLY a JSON array with objects containing:
    - "question": the interview question text
    - "questionCategory": one of [Technical, Behavioral, ProblemSolving, General]
    - "expectedKeywords": array of 3-5 keywords that a good answer should contain
    
    Example format:
    [{"question": "...", "questionCategory": "Technical", "expectedKeywords": ["keyword1", "keyword2"]}]
    
    Do not include any other text, just the JSON array.`;

    const result = await model.generateContent(prompt);
    const response = result.response.text();

    // Parse the JSON response
    let questions;
    try {
      // Try to extract JSON from response
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        questions = JSON.parse(jsonMatch[0]);
      } else {
        questions = JSON.parse(response);
      }
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', parseError);
      // Fallback to default questions
      questions = getDefaultQuestions(focusAreasText);
    }

    // Validate jobId is a valid ObjectId
    const validJobId = mongoose.Types.ObjectId.isValid(jobId) ? jobId : null;

    // Create interview session in database
    const interviewSession = new AIInterviewSession({
      user: userId,
      job: validJobId,
      sessionType: 'Practice',
      difficulty: difficultyText,
      focusAreas: focusAreas || ['JavaScript', 'Problem Solving'],
      questions: questions.map(q => ({
        question: q.question,
        questionCategory: q.questionCategory || 'Technical',
        userAnswer: '',
        aiEvaluation: {
          score: 0,
          feedback: '',
          strengths: [],
          improvements: [],
          keywordsFound: []
        },
        timeTaken: 0
      })),
      status: 'NotStarted',
      startedAt: new Date()
    });

    await interviewSession.save();

    res.status(200).json({
      success: true,
      sessionId: interviewSession._id,
      questions: interviewSession.questions.map((q, index) => ({
        id: index + 1,
        question: q.question,
        category: q.questionCategory
      }))
    });

  } catch (error) {
    console.error('Generate Questions Error:', error);
    res.status(500).json({
      message: 'Failed to generate questions',
      error: error.message
    });
  }
};

// Evaluate a single answer
exports.evaluateAnswer = async (req, res) => {
  try {
    const { sessionId, questionIndex, userAnswer } = req.body;

    const session = await AIInterviewSession.findById(sessionId);
    if (!session) {
      return res.status(404).json({ message: 'Interview session not found' });
    }

    const question = session.questions[questionIndex];
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    // Get expected keywords from the question (we'll use a simple evaluation)
    const prompt = `You are an expert technical interviewer. Evaluate the candidate's answer to this question:

Question: ${question.question}
Candidate's Answer: ${userAnswer}

Provide a JSON response with:
{
  "score": (0-100),
  "feedback": "short constructive feedback",
  "strengths": ["strength1", "strength2"],
  "improvements": ["improvement1"],
  "keywordsFound": ["keyword1", "keyword2"]
}

Only respond with valid JSON, no other text.`;

    const result = await model.generateContent(prompt);
    const response = result.response.text();

    let evaluation;
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        evaluation = JSON.parse(jsonMatch[0]);
      } else {
        evaluation = JSON.parse(response);
      }
    } catch (parseError) {
      // Fallback evaluation
      evaluation = {
        score: 50,
        feedback: 'Your answer has been recorded. Please continue to the next question.',
        strengths: ['Answer submitted'],
        improvements: ['Consider adding more details'],
        keywordsFound: []
      };
    }

    // Update the question with evaluation
    session.questions[questionIndex].userAnswer = userAnswer;
    session.questions[questionIndex].aiEvaluation = {
      score: evaluation.score || 0,
      feedback: evaluation.feedback || '',
      strengths: evaluation.strengths || [],
      improvements: evaluation.improvements || [],
      keywordsFound: evaluation.keywordsFound || []
    };

    // Calculate overall score so far
    const answeredQuestions = session.questions.filter(q => q.userAnswer);
    if (answeredQuestions.length > 0) {
      session.overallScore = Math.round(
        answeredQuestions.reduce((sum, q) => sum + (q.aiEvaluation?.score || 0), 0) / answeredQuestions.length
      );
    }

    await session.save();

    res.status(200).json({
      success: true,
      evaluation: session.questions[questionIndex].aiEvaluation,
      overallScore: session.overallScore,
      progress: {
        current: questionIndex + 1,
        total: session.questions.length
      }
    });

  } catch (error) {
    console.error('Evaluate Answer Error:', error);
    res.status(500).json({ message: 'Failed to evaluate answer', error: error.message });
  }
};

// Submit the complete interview session
exports.submitSession = async (req, res) => {
  try {
    const { sessionId, videoUrl, screenUrl } = req.body;

    const session = await AIInterviewSession.findById(sessionId);
    if (!session) {
      return res.status(404).json({ message: 'Interview session not found' });
    }

    // Update session with recordings if provided
    if (videoUrl) session.videoRecordingUrl = videoUrl;
    if (screenUrl) session.screenRecordingUrl = screenUrl;

    session.status = 'Completed';
    session.completedAt = new Date();

    // Calculate total time
    if (session.startedAt) {
      session.totalTimeTaken = Math.round((session.completedAt - session.startedAt) / 1000);
    }

    // Generate overall feedback
    const prompt = `Provide a summary feedback for a candidate who completed an interview with these results:

Total Score: ${session.overallScore}%

Questions Answered: ${session.questions.length}

${session.questions.map((q, i) => `Q${i + 1}: ${q.question.substring(0, 50)}... - Score: ${q.aiEvaluation?.score || 0}%`).join('\n')}

Return a JSON with:
{
  "overallFeedback": "comprehensive feedback paragraph",
  "keyStrengths": ["strength1", "strength2", "strength3"],
  "areasForImprovement": ["area1", "area2"],
  "recommendedNextSteps": ["step1", "step2"]
}

Only respond with valid JSON.`;

    const result = await model.generateContent(prompt);
    const response = result.response.text();

    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const feedback = JSON.parse(jsonMatch[0]);
        session.overallFeedback = feedback.overallFeedback || '';
      }
    } catch (parseError) {
      session.overallFeedback = 'Interview completed. Check individual question feedback for details.';
    }

    session.status = 'Evaluated';
    await session.save();

    res.status(200).json({
      success: true,
      session: {
        id: session._id,
        status: session.status,
        overallScore: session.overallScore,
        overallFeedback: session.overallFeedback,
        totalTimeTaken: session.totalTimeTaken,
        questionsCount: session.questions.length,
        completedAt: session.completedAt
      }
    });

  } catch (error) {
    console.error('Submit Session Error:', error);
    res.status(500).json({ message: 'Failed to submit session', error: error.message });
  }
};

// Get session by ID
exports.getSession = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await AIInterviewSession.findById(sessionId)
      .populate('user', 'name email')
      .populate('job', 'title company');

    if (!session) {
      return res.status(404).json({ message: 'Interview session not found' });
    }

    res.status(200).json({
      success: true,
      session
    });

  } catch (error) {
    console.error('Get Session Error:', error);
    res.status(500).json({ message: 'Failed to get session', error: error.message });
  }
};

// Get user's interview history
exports.getHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 10, page = 1 } = req.query;

    const sessions = await AIInterviewSession.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .select('-questions.aiEvaluation');

    const total = await AIInterviewSession.countDocuments({ user: userId });

    res.status(200).json({
      success: true,
      sessions,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Get History Error:', error);
    res.status(500).json({ message: 'Failed to get history', error: error.message });
  }
};

// Helper function for default questions
function getDefaultQuestions(focusAreas) {
  const questions = [
    {
      question: "Tell me about yourself and your experience with software development.",
      questionCategory: "Behavioral",
      expectedKeywords: ["experience", "skills", "projects"]
    },
    {
      question: "What are the key differences between var, let, and const in JavaScript?",
      questionCategory: "Technical",
      expectedKeywords: ["scope", "hoisting", "reassignment"]
    },
    {
      question: "Explain the concept of closures in JavaScript with an example.",
      questionCategory: "Technical",
      expectedKeywords: ["function", "scope", "lexical"]
    },
    {
      question: "Describe your problem-solving approach when debugging a complex issue.",
      questionCategory: "ProblemSolving",
      expectedKeywords: ["debug", "analyze", "test"]
    },
    {
      question: "What is the Virtual DOM and how does React use it?",
      questionCategory: "Technical",
      expectedKeywords: ["virtual", "diff", "reconciliation"]
    }
  ];

  return questions.slice(0, 5);
}

module.exports = exports;
