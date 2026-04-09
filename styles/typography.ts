import { normalizeFont } from "./spacing";

export const typography = {
  titleLarge: {
    fontSize: normalizeFont(28),
    fontWeight: "700" as const,
  },
  title: {
    fontSize: normalizeFont(22),
    fontWeight: "700" as const,
  },
  heading: {
    fontSize: normalizeFont(18),
    fontWeight: "600" as const,
  },
  body: {
    fontSize: normalizeFont(14),
    fontWeight: "400" as const,
  },
  bodyMedium: {
    fontSize: normalizeFont(16),
    fontWeight: "500" as const,
  },
  caption: {
    fontSize: normalizeFont(12),
    fontWeight: "400" as const,
  },
  button: {
    fontSize: normalizeFont(15),
    fontWeight: "600" as const,
  },
};
