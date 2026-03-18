import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { paymentService } from '@/services/payment.service';

declare global {
  interface Window {
    PagarmeCheckout?: {
      init: (
        success: (data: Record<string, unknown>) => boolean | void,
        fail: (error: unknown) => void
      ) => void;
    };
  }
}

const SCRIPT_ID = 'pagarme-tokenizecard-js';
const SCRIPT_SRC = 'https://checkout.pagar.me/v1/tokenizecard.js';

const onlyDigits = (value?: string) => (value || '').replace(/\D/g, '');

const getExpiryParts = (expiry?: string) => {
  const [rawMonth = '', rawYear = ''] = (expiry || '').split('/');
  const month = onlyDigits(rawMonth).slice(0, 2);
  const year = onlyDigits(rawYear).slice(0, 4);

  return {
    month,
    year,
  };
};

const extractTokenFromPayload = (payload: Record<string, unknown> | null | undefined) => {
  if (!payload) return null;

  const directToken = Object.entries(payload).find(
    ([key, value]) => key.startsWith('pagarmetoken') && typeof value === 'string'
  )?.[1];

  if (typeof directToken === 'string' && directToken.trim()) {
    return directToken;
  }

  if (typeof payload.id === 'string' && payload.id.startsWith('token_')) {
    return payload.id;
  }

  return null;
};

const ensureTokenizerScript = async (publicKey: string) => {
  const existingScript = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;

  if (
    existingScript &&
    existingScript.dataset.pagarmecheckoutAppId === publicKey &&
    window.PagarmeCheckout
  ) {
    return;
  }

  if (existingScript) {
    existingScript.remove();
  }

  await new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.id = SCRIPT_ID;
    script.src = SCRIPT_SRC;
    script.async = true;
    script.dataset.pagarmecheckoutAppId = publicKey;
    script.onload = () => resolve();
    script.onerror = () =>
      reject(new Error('Não foi possível carregar o tokenizecard.js do Pagar.me.'));
    document.body.appendChild(script);
  });
};

export interface PagarmeTokenizecardFormHandle {
  tokenize: () => Promise<string>;
}

interface PagarmeTokenizecardFormProps {
  enabled: boolean;
  holderName: string;
  cardNumber: string;
  cardExpiry: string;
  cardCvv: string;
}

export const PagarmeTokenizecardForm = forwardRef<
  PagarmeTokenizecardFormHandle,
  PagarmeTokenizecardFormProps
>(function PagarmeTokenizecardForm(
  { enabled, holderName, cardNumber, cardExpiry, cardCvv },
  ref
) {
  const formRef = useRef<HTMLFormElement | null>(null);
  const pendingPromiseRef = useRef<{
    resolve: (token: string) => void;
    reject: (error: Error) => void;
  } | null>(null);
  const [publicKey, setPublicKey] = useState<string | null>(null);

  const handleFail = useCallback((error: unknown) => {
    if (!pendingPromiseRef.current) return;

    const fallbackMessage = 'Não foi possível tokenizar o cartão com o Pagar.me.';
    const message =
      typeof error === 'string'
        ? error
        : error instanceof Error
          ? error.message
          : (error as any)?.message || fallbackMessage;

    pendingPromiseRef.current.reject(new Error(message));
    pendingPromiseRef.current = null;
  }, []);

  const handleSuccess = useCallback((data: Record<string, unknown>) => {
    if (!pendingPromiseRef.current) {
      return false;
    }

    const token = extractTokenFromPayload(data);

    if (!token) {
      pendingPromiseRef.current.reject(
        new Error('O tokenizecard.js não retornou um token de cartão válido.')
      );
      pendingPromiseRef.current = null;
      return false;
    }

    pendingPromiseRef.current.resolve(token);
    pendingPromiseRef.current = null;
    return false;
  }, []);

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;

    const initializeTokenizer = async () => {
      try {
        const config = await paymentService.getPagarmeClientConfig();
        if (cancelled) return;

        await ensureTokenizerScript(config.publicKey);
        if (cancelled) return;

        setPublicKey(config.publicKey);
        window.PagarmeCheckout?.init(handleSuccess, handleFail);
      } catch (error) {
        if (cancelled) return;
        handleFail(error);
      }
    };

    void initializeTokenizer();

    return () => {
      cancelled = true;
    };
  }, [enabled, handleFail, handleSuccess]);

  useImperativeHandle(
    ref,
    () => ({
      tokenize: async () => {
        if (!enabled) {
          throw new Error('Selecione pagamento com cartão para tokenizar os dados.');
        }

        if (!formRef.current) {
          throw new Error('Formulário de tokenização não está disponível.');
        }

        if (!publicKey) {
          throw new Error('Public Key do Pagar.me não configurada.');
        }

        await ensureTokenizerScript(publicKey);

        return new Promise<string>((resolve, reject) => {
          pendingPromiseRef.current = { resolve, reject };
          window.PagarmeCheckout?.init(handleSuccess, handleFail);
          formRef.current?.requestSubmit();
        });
      },
    }),
    [enabled, handleFail, handleSuccess, publicKey]
  );

  const { month, year } = getExpiryParts(cardExpiry);

  return (
    <form
      ref={formRef}
      action="#"
      method="POST"
      data-pagarmecheckout-form
      className="sr-only"
      aria-hidden="true"
    >
      <input
        type="text"
        name="holder-name"
        data-pagarmecheckout-element="holder_name"
        value={holderName}
        readOnly
        tabIndex={-1}
        autoComplete="off"
      />
      <input
        type="text"
        name="card-number"
        data-pagarmecheckout-element="number"
        value={onlyDigits(cardNumber)}
        readOnly
        tabIndex={-1}
        autoComplete="off"
      />
      <input
        type="text"
        name="card-exp-month"
        data-pagarmecheckout-element="exp_month"
        value={month}
        readOnly
        tabIndex={-1}
        autoComplete="off"
      />
      <input
        type="text"
        name="card-exp-year"
        data-pagarmecheckout-element="exp_year"
        value={year}
        readOnly
        tabIndex={-1}
        autoComplete="off"
      />
      <input
        type="text"
        name="cvv"
        data-pagarmecheckout-element="cvv"
        value={onlyDigits(cardCvv)}
        readOnly
        tabIndex={-1}
        autoComplete="off"
      />
      <button type="submit">Tokenizar</button>
    </form>
  );
});
