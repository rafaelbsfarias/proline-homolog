import { BlinkBlur } from 'react-loading-indicators';

export const Loading = () => {
  return (
    <div className="flex items-center justify-center h-screen">
      <BlinkBlur color="#002e4c" size="medium" text="" textColor="" />
    </div>
  );
};
