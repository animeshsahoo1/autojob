import "dotenv/config";
import { connectToDatabase } from "../database/db";
import { Job } from "../models/job.model";
import crypto from "crypto";

// Indian tech companies + MNCs with India presence
const companies = [
  "Google India",
  "Microsoft India",
  "Amazon India",
  "Flipkart",
  "Swiggy",
  "Zomato",
  "Paytm",
  "PhonePe",
  "CRED",
  "Razorpay",
  "Zerodha",
  "Dream11",
  "Ola",
  "Atlassian",
  "Salesforce India",
  "Oracle India",
  "IBM India",
  "Accenture",
  "Infosys",
  "TCS",
  "Wipro",
  "HCL Technologies",
];

const indianCities = [
  "Bangalore, Karnataka",
  "Hyderabad, Telangana",
  "Pune, Maharashtra",
  "Mumbai, Maharashtra",
  "Delhi NCR",
  "Chennai, Tamil Nadu",
  "Kolkata, West Bengal",
  "Ahmedabad, Gujarat",
  "Kochi, Kerala",
];

const internationalCities = [
  "San Francisco, CA",
  "New York, NY",
  "London, UK",
  "Singapore",
  "Dubai, UAE",
];

// Job definitions covering all test cases
const jobDefinitions = [
  // HIGH MATCH - Should PASS (India, Backend, Go/AWS)
  {
    company: "Razorpay",
    title: "Backend Engineer - Payments Platform",
    location: "Bangalore, Karnataka",
    isRemote: false,
    skills: [
      "Go",
      "PostgreSQL",
      "Redis",
      "Kafka",
      "AWS",
      "Docker",
      "Kubernetes",
    ],
    description: `Razorpay is seeking an experienced Backend Engineer to build and scale our payments platform serving millions of merchants across India. 

You'll work on high-throughput distributed systems, designing and implementing scalable microservices that process billions of transactions annually. Our tech stack includes Go, PostgreSQL, Redis, and Kafka, deployed on AWS with Kubernetes.

Key Responsibilities:
- Design and develop high-performance backend services for payment processing
- Build scalable microservices architecture handling millions of API requests daily
- Implement robust error handling and retry mechanisms for financial transactions
- Optimize database queries and implement effective caching strategies
- Collaborate with product teams to deliver customer-facing features
- Participate in on-call rotation and incident management

We're looking for engineers passionate about building reliable, secure systems that power India's digital payments revolution.`,
    requirements: [
      "2-4 years of backend development experience with Go or similar languages",
      "Strong understanding of distributed systems and microservices architecture",
      "Experience with SQL databases (PostgreSQL/MySQL) and NoSQL (Redis/MongoDB)",
      "Knowledge of message queues (Kafka/RabbitMQ) and event-driven architectures",
      "Familiarity with cloud platforms (AWS/GCP) and container orchestration (Kubernetes)",
      "Experience with CI/CD pipelines and infrastructure as code",
      "Strong problem-solving skills and ability to debug complex production issues",
    ],
    questions: [
      {
        question: "How many years of experience do you have with Go?",
        answer: "",
      },
      {
        question:
          "Describe your experience with distributed systems and microservices",
        answer: "",
      },
      {
        question:
          "Have you worked with payment systems or financial applications before?",
        answer: "",
      },
      { question: "When can you start?", answer: "" },
    ],
    employmentType: "full-time",
  },

  // HIGH MATCH - REMOTE - Should PASS
  {
    company: "Zerodha",
    title: "Senior Platform Engineer",
    location: "Remote",
    isRemote: true,
    skills: [
      "Python",
      "Go",
      "Docker",
      "Kubernetes",
      "PostgreSQL",
      "Linux",
      "AWS",
    ],
    description: `Zerodha, India's largest stockbroker, is hiring Senior Platform Engineers to work on our trading infrastructure. This is a remote position open to candidates across India.

You'll be responsible for building and maintaining the platform that handles millions of trades daily. We use Python and Go extensively, with all services containerized and orchestrated via Kubernetes on AWS.

What You'll Do:
- Build and maintain high-availability trading systems with 99.99% uptime requirements
- Design and implement infrastructure automation using Terraform and Ansible
- Optimize application performance and reduce latency for real-time trading data
- Implement monitoring, alerting, and observability solutions
- Work on database optimization and data pipeline improvements
- Contribute to open-source projects and internal tooling

We value engineering excellence, ownership, and continuous learning. Our team is small but highly skilled.`,
    requirements: [
      "4+ years experience in platform engineering or SRE roles",
      "Expert-level knowledge of Python or Go",
      "Strong Linux systems administration skills",
      "Experience with container orchestration (Kubernetes) and cloud infrastructure (AWS/GCP)",
      "Deep understanding of networking, security, and performance optimization",
      "Experience with infrastructure as code (Terraform/CloudFormation)",
      "Excellent debugging and troubleshooting skills",
    ],
    questions: [
      {
        question: "Do you have experience with financial trading systems?",
        answer: "",
      },
      {
        question:
          "Are you comfortable working remotely with async communication?",
        answer: "",
      },
      {
        question: "What's your experience with Kubernetes in production?",
        answer: "",
      },
      { question: "Expected salary range (in LPA)?", answer: "" },
    ],
    employmentType: "full-time",
  },

  // MEDIUM MATCH - Should PASS (India, DevOps focus)
  {
    company: "Swiggy",
    title: "DevOps Engineer - Platform Team",
    location: "Bangalore, Karnataka",
    isRemote: false,
    skills: [
      "Jenkins",
      "Terraform",
      "Ansible",
      "Docker",
      "Kubernetes",
      "AWS",
      "Python",
    ],
    description: `Swiggy is looking for a DevOps Engineer to join our Platform team in Bangalore. You'll work on automating infrastructure, improving deployment pipelines, and ensuring the reliability of systems serving millions of food orders daily.

Our DevOps team manages a large-scale AWS infrastructure with hundreds of microservices. You'll work with Jenkins for CI/CD, Terraform for infrastructure provisioning, and Kubernetes for container orchestration.

Responsibilities:
- Build and maintain CI/CD pipelines for 50+ microservices
- Automate infrastructure provisioning using Terraform and Ansible
- Implement monitoring and alerting using Prometheus, Grafana, and ELK stack
- Optimize cloud costs and resource utilization
- Support development teams with deployment and debugging issues
- Participate in incident response and post-mortem processes`,
    requirements: [
      "2-3 years of DevOps or infrastructure engineering experience",
      "Strong knowledge of AWS services (EC2, S3, RDS, Lambda, etc.)",
      "Experience with CI/CD tools (Jenkins, GitLab CI, or GitHub Actions)",
      "Proficiency in infrastructure as code (Terraform preferred)",
      "Good scripting skills (Python, Bash, or Shell)",
      "Understanding of networking, DNS, load balancing, and CDN concepts",
      "Experience with monitoring tools (Prometheus, Grafana, Datadog)",
    ],
    questions: [
      {
        question:
          "Describe your experience with Terraform and infrastructure automation",
        answer: "",
      },
      {
        question: "How do you handle production incidents and debugging?",
        answer: "",
      },
      { question: "What's your notice period?", answer: "" },
    ],
    employmentType: "full-time",
  },

  // MEDIUM-LOW MATCH - Location OK but skills mismatch - Might SKIP
  {
    company: "Flipkart",
    title: "Senior Java Backend Developer",
    location: "Bangalore, Karnataka",
    isRemote: false,
    skills: ["Java", "Spring Boot", "MySQL", "Kafka", "Redis", "Microservices"],
    description: `Flipkart is hiring Senior Java Backend Developers for our e-commerce platform. You'll work on building scalable backend services using Java and Spring Boot.

Join our team of 200+ backend engineers working on India's largest e-commerce platform. We process millions of orders daily and need engineers who can design robust, scalable systems.

What You'll Work On:
- Design and develop RESTful APIs for mobile and web applications
- Build microservices using Spring Boot and Spring Cloud
- Implement caching strategies using Redis for high-traffic APIs
- Work with Kafka for event streaming and async processing
- Optimize database queries and design efficient data models
- Collaborate with frontend and mobile teams`,
    requirements: [
      "5+ years of Java backend development experience",
      "Expert knowledge of Spring Framework (Spring Boot, Spring Cloud, Spring Data)",
      "Strong understanding of SQL databases and query optimization",
      "Experience with microservices architecture and RESTful API design",
      "Knowledge of caching strategies and distributed systems",
      "Familiarity with message queues (Kafka/RabbitMQ)",
      "B.Tech/M.Tech in Computer Science or related field",
    ],
    questions: [
      {
        question: "How many years of Spring Boot experience do you have?",
        answer: "",
      },
      {
        question: "Have you worked with high-traffic e-commerce systems?",
        answer: "",
      },
      { question: "What's your current CTC and expected CTC?", answer: "" },
    ],
    employmentType: "full-time",
  },

  // GOOD MATCH - Should PASS (India, Cloud/AWS focus)
  {
    company: "CRED",
    title: "Cloud Infrastructure Engineer",
    location: "Bangalore, Karnataka",
    isRemote: false,
    skills: [
      "AWS",
      "Terraform",
      "Python",
      "Docker",
      "Kubernetes",
      "CloudFormation",
    ],
    description: `CRED is hiring a Cloud Infrastructure Engineer to manage and scale our AWS infrastructure. We're a fintech startup building India's most trusted credit card management platform.

You'll be responsible for designing, implementing, and maintaining our cloud infrastructure that serves millions of users. We're heavily invested in AWS and use infrastructure-as-code extensively.

Key Responsibilities:
- Design and implement secure, scalable cloud architectures on AWS
- Manage AWS services including EC2, RDS, Lambda, S3, CloudFront, and more
- Build infrastructure automation using Terraform and CloudFormation
- Implement security best practices and compliance requirements
- Optimize cloud costs and resource utilization
- Set up monitoring, logging, and alerting systems
- Collaborate with development teams on architecture decisions`,
    requirements: [
      "3+ years of hands-on AWS experience",
      "Strong knowledge of AWS core services and best practices",
      "Experience with infrastructure as code (Terraform/CloudFormation)",
      "Understanding of networking, VPC, security groups, and IAM",
      "Scripting skills in Python or Bash",
      "Experience with containerization and Kubernetes",
      "AWS certifications (Solutions Architect/DevOps Engineer) preferred",
    ],
    questions: [
      {
        question: "Which AWS services have you worked with extensively?",
        answer: "",
      },
      { question: "Do you have any AWS certifications?", answer: "" },
      {
        question: "Describe a complex infrastructure problem you've solved",
        answer: "",
      },
      { question: "Are you open to relocating to Bangalore?", answer: "" },
    ],
    employmentType: "full-time",
  },

  // INTERNATIONAL - SHOULD SKIP (Location not India, not remote)
  {
    company: "Google",
    title: "Site Reliability Engineer",
    location: "San Francisco, CA",
    isRemote: false,
    skills: [
      "Go",
      "Python",
      "Kubernetes",
      "Docker",
      "Linux",
      "Terraform",
      "GCP",
    ],
    description: `Google's SRE team in San Francisco is looking for talented engineers to ensure the reliability and performance of our services at scale. 

You'll work on systems serving billions of users worldwide, implementing automation, monitoring, and incident response processes. This role requires on-site presence in our San Francisco office.

What SREs Do at Google:
- Build and operate distributed systems at unprecedented scale
- Design and implement automation to eliminate toil
- Participate in on-call rotations for critical services
- Conduct post-mortems and implement preventive measures
- Collaborate with development teams on system design
- Contribute to open-source SRE tooling and practices`,
    requirements: [
      "BS/MS in Computer Science or equivalent experience",
      "5+ years of experience in SRE, DevOps, or infrastructure engineering",
      "Expert programming skills in Go, Python, or similar languages",
      "Deep understanding of Linux systems and networking",
      "Experience with large-scale distributed systems",
      "Strong analytical and debugging skills",
      "Must be authorized to work in the United States",
    ],
    questions: [
      {
        question: "Are you authorized to work in the United States?",
        answer: "",
      },
      { question: "Can you relocate to San Francisco?", answer: "" },
      {
        question: "Describe your largest production system experience",
        answer: "",
      },
      {
        question:
          "What's your experience with distributed tracing and observability?",
        answer: "",
      },
    ],
    employmentType: "full-time",
  },

  // GOOD MATCH - REMOTE INDIA - Should PASS
  {
    company: "Atlassian",
    title: "Backend Software Engineer",
    location: "Remote",
    isRemote: true,
    skills: [
      "Java",
      "Python",
      "AWS",
      "PostgreSQL",
      "Redis",
      "Kafka",
      "Microservices",
    ],
    description: `Atlassian is hiring Backend Software Engineers for our India team (remote). You'll work on products like Jira, Confluence, and Bitbucket, used by millions of teams worldwide.

This is a fully remote position, and you can work from anywhere in India. We're looking for engineers passionate about building collaborative software that helps teams work better together.

What You'll Do:
- Develop and maintain backend services for Atlassian products
- Build scalable APIs and microservices using Java/Python
- Work with distributed systems and cloud infrastructure (AWS)
- Implement features that improve developer productivity
- Participate in code reviews and technical design discussions
- Contribute to architectural decisions and best practices

We value work-life balance, continuous learning, and remote-first culture.`,
    requirements: [
      "3+ years of backend development experience",
      "Strong programming skills in Java, Python, or similar languages",
      "Experience building RESTful APIs and microservices",
      "Knowledge of databases (PostgreSQL, MySQL) and caching (Redis)",
      "Understanding of cloud platforms (AWS/Azure/GCP)",
      "Excellent communication skills for remote collaboration",
      "Bachelor's degree in Computer Science or equivalent",
    ],
    questions: [
      { question: "Why do you want to work at Atlassian?", answer: "" },
      {
        question: "Describe a technically challenging project you've worked on",
        answer: "",
      },
      {
        question: "How do you approach code reviews and collaboration?",
        answer: "",
      },
      { question: "What's your expected salary?", answer: "" },
    ],
    employmentType: "full-time",
  },

  // LOW MATCH - Data Science - Should SKIP (Skills mismatch)
  {
    company: "PhonePe",
    title: "Senior Data Scientist",
    location: "Bangalore, Karnataka",
    isRemote: false,
    skills: [
      "Python",
      "TensorFlow",
      "PyTorch",
      "Scikit-learn",
      "Spark",
      "SQL",
      "Statistics",
    ],
    description: `PhonePe is looking for a Senior Data Scientist to join our Analytics team in Bangalore. You'll work on building ML models for fraud detection, user segmentation, and personalization.

As a Data Scientist at PhonePe, you'll analyze massive datasets, build predictive models, and drive data-informed decision-making across the organization.

Responsibilities:
- Build machine learning models for fraud detection and risk assessment
- Analyze user behavior patterns and create segmentation strategies
- Develop recommendation systems for personalized user experiences
- Collaborate with product teams to design A/B tests and experiments
- Present insights and recommendations to leadership
- Build and deploy ML pipelines in production`,
    requirements: [
      "4+ years of data science or ML engineering experience",
      "Strong programming skills in Python (NumPy, Pandas, Scikit-learn)",
      "Experience with deep learning frameworks (TensorFlow/PyTorch)",
      "Solid understanding of statistics, probability, and ML algorithms",
      "Experience with big data tools (Spark, Hive, Hadoop)",
      "Strong SQL skills and database knowledge",
      "Master's/PhD in Computer Science, Statistics, or related field preferred",
    ],
    questions: [
      {
        question: "Describe your experience with fraud detection models",
        answer: "",
      },
      {
        question: "What ML frameworks are you most comfortable with?",
        answer: "",
      },
      { question: "Have you deployed ML models to production?", answer: "" },
    ],
    employmentType: "full-time",
  },

  // GOOD MATCH - Should PASS (India, Go/Kubernetes)
  {
    company: "Dream11",
    title: "Platform Engineer - Kubernetes",
    location: "Mumbai, Maharashtra",
    isRemote: false,
    skills: ["Kubernetes", "Docker", "Go", "Terraform", "AWS", "Linux", "Helm"],
    description: `Dream11 is hiring Platform Engineers to build and manage our Kubernetes infrastructure. We run India's largest fantasy sports platform, serving 150M+ users with real-time score updates and gameplay.

You'll work on our container orchestration platform, managing hundreds of microservices on Kubernetes. We're looking for engineers with strong Kubernetes expertise and a passion for building reliable, scalable platforms.

What You'll Build:
- Design and manage multi-cluster Kubernetes environments on AWS
- Build platform tools and abstractions for developers
- Implement GitOps workflows using ArgoCD/Flux
- Create Helm charts and Kubernetes operators
- Optimize cluster performance and resource utilization
- Implement security policies and access controls
- Build monitoring and alerting systems for Kubernetes`,
    requirements: [
      "3+ years of experience with Kubernetes in production",
      "Strong understanding of container orchestration concepts",
      "Experience with cloud platforms (AWS/GCP) and Kubernetes services (EKS/GKE)",
      "Programming skills in Go, Python, or similar languages",
      "Knowledge of GitOps tools (ArgoCD, Flux) and Helm",
      "Understanding of networking, service mesh, and security in Kubernetes",
      "Experience with monitoring tools (Prometheus, Grafana)",
    ],
    questions: [
      {
        question: "How many years of Kubernetes experience do you have?",
        answer: "",
      },
      {
        question: "Have you built Kubernetes operators or controllers?",
        answer: "",
      },
      {
        question: "Describe your experience with multi-cluster management",
        answer: "",
      },
      {
        question: "Can you join immediately or what's your notice period?",
        answer: "",
      },
    ],
    employmentType: "full-time",
  },

  // INTERNATIONAL - REMOTE - Should PASS (Remote, good match)
  {
    company: "GitLab",
    title: "Backend Engineer - Infrastructure",
    location: "Remote",
    isRemote: true,
    skills: [
      "Ruby",
      "Go",
      "PostgreSQL",
      "Redis",
      "Kubernetes",
      "GCP",
      "Terraform",
    ],
    description: `GitLab is hiring a Backend Engineer for our Infrastructure team. This is a fully remote position open to candidates worldwide, including India.

You'll work on GitLab's core infrastructure, building features that help millions of developers collaborate on code. GitLab is an all-remote company with 1,300+ team members in 65+ countries.

What You'll Do:
- Develop and maintain GitLab's backend infrastructure services
- Work with Ruby on Rails and Go for backend development
- Optimize database queries and implement caching strategies
- Build features for GitLab's CI/CD, Container Registry, and Package Registry
- Contribute to GitLab's open-source codebase
- Collaborate asynchronously with a global team

We offer competitive compensation, flexibility, and remote-first culture.`,
    requirements: [
      "3+ years of backend development experience",
      "Strong programming skills in Ruby, Go, or Python",
      "Experience with PostgreSQL and database optimization",
      "Knowledge of distributed systems and microservices",
      "Familiarity with Kubernetes and cloud platforms",
      "Excellent written communication skills (async-first company)",
      "Ability to work independently in a remote environment",
    ],
    questions: [
      { question: "Why do you want to work remotely at GitLab?", answer: "" },
      { question: "How do you stay productive working from home?", answer: "" },
      { question: "Have you contributed to open-source projects?", answer: "" },
      { question: "What timezone are you in?", answer: "" },
    ],
    employmentType: "full-time",
  },

  // LOW MATCH - Frontend - Should SKIP (Skills mismatch)
  {
    company: "Zomato",
    title: "Senior Frontend Engineer - React",
    location: "Bangalore, Karnataka",
    isRemote: false,
    skills: [
      "React",
      "JavaScript",
      "TypeScript",
      "Redux",
      "Next.js",
      "CSS",
      "GraphQL",
    ],
    description: `Zomato is looking for a Senior Frontend Engineer to build delightful user experiences for our food delivery app. You'll work with React, TypeScript, and Next.js to create fast, responsive interfaces.

Our frontend team is responsible for both web and mobile web experiences used by millions of customers daily. We're looking for engineers passionate about performance, accessibility, and user experience.

Responsibilities:
- Build and maintain Zomato's web applications using React and Next.js
- Implement pixel-perfect, responsive designs from Figma
- Optimize frontend performance and reduce page load times
- Integrate with backend APIs and implement state management
- Write unit tests and maintain code quality
- Collaborate with designers and product managers`,
    requirements: [
      "4+ years of frontend development experience",
      "Expert-level knowledge of React and JavaScript/TypeScript",
      "Experience with Next.js, Redux, and modern frontend tooling",
      "Strong CSS skills and understanding of responsive design",
      "Knowledge of web performance optimization techniques",
      "Experience with testing frameworks (Jest, React Testing Library)",
      "Good understanding of web accessibility (WCAG standards)",
    ],
    questions: [
      {
        question: "What's your experience with React and Next.js?",
        answer: "",
      },
      {
        question: "How do you approach frontend performance optimization?",
        answer: "",
      },
      { question: "What's your current and expected CTC?", answer: "" },
    ],
    employmentType: "full-time",
  },

  // MEDIUM MATCH - Should potentially PASS (India, some relevant skills)
  {
    company: "Paytm",
    title: "Full Stack Engineer",
    location: "Noida, Uttar Pradesh",
    isRemote: false,
    skills: [
      "Node.js",
      "React",
      "MongoDB",
      "Redis",
      "AWS",
      "Docker",
      "Microservices",
    ],
    description: `Paytm is hiring Full Stack Engineers for our fintech platform. You'll work across the stack, building features for India's largest digital payments ecosystem.

As a Full Stack Engineer, you'll develop both frontend and backend services, working with modern technologies like Node.js, React, and MongoDB. We process millions of transactions daily and need engineers who can build scalable, secure systems.

What You'll Do:
- Develop full-stack features for payment and financial services
- Build RESTful APIs using Node.js and Express
- Create responsive UIs using React and TypeScript
- Work with MongoDB, Redis for data persistence and caching
- Implement microservices architecture patterns
- Deploy applications on AWS with Docker containers`,
    requirements: [
      "2-4 years of full-stack development experience",
      "Proficiency in Node.js and JavaScript/TypeScript",
      "Experience with React or similar frontend frameworks",
      "Knowledge of databases (MongoDB, PostgreSQL, Redis)",
      "Understanding of RESTful APIs and microservices",
      "Familiarity with cloud platforms and containerization",
      "Strong problem-solving and debugging skills",
    ],
    questions: [
      {
        question: "What's your experience with Node.js backend development?",
        answer: "",
      },
      {
        question: "Have you worked on payment or financial systems?",
        answer: "",
      },
      {
        question: "Are you comfortable working on both frontend and backend?",
        answer: "",
      },
    ],
    employmentType: "full-time",
  },

  // INTERNATIONAL - SINGAPORE - Should SKIP (Not India, not remote)
  {
    company: "Grab",
    title: "Senior Backend Engineer",
    location: "Singapore",
    isRemote: false,
    skills: ["Go", "Kubernetes", "PostgreSQL", "Kafka", "GCP", "Redis"],
    description: `Grab is Southeast Asia's leading superapp, and we're hiring Senior Backend Engineers for our Singapore headquarters. You'll work on services powering ride-hailing, food delivery, and payments across 8 countries.

This role requires relocation to Singapore. We offer visa sponsorship, relocation assistance, and competitive compensation packages.

What You'll Work On:
- Build high-throughput backend services using Go
- Design and implement microservices architecture on GCP
- Work with event-driven systems using Kafka
- Optimize database performance and implement caching strategies
- Collaborate with teams across Southeast Asia
- Participate in on-call rotations for critical services`,
    requirements: [
      "5+ years of backend engineering experience",
      "Expert-level Go programming skills",
      "Experience with distributed systems at scale",
      "Strong knowledge of databases and message queues",
      "Experience with Kubernetes and cloud platforms (GCP preferred)",
      "Willingness to relocate to Singapore",
      "Bachelor's degree in Computer Science or equivalent",
    ],
    questions: [
      { question: "Are you willing to relocate to Singapore?", answer: "" },
      {
        question: "Do you have experience with high-traffic systems?",
        answer: "",
      },
      { question: "What's your experience with Go in production?", answer: "" },
      { question: "When can you join if selected?", answer: "" },
    ],
    employmentType: "full-time",
  },

  // GOOD MATCH - Should PASS (India, SRE/DevOps)
  {
    company: "Ola",
    title: "Site Reliability Engineer",
    location: "Bangalore, Karnataka",
    isRemote: false,
    skills: [
      "Python",
      "Linux",
      "Kubernetes",
      "AWS",
      "Terraform",
      "Prometheus",
      "Grafana",
    ],
    description: `Ola is hiring Site Reliability Engineers to ensure the reliability and performance of India's leading ride-hailing platform. You'll work on systems serving millions of rides daily across 250+ cities.

Our SRE team is responsible for infrastructure automation, monitoring, incident management, and ensuring 99.99% uptime for critical services. We're looking for engineers who can think like both developers and operators.

Key Responsibilities:
- Build automation tools to eliminate operational toil
- Implement comprehensive monitoring and alerting systems
- Manage Kubernetes clusters and AWS infrastructure
- Participate in incident response and on-call rotations
- Conduct capacity planning and performance optimization
- Collaborate with development teams on reliability improvements
- Document processes and conduct post-mortem analyses`,
    requirements: [
      "3+ years of SRE, DevOps, or infrastructure engineering experience",
      "Strong Linux systems administration skills",
      "Experience with container orchestration (Kubernetes) and cloud platforms (AWS)",
      "Proficiency in scripting languages (Python, Bash, Shell)",
      "Knowledge of monitoring tools (Prometheus, Grafana, ELK)",
      "Understanding of networking, security, and performance tuning",
      "Experience with infrastructure as code (Terraform/Ansible)",
    ],
    questions: [
      {
        question:
          "Describe your experience with incident management and on-call",
        answer: "",
      },
      {
        question:
          "How do you approach eliminating toil and building automation?",
        answer: "",
      },
      {
        question: "What's your experience with Kubernetes in production?",
        answer: "",
      },
      { question: "What's your notice period?", answer: "" },
    ],
    employmentType: "full-time",
  },

  // INTERNATIONAL - LONDON - Should SKIP (Not India, not remote)
  {
    company: "Monzo",
    title: "Backend Engineer - Platform",
    location: "London, UK",
    isRemote: false,
    skills: ["Go", "Kubernetes", "PostgreSQL", "Kafka", "AWS", "Cassandra"],
    description: `Monzo is hiring Backend Engineers for our Platform team in London. We're building the future of banking with modern technology and a customer-first approach.

You'll work on building and scaling Monzo's core banking platform, serving millions of customers across the UK. This role requires being based in London and working from our office.

What You'll Do:
- Build microservices using Go for banking operations
- Design and implement scalable APIs for financial transactions
- Work with event-driven architectures using Kafka
- Optimize database performance (PostgreSQL, Cassandra)
- Ensure security and compliance for financial services
- Collaborate with product and engineering teams

We offer competitive salaries, equity, and flexible working arrangements.`,
    requirements: [
      "4+ years of backend development experience",
      "Strong Go programming skills",
      "Experience with distributed systems and microservices",
      "Knowledge of databases (PostgreSQL) and message queues (Kafka)",
      "Understanding of financial services and regulatory requirements",
      "Right to work in the UK",
      "Willingness to work from London office",
    ],
    questions: [
      { question: "Are you authorized to work in the UK?", answer: "" },
      { question: "Can you work from our London office?", answer: "" },
      { question: "Have you worked in fintech or banking before?", answer: "" },
      { question: "What interests you about working at Monzo?", answer: "" },
    ],
    employmentType: "full-time",
  },

  // LOW MATCH - Mobile - Should SKIP (Skills mismatch)
  {
    company: "Meesho",
    title: "Android Engineer",
    location: "Bangalore, Karnataka",
    isRemote: false,
    skills: [
      "Kotlin",
      "Android SDK",
      "MVVM",
      "Retrofit",
      "Room",
      "Coroutines",
      "Jetpack Compose",
    ],
    description: `Meesho is looking for Android Engineers to build features for India's fastest-growing social commerce platform. You'll work on an app used by millions of resellers and shoppers across India.

Our Android team builds delightful mobile experiences with modern tools like Kotlin, Jetpack Compose, and MVVM architecture. We're looking for engineers passionate about mobile development and user experience.

Responsibilities:
- Develop new features for Meesho's Android app
- Implement clean architecture patterns (MVVM/MVI)
- Optimize app performance and reduce crashes
- Integrate with backend APIs and implement local caching
- Write unit tests and ensure code quality
- Collaborate with designers on UI/UX implementation`,
    requirements: [
      "3+ years of Android development experience",
      "Expert knowledge of Kotlin and Android SDK",
      "Experience with Jetpack components and modern Android architecture",
      "Strong understanding of Material Design guidelines",
      "Knowledge of reactive programming (Coroutines, RxJava)",
      "Experience with testing frameworks and CI/CD for mobile",
      "B.Tech in Computer Science or equivalent",
    ],
    questions: [
      {
        question: "How many years of Kotlin experience do you have?",
        answer: "",
      },
      { question: "Have you worked with Jetpack Compose?", answer: "" },
      {
        question: "What's your experience with app performance optimization?",
        answer: "",
      },
    ],
    employmentType: "full-time",
  },

  // GOOD MATCH - Should PASS (India, Backend/Distributed Systems)
  {
    company: "Salesforce India",
    title: "Backend Software Engineer - Distributed Systems",
    location: "Hyderabad, Telangana",
    isRemote: false,
    skills: [
      "Java",
      "Python",
      "Kafka",
      "PostgreSQL",
      "Redis",
      "Kubernetes",
      "AWS",
    ],
    description: `Salesforce India is hiring Backend Software Engineers for our Distributed Systems team in Hyderabad. You'll work on building highly scalable, multi-tenant cloud services that power Salesforce's CRM platform.

Our engineering team in Hyderabad is growing rapidly, and we're looking for talented engineers to work on challenging distributed systems problems. You'll have the opportunity to work with cutting-edge technologies and learn from world-class engineers.

What You'll Do:
- Design and develop scalable backend services for Salesforce platform
- Build distributed systems handling millions of API requests daily
- Implement data pipelines and event-driven architectures using Kafka
- Optimize database queries and implement effective caching strategies
- Collaborate with teams across US and India
- Participate in code reviews and technical design discussions
- Contribute to architectural decisions and best practices`,
    requirements: [
      "3-5 years of backend development experience",
      "Strong programming skills in Java, Python, or similar languages",
      "Experience building distributed systems and microservices",
      "Knowledge of databases (PostgreSQL, MySQL) and caching (Redis, Memcached)",
      "Understanding of message queues (Kafka, RabbitMQ)",
      "Familiarity with cloud platforms (AWS/GCP) and container orchestration",
      "B.Tech/M.Tech in Computer Science or equivalent",
    ],
    questions: [
      {
        question:
          "Describe your experience with distributed systems and scalability",
        answer: "",
      },
      {
        question: "Have you worked with multi-tenant architectures before?",
        answer: "",
      },
      {
        question: "What's your experience with event-driven systems and Kafka?",
        answer: "",
      },
      {
        question: "Are you open to occasional US time zone calls?",
        answer: "",
      },
    ],
    employmentType: "full-time",
  },

  // MEDIUM MATCH - REMOTE - Should potentially PASS
  {
    company: "Freshworks",
    title: "Cloud Platform Engineer",
    location: "Remote",
    isRemote: true,
    skills: [
      "AWS",
      "Python",
      "Terraform",
      "Kubernetes",
      "Docker",
      "Jenkins",
      "Ansible",
    ],
    description: `Freshworks is hiring a Cloud Platform Engineer to work remotely from anywhere in India. You'll build and maintain our cloud infrastructure serving millions of users globally.

As a Cloud Platform Engineer, you'll work on AWS infrastructure automation, CI/CD pipelines, and platform tooling. We're looking for engineers who can design secure, scalable cloud architectures.

Responsibilities:
- Design and implement cloud infrastructure on AWS
- Build automation tools using Python and Terraform
- Manage Kubernetes clusters and containerized applications
- Implement CI/CD pipelines for microservices
- Set up monitoring and logging infrastructure
- Ensure security compliance and best practices
- Support development teams with cloud infrastructure needs`,
    requirements: [
      "3+ years of cloud infrastructure experience",
      "Strong AWS knowledge (EC2, EKS, RDS, S3, Lambda, etc.)",
      "Experience with infrastructure as code (Terraform preferred)",
      "Proficiency in Python for automation scripts",
      "Knowledge of CI/CD tools (Jenkins, GitLab CI)",
      "Understanding of container orchestration (Kubernetes, Docker)",
      "Good communication skills for remote collaboration",
    ],
    questions: [
      {
        question: "Which AWS services are you most experienced with?",
        answer: "",
      },
      {
        question: "How do you approach infrastructure automation?",
        answer: "",
      },
      { question: "Are you comfortable working 100% remotely?", answer: "" },
      { question: "What's your expected salary range?", answer: "" },
    ],
    employmentType: "full-time",
  },

  // INTERNATIONAL - DUBAI - Should SKIP (Not India, not remote)
  {
    company: "Careem",
    title: "Engineering Manager - Backend",
    location: "Dubai, UAE",
    isRemote: false,
    skills: [
      "Go",
      "Python",
      "Kubernetes",
      "AWS",
      "PostgreSQL",
      "Leadership",
      "Microservices",
    ],
    description: `Careem (now part of Uber) is hiring an Engineering Manager for our Backend team in Dubai. You'll lead a team of 8-10 engineers building services for ride-hailing and super app features across the Middle East.

This role requires relocation to Dubai. We offer visa sponsorship, relocation packages, and competitive compensation.

What You'll Do:
- Lead and mentor a team of backend engineers
- Drive technical direction and architecture decisions
- Manage project delivery and sprint planning
- Collaborate with product managers on feature roadmaps
- Build and scale backend services using Go and Python
- Foster engineering excellence and best practices

We're looking for technical leaders with strong engineering backgrounds and people management experience.`,
    requirements: [
      "6+ years of backend engineering experience",
      "2+ years of engineering management experience",
      "Strong technical background in Go, Python, or similar languages",
      "Experience with distributed systems and microservices at scale",
      "Proven track record of leading and growing engineering teams",
      "Excellent communication and leadership skills",
      "Willingness to relocate to Dubai, UAE",
    ],
    questions: [
      { question: "Are you willing to relocate to Dubai?", answer: "" },
      { question: "How many direct reports have you managed?", answer: "" },
      { question: "Describe your leadership philosophy", answer: "" },
      {
        question: "What's your experience with distributed teams?",
        answer: "",
      },
    ],
    employmentType: "full-time",
  },

  // GOOD MATCH - CONTRACT - Should PASS (India, relevant skills)
  {
    company: "Oracle India",
    title: "Cloud Infrastructure Consultant",
    location: "Bangalore, Karnataka",
    isRemote: false,
    skills: [
      "Oracle Cloud",
      "Linux",
      "Networking",
      "Python",
      "Terraform",
      "Ansible",
    ],
    description: `Oracle India is hiring Cloud Infrastructure Consultants on a contract basis for a 12-month project. You'll work with enterprise clients to design and implement Oracle Cloud Infrastructure (OCI) solutions.

This is a great opportunity to gain hands-on experience with Oracle Cloud while working with Fortune 500 companies. Strong Linux and networking skills are essential.

Project Responsibilities:
- Design cloud architectures on Oracle Cloud Infrastructure
- Migrate workloads from on-premise to OCI
- Implement infrastructure automation using Terraform
- Configure networking, VCN, load balancers, and security
- Troubleshoot infrastructure issues and optimize performance
- Create documentation and runbooks for clients`,
    requirements: [
      "2-3 years of cloud infrastructure experience",
      "Strong Linux systems administration skills",
      "Knowledge of networking concepts (TCP/IP, DNS, VPN, routing)",
      "Experience with any cloud platform (AWS/Azure/GCP/OCI)",
      "Scripting skills in Python or Shell",
      "Understanding of infrastructure as code principles",
      "Good communication skills for client interactions",
    ],
    questions: [
      {
        question: "Do you have experience with Oracle Cloud (OCI)?",
        answer: "",
      },
      {
        question: "Are you comfortable with a contract role (12 months)?",
        answer: "",
      },
      {
        question: "What's your experience with enterprise clients?",
        answer: "",
      },
    ],
    employmentType: "contract",
  },

  // LOW MATCH - Internship - Different level
  {
    company: "Microsoft India",
    title: "Software Engineering Intern - Azure",
    location: "Bangalore, Karnataka",
    isRemote: false,
    skills: ["C#", ".NET", "Azure", "SQL", "REST APIs"],
    description: `Microsoft India is offering a 6-month internship opportunity for students/recent graduates interested in cloud computing and Azure services.

You'll work with our Azure team in Bangalore, learning about cloud infrastructure, contributing to real projects, and getting mentored by senior engineers. This is a paid internship with potential for full-time conversion.

What You'll Learn:
- Azure cloud services and infrastructure
- Building and deploying applications on Azure
- Working with C# and .NET framework
- Collaborating in a large engineering organization
- Software development best practices and code reviews`,
    requirements: [
      "Currently pursuing B.Tech/M.Tech in Computer Science or related field",
      "Good programming skills in C#, Java, or Python",
      "Basic understanding of cloud computing concepts",
      "Knowledge of data structures and algorithms",
      "Strong problem-solving abilities",
      "Available for 6-month internship",
      "Graduating in 2024 or 2025",
    ],
    questions: [
      { question: "When are you graduating?", answer: "" },
      {
        question: "Are you available for a 6-month full-time internship?",
        answer: "",
      },
      {
        question: "What interests you about cloud computing and Azure?",
        answer: "",
      },
    ],
    employmentType: "internship",
  },
];

