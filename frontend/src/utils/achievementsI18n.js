const toAchievementSlug = name =>
  String(name || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

const getTargetValue = achievement =>
  achievement?.criteriaValue ??
  achievement?.targetValue ??
  achievement?.criteriaThreshold ??
  achievement?.progress?.targetValue ??
  null;

const getTemplateDescription = (t, achievement) => {
  const targetValue = getTargetValue(achievement);
  const count = targetValue ?? 0;
  const criteriaType = achievement?.criteriaType;
  const defaultDescription = achievement?.description || '';

  switch (criteriaType) {
    case 'DONATION_COUNT':
      return t('achievements.descriptionTemplates.DONATION_COUNT', {
        count,
        defaultValue: defaultDescription,
      });
    case 'WEEKLY_STREAK':
      return t('achievements.descriptionTemplates.WEEKLY_STREAK', {
        count,
        defaultValue: defaultDescription,
      });
    case 'MESSAGE_COUNT':
      return t('achievements.descriptionTemplates.MESSAGE_COUNT', {
        count,
        defaultValue: defaultDescription,
      });
    case 'UNIQUE_PARTNER_COUNT':
      return t('achievements.descriptionTemplates.UNIQUE_PARTNER_COUNT', {
        count,
        defaultValue: defaultDescription,
      });
    default:
      return defaultDescription;
  }
};

export const translateAchievement = (t, achievement) => {
  if (!achievement) {
    return achievement;
  }

  const slug = toAchievementSlug(achievement.name);
  const templateDescription = getTemplateDescription(t, achievement);

  return {
    ...achievement,
    name: t(`achievements.catalog.${slug}.name`, achievement.name || ''),
    description: t(
      `achievements.catalog.${slug}.description`,
      templateDescription || achievement.description || ''
    ),
  };
};
