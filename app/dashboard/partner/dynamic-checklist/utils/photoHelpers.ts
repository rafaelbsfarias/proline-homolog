export const isFilePhoto = (photo: File | string): photo is File => {
  return photo instanceof File;
};

export const isUrlPhoto = (photo: File | string): photo is string => {
  return typeof photo === 'string';
};

export const getPhotoPreviewUrl = (photo: File | string): string => {
  if (isFilePhoto(photo)) {
    return URL.createObjectURL(photo);
  }
  return photo;
};

export const getPhotoType = (photo: File | string): 'new' | 'saved' => {
  return isFilePhoto(photo) ? 'new' : 'saved';
};
