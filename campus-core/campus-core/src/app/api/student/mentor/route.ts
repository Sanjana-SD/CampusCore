import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// Local technical skills vocabulary for rule-based matching
const TECH_SKILLS = [
  'javascript', 'typescript', 'react', 'next.js', 'vue', 'angular', 'node.js', 'express',
  'python', 'django', 'flask', 'java', 'spring boot', 'c++', 'c#', 'golang', 'rust',
  'sql', 'postgresql', 'mysql', 'mongodb', 'redis', 'cassandra', 'dynamodb',
  'docker', 'kubernetes', 'aws', 'gcp', 'azure', 'devops', 'ci/cd', 'git',
  'html', 'css', 'tailwind css', 'bootstrap', 'graphql', 'rest api', 'microservices',
  'machine learning', 'data science', 'deep learning', 'nlp', 'pandas', 'numpy', 'pytorch'
];

// Predefined roadmaps for fallback
const PREDEFINED_ROADMAPS: Record<string, any> = {
  'Software Engineer': {
    requiredSkills: ['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'Docker', 'REST API'],
    roadmap: {
      plan30: 'Master TypeScript fundamentals and Advanced React Hooks. Implement client-side routing and state management.',
      plan60: 'Build backend REST APIs using Node.js and Express. Connect to PostgreSQL and model database relationships.',
      plan90: 'Learn containerization with Docker. Deploy a full-stack containerized application with CI/CD GitHub Actions.'
    },
    projects: ['Dynamic Task Management App (TypeScript)', 'E-Commerce REST API Backend (Express)'],
    certifications: ['AWS Certified Developer', 'Meta Front-End Developer Certificate'],
    resources: ['MDN Web Docs', 'Next.js Learning Center', 'PostgreSQL Documentation'],
    interviewPrep: [
      'Explain the difference between SQL and NoSQL databases.',
      'What is React Virtual DOM and how does reconciliation work?',
      'Describe how JWT-based authorization works in microservices.'
    ]
  },
  'Data Scientist': {
    requiredSkills: ['Python', 'Pandas', 'NumPy', 'Machine Learning', 'SQL', 'PyTorch'],
    roadmap: {
      plan30: 'Strengthen Python programming. Master NumPy arrays and Pandas dataframes for data manipulation.',
      plan60: 'Learn exploratory data analysis (EDA). Master SQL queries and integrate regression/classification models.',
      plan90: 'Study neural networks with PyTorch. Train, evaluate, and export deep learning classifiers.'
    },
    projects: ['Housing Price Regression Predictor', 'Customer Churn Classification Pipeline'],
    certifications: ['Google Data Analytics Professional', 'IBM Data Science Certificate'],
    resources: ['Kaggle Learn Tutorials', 'Scikit-Learn Docs', 'PyTorch Official Guide'],
    interviewPrep: [
      'Explain the difference between overfitting and underfitting.',
      'What is the purpose of regularization (L1/L2)?',
      'How does gradient descent work in deep learning?'
    ]
  },
  'DevOps Engineer': {
    requiredSkills: ['Docker', 'Kubernetes', 'AWS', 'Linux', 'Git', 'CI/CD'],
    roadmap: {
      plan30: 'Master Linux shell commands and scripting. Learn Git branching workflows and setup automated linters.',
      plan60: 'Dockerize local full-stack projects. Setup multi-stage builds and deploy on AWS EC2/ECS.',
      plan90: 'Learn Kubernetes cluster orchestration. Implement blue-green deployments using CI/CD pipelines.'
    },
    projects: ['Multi-Stage Dockerized Web Application', 'Automated Terraform Infrastructure Pipeline'],
    certifications: ['Certified Kubernetes Administrator (CKA)', 'AWS SysOps Administrator'],
    resources: ['DevOps Roadmap.sh', 'Docker Docs', 'Kubernetes Interactive Tutorials'],
    interviewPrep: [
      'What is the difference between virtual machines and containers?',
      'Explain the core stages of a CI/CD automation pipeline.',
      'What is Infrastructure as Code (IaC) and why is it used?'
    ]
  }
};

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  try {
    const { resumeText, selectedCareerGoal, academicPerformance } = await request.json();

    if (!selectedCareerGoal) {
      return NextResponse.json({ error: 'Selected career goal is required.' }, { status: 400 });
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized user.' }, { status: 401 });
    }

    const textToParse = (resumeText || '').toLowerCase();
    
    // 1. NLP Keyword extraction for current skills
    const extractedSkills = TECH_SKILLS.filter(skill => textToParse.includes(skill))
      .map(skill => skill.toUpperCase());

    // 2. Select matching templates or fallback to Software Engineer
    const targetGoal = selectedCareerGoal in PREDEFINED_ROADMAPS ? selectedCareerGoal : 'Software Engineer';
    const template = PREDEFINED_ROADMAPS[targetGoal];

    const matchedSkills = template.requiredSkills.filter((s: string) => 
      extractedSkills.includes(s.toUpperCase())
    );
    
    const missingSkills = template.requiredSkills.filter((s: string) => 
      !extractedSkills.includes(s.toUpperCase())
    );

    // Calculate match score
    const matchScore = template.requiredSkills.length > 0 
      ? Math.round((matchedSkills.length / template.requiredSkills.length) * 100)
      : 0;

    // Construct response JSON matching specs
    const recommendations = {
      careerLevel: matchScore >= 70 ? 'Advanced' : matchScore >= 40 ? 'Intermediate' : 'Beginner',
      personalizedSummary: `Based on your academic performance (${academicPerformance || '75%'}) and your resume keyword parsing, you have a solid matching foundation of ${matchedSkills.length} core technical requirements for the ${selectedCareerGoal} role. Completing the missing tags like ${missingSkills.join(', ') || 'none'} will optimize your portfolio for placements.`,
      requiredSkills: template.requiredSkills,
      currentSkills: matchedSkills,
      missingSkills: missingSkills,
      learningRoadmap: {
        plan30: template.roadmap.plan30,
        plan60: template.roadmap.plan60,
        plan90: template.roadmap.plan90
      },
      recommendedProjects: template.projects,
      recommendedCertifications: template.certifications,
      learningResources: template.resources,
      interviewPreparation: template.interviewPrep
    };

    // Upsert into c360_roadmap in the database so the student dashboard maintains state!
    const { error: dbError } = await supabase
      .from('c360_roadmap')
      .upsert({
        student_id: user.id,
        target_career: selectedCareerGoal,
        roadmap_json: recommendations
      }, { onConflict: 'student_id' });

    if (dbError) {
      console.error('Roadmap database upsert error:', dbError.message);
    }

    // Log the event
    await supabase.from('admin_logs').insert({
      action_type: 'ai_mentor',
      message: `Generated AI Career Roadmap for student: ${user.email} -> ${selectedCareerGoal}`
    });

    return NextResponse.json({ success: true, recommendations });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// Fetch active roadmap for student
export async function GET() {
  const supabase = await createClient();

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('c360_roadmap')
      .select('*')
      .eq('student_id', user.id)
      .single();

    if (error) {
      return NextResponse.json({ roadmap: null });
    }

    return NextResponse.json({ roadmap: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
