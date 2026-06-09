import React from 'react';
import { Image } from 'expo-image';

interface InstagramLogoProps {
  color: string;
  width?: number;
  height?: number;
}

export const InstagramLogo: React.FC<InstagramLogoProps> = ({
  color,
  width = 104,
  height = 28,
}) => {
  return (
    <Image
      source={require('@/assets/images/logo.svg')}
      style={{
        width,
        height,
        tintColor: color,
      }}
      contentFit="contain"
    />
  );
};
