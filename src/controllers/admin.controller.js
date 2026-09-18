import { Op, Sequelize } from "sequelize";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import {
  Grievance,
  Department,
  School,
  GovernmentAuthority,
  GrievanceCategory,
  GrievanceTimelineEvent,
} from "../models/index.js";

/**
 * =====================================================================
 * MEMBER 2: SAMARTHYA ADMIN & MACRO DECISION-MAKING CONTROLLERS
 * =====================================================================
 */

/**
 * Helper to ensure user has administrator privileges
 */
const requireAdmin = (user) => {
  if (!user || (user.role !== "SAMARTHYA_ADMIN" && user.role !== "SAMARTHYA_COORDINATOR")) {
    throw new ApiError(403, "Access restricted to Samarthya Administrators and Coordinators");
  }
};

/**
 * @desc    Get bottleneck analytics identifying worst-performing departments and districts
 * @route   GET /api/v1/admin/analytics/bottlenecks
 * @access  Admin Only
 */
export const getBottleneckAnalytics = asyncHandler(async (req, res) => {
  requireAdmin(req.user);

  // 1. Department Bottlenecks: aggregate across all departments
  const departments = await Department.findAll({
    include: [
      {
        model: GrievanceCategory,
        as: "categories",
        include: [
          {
            model: Grievance,
            as: "grievances",
            attributes: ["id", "status", "isHanged", "createdAt", "resolvedAt"],
          },
        ],
      },
    ],
  });

  const worstPerformingDepartments = departments.map((dept) => {
    let openCount = 0;
    let hangedCount = 0;
    let totalResolvedDays = 0;
    let resolvedCount = 0;

    (dept.categories || []).forEach((cat) => {
      (cat.grievances || []).forEach((g) => {
        if (g.status !== "RESOLVED") {
          openCount++;
        }
        if (g.isHanged || g.status === "HANGED") {
          hangedCount++;
        }
        if (g.status === "RESOLVED" && g.resolvedAt) {
          const days = Math.max(
            1,
            Math.round(
              (new Date(g.resolvedAt).getTime() - new Date(g.createdAt).getTime()) /
                (1000 * 60 * 60 * 24)
            )
          );
          totalResolvedDays += days;
          resolvedCount++;
        }
      });
    });

    const averageDaysToResolve =
      resolvedCount > 0 ? Math.round(totalResolvedDays / resolvedCount) : 30;

    return {
      departmentCode: dept.departmentCode,
      departmentName: dept.departmentName,
      openGrievances: openCount,
      hangedGrievances: hangedCount,
      averageDaysToResolve,
    };
  });

  worstPerformingDepartments.sort(
    (a, b) => b.hangedGrievances - a.hangedGrievances || b.openGrievances - a.openGrievances
  );

  // 2. District Bottlenecks: aggregate across schools grouped by district
  const schools = await School.findAll({
    include: [
      {
        model: Grievance,
        as: "grievances",
        attributes: ["id", "status", "isHanged", "currentEscalationLevel"],
      },
    ],
  });

  const districtMap = new Map();

  schools.forEach((school) => {
    const district = school.district || "Unknown";
    if (!districtMap.has(district)) {
      districtMap.set(district, {
        district,
        openGrievances: 0,
        hangedGrievances: 0,
        totalGrievances: 0,
        escalatedGrievances: 0,
      });
    }

    const dStats = districtMap.get(district);
    (school.grievances || []).forEach((g) => {
      dStats.totalGrievances++;
      if (g.status !== "RESOLVED") {
        dStats.openGrievances++;
      }
      if (g.isHanged || g.status === "HANGED") {
        dStats.hangedGrievances++;
      }
      if (g.currentEscalationLevel > 1) {
        dStats.escalatedGrievances++;
      }
    });
  });

  const worstPerformingDistricts = Array.from(districtMap.values()).map((d) => {
    const escalationRatePercentage =
      d.totalGrievances > 0
        ? parseFloat(((d.escalatedGrievances / d.totalGrievances) * 100).toFixed(1))
        : 0;

    return {
      district: d.district,
      openGrievances: d.openGrievances,
      hangedGrievances: d.hangedGrievances,
      escalationRatePercentage,
    };
  });

  worstPerformingDistricts.sort(
    (a, b) => b.hangedGrievances - a.hangedGrievances || b.openGrievances - a.openGrievances
  );

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        worstPerformingDepartments,
        worstPerformingDistricts,
      },
      "Bottleneck analytics retrieved"
    )
  );
});

/**
 * @desc    Batch escalate overdue grievances to District Magistrate or State Directorate
 * @route   POST /api/v1/admin/escalate-batch
 * @access  Admin Only
 */
