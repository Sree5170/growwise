// Pure rule-based engine: no database, no network, no AI key. Deterministic given its inputs.
// An AI re-ranker can be added later via the `rerank` option, but it only ever sees the ELIGIBLE list,
// so it cannot bypass the age and safety rules (see eligibleActivities).
import { AGE_GROUP_RANGES, CATEGORY_DOMAIN } from '../../utils/constants.js';

const DOMAINS = ['physical', 'cognitive', 'creative', 'practical', 'safety'];
const norm = (s) => String(s).toLowerCase().trim();
const DAY = 86400000;

export function materialsCoverage(activity, available = []) {
  if (!activity.materials?.length) return 1;
  const have = available.map(norm);
  const covered = activity.materials.filter((m) => have.some((h) => norm(m).includes(h) || h.includes(norm(m)))).length;
  return covered / activity.materials.length;
}

// Hard filters, applied BEFORE any scoring (rules 1-3 + constraints).
export function eligibleActivities(child, activities, { availableMinutes } = {}) {
  const [lo, hi] = AGE_GROUP_RANGES[child.ageGroup];
  const minutes = availableMinutes ?? child.preferences?.availableMinutes ?? 30;
  const prefs = child.preferences || {};
  const declared = (prefs.materialsAvailable || []).length > 0;
  return activities.filter((a) => {
    if (!a.isPublished) return false;
    if (a.minimumAge > hi || a.maximumAge < lo) return false;                       // 1. age range
    if (a.durationMinutes > minutes) return false;                                    // 2. time constraint
    if (a.needsOutdoorSpace && prefs.hasOutdoorSpace === false) return false;         // 2. outdoor space
    if (a.requiresAdultSupervision && prefs.adultAvailable === false) return false;   // 3. supervision
    if (declared && materialsCoverage(a, prefs.materialsAvailable) < 0.6) return false; // 2. materials
    return true;
  });
}

export function recommend({ child, activities, recentTasks = [], now = new Date(), limit = 5, availableMinutes, rerank } = {}) {
  const prefs = child.preferences || {};
  const pool = eligibleActivities(child, activities, { availableMinutes });
  const byId = Object.fromEntries(activities.map((a) => [String(a._id), a]));

  const recent = recentTasks.filter((t) => t.status !== 'cancelled').map((t) => ({ t, a: byId[String(t.activityId)], age: (now - new Date(t.scheduledDate)) / DAY })).filter((x) => x.a);
  const lastWeek = recent.filter((x) => x.age <= 7 && x.age >= -7);
  const domainCount = Object.fromEntries(DOMAINS.map((d) => [d, 0]));
  for (const x of lastWeek) domainCount[CATEGORY_DOMAIN[x.a.category]]++;
  const minCount = Math.min(...Object.values(domainCount));
  const lastCategories = recent.sort((a, b) => new Date(b.t.scheduledDate) - new Date(a.t.scheduledDate)).slice(0, 3).map((x) => x.a.category);

  const scored = [];
  for (const a of pool) {
    const reasons = []; let score = 0;
    const rec = recent.find((x) => String(x.a._id) === String(a._id));
    if (rec && rec.age <= 7) continue;                                               // 5. never repeat within a week
    if (rec && rec.age <= 14) { score -= 3; }                                        // 5. soft penalty within 2 weeks

    const interests = new Set((child.interests || []).map(norm));
    const matched = (a.tags || []).filter((t) => interests.has(norm(t)));
    if (matched.length) { score += 3 * matched.length; reasons.push(`Matches their interest in ${matched.slice(0, 2).join(' and ')}`); }  // 4.
    if ((prefs.preferredCategories || []).includes(a.category)) { score += 2; reasons.push('A category they like'); }

    const dom = CATEGORY_DOMAIN[a.category];
    if (domainCount[dom] === minCount) { score += 3; reasons.push(domainCount[dom] === 0 ? `Adds ${dom} variety — none planned this week` : `Balances the week (fewest ${dom} activities so far)`); } // 6.
    else if (domainCount[dom] >= 3) { score -= 1; }
    if (lastCategories.includes(a.category)) score -= 1;

    if (materialsCoverage(a, prefs.materialsAvailable) === 1 && (prefs.materialsAvailable || []).length) { score += 1; reasons.push('Uses materials you already have'); }
    const minutes = availableMinutes ?? prefs.availableMinutes ?? 30;
    reasons.push(`Takes ${a.durationMinutes} min (you have ${minutes})`);
    if (a.requiresAdultSupervision) reasons.push('Needs an adult nearby');
    scored.push({ activity: a, score, reasons, domain: dom });
  }

  scored.sort((x, y) => y.score - x.score || x.activity.durationMinutes - y.activity.durationMinutes || String(x.activity._id).localeCompare(String(y.activity._id)));
  let ranked = rerank ? rerank(scored) : scored;                                       // optional future AI hook (eligible items only)
  ranked = ranked.filter((r) => scored.some((s) => s.activity === r.activity));        // guard: cannot add ineligible items

  const picked = []; const perDomain = {};
  for (const r of ranked) {                                                            // keep the list varied: max 2 per domain
    if ((perDomain[r.domain] || 0) >= 2) continue;
    perDomain[r.domain] = (perDomain[r.domain] || 0) + 1; picked.push(r);
    if (picked.length >= limit) break;
  }
  return picked.map((r) => {
    const alt = r.activity.needsOutdoorSpace ? pool.find((p) => p.isIndoor && !p.needsOutdoorSpace && CATEGORY_DOMAIN[p.category] === r.domain && String(p._id) !== String(r.activity._id)) : null; // 7.
    return {
      activity: r.activity, score: r.score,
      reason: r.reasons.join(' · '),                                                   // 8.
      ...(alt ? { indoorAlternative: { id: alt._id, title: alt.title } } : {}),
    };
  });
}
