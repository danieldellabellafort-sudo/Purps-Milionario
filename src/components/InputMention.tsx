import React, { useState, useRef, useEffect } from "react";
import { ALL_FRIENDS, useAuth } from "@/components/AuthProvider";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface InputMentionProps extends React.InputHTMLAttributes<HTMLInputElement> {
  value: string;
  onChangeValue: (val: string) => void;
  profilePics?: Record<string, string>;
  ownerName?: string;
}

export const InputMention: React.FC<InputMentionProps> = ({ 
  value, 
  onChangeValue, 
  profilePics = {}, 
  ownerName,
  className,
  ...props 
}) => {
  const [showMentions, setShowMentions] = useState(false);
  const [mentionFilter, setMentionFilter] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  
  const currentPerson = ownerName || (user === "MASTER" ? "" : user);

  const filteredFriends = ALL_FRIENDS.filter((f) => {
    if (f === currentPerson) return false;
    if (mentionFilter && !f.toLowerCase().includes(mentionFilter.toLowerCase())) return false;
    return true;
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    onChangeValue(val);
    
    // Check if we are typing a mention
    const cursor = e.target.selectionStart || 0;
    const textBefore = val.slice(0, cursor);
    const match = textBefore.match(/@(\w*)$/);
    
    if (match) {
      setShowMentions(true);
      setMentionFilter(match[1]);
    } else {
      setShowMentions(false);
    }
  };

  const insertMention = (friend: string) => {
    if (!inputRef.current) return;
    const cursor = inputRef.current.selectionStart || 0;
    const textBefore = value.slice(0, cursor);
    const textAfter = value.slice(cursor);
    const match = textBefore.match(/@(\w*)$/);
    
    if (match) {
      const newVal = textBefore.slice(0, match.index) + `@${friend} ` + textAfter;
      onChangeValue(newVal);
    }
    
    setShowMentions(false);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  };

  return (
    <div className="relative w-full">
      <Input
        ref={inputRef}
        value={value}
        onChange={handleChange}
        className={className}
        autoComplete="off"
        {...props}
      />
      
      {showMentions && filteredFriends.length > 0 && (
        <div className="absolute z-50 bottom-full left-0 mb-1 w-full max-h-48 overflow-y-auto bg-card border rounded-xl shadow-xl flex flex-col p-1 animate-in fade-in zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=closed]:zoom-out-95">
          {filteredFriends.map(friend => (
            <button
              key={friend}
              type="button"
              onClick={() => insertMention(friend)}
              className="flex items-center gap-3 px-3 py-2 text-sm hover:bg-muted/50 rounded-lg transition-colors text-left"
            >
              <img 
                src={profilePics[friend] || "/favicon.png"} 
                alt={friend} 
                className="w-6 h-6 rounded-full object-cover border"
              />
              <span className="font-semibold">{friend}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
