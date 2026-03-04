export type DocumentCategory = {
  _id: string;
  name: string;
  department: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  filesCount: number;
};

export interface DocumentFile {
  _id: string;
  name: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  department: string;
  category: string | DocumentCategory;
  uploadedBy: {
    _id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface UploadFilePayload {
  file: File;
  name: string;
  fileName: string;
  category: string;
}
