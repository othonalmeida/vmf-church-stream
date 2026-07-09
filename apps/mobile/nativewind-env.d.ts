/// <reference types="nativewind/types" />

export {};

// A referencia acima aponta para a copia de react-native-css-interop aninhada
// dentro de node_modules/nativewind/node_modules (o npm nao consegue
// deduplicar 100% neste monorepo, mesmo com "overrides"), o que faz o
// TypeScript tratar como um modulo "react-native" diferente do que os
// componentes do app realmente resolvem. Declarando aqui diretamente,
// augmentamos o "react-native" no contexto de resolucao do proprio apps/mobile.
declare module "react-native" {
  interface ViewProps {
    className?: string;
  }
  interface TextProps {
    className?: string;
  }
  interface ImagePropsBase {
    className?: string;
  }
  interface ScrollViewProps {
    className?: string;
    contentContainerClassName?: string;
  }
  interface TextInputProps {
    className?: string;
  }
}

declare module "*.css";
