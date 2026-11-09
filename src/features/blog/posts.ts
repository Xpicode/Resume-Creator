// Starter SEO guides (plan Phase 3C task 14). Plain data, rendered by /blog/[slug]. Keep advice honest and current.

export type Block = { heading: string; paragraphs?: string[]; bullets?: string[] };
export type Post = {
  slug: string;
  title: string;
  description: string;
  date: string; // YYYY-MM-DD
  blocks: Block[];
};

export const POSTS: Post[] = [
  {
    slug: "fresh-graduate-resume-philippines",
    title: "Fresh graduate resume (Philippines): what to include, section by section",
    description:
      "A simple guide for fresh grads in the Philippines: which sections to include, what order to use, and how to make OJT and school projects count.",
    date: "2026-11-09",
    blocks: [
      {
        heading: "Keep it to one page",
        paragraphs: [
          "As a fresh graduate, one page is enough. Recruiters often scan dozens of resumes for one opening, so put the most useful information at the top and cut anything that doesn't help you get this job.",
        ],
      },
      {
        heading: "The sections, in order",
        bullets: [
          "Contact details: full name, phone number, a professional email address and your city or province. A full street address isn't needed.",
          "Summary (2–3 lines): your degree, what you're good at and the kind of job you want.",
          "Education: degree, school, years, and honors such as Cum Laude or Dean's Lister. Add your thesis or capstone title if it relates to the job.",
          "Internship (OJT): company, your role, dates, and 2–4 bullets on what you actually did.",
          "Skills: tools and abilities the job post mentions and you really have — for example MS Excel, customer service, or a programming language.",
          "Trainings & Seminars, and Licenses & Eligibility: TESDA NC II, Civil Service eligibility or a PRC license if you have one.",
          'Character References: 2–3 people (OJT supervisor, adviser) or simply "Available upon request".',
        ],
      },
      {
        heading: "Make school work count",
        paragraphs: [
          'No full-time job yet? Your OJT, capstone, org work and part-time jobs are your experience. Write them like work: start with an action verb, say what you did, and add a number when you honestly know it — for example "Set up 40 new desktop computers during OJT".',
        ],
      },
      {
        heading: "Before you send it",
        bullets: [
          "Save it as a PDF so the layout doesn't change.",
          "Name the file clearly, like Juan-Dela-Cruz-Resume.pdf.",
          "Read the job post again and make sure the skills it asks for (that you have) appear on your resume.",
        ],
      },
    ],
  },
  {
    slug: "resume-with-no-experience",
    title: "What to put in a resume when you have no work experience",
    description:
      "No job yet? Here's what to write instead: OJT, projects, orgs, volunteering and skills — written so employers see what you can do.",
    date: "2026-11-09",
    blocks: [
      {
        heading: '"No experience" usually isn\'t true',
        paragraphs: [
          "Employers hiring for entry-level roles know you haven't had a full-time job. What they want to see is that you can learn, follow through and work with people. You've probably shown that already — in school, at home, or in your community.",
        ],
      },
      {
        heading: "What counts",
        bullets: [
          "OJT or internship — even a short one.",
          "School projects and your thesis or capstone, especially if you built, organized or researched something.",
          "Student organizations: officer roles, events you helped run, money you handled as treasurer.",
          "Part-time, freelance or family business work: selling online, tutoring, helping at a sari-sari store.",
          "Volunteering: barangay programs, church or youth groups, relief operations.",
          "Trainings, seminars and certificates, such as TESDA courses.",
        ],
      },
      {
        heading: "How to write it",
        paragraphs: [
          "Use the same format as a job: what you did, for whom, and the result. Start each bullet with an action verb such as organized, prepared, assisted, built or handled. Keep each bullet to one or two lines.",
          'Good: "Organized a 2-day seminar for 150 students as org secretary". Weak: "Responsible for events".',
        ],
      },
      {
        heading: "Never invent experience",
        paragraphs: [
          "It's tempting to stretch the truth, but employers check — and a reference call or a simple question in the interview can expose it. Describe what you really did as clearly and specifically as you can. That is enough.",
        ],
      },
    ],
  },
  {
    slug: "ats-friendly-resume-tips",
    title: "ATS-friendly resume tips for JobStreet and other online applications",
    description:
      "Many companies use software to sort online applications. These tips help your resume get read correctly, on JobStreet, Indeed or company career sites.",
    date: "2026-11-09",
    blocks: [
      {
        heading: "What an ATS does",
        paragraphs: [
          "An applicant tracking system (ATS) is software companies use to collect and sort applications. It reads the text in your resume so recruiters can search and filter. If the software can't read your resume, a person may never see it.",
        ],
      },
      {
        heading: "Format tips",
        bullets: [
          "Use one column. Two-column layouts, tables and text boxes can be read in the wrong order.",
          "Use standard headings: Summary, Experience, Education, Skills.",
          "Put contact details in the main body, not only in a header or footer.",
          "Don't put important text inside images or icons.",
          "Use a clear font and send a PDF with real, selectable text — not a scanned photo of a printout.",
        ],
      },
      {
        heading: "Keyword tips",
        bullets: [
          "Read the job post and note the skills and tools it repeats.",
          'Use the same words where they\'re true for you — if the post says "MS Excel", write "MS Excel", not only "spreadsheets".',
          "Put the most important skills in your summary and in your bullets, not just in the Skills list.",
          "Don't copy the whole job post or hide keywords in white text. Recruiters see it, and it looks dishonest.",
        ],
      },
      {
        heading: "One resume per kind of job",
        paragraphs: [
          "If you're applying to different kinds of roles — say, IT support and data encoding — keep a version for each and adjust the summary and skills. A resume aimed at one role reads better than one that tries to fit all of them.",
        ],
      },
    ],
  },
  {
    slug: "personal-information-on-resume-philippines",
    title: "Should you put your birthdate, civil status and religion on your resume?",
    description:
      "Older Philippine resume formats include age, civil status, religion and height. Here's what to include today, and when.",
    date: "2026-11-09",
    blocks: [
      {
        heading: "The short answer",
        paragraphs: [
          "For most private-sector jobs, leave them out. Your name, phone number, email address and city are enough for an employer to contact you.",
        ],
      },
      {
        heading: "Why many people now leave them out",
        bullets: [
          "Privacy: your resume gets passed around and uploaded to many websites. Less personal data means less risk if it leaks.",
          "Fairness: details like age, religion or civil status have nothing to do with how well you can do the job. The Anti-Age Discrimination in Employment Act (RA 10911) also bars employers from setting age limits in job ads.",
          "Space: on a one-page resume, that space is better used for skills and experience.",
        ],
      },
      {
        heading: "When to include them",
        paragraphs: [
          "Include a detail only when the employer asks for it — for example a job post or application form that requires it. Government jobs usually have their own form, the Personal Data Sheet (PDS), so these details go there rather than on your resume.",
        ],
      },
      {
        heading: "What about the 2x2 photo?",
        paragraphs: [
          "Many local employers still expect a 2x2 photo, especially for walk-in applications. If the job post asks for one, use a recent, plain-background photo. For online applications through an ATS, a photo-free, one-column resume is usually the safer choice.",
        ],
      },
    ],
  },
  {
    slug: "how-to-put-ojt-on-resume",
    title: "How to put your OJT (internship) on your resume",
    description:
      "Your OJT is real work experience. Here's how to list it, what to write in the bullets, and examples you can adapt.",
    date: "2026-11-09",
    blocks: [
      {
        heading: "Where it goes",
        paragraphs: [
          'Give it its own section — "Internship (OJT)" or "Work Experience" — and place it right after Education. If it\'s your most relevant experience for the job, you can even put it before Education.',
        ],
      },
      {
        heading: "What to include",
        bullets: [
          'Your role, such as "IT Support Intern" or "Accounting Intern".',
          "The company or office, and its city.",
          "The months you were there, for example Feb 2025 – May 2025.",
          "Two to four bullets about what you did.",
        ],
      },
      {
        heading: "Writing the bullets",
        paragraphs: [
          "Start each bullet with an action verb and be specific. Add numbers you actually know — how many people you helped, how many records you encoded, how many items you checked. If you don't know a number, don't guess; describe the task clearly instead.",
        ],
        bullets: [
          "Encoded and checked about 300 delivery records a week in MS Excel",
          "Assisted walk-in clients at the front desk and answered phone inquiries",
          "Prepared monthly inventory reports for the office supervisor",
          "Fixed printer and network issues for staff across three departments",
        ],
      },
      {
        heading: "Ask your supervisor to be a reference",
        paragraphs: [
          "Your OJT supervisor saw your work up close. Ask before you list them, and add their name, position and company under Character References.",
        ],
      },
    ],
  },
];

export const postBySlug = (slug: string) => POSTS.find((p) => p.slug === slug);
