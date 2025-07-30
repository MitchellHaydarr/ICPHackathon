import { useToast, UseToastOptions } from '@chakra-ui/react';
import { useEffect, useCallback } from 'react';

export enum ToastType {
  SUCCESS = 'success',
  ERROR = 'error',
  INFO = 'info',
  WARNING = 'warning'
}

// Create a global toast object for use throughout the app
let globalToastFn: (options: UseToastOptions) => void;

export const setGlobalToast = (toastFn: (options: UseToastOptions) => void) => {
  globalToastFn = toastFn;
};

export const toast = {
  success: (title: string, description?: string) => {
    globalToastFn({
      title,
      description,
      status: 'success',
      duration: 5000,
      isClosable: true,
      position: 'bottom-right',
    });
  },
  error: (title: string, description?: string) => {
    globalToastFn({
      title,
      description,
      status: 'error',
      duration: 9000,
      isClosable: true,
      position: 'bottom-right',
    });
  },
  info: (title: string, description?: string) => {
    globalToastFn({
      title,
      description,
      status: 'info',
      duration: 5000,
      isClosable: true,
      position: 'bottom-right',
    });
  },
  warning: (title: string, description?: string) => {
    globalToastFn({
      title,
      description,
      status: 'warning',
      duration: 7000,
      isClosable: true,
      position: 'bottom-right',
    });
  },
  custom: (options: UseToastOptions) => {
    globalToastFn(options);
  }
};

// This component initializes the toast system
const ToastContainer: React.FC = () => {
  const toastFn = useToast();
  
  const setToastFn = useCallback(() => {
    setGlobalToast(toastFn);
  }, [toastFn]);
  
  useEffect(() => {
    setToastFn();
  }, [setToastFn]);
  
  return null;
};

export default ToastContainer;
