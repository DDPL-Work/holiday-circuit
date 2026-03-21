export const createDashboardNotification = async (queryId, quoteDetails) => {
  // Placeholder: store notification in DB
  console.log(`Dashboard notification created for query ${queryId}`, quoteDetails);
  return { status: "created", queryId };
};