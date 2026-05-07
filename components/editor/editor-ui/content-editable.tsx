import type { JSX } from "react";

import { ContentEditable as LexicalContentEditable } from "@lexical/react/LexicalContentEditable";

type Props = {
  placeholder: string;
  className?: string;
  placeholderClassName?: string;
  id?: string;
  ariaInvalid?: boolean;
  ariaDescribedBy?: string;
};

export function ContentEditable({
  placeholder,
  className,
  placeholderClassName,
  id,
  ariaInvalid,
  ariaDescribedBy,
}: Props): JSX.Element {
  return (
    <LexicalContentEditable
      id={id}
      aria-invalid={ariaInvalid}
      aria-describedby={ariaDescribedBy}
      className={`ContentEditable__root relative block min-h-72 overflow-auto px-4 py-2 focus:outline-none ${className ?? ""}`.trim()}
      aria-placeholder={placeholder}
      placeholder={
        <div
          className={`pointer-events-none absolute top-0 left-0 overflow-hidden px-4 py-2 text-ellipsis text-muted-foreground select-none ${placeholderClassName ?? ""}`.trim()}
        >
          {placeholder}
        </div>
      }
    />
  );
}