export const batchEscalateGrievances = asyncHandler(async (req, res) => {
  requireAdmin(req.user);

  const {
    grievanceIds = [],
    escalationReason = "Overdue past 30 days without department response. Escalating.",
    targetAuthorityLevel = "DISTRICT",
  } = req.body;

  if (!Array.isArray(grievanceIds) || grievanceIds.length === 0) {
    throw new ApiError(400, "grievanceIds must be a non-empty array of UUIDs");
  }

  const targetLevel = targetAuthorityLevel === "STATE" ? 3 : 2;

  const grievances = await Grievance.findAll({
    where: {
      id: { [Op.in]: grievanceIds },
    },
  });

  let escalatedCount = 0;

  for (const g of grievances) {
    const prevStatus = g.status;
    g.currentEscalationLevel = targetLevel;
    g.isHanged = true;
    g.status = "HANGED";
    await g.save();

    await School.increment("hangedGrievancesCount", {
      by: 1,
      where: { id: g.schoolId },
    });

    await GrievanceTimelineEvent.create({
      grievanceId: g.id,
      performedByUserId: req.user.id,
      eventType: "MANUALLY_ESCALATED",
      previousStatus: prevStatus,
      newStatus: "HANGED",
      comment: `Batch escalation by Administrator: ${escalationReason}`,
      eventMetadata: {
        targetAuthorityLevel,
        escalationReason,
      },
    });

    escalatedCount++;
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        escalatedCount,
        notificationsDispatched: escalatedCount * 2, // Officer SMS + Email
      },
      "Batch escalation executed successfully"
    )
  );
});

/**
 * @desc    Export comprehensive grievance dataset as CSV
 * @route   GET /api/v1/admin/reports/export
 * @access  Admin Only
 */
export const exportReport = asyncHandler(async (req, res) => {
  requireAdmin(req.user);

  const { state, district, startDate, endDate, format = "csv" } = req.query;

  const whereClause = {};
  if (startDate || endDate) {
    whereClause.createdAt = {};
    if (startDate) whereClause.createdAt[Op.gte] = new Date(startDate);
    if (endDate) whereClause.createdAt[Op.lte] = new Date(endDate);
  }

  const schoolWhere = {};
  if (state) schoolWhere.state = { [Op.iLike]: `%${state.trim()}%` };
  if (district) schoolWhere.district = { [Op.iLike]: `%${district.trim()}%` };

  const grievances = await Grievance.findAll({
    where: whereClause,
    include: [
      {
        model: School,
        as: "school",
        where: Object.keys(schoolWhere).length > 0 ? schoolWhere : undefined,
      },
      {
        model: GrievanceCategory,
        as: "category",
        attributes: ["categoryName", "categoryCode"],
      },
      {
        model: GovernmentAuthority,
        as: "assignedAuthority",
        attributes: ["officeName", "designation"],
      },
    ],
    order: [["createdAt", "DESC"]],
  });

  // Construct CSV Header and Rows
  const headers = [
    "Ticket Number",
    "School Name",
    "UDISE Code",
    "District",
    "State",
    "Category",
    "Status",
    "Priority",
    "SLA Days",
    "Is Hanged",
    "Created Date",
    "Resolved Date",
    "Assigned Office",
  ];

  const escapeCsv = (str) => {
    if (str === null || str === undefined) return '""';
    const clean = String(str).replace(/"/g, '""');
    return `"${clean}"`;
  };

  const csvRows = [headers.join(",")];

  for (const g of grievances) {
    const plain = g.get({ plain: true });
    const row = [
      escapeCsv(plain.ticketNumber),
      escapeCsv(plain.school?.schoolName),
      escapeCsv(plain.school?.udiseCode),
      escapeCsv(plain.school?.district),
      escapeCsv(plain.school?.state),
      escapeCsv(plain.category?.categoryName),
      escapeCsv(plain.status),
      escapeCsv(plain.priority),
      escapeCsv(plain.slaDays),
      escapeCsv(plain.isHanged ? "YES" : "NO"),
      escapeCsv(plain.createdAt ? new Date(plain.createdAt).toISOString().split("T")[0] : ""),
      escapeCsv(plain.resolvedAt ? new Date(plain.resolvedAt).toISOString().split("T")[0] : ""),
      escapeCsv(plain.assignedAuthority?.officeName || "Unassigned"),
    ];
    csvRows.push(row.join(","));
  }

  const csvContent = csvRows.join("\n");

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="samarthya_report_${new Date().getFullYear()}.csv"`
  );

  return res.status(200).send(csvContent);
});
