export const getFileExtension = (fileName: string): string => {
  return fileName.match(/\.[^/.]+$/)?.[0] ?? "";
};

export const getFileNameWithoutExtension = (fileName: string): string => {
  return fileName.replace(/\.[^/.]+$/, "");
};
