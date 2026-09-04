export const FieldError = ({ message }: { message?: string }) =>
  message ? <p className="text-xs text-alert">{message}</p> : null;
