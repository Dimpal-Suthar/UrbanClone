import { deleteImage, deleteImages, uploadImage, uploadImages } from '@/services/storageService';
import { useMutation } from '@tanstack/react-query';

export const useUploadImage = () => {
  return useMutation({
    mutationFn: ({ imageUri, path, fileName }: { imageUri: string; path: string; fileName?: string }) =>
      uploadImage(imageUri, path, fileName),
  });
};

export const useUploadImages = () => {
  return useMutation({
    mutationFn: ({ imageUris, path }: { imageUris: string[]; path: string }) =>
      uploadImages(imageUris, path),
  });
};

export const useDeleteImage = () => {
  return useMutation({
    mutationFn: deleteImage,
  });
};

export const useDeleteImages = () => {
  return useMutation({
    mutationFn: deleteImages,
  });
};
