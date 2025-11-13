export const mimeFromExtension = (ext) => {
  const map = {
    ".txt": "text/plain",
    ".json": "application/json",
    ".pdf": "application/pdf",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".csv": "text/csv",
  };

  return map[ext.toLowerCase()] || "application/octet-stream";
};
