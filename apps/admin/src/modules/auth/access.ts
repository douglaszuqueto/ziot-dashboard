export const hasPermission = (
  permissions: readonly string[],
  required?: string,
) => !required || permissions.includes(required);
