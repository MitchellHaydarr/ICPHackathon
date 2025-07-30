import React from 'react';
import { useLocation } from 'react-router-dom';
import {
  Box,
  Flex,
  Button,
  IconButton,
  Stack,
  Spacer,
  Circle,
  Text,
  HStack,
  Tooltip,
  Badge
} from '@chakra-ui/react';
import { HamburgerIcon, CloseIcon, MoonIcon, SunIcon } from '@chakra-ui/icons';
import config from '../config';

interface NavbarProps {
  isConnected?: boolean;
  isConnecting?: boolean;
  onConnect?: () => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
  principal?: string;
}

const Navbar = ({ 
  isConnected = false, 
  isConnecting = false, 
  onConnect = () => {}, 
  darkMode = false, 
  toggleDarkMode = () => {},
  principal = ''
}: NavbarProps) => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const location = useLocation();
  
  // Colors based on color mode
  const bgColor = darkMode ? 'gray.800' : 'white';
  const borderColor = darkMode ? 'gray.700' : 'gray.200';
  const buttonBg = darkMode ? 'brand.400' : 'brand.500';
  const buttonColor = darkMode ? 'gray.800' : 'white';
  const buttonHoverBg = darkMode ? 'brand.300' : 'brand.600';
  const textColor = darkMode ? 'white' : 'gray.600';
  const hoverBgColor = darkMode ? 'gray.700' : 'gray.100';
  const navActiveBg = darkMode ? 'brand.600' : 'gray.100';
  const navHoverBg = darkMode ? 'whiteAlpha.200' : 'gray.100';
  const navActiveBorderColor = darkMode ? 'brand.300' : 'brand.500';
  
  const isActive = (path: string) => location.pathname === path;

  return (
    <Box>
      <Flex
        bg={bgColor}
        color={textColor}
        minH="60px"
        py={2}
        px={4}
        borderBottom="1px"
        borderStyle="solid"
        borderColor={borderColor}
        alignItems="center"
      >
        <Flex flex={1}>
          <Box
            onClick={() => window.location.href = '/'}
            textAlign="left"
            fontFamily="heading"
            fontWeight="bold"
            fontSize="xl"
            color={darkMode ? 'white' : 'gray.800'}
            _hover={{
              textDecoration: 'none',
              color: darkMode ? 'brand.300' : 'brand.500',
              cursor: 'pointer'
            }}
            mr={4}
          >
            Atlas ICP
          </Box>

          <Flex display={{ base: 'none', md: 'flex' }} ml={4} alignItems="center">
            {/* Desktop Navigation */}
            <Box position="relative">
              <Box
                onClick={() => window.location.href = '/'}
                px={4}
                py={2}
                rounded="md"
                bg={isActive('/') ? navActiveBg : 'transparent'}
                color={isActive('/') ? (darkMode ? 'white' : 'gray.800') : textColor}
                borderBottom={isActive('/') ? '2px solid' : 'none'}
                borderColor={navActiveBorderColor}
                _hover={{
                  textDecoration: 'none',
                  bg: navHoverBg,
                  cursor: 'pointer'
                }}
                fontWeight={isActive('/') ? 'medium' : 'normal'}
                transition="all 0.2s"
              >
                Dashboard
              </Box>
            </Box>
            
            <Box position="relative">
              <Box
                onClick={() => window.location.href = '/portfolio'}
                px={4}
                py={2}
                rounded="md"
                bg={isActive('/portfolio') ? navActiveBg : 'transparent'}
                color={isActive('/portfolio') ? (darkMode ? 'white' : 'gray.800') : textColor}
                borderBottom={isActive('/portfolio') ? '2px solid' : 'none'}
                borderColor={navActiveBorderColor}
                _hover={{
                  textDecoration: 'none',
                  bg: navHoverBg,
                  cursor: 'pointer'
                }}
                fontWeight={isActive('/portfolio') ? 'medium' : 'normal'}
                transition="all 0.2s"
              >
                Portfolio
              </Box>
            </Box>
            
            <Box position="relative">
              <Box
                onClick={() => window.location.href = '/ai-control'}
                px={4}
                py={2}
                rounded="md"
                bg={isActive('/ai-control') ? navActiveBg : 'transparent'}
                color={isActive('/ai-control') ? (darkMode ? 'white' : 'gray.800') : textColor}
                borderBottom={isActive('/ai-control') ? '2px solid' : 'none'}
                borderColor={navActiveBorderColor}
                _hover={{
                  textDecoration: 'none',
                  bg: navHoverBg,
                  cursor: 'pointer'
                }}
                fontWeight={isActive('/ai-control') ? 'medium' : 'normal'}
                transition="all 0.2s"
              >
                AI Control
              </Box>
            </Box>
          </Flex>
        </Flex>

        <Flex gap="2">
          <IconButton
            aria-label="Toggle color mode"
            variant="ghost"
            size="md"
            onClick={toggleDarkMode}
            color={darkMode ? 'yellow.200' : 'blue.700'}
            _hover={{
              bg: darkMode ? 'whiteAlpha.200' : 'gray.100'
            }}
          >
            {darkMode ? <SunIcon /> : <MoonIcon />}
          </IconButton>

          <Tooltip label={config.useMockWallet ? "Using mock wallet" : "Internet Identity wallet"} placement="bottom">
            <Button
              size="md"
              bg={buttonBg}
              color={buttonColor}
              _hover={{
                bg: buttonHoverBg,
              }}
              onClick={onConnect || (() => {})}
              disabled={isConnecting}
              position="relative"
            >
              {isConnected ? (
                <>
                  <Circle size="8px" bg="green.400" mr={2} />
                  {principal ? `${principal.slice(0, 5)}...` : 'Connected'}
                  {config.useMockWallet && (
                    <Badge 
                      position="absolute" 
                      top="-8px" 
                      right="-8px" 
                      colorScheme="orange" 
                      fontSize="xs"
                      borderRadius="full"
                    >
                      Mock
                    </Badge>
                  )}
                </>
              ) : (
                <>
                  Connect to IC
                  {config.useMockWallet && (
                    <Badge 
                      ml={2} 
                      colorScheme="orange" 
                      fontSize="xs"
                    >
                      Mock
                    </Badge>
                  )}
                </>
              )}
            </Button>
          </Tooltip>

          <IconButton
            onClick={() => setIsMenuOpen(true)}
            aria-label="Open menu"
            variant="ghost"
            display={{ base: 'flex', md: 'none' }}
            color={darkMode ? 'white' : 'gray.700'}
            _hover={{
              bg: darkMode ? 'whiteAlpha.200' : 'gray.100'
            }}
          >
            <HamburgerIcon />
          </IconButton>
        </Flex>
      </Flex>

      {isMenuOpen && (
        <Box 
          position="fixed"
          top="0"
          right="0"
          bottom="0"
          width="250px"
          bg={bgColor}
          boxShadow="-2px 0 10px rgba(0, 0, 0, 0.3)"
          zIndex="modal"
          p="5"
          borderLeft={darkMode ? '1px solid' : 'none'}
          borderColor={darkMode ? 'gray.700' : 'gray.200'}
        >
          <Flex justify="flex-end" mb="4">
            <IconButton
              aria-label="Close menu"
              size="sm"
              onClick={() => setIsMenuOpen(false)}
              children={<CloseIcon />}
              variant="ghost"
              color={darkMode ? 'white' : 'gray.700'}
              _hover={{
                bg: darkMode ? 'whiteAlpha.200' : 'gray.100'
              }}
            />
          </Flex>
          <Flex direction="column" mt={8} gap="4">
              <Button 
                variant="ghost" 
                justifyContent="flex-start"
                onClick={() => {
                  setIsMenuOpen(false);
                  window.location.href = '/';
                }}
                width="full"
                bg={isActive('/') ? navActiveBg : 'transparent'}
                color={isActive('/') ? (darkMode ? 'white' : 'gray.800') : textColor}
                borderLeft={isActive('/') ? '4px solid' : 'none'}
                borderColor={navActiveBorderColor}
                fontWeight={isActive('/') ? 'medium' : 'normal'}
                _hover={{
                  bg: navHoverBg
                }}
              >
                Dashboard
              </Button>
              
              <Button 
                variant="ghost" 
                justifyContent="flex-start"
                onClick={() => {
                  setIsMenuOpen(false);
                  window.location.href = '/portfolio';
                }}
                width="full"
                bg={isActive('/portfolio') ? navActiveBg : 'transparent'}
                color={isActive('/portfolio') ? (darkMode ? 'white' : 'gray.800') : textColor}
                borderLeft={isActive('/portfolio') ? '4px solid' : 'none'}
                borderColor={navActiveBorderColor}
                fontWeight={isActive('/portfolio') ? 'medium' : 'normal'}
                _hover={{
                  bg: navHoverBg
                }}
              >
                Portfolio
              </Button>
              
              <Button 
                variant="ghost" 
                justifyContent="flex-start"
                onClick={() => {
                  setIsMenuOpen(false);
                  window.location.href = '/ai-control';
                }}
                width="full"
                bg={isActive('/ai-control') ? navActiveBg : 'transparent'}
                color={isActive('/ai-control') ? (darkMode ? 'white' : 'gray.800') : textColor}
                borderLeft={isActive('/ai-control') ? '4px solid' : 'none'}
                borderColor={navActiveBorderColor}
                fontWeight={isActive('/ai-control') ? 'medium' : 'normal'}
                _hover={{
                  bg: navHoverBg
                }}
              >
                AI Control
              </Button>
              
              <Button
                variant="ghost"
                onClick={() => {
                  toggleDarkMode();
                  setIsMenuOpen(false);
                }}
                justifyContent="flex-start"
                width="full"
                leftIcon={darkMode ? <SunIcon color="yellow.200" /> : <MoonIcon color="blue.700" />}
                _hover={{
                  bg: navHoverBg
                }}
              >
                {darkMode ? 'Light Mode' : 'Dark Mode'}
              </Button>
            </Flex>
        </Box>
      )}
    </Box>
  );
};

export default Navbar;