function generateJobHash(
  company: string,
  title: string,
  location: string,
): string {
  return crypto
    .createHash("md5")
    .update(`${company}-${title}-${location}-${Date.now()}`)
    .digest("hex");
}

async function generateJobs() {
  await connectToDatabase();
  console.log("Connected to database");

  // Clear existing jobs
  await Job.deleteMany({});
  console.log("Cleared existing jobs");

  const jobs = jobDefinitions.map((jobDef, index) => ({
    externalJobId: `JOB-${Date.now()}-${index}`,
    source: "sandbox",
    company: jobDef.company,
    title: jobDef.title,
    location: jobDef.location,
    isRemote: jobDef.isRemote,
    description: jobDef.description,
    requirements: jobDef.requirements,
    skills: jobDef.skills,
    employmentType: jobDef.employmentType,
    startDate: new Date(Date.now() + Math.random() * 60 * 24 * 60 * 60 * 1000),
    questions: jobDef.questions,
    applyUrl: `https://sandbox.autojob.com/apply/${jobDef.company.toLowerCase().replace(/\s+/g, "-")}-${index}`,
    jobHash: generateJobHash(jobDef.company, jobDef.title, jobDef.location),
  }));

  // Insert all jobs
  const result = await Job.insertMany(jobs);
  console.log(`✅ Successfully created ${result.length} jobs`);

  // Display summary
  console.log("\n📊 Job Summary:");
  console.log(`- Total Jobs: ${jobs.length}`);
  console.log(
    `- India Locations: ${jobs.filter((j) => j.location.includes("India") || indianCities.some((city) => j.location === city)).length}`,
  );
  console.log(
    `- International: ${jobs.filter((j) => internationalCities.some((city) => j.location === city)).length}`,
  );
  console.log(`- Remote Jobs: ${jobs.filter((j) => j.isRemote).length}`);
  console.log(
    `- Full-time: ${jobs.filter((j) => j.employmentType === "full-time").length}`,
  );
  console.log(
    `- Contract: ${jobs.filter((j) => j.employmentType === "contract").length}`,
  );
  console.log(
    `- Internship: ${jobs.filter((j) => j.employmentType === "internship").length}`,
  );

  console.log("\n🎯 Expected Outcomes (based on 40% match threshold):");
  console.log(
    "- Should PASS (8-10 jobs): Razorpay, Zerodha, Swiggy, CRED, Atlassian, Dream11, GitLab, Ola, Salesforce, Freshworks",
  );
  console.log(
    "- Should SKIP - Location (5 jobs): Google SF, Grab SG, Monzo UK, Careem Dubai, Microsoft Intern",
  );
  console.log(
    "- Should SKIP - Skills (5 jobs): Flipkart Java, PhonePe DS, Zomato Frontend, Meesho Android, Oracle Contract",
  );
  console.log(
    "- REMOTE International (2 jobs): GitLab (should pass), Careem (should skip - management role)",
  );

  process.exit(0);
}

generateJobs().catch((error) => {
  console.error("❌ Error generating jobs:", error);
  process.exit(1);
});
