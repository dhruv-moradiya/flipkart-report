import { ReturnRecord } from "../types/return.types";
import { CommentsAnalytics } from "../types/analytics.types";

/**
 * Extracts and organizes seller & customer return comments
 *
 * Source Column: Comments
 */
export function calculateCommentsAnalytics(returns: ReturnRecord[]): CommentsAnalytics {
  const items: { returnId: string; comments: string }[] = [];
  let returnsWithComments = 0;
  let returnsWithoutComments = 0;

  returns.forEach((r) => {
    if (typeof r.comments === "string" && r.comments.trim().length > 0) {
      returnsWithComments++;
      items.push({
        returnId: r.returnId,
        comments: r.comments.trim(),
      });
    } else {
      returnsWithoutComments++;
    }
  });

  return {
    hasData: returnsWithComments > 0,
    totalComments: items.length,
    returnsWithComments,
    returnsWithoutComments,
    totalWithComments: returnsWithComments,
    totalWithoutComments: returnsWithoutComments,
    items,
  };
}
