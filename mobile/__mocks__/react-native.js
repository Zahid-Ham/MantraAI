export const Platform = {
  OS: 'android',
  select: (objs) => objs.android || objs.default,
};

export default {
  Platform,
};
