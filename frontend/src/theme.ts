import { extendTheme } from '@chakra-ui/react';
import type { ThemeConfig } from '@chakra-ui/react';
import { createBreakpoints } from '@chakra-ui/theme-tools';

// Customize Chakra UI theme to match our design preferences
const config: ThemeConfig = {
  initialColorMode: 'light',
  useSystemColorMode: true,
};

const colors = {
  brand: {
    50: '#E6F6FF',
    100: '#BFEBFE',
    200: '#91DBFC',
    300: '#61CBFA',
    400: '#39BBF8',
    500: '#0EA5E9', // Primary brand color
    600: '#0284C7',
    700: '#0369A1',
    800: '#075985',
    900: '#0C4A6E',
  },
  secondary: {
    50: '#ECFDF5',
    100: '#D1FAE5',
    200: '#A7F3D0',
    300: '#6EE7B7',
    400: '#34D399',
    500: '#10B981', // Secondary brand color
    600: '#059669',
    700: '#047857',
    800: '#065F46',
    900: '#064E3B',
  },
};

const fonts = {
  heading: 'Inter, system-ui, sans-serif',
  body: 'Inter, system-ui, sans-serif',
};

// Define breakpoints for responsive design using the createBreakpoints helper
const breakpoints = createBreakpoints({
  sm: '30em', // 480px
  md: '48em', // 768px
  lg: '62em', // 992px
  xl: '80em', // 1280px
  '2xl': '96em', // 1536px
});

// Card components and other custom styles
const components = {
  Card: {
    baseStyle: {
      p: '6',
      borderRadius: 'lg',
      boxShadow: 'lg',
      bg: 'white',
      _dark: {
        bg: 'gray.800',
      },
    },
  },
  Button: {
    baseStyle: {
      fontWeight: 'semibold',
      borderRadius: 'md',
    },
    variants: {
      primary: {
        bg: 'brand.500',
        color: 'white',
        _hover: {
          bg: 'brand.600',
        },
        _active: {
          bg: 'brand.700',
        },
      },
      secondary: {
        bg: 'secondary.500',
        color: 'white',
        _hover: {
          bg: 'secondary.600',
        },
        _active: {
          bg: 'secondary.700',
        },
      },
      connect: {
        bg: 'gray.100',
        color: 'gray.800',
        _hover: {
          bg: 'gray.200',
        },
        _active: {
          bg: 'gray.300',
        },
        _dark: {
          bg: 'gray.700',
          color: 'white',
          _hover: {
            bg: 'gray.600',
          },
          _active: {
            bg: 'gray.500',
          },
        },
      },
    },
  },
};

const theme = extendTheme({ config, colors, fonts, components, breakpoints });

export default theme;
