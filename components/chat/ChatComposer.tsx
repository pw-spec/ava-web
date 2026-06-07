'use client';
import { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

export function ChatComposer({
  onSend,
  disabled,
  textareaRef,
}: {
  onSend: (text: string) => void;
  disabled: boolean;
  textareaRef?: React.Ref<HTMLTextAreaElement>;
}) {
  const [value, setValue] = useState('');

  function submit() {
    const text = value.trim();
    if (!text || disabled) return;
    onSend(text);
    setValue('');
  }

  return (
    <div className="flex items-end gap-2 border-t border-border bg-background p-3">
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            submit();
          }
        }}
        disabled={disabled}
        rows={1}
        placeholder="Tell Ava how you're doing…"
        aria-label="Message Ava"
        className="max-h-32 min-h-10 flex-1 resize-none"
      />
      <Button type="button" onClick={submit} disabled={disabled} aria-label="Send" className="shrink-0">
        ↑
      </Button>
    </div>
  );
}
