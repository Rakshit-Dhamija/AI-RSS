/**
 * Demo data for POC presentation
 * Ensures your demo always has content to show
 */

const demoJobs = [
  {
    title: "Registered Nurse - ICU",
    description: "We are seeking a dedicated Registered Nurse for our Intensive Care Unit. The ideal candidate will have experience in critical care, patient monitoring, and emergency response. Must be licensed RN with BLS and ACLS certification. Strong communication skills and ability to work in high-stress environments required.",
    enhancedDescription: "ICU Registered Nurse position requiring:\n\nRequired Skills:\n- Critical care nursing\n- Patient assessment and monitoring\n- Emergency response protocols\n- Medication administration\n- Ventilator management\n- Electronic health records\n\nCertifications Required:\n- Active RN license\n- BLS certification\n- ACLS certification\n\nExperience: 2+ years in critical care or ICU\nResponsibilities: Provide direct patient care, monitor vital signs, collaborate with medical team, maintain accurate documentation"
  },
  {
    title: "Marketing Manager",
    description: "Join our marketing team as a Marketing Manager! We need someone experienced in digital marketing, campaign management, and brand strategy. Experience with social media marketing, SEO, content creation, and analytics is essential. Leadership experience and ability to manage marketing budgets required.",
    enhancedDescription: "Marketing Manager role focusing on:\n\nRequired Skills:\n- Digital marketing strategy\n- Campaign management\n- Social media marketing\n- Content creation and copywriting\n- SEO and SEM\n- Marketing analytics\n- Budget management\n- Team leadership\n\nPreferred Skills:\n- Google Analytics and Ads\n- Email marketing platforms\n- Graphic design tools\n- Project management\n\nExperience: 3+ years in marketing management\nResponsibilities: Develop marketing strategies, manage campaigns, lead marketing team, analyze performance metrics, collaborate with sales team"
  },
  {
    title: "Elementary School Teacher",
    description: "We are looking for a passionate Elementary School Teacher to join our team. The ideal candidate will have experience in curriculum development, classroom management, and student assessment. Must have teaching certification and experience with diverse learning needs. Strong communication skills with students, parents, and colleagues required.",
    enhancedDescription: "Elementary School Teacher position requiring:\n\nRequired Skills:\n- Curriculum development and lesson planning\n- Classroom management\n- Student assessment and evaluation\n- Educational technology integration\n- Differentiated instruction\n- Parent communication\n\nCertifications Required:\n- Valid teaching license\n- Elementary education certification\n\nExperience: 2+ years in elementary education\nResponsibilities: Plan and deliver engaging lessons, assess student progress, manage classroom environment, communicate with parents, collaborate with school staff"
  },
  {
    title: "Financial Analyst",
    description: "We are seeking a detail-oriented Financial Analyst to join our finance team. The candidate will be responsible for financial modeling, budgeting, forecasting, and analysis. Strong Excel skills, knowledge of financial software, and experience with financial reporting required. CPA or CFA certification preferred.",
    enhancedDescription: "Financial Analyst role focusing on:\n\nRequired Skills:\n- Financial modeling and analysis\n- Budgeting and forecasting\n- Excel advanced functions\n- Financial reporting\n- Data analysis and interpretation\n- Risk assessment\n\nPreferred Skills:\n- SAP or Oracle financial systems\n- PowerBI or Tableau\n- CPA or CFA certification\n- Investment analysis\n\nExperience: 2+ years in financial analysis\nResponsibilities: Prepare financial reports, conduct variance analysis, support budgeting process, perform financial modeling, present findings to management"
  }
];

