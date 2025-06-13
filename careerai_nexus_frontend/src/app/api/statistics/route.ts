import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

/**
 * PUBLIC_INTERFACE
 * API endpoint to aggregate per-user dashboard statistics for the authenticated user.
 * Aggregates information from Interview, Resume, and Insight tables.
 * Returns: { interview: {...}, resume: {...}, insight: {...} }
 */
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return new Response(
      JSON.stringify({ error: "Unauthorized." }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }

  const userId = session.user.id;

  // Gather stats from Interview, Resume, and Insight for the current user.
  try {
    // Interviews aggregation
    const interviewStats = await prisma.interview.aggregate({
      _count: { id: true },
      _avg: { score: true },
      _max: { score: true },
      where: { userId },
    });
    // Weekly interview trend (last 6 weeks, grouped by weekStart ISO week)
    const interviewTrend = await prisma.interview.findMany({
      where: { userId },
      orderBy: { scheduledAt: "asc" },
      select: {
        scheduledAt: true,
        score: true,
      },
    });

    // Resumes aggregation
    const resumeCount = await prisma.resume.count({ where: { userId } });
    const submissionSum = await prisma.resume.aggregate({
      _sum: { submissionCount: true },
      where: { userId },
    });

    // Cover letters: For demo, just mock (e.g., no cover letter table)
    const coverLetterCount = 7; // Replace with actual query if/when implemented

    // Insights
    const insights = await prisma.insight.findMany({
      where: { userId },
      orderBy: { weekStart: "asc" },
      select: {
        weekStart: true,
        summary: true,
        chartData: true,
      },
      take: 6, // Limit to last 6 weeks
    });

    // Compute "weeks tracked"
    const weeksTracked = insights.length;

    // Build API response
    const responseData = {
      interview: {
        count: interviewStats._count.id,
        averageScore: interviewStats._avg.score,
        maxScore: interviewStats._max.score,
        weeklyTrend: interviewTrend,
      },
      resume: {
        count: resumeCount,
        submissionTotal: submissionSum._sum.submissionCount ?? 0,
        coverLetterCount, // placeholder - real table/logic TBD
      },
      insights: {
        weeksTracked,
        items: insights,
      },
    };

    return new Response(
      JSON.stringify(responseData),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error?.message || "Internal Server Error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
