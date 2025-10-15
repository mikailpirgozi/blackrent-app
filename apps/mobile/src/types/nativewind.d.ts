/// <reference types="react" />
/// <reference types="react-native" />

declare module 'react-native' {
  interface ViewProps {
    className?: string;
  }
  
  interface TextProps {
    className?: string;
  }
  
  interface TouchableOpacityProps {
    className?: string;
  }
  
  interface ScrollViewProps {
    className?: string;
  }
  
  interface ImageProps {
    className?: string;
  }
  
  interface TextInputProps {
    className?: string;
  }
}

declare module 'react-native-safe-area-context' {
  interface SafeAreaViewProps {
    className?: string;
  }
}

export {};

