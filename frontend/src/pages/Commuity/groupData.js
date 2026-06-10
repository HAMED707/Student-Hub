export const storageKey = "community-groups-state";

export const supportedImageTypes = ["image/jpeg", "image/png", "image/webp"];

export const initialGroups = [
  {
    id: 1,
    name: "EELU Community",
    members: 1200,
    activeToday: 184,
    weeklyPosts: 38,
    unread: 6,
    lastActivity: "12 min ago",
    lastPostTime: "15 min ago",
    lastActiveMember: "Ahmed",
    recentPostsCount: 5,
    latestActivity: "Ahmed posted 15 minutes ago",
    activityFeed: [
      {
        id: 1,
        user: "Ahmed",
        action: "posted an apartment update",
        time: "15 min ago",
      },
      {
        id: 2,
        user: "Mariam",
        action: "asked about room share",
        time: "1 hr ago",
      },
      {
        id: 3,
        user: "Saeed",
        action: "shared a study group event",
        time: "3 hrs ago",
      },
    ],
    image:
      "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=900&q=80",
    desc: "A community for EELU University students to share housing tips, study groups, and events.",
    city: "Cairo",
    university: "EELU",
    category: "University",
    isMyGroup: true,
    isRecommended: true,
    joinType: "open",
  },
  {
    id: 2,
    name: "Cairo University Students",
    members: 3500,
    activeToday: 520,
    weeklyPosts: 94,
    unread: 0,
    lastActivity: "1 hr ago",
    lastPostTime: "28 min ago",
    lastActiveMember: "Nour",
    recentPostsCount: 18,
    latestActivity: "Nour shared a new housing lead",
    activityFeed: [
      {
        id: 1,
        user: "Nour",
        action: "shared a new housing lead",
        time: "28 min ago",
      },
      {
        id: 2,
        user: "Karim",
        action: "commented on a landlord review",
        time: "2 hrs ago",
      },
      {
        id: 3,
        user: "Laila",
        action: "posted a weekend meetup",
        time: "4 hrs ago",
      },
    ],
    image:
      "https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=900&q=80",
    desc: "Find nearby apartments, ask about landlords, and connect with students around Cairo University.",
    city: "Giza",
    university: "Cairo University",
    category: "Housing",
    isMyGroup: false,
    isRecommended: true,
    joinType: "request",
  },
  {
    id: 3,
    name: "Ain Shams Hub",
    members: 900,
    activeToday: 76,
    weeklyPosts: 22,
    unread: 0,
    lastActivity: "Today",
    lastPostTime: "40 min ago",
    lastActiveMember: "Reem",
    recentPostsCount: 9,
    latestActivity: "Reem posted a study guide",
    activityFeed: [
      {
        id: 1,
        user: "Reem",
        action: "posted a study guide",
        time: "40 min ago",
      },
      {
        id: 2,
        user: "Omar",
        action: "requested roommate tips",
        time: "6 hrs ago",
      },
      {
        id: 3,
        user: "Salma",
        action: "shared a transport update",
        time: "Yesterday",
      },
    ],
    image:
      "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=900&q=80",
    desc: "Official hub for Ain Shams students looking for roommates, study partners, and commute advice.",
    city: "Cairo",
    university: "Ain Shams",
    category: "Study",
    isMyGroup: false,
    isRecommended: false,
    joinType: "open",
  },
  {
    id: 4,
    name: "AUC Housing",
    members: 2100,
    activeToday: 244,
    weeklyPosts: 57,
    unread: 0,
    lastActivity: "30 min ago",
    lastPostTime: "12 min ago",
    lastActiveMember: "Hana",
    recentPostsCount: 12,
    latestActivity: "Hana asked about compound fees",
    activityFeed: [
      {
        id: 1,
        user: "Hana",
        action: "asked about compound fees",
        time: "12 min ago",
      },
      { id: 2, user: "Adam", action: "posted a new sublet", time: "1 hr ago" },
      {
        id: 3,
        user: "Mona",
        action: "shared a nearby cafe review",
        time: "5 hrs ago",
      },
    ],
    image:
      "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=900&q=80",
    desc: "Housing discussions for AUC students, including compounds, shared flats, and transport options.",
    city: "New Cairo",
    university: "AUC",
    category: "Housing",
    isMyGroup: false,
    isRecommended: true,
    joinType: "request",
  },
  {
    id: 5,
    name: "Nasr City Roommates",
    members: 780,
    activeToday: 133,
    weeklyPosts: 41,
    unread: 0,
    lastActivity: "2 hrs ago",
    lastPostTime: "1 hr ago",
    lastActiveMember: "Tamer",
    recentPostsCount: 6,
    latestActivity: "Tamer posted a roommate match",
    activityFeed: [
      {
        id: 1,
        user: "Tamer",
        action: "posted a roommate match",
        time: "1 hr ago",
      },
      {
        id: 2,
        user: "Aya",
        action: "asked about rent splitting",
        time: "3 hrs ago",
      },
      {
        id: 3,
        user: "Mazen",
        action: "shared a new flat visit",
        time: "Yesterday",
      },
    ],
    image:
      "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=900&q=80",
    desc: "Roommate matching and apartment leads around Nasr City and nearby campuses.",
    city: "Nasr City",
    university: "Multiple Universities",
    category: "Roommates",
    isMyGroup: false,
    isRecommended: true,
    joinType: "open",
  },
  {
    id: 6,
    name: "Student Part-time Jobs",
    members: 1640,
    activeToday: 201,
    weeklyPosts: 72,
    unread: 0,
    lastActivity: "45 min ago",
    lastPostTime: "15 min ago",
    lastActiveMember: "Sara",
    recentPostsCount: 15,
    latestActivity: "Sara shared a new internship post",
    activityFeed: [
      {
        id: 1,
        user: "Sara",
        action: "shared a new internship post",
        time: "15 min ago",
      },
      { id: 2, user: "Omar", action: "posted a job alert", time: "2 hrs ago" },
      {
        id: 3,
        user: "Lina",
        action: "asked about part-time help",
        time: "Yesterday",
      },
    ],
    image:
      "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=900&q=80",
    desc: "Part-time jobs, internships, and paid opportunities for students around Cairo.",
    city: "Cairo",
    university: "All Universities",
    category: "Jobs",
    isMyGroup: false,
    isRecommended: false,
    joinType: "open",
  },
];

export const loadGroups = () => {
  if (typeof window === "undefined") {
    return initialGroups;
  }

  try {
    const stored = localStorage.getItem(storageKey);
    if (!stored) {
      return initialGroups;
    }

    const parsed = JSON.parse(stored);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch (error) {
    console.error("Failed to parse saved group state:", error);
  }

  return initialGroups;
};

export const saveGroups = (groups) => {
  if (typeof window === "undefined") {
    return;
  }

  try {
    localStorage.setItem(storageKey, JSON.stringify(groups));
  } catch (error) {
    console.error("Failed to save group state:", error);
  }
};
