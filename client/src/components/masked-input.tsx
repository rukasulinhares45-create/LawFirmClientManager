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
    const mask = (value: string) => {
      const numbers = value.replace(/\D/g, "");
      if (numbers.length <= 11) {
        return "000.000.000-00";
      }
      return "00.000.000/0000-00";
    };

    return <MaskedInput ref={ref} mask={mask} {...props} />;
  }
);

CPFCNPJMask.displayName = "CPFCNPJMask";

export const PhoneMask = forwardRef<HTMLInputElement, Omit<MaskedInputProps, "mask">>(
  (props, ref) => {
    const mask = (value: string) => {
      const numbers = value.replace(/\D/g, "");
      if (numbers.length <= 10) {
        return "(00) 0000-0000";
      }
      return "(00) 00000-0000";
    };

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
