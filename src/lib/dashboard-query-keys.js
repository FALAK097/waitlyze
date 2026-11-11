export const dashboardQueryKeys = {
  analytics: (waitListId) => ["waitlist-analytics", waitListId],
  analyticsRange: (waitListId, days, endDate, timeZone) => [
    ...dashboardQueryKeys.analytics(waitListId),
    days,
    endDate,
    timeZone,
  ],
  subscribers: (waitListId) => ["waitlist-subscribers", waitListId],
  subscriberPage: (waitListId, status, delivery, search, sort, page, cursor) => [
    ...dashboardQueryKeys.subscribers(waitListId),
    status,
    delivery,
    search,
    sort,
    page,
    cursor,
  ],
};
