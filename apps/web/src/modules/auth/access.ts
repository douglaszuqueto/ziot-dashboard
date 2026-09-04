export const hasAccess = (items: readonly string[], required?: string) =>
  !required || items.includes(required);

export const hasModule = (modules: readonly string[], required?: string) =>
  !required || modules.includes(required);
