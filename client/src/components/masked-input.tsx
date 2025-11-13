import { IMaskInput } from "react-imask";
import { forwardRef } from "react";

interface MaskedInputProps {
  mask: any;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  required?: boolean;
  id?: string;
  "data-testid"?: string;
}

export const MaskedInput = forwardRef<HTMLInputElement, MaskedInputProps>(
  ({ mask, value, onChange, onBlur, ...props }, ref) => {
    return (
      <IMaskInput
        mask={mask}
        value={value}
        unmask={true}
        onAccept={(value: string) => onChange(value)}
        onBlur={onBlur}
        {...props}
        inputRef={ref as any}
        className={`flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 ${props.className || ""}`}
      />
    );
  }
);

MaskedInput.displayName = "MaskedInput";

export const CPFCNPJMask = forwardRef<HTMLInputElement, Omit<MaskedInputProps, "mask">>(
  (props, ref) => {
    const mask = [
      {
        mask: "000.000.000-00",
        maxLength: 11,
      },
      {
        mask: "00.000.000/0000-00",
      },
    ];

    return <MaskedInput ref={ref} mask={mask} {...props} />;
  }
);

CPFCNPJMask.displayName = "CPFCNPJMask";

export const PhoneMask = forwardRef<HTMLInputElement, Omit<MaskedInputProps, "mask">>(
  (props, ref) => {
    const mask = [
      {
        mask: "(00) 0000-0000",
        maxLength: 10,
      },
      {
        mask: "(00) 00000-0000",
      },
    ];

    return <MaskedInput ref={ref} mask={mask} {...props} />;
  }
);

PhoneMask.displayName = "PhoneMask";

export const CEPMask = forwardRef<HTMLInputElement, Omit<MaskedInputProps, "mask">>(
  (props, ref) => {
    return <MaskedInput ref={ref} mask="00000-000" {...props} />;
  }
);

CEPMask.displayName = "CEPMask";

export const stripNonDigits = (value: string | null | undefined): string => {
  if (!value) return "";
  return value.replace(/\D/g, "");
};

export function validateCPF(cpf: string): boolean {
  const cleaned = stripNonDigits(cpf);
  
  if (cleaned.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cleaned)) return false;
  
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleaned.charAt(i)) * (10 - i);
  }
  let digit = 11 - (sum % 11);
  if (digit > 9) digit = 0;
  if (digit !== parseInt(cleaned.charAt(9))) return false;
  
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleaned.charAt(i)) * (11 - i);
  }
  digit = 11 - (sum % 11);
  if (digit > 9) digit = 0;
  if (digit !== parseInt(cleaned.charAt(10))) return false;
  
  return true;
}

export function validateCNPJ(cnpj: string): boolean {
  const cleaned = stripNonDigits(cnpj);
  
  if (cleaned.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(cleaned)) return false;
  
  let length = cleaned.length - 2;
  let numbers = cleaned.substring(0, length);
  const digits = cleaned.substring(length);
  let sum = 0;
  let pos = length - 7;
  
  for (let i = length; i >= 1; i--) {
    sum += parseInt(numbers.charAt(length - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  
  let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(0))) return false;
  
  length = length + 1;
  numbers = cleaned.substring(0, length);
  sum = 0;
  pos = length - 7;
  
  for (let i = length; i >= 1; i--) {
    sum += parseInt(numbers.charAt(length - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  
  result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(1))) return false;
  
  return true;
}
