import React from "react";
import { ALL_FRIENDS } from "@/components/AuthProvider";
import { cn } from "@/lib/utils";

interface DescriptionWithMentionsProps {
  text: string;
  profilePics?: Record<string, string>;
  className?: string;
}

export const DescriptionWithMentions: React.FC<DescriptionWithMentionsProps> = ({ 
  text, 
  profilePics = {},
  className
}) => {
  if (!text) return null;

  // Encontra todas as palavras que começam com @ e estão na lista de amigos
  const words = text.split(/(\s+)/); // Preserva os espaços

  return (
    <span className={className} title={text}>
      {words.map((word, i) => {
        if (word.startsWith('@')) {
          const mentionedName = word.substring(1).replace(/[.,!?:]$/, "");
          const exactFriend = ALL_FRIENDS.find(
            f => f.toLowerCase() === mentionedName.toLowerCase()
          );

          if (exactFriend) {
            // Separa a pontuação caso o usuário tenha digitado algo como "@Daniel,"
            const punctuation = word.substring(1 + mentionedName.length);
            
            return (
              <span key={i} className="inline-flex items-center gap-1 mx-0.5 align-middle bg-primary/10 text-primary px-1.5 rounded-md font-medium text-xs border border-primary/20">
                <img 
                  src={profilePics[exactFriend] || "/favicon.png"} 
                  alt={exactFriend} 
                  className="w-4 h-4 rounded-full object-cover shadow-sm border border-background"
                />
                @{exactFriend}
                {punctuation && <span className="text-foreground">{punctuation}</span>}
              </span>
            );
          }
        }
        
        // Retorna a palavra normalmente se não for menção
        return <span key={i}>{word}</span>;
      })}
    </span>
  );
};
