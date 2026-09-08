import { ActivityItem } from '../types';

export interface ActivityCategoryConfig {
  id: 'Category 1' | 'Category 2' | 'Category 3';
  number: 1 | 2 | 3;
  name: string;
  shortName: string;
  subtitle: string;
  requiredPoints: number;
  subcategories: string[];
}

export const KTU_ACTIVITY_CATEGORIES: ActivityCategoryConfig[] = [
  {
    id: 'Category 1',
    number: 1,
    name: 'Category 1: National & Social Initiatives',
    shortName: 'Category 1',
    subtitle: 'NSS, NCC, Community Service & Leadership',
    requiredPoints: 30,
    subcategories: [
      'Community Service & Volunteering (NSS/NCC)',
      'Student Leadership & Club Activities',
      'Volunteering',
      'Community Service',
      'NSS',
      'NCC',
      'National Initiatives',
      'Leadership',
    ],
  },
  {
    id: 'Category 2',
    number: 2,
    name: 'Category 2: Sports & Cultural Activities',
    shortName: 'Category 2',
    subtitle: 'Sports, Athletics, Arts & Cultural Competitions',
    requiredPoints: 30,
    subcategories: [
      'Sports & Athletics',
      'Cultural & Arts Competitions',
      'Sports',
      'Cultural',
      'Arts',
      'Athletics',
      'Games',
    ],
  },
  {
    id: 'Category 3',
    number: 3,
    name: 'Category 3: Professional & Technical Initiatives',
    shortName: 'Category 3',
    subtitle: 'Internships, Technical Competitions, Hackathons & MOOCs',
    requiredPoints: 40,
    subcategories: [
      'Internships & Industrial Training',
      'Technical Competitions & Hackathons',
      'MOOCs & Professional Certifications',
      'Internships',
      'Technical Competitions',
      'MOOCs',
      'Hackathons',
      'Certifications',
      'Research & Projects',
    ],
  },
];

/**
 * Maps an activity category string to one of the 3 KTU categories
 */
export function getCategoryForActivity(
  categoryStr: string
): 'Category 1' | 'Category 2' | 'Category 3' {
  if (!categoryStr) return 'Category 3';
  const clean = categoryStr.trim().toLowerCase();

  // Direct category identifier check
  if (clean.includes('category 1') || clean.includes('cat 1') || clean.includes('group 1') || clean.includes('group i')) {
    return 'Category 1';
  }
  if (clean.includes('category 2') || clean.includes('cat 2') || clean.includes('group 2') || clean.includes('group ii')) {
    return 'Category 2';
  }
  if (clean.includes('category 3') || clean.includes('cat 3') || clean.includes('group 3') || clean.includes('group iii')) {
    return 'Category 3';
  }

  // Check subcategories
  for (const cat of KTU_ACTIVITY_CATEGORIES) {
    for (const sub of cat.subcategories) {
      if (clean.includes(sub.toLowerCase())) {
        return cat.id;
      }
    }
  }

  // Fallbacks based on keywords
  if (clean.includes('sport') || clean.includes('cultur') || clean.includes('arts') || clean.includes('music') || clean.includes('dance')) {
    return 'Category 2';
  }
  if (clean.includes('nss') || clean.includes('ncc') || clean.includes('volunteer') || clean.includes('social') || clean.includes('communit') || clean.includes('service')) {
    return 'Category 1';
  }

  return 'Category 3';
}

export interface CategoryProgress {
  config: ActivityCategoryConfig;
  approvedPoints: number;
  pendingPoints: number;
  remainingPoints: number;
  progressPct: number;
  status: 'Completed' | 'In Progress';
}

export interface ActivitiesAnalysis {
  categoryProgress: Record<'Category 1' | 'Category 2' | 'Category 3', CategoryProgress>;
  overall: {
    targetPoints: number;
    approvedPoints: number;
    pendingPoints: number;
    remainingPoints: number;
    progressPct: number;
    completedCategories: number;
    inProgressCategories: number;
  };
}

/**
 * Computes category-wise and overall progress from the list of activities
 */
export function calculateActivitiesAnalysis(activities: ActivityItem[] = []): ActivitiesAnalysis {
  const resultProgress: Record<'Category 1' | 'Category 2' | 'Category 3', CategoryProgress> = {
    'Category 1': {
      config: KTU_ACTIVITY_CATEGORIES[0],
      approvedPoints: 0,
      pendingPoints: 0,
      remainingPoints: KTU_ACTIVITY_CATEGORIES[0].requiredPoints,
      progressPct: 0,
      status: 'In Progress',
    },
    'Category 2': {
      config: KTU_ACTIVITY_CATEGORIES[1],
      approvedPoints: 0,
      pendingPoints: 0,
      remainingPoints: KTU_ACTIVITY_CATEGORIES[1].requiredPoints,
      progressPct: 0,
      status: 'In Progress',
    },
    'Category 3': {
      config: KTU_ACTIVITY_CATEGORIES[2],
      approvedPoints: 0,
      pendingPoints: 0,
      remainingPoints: KTU_ACTIVITY_CATEGORIES[2].requiredPoints,
      progressPct: 0,
      status: 'In Progress',
    },
  };

  activities.forEach((act) => {
    const catId = getCategoryForActivity(act.category);
    const approvedPts = parseFloat(act.points || '0') || 0;
    const requestedPts = parseFloat(act.requested_points || '0') || 0;

    if (act.status === 'Approved') {
      resultProgress[catId].approvedPoints += approvedPts;
    } else if (act.status === 'Pending') {
      resultProgress[catId].pendingPoints += requestedPts;
    }
  });

  let completedCats = 0;
  let totalApproved = 0;
  let totalPending = 0;

  (['Category 1', 'Category 2', 'Category 3'] as const).forEach((catId) => {
    const item = resultProgress[catId];
    item.remainingPoints = Math.max(0, item.config.requiredPoints - item.approvedPoints);
    item.progressPct = Math.min(100, Math.round((item.approvedPoints / item.config.requiredPoints) * 100));
    item.status = item.approvedPoints >= item.config.requiredPoints ? 'Completed' : 'In Progress';
    if (item.status === 'Completed') completedCats++;

    totalApproved += item.approvedPoints;
    totalPending += item.pendingPoints;
  });

  const target = 100;
  const totalRemaining = Math.max(0, target - totalApproved);
  const overallPct = Math.min(100, Math.round((totalApproved / target) * 100));

  return {
    categoryProgress: resultProgress,
    overall: {
      targetPoints: target,
      approvedPoints: totalApproved,
      pendingPoints: totalPending,
      remainingPoints: totalRemaining,
      progressPct: overallPct,
      completedCategories: completedCats,
      inProgressCategories: 3 - completedCats,
    },
  };
}
