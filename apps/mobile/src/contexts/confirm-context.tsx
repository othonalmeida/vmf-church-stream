import { Ionicons } from '@expo/vector-icons';
import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';

interface ConfirmOptions {
  title?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** false pinta o botao de confirmacao como acao neutra em vez de perigosa (padrao: true). */
  danger?: boolean;
}

type ConfirmFn = (message: string, options?: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | undefined>(undefined);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<{ message: string; options: ConfirmOptions } | null>(null);
  const resolverRef = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback<ConfirmFn>((message, options = {}) => {
    setState({ message, options });
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
    });
  }, []);

  const close = (result: boolean) => {
    resolverRef.current?.(result);
    resolverRef.current = null;
    setState(null);
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <Modal visible={state !== null} transparent animationType="fade" onRequestClose={() => close(false)}>
        <View className="flex-1 items-center justify-center bg-black/60 px-6">
          <View className="w-full max-w-sm rounded-2xl bg-surface-raised p-6">
            <View className="mb-5 flex-row items-start gap-3">
              <View className="h-9 w-9 items-center justify-center rounded-full bg-red-100">
                <Ionicons name="warning" size={18} color="#dc2626" />
              </View>
              <View className="flex-1">
                {state?.options.title && (
                  <Text className="mb-1 font-semibold text-ink-950">{state.options.title}</Text>
                )}
                <Text className="text-sm text-ink-700">{state?.message}</Text>
              </View>
            </View>
            <View className="flex-row justify-end gap-2">
              <Pressable
                onPress={() => close(false)}
                className="rounded-xl border border-surface-border bg-surface-raised px-4 py-2.5"
              >
                <Text className="text-sm font-medium text-ink-950">
                  {state?.options.cancelLabel ?? 'Cancelar'}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => close(true)}
                className={
                  state?.options.danger === false
                    ? 'rounded-xl bg-ink-900 px-4 py-2.5'
                    : 'rounded-xl bg-red-600 px-4 py-2.5'
                }
              >
                <Text className="text-sm font-medium text-white">
                  {state?.options.confirmLabel ?? 'Confirmar'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) {
    throw new Error('useConfirm must be used within ConfirmProvider');
  }
  return ctx;
}
