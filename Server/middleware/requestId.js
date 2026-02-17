import crypto from "crypto";

const generateId = () => {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  return crypto.randomBytes(16).toString("hex");
};

export default function requestId() {
  return (req, res, next) => {
    const incoming = req?.headers?.["x-request-id"];
    const id =
      typeof incoming === "string" && incoming.trim()
        ? incoming.trim()
        : generateId();

    req.requestId = id;
    res.setHeader("X-Request-Id", id);
    next();
  };
}
