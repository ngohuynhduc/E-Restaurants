export const paginate = ({ page = 1, limit = 10 }: { page?: number; limit?: number }) => {
  const pageInt = Number(page);
  const limitInt = Number(limit);
  const offset = (pageInt - 1) * limitInt;

  return {
    limit: limitInt,
    offset,
    page: pageInt,
  };
};