const demoResumes = [
  {
    parsedResume: {
      name: "Emily Rodriguez, RN",
      email: "emily.rodriguez@email.com",
      skills: "Critical care nursing, Patient assessment, Emergency response, Medication administration, Ventilator management, Electronic health records, BLS, ACLS, Patient monitoring, Team collaboration",
      experience: "Registered Nurse with 3 years of experience in intensive care and emergency medicine. Specialized in critical care nursing with expertise in patient monitoring, emergency response protocols, and ventilator management. Experienced in high-stress environments and multidisciplinary team collaboration. Maintained accurate patient documentation and provided compassionate care to critically ill patients.",
      education: "Bachelor of Science in Nursing, City Medical College, 2021. RN License #RN123456. BLS and ACLS Certified.",
      summary: "Dedicated ICU nurse with strong clinical skills and experience in critical care environments. Committed to providing exceptional patient care and working effectively in emergency situations.",
      projects: "Quality Improvement Initiative: Led project to reduce patient fall rates by 30%. Mentorship Program: Trained 5 new graduate nurses in ICU protocols."
    },
    embedding: Array(384).fill(0).map(() => Math.random() * 0.1 + 0.6), // Higher embedding for good match
    uploadedAt: new Date()
  },
  {
    parsedResume: {
      name: "David Martinez",
      email: "david.martinez@email.com",
      skills: "Digital marketing, Campaign management, Social media marketing, Content creation, SEO, SEM, Marketing analytics, Budget management, Team leadership, Google Analytics, Email marketing, Branding",
      experience: "Marketing Manager with 4 years of experience in digital marketing and campaign management. Led successful marketing campaigns that increased brand awareness by 40% and generated $2M in revenue. Expertise in social media marketing, SEO optimization, and marketing analytics. Managed marketing budgets up to $500K and led cross-functional teams of 8 members.",
      education: "Master of Business Administration in Marketing, Business University, 2020. Google Analytics Certified.",
      summary: "Results-driven marketing professional with proven track record in digital marketing strategy and team leadership. Passionate about data-driven marketing and brand development.",
      projects: "Brand Relaunch Campaign: Increased brand recognition by 45%. Social Media Strategy: Grew followers by 200% across all platforms."
    },
    embedding: Array(384).fill(0).map(() => Math.random() * 0.1 + 0.5), // Good match for marketing role
    uploadedAt: new Date()
  },
  {
    parsedResume: {
      name: "Jennifer Thompson",
      email: "jennifer.thompson@email.com",
      skills: "Curriculum development, Lesson planning, Classroom management, Student assessment, Educational technology, Differentiated instruction, Parent communication, Special needs education, Reading instruction, Math instruction",
      experience: "Elementary School Teacher with 5 years of experience in grades K-5. Developed engaging curriculum aligned with state standards and implemented differentiated instruction strategies for diverse learners. Experienced in classroom management, student assessment, and parent communication. Successfully improved student reading scores by 25% through innovative teaching methods.",
      education: "Master of Education in Elementary Education, Teachers College, 2019. Valid Teaching License #T789012. Reading Specialist Certification.",
      summary: "Passionate educator dedicated to fostering student growth and creating inclusive learning environments. Skilled in curriculum development and educational technology integration.",
      projects: "Reading Intervention Program: Designed program that improved struggling readers' performance. Technology Integration: Implemented tablet-based learning activities."
    },
    embedding: Array(384).fill(0).map(() => Math.random() * 0.1 + 0.4), // Good match for teaching role
    uploadedAt: new Date()
  },
  {
    parsedResume: {
      name: "Robert Kim",
      email: "robert.kim@email.com",
      skills: "Financial modeling, Financial analysis, Budgeting, Forecasting, Excel advanced functions, Financial reporting, Data analysis, Risk assessment, SAP, PowerBI, Investment analysis, Variance analysis",
      experience: "Financial Analyst with 3 years of experience in corporate finance and financial modeling. Prepared comprehensive financial reports and conducted variance analysis for senior management. Proficient in advanced Excel functions, SAP financial systems, and PowerBI for data visualization. Supported annual budgeting process for $50M department and performed investment analysis for capital projects.",
      education: "Bachelor of Science in Finance, Finance Institute, 2021. CFA Level 1 Candidate. Excel Expert Certification.",
      summary: "Detail-oriented financial professional with strong analytical skills and expertise in financial modeling. Committed to providing accurate financial insights to support business decisions.",
      projects: "Budget Optimization Model: Created Excel model that identified $2M in cost savings. Financial Dashboard: Developed PowerBI dashboard for real-time financial monitoring."
    },
    embedding: Array(384).fill(0).map(() => Math.random() * 0.1 + 0.45), // Good match for finance role
    uploadedAt: new Date()
  },
  {
    parsedResume: {
      name: "Lisa Wang",
      email: "lisa.wang@email.com",
      skills: "Retail management, Customer service, Inventory management, Sales, Team leadership, Merchandising, Point of sale systems, Staff training, Loss prevention, Visual merchandising",
      experience: "Retail Store Manager with 6 years of experience in retail operations and team management. Managed daily operations of high-volume store with $3M annual revenue. Led team of 15 employees and consistently exceeded sales targets by 20%. Expertise in inventory management, customer service, and visual merchandising. Implemented staff training programs that reduced employee turnover by 30%.",
      education: "Bachelor of Business Administration, Commerce University, 2018. Retail Management Certificate.",
      summary: "Experienced retail professional with strong leadership skills and proven track record in sales performance and team development.",
      projects: "Customer Loyalty Program: Launched program that increased repeat customers by 35%. Store Layout Redesign: Improved customer flow and increased sales per square foot."
    },
    embedding: Array(384).fill(0).map(() => Math.random() * 0.1 + 0.3), // Lower match - different industry
    uploadedAt: new Date()
  }
];

module.exports = { demoJobs, demoResumes };