import type { ResumeContent } from "@/features/resume/schema";

// Fictional fresh-grad resume for the public template gallery. Not a real person.
const id = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;

export const SAMPLE_RESUME: ResumeContent = {
  version: 1,
  personal: {
    firstName: "Juan",
    middleName: "Santos",
    lastName: "Dela Cruz",
    headline: "BS Information Technology Graduate",
    email: "juan.delacruz@example.com",
    phone: "0917 000 0000",
    cityProvince: "Quezon City, Metro Manila",
  },
  sections: [
    {
      id: id(1),
      type: "summary",
      title: "Summary",
      isVisible: true,
      items: [
        {
          id: id(2),
          text: "IT graduate with help desk OJT experience and a capstone project on inventory systems. Patient with users, careful with records, and quick to learn new tools.",
        },
      ],
    },
    {
      id: id(3),
      type: "education",
      title: "Education",
      isVisible: true,
      items: [
        {
          id: id(4),
          degree: "Bachelor of Science in Information Technology",
          school: "Sample State University",
          start: "2021-08",
          end: "2025-06",
          honors: "Cum Laude",
          thesisTitle: "Barcode-Based Inventory System for a Barangay Health Center",
        },
      ],
    },
    {
      id: id(5),
      type: "internship",
      title: "Internship (OJT)",
      isVisible: true,
      items: [
        {
          id: id(6),
          role: "IT Support Intern",
          company: "City Hall IT Office (sample)",
          location: "Quezon City",
          start: "2025-02",
          end: "2025-05",
          bullets: [
            "Fixed printer and computer issues for about 120 employees",
            "Set up and tested 40 new desktop computers before deployment",
            "Logged and followed up support requests in a shared spreadsheet",
          ],
        },
      ],
    },
    {
      id: id(7),
      type: "skills",
      title: "Skills",
      isVisible: true,
      items: [
        "Windows troubleshooting",
        "Networking basics",
        "MS Excel",
        "HTML and CSS",
        "Customer service",
      ].map((name, i) => ({ id: id(20 + i), name })),
    },
    {
      id: id(8),
      type: "trainings_seminars",
      title: "Trainings & Seminars",
      isVisible: true,
      items: [
        {
          id: id(9),
          title: "Cybersecurity Awareness Seminar",
          organizer: "DICT (sample)",
          date: "2024-10",
          hours: 8,
        },
      ],
    },
    {
      id: id(10),
      type: "licenses_eligibility",
      title: "Licenses & Eligibility",
      isVisible: true,
      items: [{ id: id(11), name: "TESDA NC II – Computer Systems Servicing", date: "2024-05" }],
    },
    {
      id: id(12),
      type: "references",
      title: "Character References",
      isVisible: true,
      items: [
        {
          id: id(13),
          name: "Engr. Maria Reyes",
          position: "OJT Supervisor",
          company: "City Hall IT Office (sample)",
        },
      ],
    },
  ],
};
